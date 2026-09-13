import type { AttrFx, GameState } from '../types'
import { clamp, pushLog } from '../state/game'

export function noteFloat(s: GameState, fx: AttrFx, riskDelta?: number) {
  const list: { key: string; delta: number }[] = []
  const map: [keyof AttrFx, string][] = [
    ['ZJ', '政绩'],
    ['GX', '关系'],
    ['Lian', '廉洁'],
    ['MX', '民心'],
    ['NL', '能力'],
  ]
  for (const [k, label] of map) {
    const v = fx[k]
    if (typeof v === 'number' && v !== 0) list.push({ key: label, delta: v })
  }
  if (typeof riskDelta === 'number' && riskDelta !== 0)
    list.push({ key: '风险', delta: riskDelta })
  s.floatFx = list
}

export function clearFloat(s: GameState) {
  s.floatFx = undefined
}

/** 组织约谈：连续不称职触发 */
export function maybeOrgTalk(s: GameState): boolean {
  if (s.badAppraisalStreak < 2) return false
  if (s.flags.orgTalkDone) return false
  s.flags.orgTalkDone = true
  s.attrs.GX = clamp(s.attrs.GX - 8)
  s.risk = clamp(s.risk + 6, 0, 100)
  pushLog(
    s,
    '【组织约谈】连续考核靠后。组织找你谈话：要正视问题、限期整改。关系与风险承压。',
  )
  s.lastFeedback = {
    title: '组织约谈',
    text: '连续两年考核靠后，组织已约谈。请认真履职，否则可能调整岗位。',
  }
  return true
}

/** 高好感主动来访 / 低好感使绊子 */
export function networkDrama(s: GameState, npcId: string, favor: number): string | null {
  if (favor >= 70 && Math.random() < 0.22 && !s.pendingVisit) {
    s.pendingVisit = { npcId, favor }
    return null
  }
  if (favor <= -20 && Math.random() < 0.18) {
    s.risk = clamp(s.risk + 3, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 2)
    return '关系网：有人在背后使绊子，风险与关系承压。'
  }
  return null
}

export function resolveVisit(s: GameState, accept: boolean): { text: string } {
  const v = s.pendingVisit
  s.pendingVisit = null
  if (!v) return { text: '' }
  const ref = s.npcs.find((n) => n.id === v.npcId)
  if (accept) {
    if (ref) ref.favor = clamp(ref.favor + 6, -50, 100)
    s.attrs.GX = clamp(s.attrs.GX + 3)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
    pushLog(s, '关系网：你赴了友人的约，交情更深。')
    return { text: '你推掉应酬赴约。对方很高兴，说起不少有用的话。关系上升。' }
  }
  if (ref) ref.favor = clamp(ref.favor - 3, -50, 100)
  pushLog(s, '关系网：你婉拒了友人的来访。')
  return { text: '你以工作为由婉拒。对方表示理解，下次再约。好感略降。' }
}
