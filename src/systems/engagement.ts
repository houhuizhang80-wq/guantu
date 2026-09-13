import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'

/** 当前职级对应的草率分锁死线 */
export function mashLimitFor(minRank: number): number {
  return minRank >= 18 ? 28 : minRank >= 15 ? 36 : minRank >= 12 ? 48 : 60
}

/**
 * 记录一次事件选项。
 * 连点改为阶梯：连 2 次 +4，连 3 次 +8，连 4 次及以上 +12（不再第 4 次悬崖 +18）。
 * 认真轮换时：草率分 ≥40 降得更快（−5），否则 −3。
 */
export function noteChoice(s: GameState, index: number) {
  if (!s.choiceHistory) s.choiceHistory = []
  s.choiceHistory.push(index)
  if (s.choiceHistory.length > 8) s.choiceHistory.shift()
  if (!s.mashScore) s.mashScore = 0

  const hist = s.choiceHistory
  let streak = 1
  for (let i = hist.length - 2; i >= 0; i--) {
    if (hist[i] === hist[hist.length - 1]) streak++
    else break
  }

  if (streak >= 2) {
    const add = streak >= 4 ? 12 : streak === 3 ? 8 : 4
    const before = s.mashScore
    s.mashScore = clamp(s.mashScore + add, 0, 100)
    if (before < 50 && s.mashScore >= 50) {
      pushLog(s, '（组织观察）决策模式过于单一，请认真研判选项。')
    }
  } else {
    const decay = s.mashScore >= 40 ? 5 : 3
    s.mashScore = clamp(s.mashScore - decay, 0, 100)
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
  // 换行动：草率高时多降一点
  const decay = (s.mashScore ?? 0) >= 40 ? 3 : 2
  s.mashScore = clamp((s.mashScore ?? 0) - decay, 0, 100)
  return { decay: false }
}

/** 晋升前的「履职质量」门槛 */
export function engagementGate(s: GameState, minRank: number): { ok: boolean; reason: string } {
  const handled = s.eventsHandledThisPost ?? 0
  const need = minRank >= 18 ? 14 : minRank >= 15 ? 12 : minRank >= 12 ? 8 : minRank >= 8 ? 6 : minRank >= 4 ? 5 : 3
  if (handled < need)
    return {
      ok: false,
      reason: `本岗位经手事件不足（需至少 ${need} 件，现 ${handled}）——组织要看实绩过程`,
    }
  const mashLimit = mashLimitFor(minRank)
  if ((s.mashScore ?? 0) >= mashLimit)
    return {
      ok: false,
      reason: `决策过于草率（草率分 ${s.mashScore ?? 0}/${mashLimit}，连续点同一选项或敷衍）。请认真轮换选项、少快进，分数会逐渐回落`,
    }
  if ((s.failStreak ?? 0) >= 3)
    return { ok: false, reason: '连续失误，需先稳住工作局面' }
  return { ok: true, reason: '' }
}

/** 距离锁死还差多少；≤0 表示已超线 */
export function mashHeadroom(s: GameState, minRank: number): number {
  return mashLimitFor(minRank) - (s.mashScore ?? 0)
}

/** 是否应展示预警（差 10 分以内且仍可玩） */
export function mashWarn(s: GameState, minRank: number): boolean {
  const head = mashHeadroom(s, minRank)
  return head <= 10 && head > 0 && (s.mashScore ?? 0) >= 20
}

export function mashPenalty(s: GameState): number {
  return Math.round((s.mashScore ?? 0) * 0.15)
}

/**
 * 快进：荒政代价略降；若本月已排周计划，可抵消 2 点草率。
 */
export function applySkipMonthCost(s: GameState) {
  let add = 4
  if (s.weekPlanned) add = Math.max(1, add - 2)
  s.mashScore = clamp((s.mashScore ?? 0) + add, 0, 100)
  s.attrs.ZJ = clamp(s.attrs.ZJ - 1)
  if (s.family) s.family.spouseMood = clamp(s.family.spouseMood - 2)
  s.risk = clamp(s.risk + 0.8, 0, 100)
}

/** 危险选拔策略：同一日历月内草率只加一次 */
export function applyPromoMashOnce(s: GameState, delta: number): number {
  if (!delta) return 0
  const stamp = `${s.year}-${s.month}`
  if (s.flags.mashStratMonth === stamp) return 0
  s.flags.mashStratMonth = stamp
  s.mashScore = clamp((s.mashScore ?? 0) + delta, 0, 100)
  return delta
}

export function resetEngagementOnPost(s: GameState) {
  s.eventsHandledThisPost = 0
  s.lastActionKey = null
}
