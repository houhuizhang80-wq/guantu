import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'

/** 记录一次事件选项，检测「乱点」 */
export function noteChoice(s: GameState, index: number) {
  if (!s.choiceHistory) s.choiceHistory = []
  s.choiceHistory.push(index)
  if (s.choiceHistory.length > 8) s.choiceHistory.shift()
  if (!s.mashScore) s.mashScore = 0

  const tail = s.choiceHistory.slice(-4)
  const same4 = tail.length === 4 && tail.every((x) => x === tail[0])
  if (same4) {
    s.mashScore = clamp(s.mashScore + 18, 0, 100)
    if (s.mashScore >= 50 && s.mashScore < 55) {
      pushLog(s, '（组织观察）决策模式过于单一，请认真研判选项。')
    }
  } else {
    s.mashScore = clamp(s.mashScore - 3, 0, 100)
  }
}

export function noteEventHandled(s: GameState) {
  s.eventsHandledThisPost = (s.eventsHandledThisPost ?? 0) + 1
}

export function noteAction(s: GameState, key: string): { decay: boolean } {
  if (!s.lastActionKey) {
    s.lastActionKey = key
    return { decay: false }
  }
  if (s.lastActionKey === key) {
    s.mashScore = clamp((s.mashScore ?? 0) + 5, 0, 100)
    return { decay: true }
  }
  s.lastActionKey = key
  s.mashScore = clamp((s.mashScore ?? 0) - 2, 0, 100)
  return { decay: false }
}

/** 晋升前的「履职质量」门槛 */
export function engagementGate(s: GameState, minRank: number): { ok: boolean; reason: string } {
  const handled = s.eventsHandledThisPost ?? 0
  // 高层要求更厚的实绩过程，登顶不能靠空转
  const need = minRank >= 18 ? 14 : minRank >= 15 ? 12 : minRank >= 12 ? 8 : minRank >= 8 ? 6 : minRank >= 4 ? 5 : 3
  if (handled < need)
    return {
      ok: false,
      reason: `本岗位经手事件不足（需至少 ${need} 件，现 ${handled}）——组织要看实绩过程`,
    }
  const mashLimit = minRank >= 18 ? 28 : minRank >= 15 ? 36 : minRank >= 12 ? 48 : 60
  if ((s.mashScore ?? 0) >= mashLimit)
    return {
      ok: false,
      reason: '决策过于草率（连续点同一选项/敷衍），请先认真处置事务',
    }
  if ((s.failStreak ?? 0) >= 3)
    return { ok: false, reason: '连续失误，需先稳住工作局面' }
  return { ok: true, reason: '' }
}

export function mashPenalty(s: GameState): number {
  return Math.round((s.mashScore ?? 0) * 0.15)
}

/** 快进：每月荒政代价 */
export function applySkipMonthCost(s: GameState) {
  s.mashScore = clamp((s.mashScore ?? 0) + 6, 0, 100)
  s.attrs.ZJ = clamp(s.attrs.ZJ - 1)
  if (s.family) s.family.spouseMood = clamp(s.family.spouseMood - 2)
  s.risk = clamp(s.risk + 0.8, 0, 100)
}

export function resetEngagementOnPost(s: GameState) {
  s.eventsHandledThisPost = 0
  s.lastActionKey = null
}
