import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'
import { getPost } from '../data/posts'
import { factionName } from './faction'
import { loadCatalog } from '../state/catalog'

/* ═══════ 会前拉票（票决前一步） ═══════ */

export type CanvassKind = 'private' | 'public' | 'wait'

export function maybeOfferCanvass(s: GameState): boolean {
  if (s.promo?.stage !== 'piaojue') return false
  if (s.flags.canvassDone === `${s.promo.targetId}`) return false
  if (s.pendingCanvass) return true
  s.pendingCanvass = true
  return true
}

export function resolveCanvass(s: GameState, kind: CanvassKind): string {
  if (s.promo?.stage !== 'piaojue' || !s.pendingCanvass) return '当前没有会前沟通窗口。'
  s.pendingCanvass = false
  s.flags.canvassDone = String(s.promo.targetId)
  const from = getPost(s.postId)
  if (kind === 'private') {
    s.attrs.GX = clamp(s.attrs.GX + (from.rank >= 15 ? 2 : 4))
    s.attrs.Lian = clamp(s.attrs.Lian - (from.rank >= 15 ? 3 : 5))
    s.risk = clamp(s.risk + (from.rank >= 15 ? 4 : 3), 0, 100)
    s.flags.canvassBonus = from.rank >= 15 ? 3 : 6
    const t = '会前你把该说的话都说了。票面可能稳一点，但痕迹也留了一点。'
    pushLog(s, `【拉票】${t}`)
    return t
  }
  if (kind === 'public') {
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    s.attrs.Lian = clamp(s.attrs.Lian + 2)
    s.flags.canvassBonus = 3
    const t = '你按程序在会上把分管工作讲清楚，不预设立场。程序分稳了。'
    pushLog(s, `【拉票】${t}`)
    return t
  }
  s.flags.canvassBonus = 0
  const t = '你选择按兵不动，等会议自然召开。'
  pushLog(s, `【拉票】${t}`)
  return t
}

/* ═══════ 图鉴收集奖励 ═══════ */

const CATALOG_MILESTONES = [
  { n: 30, name: '见习观察员', fx: { ZJ: 1, NL: 1 } },
  { n: 60, name: '基层百事通', fx: { ZJ: 2, MX: 2, NL: 1 } },
  { n: 100, name: '组织部熟面孔', fx: { ZJ: 3, GX: 3, NL: 2 } },
  { n: 150, name: '图鉴收藏家', fx: { ZJ: 4, GX: 4, Lian: 2, MX: 3, NL: 3 } },
] as const

/** 开局时按已收集图鉴给一次性加成（跨局） */
export function catalogOpeningBonus(s: GameState): string[] {
  const got = loadCatalog().length
  const notes: string[] = []
  for (const m of CATALOG_MILESTONES) {
    if (got < m.n) continue
    const key = `cat_${m.n}`
    if (s.flags[key]) continue
    s.flags[key] = true
    for (const k of Object.keys(m.fx) as (keyof typeof m.fx)[]) {
      s.attrs[k] = clamp(s.attrs[k] + (m.fx[k] as number))
    }
    notes.push(`图鉴 ${m.n} 条 ·「${m.name}」开局加成`)
  }
  return notes
}

export function catalogMilestones() {
  return CATALOG_MILESTONES
}

/* ═══════ 配偶 / 子女职业线 ═══════ */

export type FamilyCareer = 'work' | 'care' | 'study'

export function setFamilyCareer(s: GameState, kind: FamilyCareer): string {
  s.familyCareer = kind
  if (kind === 'work') {
    pushLog(s, '【家事】你支持配偶以事业为重。家里少些人手，组织上多看你一眼「公私分明」。')
    return '支持配偶拼事业：廉洁/能力小幅上升，配偶心情承压。'
  }
  if (kind === 'care') {
    if (s.family) s.family.spouseMood = clamp(s.family.spouseMood + 12)
    pushLog(s, '【家事】你更顾家，配偶心情好转，但有人说你「心思不在工作上」。')
    return '侧重家庭：配偶心情上升，关系略降。'
  }
  pushLog(s, '【家事】你支持子女走自己的路，少干预。家里安静了些。')
  return '对子女少干预：民心小幅上升，家庭更稳。'
}

export function tickFamilyCareer(s: GameState) {
  if (s.familyCareer === 'work' && s.family) {
    s.family.spouseMood = clamp(s.family.spouseMood - 1)
    if (Math.random() < 0.15) {
      s.attrs.Lian = clamp(s.attrs.Lian + 1)
      s.attrs.NL = clamp(s.attrs.NL + 1)
    }
  } else if (s.familyCareer === 'care' && s.family) {
    if (Math.random() < 0.25) s.family.spouseMood = clamp(s.family.spouseMood + 1)
    if (Math.random() < 0.12) s.attrs.GX = clamp(s.attrs.GX - 1)
  } else if (s.familyCareer === 'study') {
    if (Math.random() < 0.12 && s.family) s.family.parentHealth = clamp(s.family.parentHealth + 1)
  }
}

