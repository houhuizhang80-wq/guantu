import type { GameState } from '../types'
import { clamp, pushLog, pushTimeline } from '../state/game'
import { getPost } from '../data/posts'
import { npcsVisibleAt } from '../data/npcs'

/** 到龄后进入「余热」阶段：顾问/调研/写材料，可选继续或收束 */
export function enterRetired(s: GameState): boolean {
  if (s.retiredMode) return false
  const rank = getPost(s.postId).rank
  const ret = rank <= 3 ? 60 : rank <= 7 ? 60 : rank <= 11 ? 63 : rank <= 14 ? 65 : 68
  if (s.age < ret) return false
  s.retiredMode = true
  pushTimeline(s, 'other', '到龄退休，转入余热')
  pushLog(s, '【退休】到龄。可选择顾问调研、写回忆，或正式收束生涯。')
  s.lastFeedback = {
    title: '到龄退休',
    text: '组织谈话：按规定退休。你可继续「余热」数月，或选择收束生涯。',
  }
  return true
}

export function retiredAct(
  s: GameState,
  kind: 'consult' | 'memoir' | 'settle',
): { text: string; end?: boolean } {
  if (!s.retiredMode) return { text: '' }
  if (kind === 'consult') {
    s.attrs.NL = clamp(s.attrs.NL + 2)
    s.attrs.MX = clamp(s.attrs.MX + 2)
    pushLog(s, '【余热】受邀顾问调研，把经验写成建议。')
    return { text: '你以顾问身份调研，建议被采纳。能力与民心略升。' }
  }
  if (kind === 'memoir') {
    s.attrs.Lian = clamp(s.attrs.Lian + 2)
    s.attrs.MX = clamp(s.attrs.MX + 3)
    pushLog(s, '【余热】整理回忆与材料，不涉及未公开事项。')
    return { text: '你整理材料与回忆，心里更踏实。廉洁与民心略升。' }
  }
  return { text: '你正式收束生涯，回家。', end: true }
}

/** 年度述职侧重：下年事件轻微偏向 */
export function focusEventBias(s: GameState): string | null {
  const f = s.appraisalFocus
  if (!f) return null
  if (f === 'zj' && Math.random() < 0.18) {
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    return '按述职侧重，你把更多精力放在政绩项目上。'
  }
  if (f === 'mx' && Math.random() < 0.18) {
    s.attrs.MX = clamp(s.attrs.MX + 2)
    return '按述职侧重，你把更多精力放在民生实事上。'
  }
  if (f === 'lian' && Math.random() < 0.2) {
    s.risk = clamp(s.risk - 2, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian + 1)
    return '按述职侧重，你把更多精力放在廉洁与风险防控上。'
  }
  return null
}

/** 关系网引荐：高好感引荐新人入场 */
export function maybeIntroduce(s: GameState): string | null {
  if (s.introCd && s.introCd > 0) return null
  if (s.turn < 20) return null
  const rank = getPost(s.postId).rank
  const vis = new Set(npcsVisibleAt(rank).map((n) => n.id))
  const pool = s.npcs.filter((n) => vis.has(n.id))
  if (pool.length === 0) return null
  const best = pool.reduce((a, b) => (b.favor > a.favor ? b : a), pool[0])
  if (best.favor < 55) return null
  if (Math.random() > 0.12) return null
  s.introCd = 6
  const name = rank >= 12 ? '市里新面孔' : '县里新同事'
  s.attrs.GX = clamp(s.attrs.GX + 3)
  pushLog(s, `【关系】${name}经引荐进入你的交往圈。关系+3。`)
  return `${name}经引荐进入你的交往圈，人脉拓宽。`
}

/** 选拔失败复盘 */
export function recordPromoFail(s: GameState, reason: string) {
  if (!s.promoFailLog) s.promoFailLog = []
  s.promoFailLog.unshift(`${s.year}.${s.month} ${reason}`)
  if (s.promoFailLog.length > 8) s.promoFailLog.pop()
}


