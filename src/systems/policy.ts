import type { GameState } from '../types'
import { getPost } from '../data/posts'
import { clamp, pushLog } from '../state/game'
import { factionName } from './faction'

/* ═══════════ 政策试点 ═══════════ */

export interface PolicyDef {
  id: string
  name: string
  flavor: string
  total: number
  minRank: number
  maxRank: number
  /** 侧重：结项加成偏向 */
  focus: 'zj' | 'mx' | 'lian' | 'nl'
  doneFx: Partial<Record<'ZJ' | 'MX' | 'Lian' | 'NL' | 'GX' | 'Risk', number>>
}

export const POLICY_DEFS: PolicyDef[] = [
  {
    id: 'chanye',
    name: '特色产业延链试点',
    flavor: '选一个镇做精深加工，先做出样板再全县推开。',
    total: 4,
    minRank: 6,
    maxRank: 12,
    focus: 'zj',
    doneFx: { ZJ: 10, NL: 4, Risk: 3 },
  },
  {
    id: 'minsheng_fast',
    name: '高频民生「一件事」改革',
    flavor: '把开证明、办补贴、报残联等高频事项并成一次办。',
    total: 3,
    minRank: 6,
    maxRank: 12,
    focus: 'mx',
    doneFx: { MX: 12, ZJ: 5, NL: 3 },
  },
  {
    id: 'yangguang',
    name: '村级权力阳光运行',
    flavor: '小微权力清单上墙、流水上网，让乡亲点得开、看得懂。',
    total: 3,
    minRank: 7,
    maxRank: 13,
    focus: 'lian',
    doneFx: { Lian: 8, MX: 5, ZJ: 4, Risk: -5 },
  },
  {
    id: 'shuzi',
    name: '县域治理数据底座',
    flavor: '人口、房屋、企业一张图——先打通，再谈智能。',
    total: 4,
    minRank: 8,
    maxRank: 14,
    focus: 'nl',
    doneFx: { NL: 10, ZJ: 6, GX: 3 },
  },
  {
    id: 'tudi',
    name: '存量用地盘活试点',
    flavor: '闲置厂房与批而未供地块，一宗一策。',
    total: 4,
    minRank: 8,
    maxRank: 14,
    focus: 'zj',
    doneFx: { ZJ: 11, GX: 4, Risk: 4 },
  },
]

export function canStartPolicy(s: GameState): { ok: boolean; reason: string } {
  if (s.policy) return { ok: false, reason: '已有政策试点在办' }
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  const rank = getPost(s.postId).rank
  if (rank < 6) return { ok: false, reason: '县处及以上才可启动政策试点' }
  return { ok: true, reason: '' }
}

export function startPolicy(s: GameState, id: string): { ok: boolean; text: string } {
  const gate = canStartPolicy(s)
  if (!gate.ok) return { ok: false, text: gate.reason }
  const def = POLICY_DEFS.find((d) => d.id === id)
  if (!def) return { ok: false, text: '未知试点' }
  const rank = getPost(s.postId).rank
  if (rank < def.minRank || rank > def.maxRank) return { ok: false, text: '当前职务层次不适合该试点' }
  s.policy = {
    id: def.id,
    name: def.name,
    step: 0,
    total: def.total,
    quality: 40 + Math.floor(Math.random() * 15),
  }
  s.actionPoints = Math.max(0, s.actionPoints - 1)
  pushLog(s, `【试点】启动「${def.name}」：${def.flavor}`)
  return { ok: true, text: `已启动政策试点「${def.name}」（约 ${def.total} 个月）。可在经营台查看进度。` }
}

