import type { Faction, GameState } from '../types'
import { clamp, pushLog, pushTimeline } from '../state/game'

export interface FactionInfo {
  id: Exclude<Faction, 'none'>
  name: string
  desc: string
  bonus: string
  risk: string
}

export const FACTIONS: FactionInfo[] = [
  {
    id: 'A',
    name: 'A 系',
    desc: '本地成长起来的一派，根基在乡镇与县直。',
    bonus: '票决时更易通过；本地资源倾斜',
    risk: '一旦翻船，连根拔起',
  },
  {
    id: 'B',
    name: 'B 系',
    desc: '市里下来的干部圈子，眼界宽、规矩大。',
    bonus: '晋升机会多；省里信息灵',
    risk: '被本地视为「外来户」',
  },
  {
    id: 'local',
    name: '地方系',
    desc: '乡贤、能人、老干部构成的非正式网络。',
    bonus: '办事顺、基层消息灵',
    risk: '容易陷入人情泥潭',
  },
]

export function factionName(id: Faction): string {
  if (id === 'none') return '未站队'
  return FACTIONS.find((f) => f.id === id)?.name ?? id
}

export function factionOf(s: GameState): Faction {
  return s.faction || 'none'
}

export function joinFaction(
  s: GameState,
  target: Exclude<Faction, 'none'> | 'none',
): { ok: boolean; text: string } {
  const cur = s.faction
  if (s.factionCd > 0)
    return { ok: false, text: `派系动作冷却中（还剩 ${s.factionCd} 个月），刚动过就别再折腾了。` }
  if (cur === target) return { ok: false, text: '你已经在这一边了。' }
  if (target === 'none') {
    s.faction = 'none'
    s.factionHeat = clamp(s.factionHeat - 25, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian + 3)
    s.attrs.GX = clamp(s.attrs.GX - 10)
    s.risk = clamp(s.risk + 8, 0, 100)
    s.factionCd = 4
    pushLog(s, '【派系】你宣布保持独立。旧派觉得你「不够意思」，有人开始疏远。')
    return {
      ok: true,
      text: '脱离派系。廉洁上升，但关系大幅承压；短期内可能被两边夹击，风险上升。',
    }
  }
  const fromRep = cur !== 'none' ? (s.factionRep[cur] ?? 30) : 30
  s.faction = target
  if (!s.factionRep) s.factionRep = { A: 20, B: 20, local: 30 }
  s.factionRep[target] = clamp((s.factionRep[target] ?? 20) + 10, 0, 100)
  s.factionCd = 4
  if (cur !== 'none') {
    // 转投：旧派报复
    s.factionRep[cur] = clamp(fromRep - 25, 0, 100)
    s.factionHeat = clamp(s.factionHeat + 25, 0, 100)
    s.risk = clamp(s.risk + 14, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian - 10)
    s.attrs.GX = clamp(s.attrs.GX - 6)
    pushLog(
      s,
      `【派系】你从${factionName(cur)}转投${factionName(target)}。旧派立刻有人「打招呼」，风声传得到处都是。`,
    )
    return {
      ok: true,
      text: `转投${factionName(target)}：旧派记恨、新派观望。风险与廉洁双降，且数月内不宜再折腾。`,
    }
  }
  s.factionHeat = clamp(s.factionHeat + 12, 0, 100)
  s.attrs.GX = clamp(s.attrs.GX + 5)
  s.attrs.Lian = clamp(s.attrs.Lian - 5)
  s.risk = clamp(s.risk + 5, 0, 100)
  pushLog(s, `【派系】你正式靠拢${factionName(target)}。有人把你写进了「名单」。`)
  return {
    ok: true,
    text: `靠拢${factionName(target)}。关系上升，但从此被记在名单上：帮派系办事会消耗你，对家也会盯上你。`,
  }
}