/* ═══════ 门生反哺 ═══════ */

export function maybeProtegeVisit(s: GameState): string | null {
  if (s.turn < 60) return null
  if (Math.random() > 0.04) return null
  const rank = getPost(s.postId).rank
  if (rank < 8) return null
  const pool = (s.inherit ?? []).concat(s.bondNpcIds ?? [])
  if (pool.length === 0 && (s.life ?? 1) <= 1) return null
  if (Math.random() < 0.5) {
    s.attrs.GX = clamp(s.attrs.GX + 2)
    s.attrs.MX = clamp(s.attrs.MX + 1)
    const t = '【门生】当年你推荐过的年轻人来汇报工作，顺带问了一句「老领导身体可好」。'
    pushLog(s, t)
    return t
  }
  s.risk = clamp(s.risk + 2, 0, 100)
  s.attrs.GX = clamp(s.attrs.GX - 2)
  const t = '【门生】有门生在外惹了事，电话里支支吾吾。你让人按规矩办，心里却沉了一下。'
  pushLog(s, t)
  return t
}

/* ═══════ 职级并行：列席与课题 ═══════ */

export function canRankTrackWork(s: GameState): { ok: boolean; reason: string } {
  const post = getPost(s.postId)
  if (post.track !== 'rank') return { ok: false, reason: '非职级序列岗位' }
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  if ((s.flags.rankWorkMonth as string) === `${s.year}-${s.month}`)
    return { ok: false, reason: '本月已列席/课题' }
  return { ok: true, reason: '' }
}

export function doRankTrackWork(s: GameState): string {
  const gate = canRankTrackWork(s)
  if (!gate.ok) return gate.reason
  s.actionPoints -= 1
  s.flags.rankWorkMonth = `${s.year}-${s.month}`
  const r = Math.random()
  if (r < 0.4) {
    s.attrs.NL = clamp(s.attrs.NL + 3)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    const t = '你完成一篇专项课题，被上级机关点名表扬，能力与政绩上升。'
    pushLog(s, `【职级】${t}`)
    return t
  }
  if (r < 0.75) {
    s.attrs.GX = clamp(s.attrs.GX + 3)
    s.attrs.NL = clamp(s.attrs.NL + 1)
    const t = '你列席党组会并作专业发言，几位领导记住了你的名字。'
    pushLog(s, `【职级】${t}`)
    return t
  }
  s.attrs.Lian = clamp(s.attrs.Lian + 2)
  s.risk = clamp(s.risk - 2, 0, 100)
  const t = '你把调研材料反复核对，堵住一处口径漏洞。廉洁与风险小幅改善。'
  pushLog(s, `【职级】${t}`)
  return t
}

/* ═══════ 政策试点 × 派系 ═══════ */

export function policyFactionFactor(s: GameState): {
  bonusZJ: number
  bonusLian: number
  risk: number
  note: string
} {
  const f = s.faction
  if (f === 'none') return { bonusZJ: 0, bonusLian: 0, risk: 0, note: '' }
  const heat = s.factionHeat ?? 20
  if (heat > 60) {
    return {
      bonusZJ: 2,
      bonusLian: -2,
      risk: 3,
      note: `本系施压让试点「出彩」，政绩好看但程序打了折扣。`,
    }
  }
  if (s.attrs.Lian >= 80) {
    return {
      bonusZJ: 1,
      bonusLian: 2,
      risk: -2,
      note: `你顶住${factionName(f)}的人情，试点按规矩办，口碑更硬。`,
    }
  }
  return { bonusZJ: 0, bonusLian: 0, risk: 0, note: '' }
}

/* ═══════ 巡视组（已有专项链，此处给「迎检准备」动作） ═══════ */

export function canPrepInspect(s: GameState): { ok: boolean; reason: string } {
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  if ((s.flags.inspectPrepMonth as string) === `${s.year}-${s.month}`)
    return { ok: false, reason: '本月已做迎检准备' }
  return { ok: true, reason: '' }
}

export function prepInspect(s: GameState): string {
  const gate = canPrepInspect(s)
  if (!gate.ok) return gate.reason
  s.actionPoints -= 1
  s.flags.inspectPrepMonth = `${s.year}-${s.month}`
  s.risk = clamp(s.risk - 4, 0, 100)
  s.attrs.Lian = clamp(s.attrs.Lian + 2)
  s.attrs.NL = clamp(s.attrs.NL + 1)
  const t = '你提前自查台账与谈话提纲，风险下降。若巡视组进驻，处境会好一些。'
  pushLog(s, `【迎检】${t}`)
  return t
}
