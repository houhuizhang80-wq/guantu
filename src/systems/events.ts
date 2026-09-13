import type { GameEvent, GameState } from '../types'
import { EVENTS } from '../data/events'
import { getPost } from '../data/posts'
import { getProvince } from '../data/provinces'

function eligible(s: GameState, e: GameEvent): boolean {
  if (e.onlyOnce && s.usedEvents.includes(e.id)) return false
  if (!e.onlyOnce) {
    const recent = s.recentEvents ?? s.usedEvents.slice(-3)
    if (recent.includes(e.id)) return false
  }
  if (!meetsRequire(s, e.require)) return false
  if (e.originIds && e.originIds.length > 0) {
    if (!s.originId || !e.originIds.includes(s.originId)) return false
  }
  if (e.flavors && e.flavors.length > 0) {
    const f = getProvince(s.provinceId).flavor
    if (!e.flavors.includes(f)) return false
  }
  const rank = getPost(s.postId).rank
  if (typeof e.minRank === 'number' && rank < e.minRank) return false
  if (typeof e.maxRank === 'number' && rank > e.maxRank) return false
  if (typeof e.minRisk === 'number' && s.risk < e.minRisk) return false
  if (e.monthMod && e.monthMod.length > 0 && !e.monthMod.includes(s.month)) return false
  return true
}

function pickWeighted(pool: GameEvent[]): GameEvent | null {
  if (pool.length === 0) return null
  const total = pool.reduce((sum, e) => sum + Math.max(e.weight, 0), 0)
  if (total <= 0) {
    return pool[Math.floor(Math.random() * pool.length)]
  }
  let roll = Math.random() * total
  for (const e of pool) {
    roll -= Math.max(e.weight, 0)
    if (roll <= 0) return e
  }
  return pool[pool.length - 1]
}

/**
 * 主线优先；风险够高时插危机；否则在日常/人脉/温和里抽。
 * 连续空窗保底：强制取任意合格事件。
 */
export function scheduleNextEvent(s: GameState): GameEvent | null {
  const mains = EVENTS.filter((e) => e.kind === 'main' && eligible(s, e))
  if (mains.length > 0) {
    mains.sort((a, b) => (a.storyOrder ?? 99) - (b.storyOrder ?? 99))
    return mains[0]
  }

  if (s.risk >= 30 && s.turn > 3) {
    const crises = EVENTS.filter((e) => e.kind === 'crisis' && eligible(s, e))
    if (crises.length > 0 && Math.random() < Math.min(0.55, 0.15 + s.risk / 180)) {
      return crises[Math.floor(Math.random() * crises.length)]
    }
  }

  const soft = EVENTS.filter(
    (e) => (e.kind === 'daily' || e.kind === 'npc' || e.kind === 'calm') && eligible(s, e),
  )
  const picked = pickWeighted(soft)
  if (picked) return picked

  const any = EVENTS.filter((e) => eligible(s, e))
  return any.length ? any[Math.floor(Math.random() * any.length)] : null
}

export function markEventUsed(s: GameState, e: GameEvent) {
  if (e.onlyOnce) {
    if (!s.usedEvents.includes(e.id)) s.usedEvents.push(e.id)
  } else {
    if (!s.recentEvents) s.recentEvents = []
    s.recentEvents.push(e.id)
    if (s.recentEvents.length > 4) s.recentEvents.shift()
  }
}

export function meetsRequire(
  s: GameState,
  require?: Partial<import('../types').Attrs> & {
    maxRisk?: number
    npc?: { id: string; min: number }[]
    afterEvent?: string
  },
): boolean {
  if (!require) return true
  const a = s.attrs
  if (require.ZJ != null && a.ZJ < require.ZJ) return false
  if (require.GX != null && a.GX < require.GX) return false
  if (require.Lian != null && a.Lian < require.Lian) return false
  if (require.MX != null && a.MX < require.MX) return false
  if (require.NL != null && a.NL < require.NL) return false
  if (require.maxRisk != null && s.risk > require.maxRisk) return false
  if (require.afterEvent && !s.usedEvents.includes(require.afterEvent)) return false
  if (require.npc) {
    for (const n of require.npc) {
      const ref = s.npcs.find((x) => x.id === n.id)
      if (!ref || ref.favor < n.min) return false
    }
  }
  return true
}