/** 派系声望动作：表忠心 / 低调 / 拆台 */
export function factionAct(
  s: GameState,
  kind: 'loyal' | 'low' | 'sabotage',
): { ok: boolean; text: string } {
  const f = s.faction
  if (f === 'none') return { ok: false, text: '未站队，谈不上表忠心。' }
  if (s.factionCd > 0)
    return { ok: false, text: `派系动作冷却中（还剩 ${s.factionCd} 个月）。` }
  // 声望过低可能被踢出
  if ((s.factionRep[f] ?? 0) < 10 && Math.random() < 0.3) {
    s.faction = 'none'
    s.factionHeat = clamp(s.factionHeat - 15, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 8)
    s.risk = clamp(s.risk + 6, 0, 100)
    pushLog(s, `【派系】${factionName(f)}里有人觉得你「不够自己人」，你被边缘化了。`)
    return { ok: false, text: '你在本系声望过低，已被边缘化，暂时失去派系支持。' }
  }

  if (kind === 'loyal') {
    s.factionRep[f] = clamp((s.factionRep[f] ?? 20) + 10, 0, 100)
    s.factionHeat = clamp(s.factionHeat + 10, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX + 4)
    s.attrs.Lian = clamp(s.attrs.Lian - 6)
    s.risk = clamp(s.risk + 6, 0, 100)
    s.factionCd = 3
    s.lastFactionAct = 'loyal'
    // 表忠必触发对家敌意
    const others = FACTIONS.filter((x) => x.id !== f).map((x) => x.id)
    const o = others[Math.floor(Math.random() * others.length)]
    s.factionRep[o] = clamp((s.factionRep[o] ?? 20) - 8, 0, 100)
    pushLog(s, `【派系】你向${factionName(f)}表忠心。${factionName(o)}那边有人冷笑：「等着瞧。」`)
    return {
      ok: true,
      text: '公开表态、主动揽责。本系声望大升，对家立刻不满，风险与廉洁承压。',
    }
  }
  if (kind === 'low') {
    s.factionHeat = clamp(s.factionHeat - 12, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian + 2)
    s.factionRep[f] = clamp((s.factionRep[f] ?? 20) - 6, 0, 100)
    s.factionCd = 2
    s.lastFactionAct = 'low'
    pushLog(s, '【派系】你刻意低调，少表态少露脸。本系有人觉得你滑头。')
    return { ok: true, text: '压低存在感。角力热度下降，但本系声望下降更明显。' }
  }
  // sabotage 对家
  const others = FACTIONS.filter((x) => x.id !== f).map((x) => x.id)
  const other = others[Math.floor(Math.random() * others.length)]
  s.factionRep[other] = clamp((s.factionRep[other] ?? 20) - 15, 0, 100)
  s.factionRep[f] = clamp((s.factionRep[f] ?? 20) + 8, 0, 100)
  s.factionHeat = clamp(s.factionHeat + 18, 0, 100)
  s.risk = clamp(s.risk + 14, 0, 100)
  s.attrs.Lian = clamp(s.attrs.Lian - 12)
  s.attrs.GX = clamp(s.attrs.GX - 4)
  s.factionCd = 5
  s.lastFactionAct = 'sabotage'
  pushLog(s, `【派系】你暗中拆了${factionName(other)}的台。对方已经起疑。`)
  return {
    ok: true,
    text: `拆台成功：本系声望上升，对家声望大降。但风险、廉洁、关系都恶化，且对方很可能报复。`,
  }
}

/** 派系对票决的加成（promotion 里调用） */
export function factionVoteBonus(s: GameState): number {
  if (s.faction === 'none') return 0
  const rep = s.factionRep[s.faction] ?? 0
  let bonus = rep >= 70 ? 10 : rep >= 45 ? 6 : rep >= 25 ? 3 : 0
  // 对家声望高会拖后腿
  const others = FACTIONS.filter((x) => x.id !== s.faction).map((x) => x.id)
  for (const o of others) {
    const r = s.factionRep[o] ?? 0
    if (r >= 60) bonus -= 4
  }
  if (s.factionHeat > 75) bonus -= 3
  return bonus
}