/** 每月推进；结项时结算 */
export function tickPolicy(s: GameState): string | null {
  if (!s.policy) return null
  const def = POLICY_DEFS.find((d) => d.id === s.policy!.id)
  if (!def) {
    s.policy = null
    return null
  }
  s.policy.step += 1
  // 质量：五维与风险拉扯
  const a = s.attrs
  const q =
    a.ZJ * 0.25 +
    a.NL * 0.25 +
    a.MX * 0.2 +
    a.Lian * 0.2 +
    (100 - s.risk) * 0.1 +
    (def.focus === 'zj' ? a.ZJ * 0.1 : def.focus === 'mx' ? a.MX * 0.1 : def.focus === 'lian' ? a.Lian * 0.1 : a.NL * 0.1)
  s.policy.quality = Math.round(clamp((s.policy.quality + q) / 2, 0, 100))

  if (s.policy.step >= s.policy.total) {
    const quality = s.policy.quality
    const strong = quality >= 70
    const weak = quality < 45
    const fx = { ...def.doneFx }
    const scale = strong ? 1.25 : weak ? 0.45 : 1
    const applied: string[] = []
    for (const k of Object.keys(fx) as (keyof typeof fx)[]) {
      const v = fx[k]
      if (typeof v !== 'number') continue
      const scaled = Math.round(v * scale)
      if (k === 'Risk') {
        s.risk = clamp(s.risk + scaled, 0, 100)
        applied.push(`风险${scaled >= 0 ? '+' : ''}${scaled}`)
      } else {
        s.attrs[k] = clamp(s.attrs[k] + scaled)
        applied.push(`${k}${scaled >= 0 ? '+' : ''}${scaled}`)
      }
    }
    if (strong) {
      s.attrs.GX = clamp(s.attrs.GX + 3)
      s.flags.policyExcellent = true
    }
    const name = s.policy.name
    s.policy = null
    const line = `【试点】「${name}」结项（质量 ${quality}）。${applied.join('，')}。`
    pushLog(s, line)
    return line
  }
  if (s.policy.step === Math.ceil(s.policy.total / 2)) {
    const mid = `【试点】「${s.policy.name}」过半，质量约 ${s.policy.quality}。`
    pushLog(s, mid)
    return mid
  }
  return null
}

/* ═══════════ 派系任务 ═══════════ */

export interface FactionTaskDef {
  id: string
  title: string
  text: string
  months: number
  /** 成功加成本系声望 */
  rep: number
  /** 成功：关系/廉洁取舍 */
  okFx: Partial<Record<'ZJ' | 'GX' | 'Lian' | 'MX' | 'NL' | 'Risk', number>>
  /** 失败：风险与热度 */
  failRisk: number
  failHeat: number
}

const FACTION_TASKS: FactionTaskDef[] = [
  {
    id: 'renyuan',
    title: '安排「自己人」',
    text: '本系有人托你把他侄子塞进下属单位。程序上能走，走完之后不好摘。',
    months: 2,
    rep: 12,
    okFx: { GX: 8, Lian: -8, Risk: 6 },
    failRisk: 8,
    failHeat: 12,
  },
  {
    id: 'zijin',
    title: '协调一笔「急钱」',
    text: '本系项目缺口资金，要你协调财政或平台公司先垫一垫。账面上说得过去，审计时说不清。',
    months: 2,
    rep: 14,
    okFx: { ZJ: 4, GX: 6, Lian: -10, Risk: 10 },
    failRisk: 12,
    failHeat: 15,
  },
  {
    id: 'pingyi',
    title: '会上替本系说话',
    text: '常委会前，本系希望你在争议议题上「把住方向」。表态太满会伤对家，太软本系不满。',
    months: 1,
    rep: 10,
    okFx: { GX: 5, Lian: -4, ZJ: 2 },
    failRisk: 5,
    failHeat: 10,
  },
  {
    id: 'zheyan',
    title: '压一压舆情',
    text: '本系关联企业被拍了负面。宣传口问你要不要「降温」。压住了是人情，压不住是事故。',
    months: 1,
    rep: 11,
    okFx: { GX: 6, Risk: 8, Lian: -6 },
    failRisk: 14,
    failHeat: 16,
  },
]

