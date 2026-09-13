import type { GameEvent, GameState } from '../types'
import { EVENTS } from '../data/events'
import { getPost } from '../data/posts'
import { getProvince } from '../data/provinces'

/** 冷却窗口：最近 N 次抽到的事件不再进池（比旧版 4 更长，压重复） */
const RECENT_COOLDOWN = 12

function eligible(s: GameState, e: GameEvent): boolean {
  if (e.onlyOnce && s.usedEvents.includes(e.id)) return false
  if (!e.onlyOnce) {
    const recent = s.recentEvents ?? []
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
  if (e.pathTag === 'jijian') {
    const title = getPost(s.postId).title
    const onTrack =
      title.includes('纪委') ||
      title.includes('监委') ||
      title.includes('巡视') ||
      (s.paths ?? []).includes('jijian')
    if (!onTrack) return false
  }
  if (e.pathTag === 'zhengfa') {
    const title = getPost(s.postId).title
    const onTrack =
      title.includes('政法') ||
      title.includes('公安') ||
      title.includes('检察') ||
      title.includes('法院') ||
      title.includes('司法') ||
      (s.paths ?? []).includes('zhengfa')
    if (!onTrack) return false
  }
  const rank = getPost(s.postId).rank
  if (typeof e.minRank === 'number' && rank < e.minRank) return false
  if (typeof e.maxRank === 'number' && rank > e.maxRank) return false
  if (typeof e.minRisk === 'number' && s.risk < e.minRisk) return false
  if (e.monthMod && e.monthMod.length > 0 && !e.monthMod.includes(s.month)) return false
  return true
}

function hitsOf(s: GameState, id: string): number {
  return s.eventHits?.[id] ?? 0
}

/**
 * 加权抽取：见过越多次权重越低，从未见过的有加成。
 * 避免「加班夜 ×30」把中局打成复读。
 */
function pickWeighted(pool: GameEvent[], s: GameState): GameEvent | null {
  if (pool.length === 0) return null
  const weights = pool.map((e) => {
    const hits = hitsOf(s, e.id)
    const base = Math.max(e.weight, 0.5)
    if (hits <= 0) return base * 1.6
    return base / Math.pow(1 + hits, 1.35)
  })
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return pool[Math.floor(Math.random() * pool.length)]
  let roll = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
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

  // 专项链后续：上一环刚过就优先接上，保证 3 个月连续剧情
  const chainNext = EVENTS.filter(
    (e) =>
      e.onlyOnce &&
      e.require?.afterEvent &&
      s.usedEvents.includes(e.require.afterEvent) &&
      eligible(s, e),
  )
  if (chainNext.length > 0 && Math.random() < 0.85) {
    return chainNext[0]
  }

  if (s.risk >= 30 && s.turn > 3) {
    const crises = EVENTS.filter((e) => e.kind === 'crisis' && eligible(s, e))
    if (crises.length > 0 && Math.random() < Math.min(0.55, 0.15 + s.risk / 180)) {
      // 危机也降权，避免同一危机反复砸脸
      return pickWeighted(crises, s)
    }
  }

  const soft = EVENTS.filter(
    (e) => (e.kind === 'daily' || e.kind === 'npc' || e.kind === 'calm') && eligible(s, e),
  )
  const picked = pickWeighted(soft, s)
  if (picked) return picked

  const any = EVENTS.filter((e) => eligible(s, e))
  return any.length ? pickWeighted(any, s) : null
}

export function markEventUsed(s: GameState, e: GameEvent) {
  if (!s.eventHits) s.eventHits = {}
  s.eventHits[e.id] = (s.eventHits[e.id] ?? 0) + 1

  if (e.onlyOnce) {
    if (!s.usedEvents.includes(e.id)) s.usedEvents.push(e.id)
  } else {
    if (!s.recentEvents) s.recentEvents = []
    s.recentEvents.push(e.id)
    if (s.recentEvents.length > RECENT_COOLDOWN) s.recentEvents.shift()
  }
}

export function eventHitCount(s: GameState, id: string): number {
  return hitsOf(s, id)
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