/** 派系动态事件 */
export function maybeFactionEvent(s: GameState): string | null {
  if (s.faction === 'none') {
    if (s.turn > 12 && Math.random() < 0.12) {
      s.attrs.GX = clamp(s.attrs.GX - 1)
      return '有人暗示你：不站队也是一种站队。要不要表态？'
    }
    return null
  }
  const rep = s.factionRep[s.faction] ?? 0

  if (s.lastFactionAct === 'sabotage' && Math.random() < 0.4) {
    s.lastFactionAct = null
    s.risk = clamp(s.risk + 10, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 5)
    pushLog(s, '【派系】对家开始反击：项目被卡、有人传你闲话。')
    return '对家反击：你近期的项目推进受阻，风评也受影响。'
  }

  if (s.factionHeat > 60 && Math.random() < 0.3) {
    s.risk = clamp(s.risk + 4, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 2)
    pushTimeline(s, 'other', '派系内部摩擦')
    return `【派系】${factionName(s.faction)}内部有摩擦，你被要求「明确态度」。风险上升。`
  }
  if (rep < 25 && Math.random() < 0.22) {
    s.factionRep[s.faction] = clamp(rep - 3, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 2)
    return `【派系】${factionName(s.faction)}里有人觉得你「不够自己人」，开始疏远。`
  }
  if (rep >= 70 && Math.random() < 0.18) {
    s.attrs.GX = clamp(s.attrs.GX + 2)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    return `【派系】${factionName(s.faction)}给你递了个「露脸」的机会，政绩与关系都沾光。`
  }
  // 会议投票二选一
  if (s.factionHeat > 55 && Math.random() < 0.12 && !s.pendingVote) {
    s.pendingVote = {
      title: '会议表决',
      text: `会上要表决一项有争议的方案。${factionName(s.faction)}希望你投赞成，对家希望你反对。你怎么投？`,
    }
    return '会议表决：本系与对家都在看你。请选择赞成或反对。'
  }
  return null
}

export function resolveVote(s: GameState, choice: 'yes' | 'no' | 'abstain'): string {
  s.pendingVote = null
  if (s.faction === 'none') return '你未站队，弃权。'
  const f = s.faction
  if (choice === 'yes') {
    s.factionRep[f] = clamp((s.factionRep[f] ?? 20) + 8, 0, 100)
    s.factionHeat = clamp(s.factionHeat + 8, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX + 3)
    s.attrs.Lian = clamp(s.attrs.Lian - 4)
    s.risk = clamp(s.risk + 4, 0, 100)
    pushLog(s, `【派系】你投了赞成。${factionName(f)}满意，对家不满。`)
    return '你投赞成。本系声望上升，对家不满，风险与廉洁承压。'
  }
  if (choice === 'no') {
    const others = FACTIONS.filter((x) => x.id !== f).map((x) => x.id)
    const o = others[Math.floor(Math.random() * others.length)]
    s.factionRep[f] = clamp((s.factionRep[f] ?? 20) - 10, 0, 100)
    s.factionRep[o] = clamp((s.factionRep[o] ?? 20) + 6, 0, 100)
    s.factionHeat = clamp(s.factionHeat + 10, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian + 3)
    s.attrs.GX = clamp(s.attrs.GX - 5)
    pushLog(s, `【派系】你投了反对。${factionName(f)}不高兴，对家暗喜。`)
    return '你投反对。本系不满，对家略喜，廉洁略升。'
  }
  s.factionHeat = clamp(s.factionHeat - 4, 0, 100)
  s.attrs.GX = clamp(s.attrs.GX - 2)
  s.attrs.Lian = clamp(s.attrs.Lian + 1)
  pushLog(s, '【派系】你弃权。两边都不太满意。')
  return '你弃权。两边都不太满意，角力热度略降。'
}