export function maybeOfferFactionTask(s: GameState): FactionTaskDef | null {
  if (s.faction === 'none') return null
  if (s.factionTask || s.pendingFactionTask) return null
  if (s.factionCd > 0) return null
  if (s.currentEventId) return null
  if (s.turn < 12) return null
  if (Math.random() > 0.22) return null
  const done = s.factionTaskDone ?? []
  const fresh = FACTION_TASKS.filter((t) => !done.includes(t.id))
  const list = fresh.length ? fresh : FACTION_TASKS
  const pick = list[Math.floor(Math.random() * list.length)]
  s.pendingFactionTask = pick.id
  return pick
}

export function acceptFactionTask(s: GameState, def: FactionTaskDef): { ok: boolean; text: string } {
  if (s.faction === 'none') return { ok: false, text: '未站队。' }
  if (s.factionTask) return { ok: false, text: '已有派系交办在办。' }
  s.factionTask = {
    id: def.id,
    title: def.title,
    text: def.text,
    monthsLeft: def.months,
    totalMonths: def.months,
  }
  s.pendingFactionTask = null
  pushLog(s, `【派系】${factionName(s.faction)}交办：「${def.title}」。`)
  return { ok: true, text: `已接下「${def.title}」（约 ${def.months} 个月）。办成涨声望，办砸抬风险。` }
}

export function declineFactionTask(s: GameState, def: FactionTaskDef): { ok: boolean; text: string } {
  s.pendingFactionTask = null
  s.factionRep[s.faction] = clamp((s.factionRep[s.faction] ?? 20) - 8, 0, 100)
  s.factionHeat = clamp((s.factionHeat ?? 20) - 4, 0, 100)
  pushLog(s, `【派系】你婉拒了「${def.title}」。本系有人不高兴。`)
  return { ok: true, text: `婉拒「${def.title}」：本系声望下降，但躲过一次风险。` }
}

export function tickFactionTask(s: GameState): string | null {
  if (!s.factionTask || s.faction === 'none') return null
  const t = s.factionTask
  t.monthsLeft -= 1
  if (t.monthsLeft > 0) return null
  const def = FACTION_TASKS.find((d) => d.id === t.id)
  s.factionTask = null
  if (!def) return null
  const a = s.attrs
  // 办成概率：关系与能力，风险与廉洁拖后腿
  const power = a.GX * 0.4 + a.NL * 0.25 + a.ZJ * 0.15 + a.Lian * 0.1 + (100 - s.risk) * 0.1
  const success = power >= 55 && Math.random() < Math.min(0.92, 0.45 + (power - 55) / 80)
  if (success) {
    s.factionRep[s.faction] = clamp((s.factionRep[s.faction] ?? 20) + def.rep, 0, 100)
    for (const k of Object.keys(def.okFx) as (keyof typeof def.okFx)[]) {
      const v = def.okFx[k]
      if (typeof v !== 'number') continue
      if (k === 'Risk') s.risk = clamp(s.risk + v, 0, 100)
      else s.attrs[k] = clamp(s.attrs[k] + v)
    }
    if (!s.factionTaskDone) s.factionTaskDone = []
    if (!s.factionTaskDone.includes(def.id)) s.factionTaskDone.push(def.id)
    const line = `【派系】「${def.title}」办妥。${factionName(s.faction)}声望 +${def.rep}。`
    pushLog(s, line)
    return line
  }
  s.risk = clamp(s.risk + def.failRisk, 0, 100)
  s.factionHeat = clamp((s.factionHeat ?? 20) + def.failHeat, 0, 100)
  s.factionRep[s.faction] = clamp((s.factionRep[s.faction] ?? 20) - 6, 0, 100)
  const line = `【派系】「${def.title}」没办利索。风险与角力热度上升，本系有人埋怨。`
  pushLog(s, line)
  return line
}

/** 当前待接任务（派系页展示） */
export function peekFactionTask(s: GameState): FactionTaskDef | null {
  const id = s.pendingFactionTask
  if (!id) return null
  return FACTION_TASKS.find((d) => d.id === id) ?? null
}

export function factionTaskById(id: string): FactionTaskDef | undefined {
  return FACTION_TASKS.find((d) => d.id === id)
}
