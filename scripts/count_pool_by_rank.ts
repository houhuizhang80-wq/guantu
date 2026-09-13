import { createNewGame } from '../src/state/game'
import { EVENTS } from '../src/data/events'
import { getPost } from '../src/data/posts'

const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v)
  },
  removeItem: (k: string) => {
    mem.delete(k)
  },
}

function elig(s: any, e: any) {
  if (e.onlyOnce && s.usedEvents.includes(e.id)) return false
  if (e.minRank != null && getPost(s.postId).rank < e.minRank) return false
  if (e.maxRank != null && getPost(s.postId).rank > e.maxRank) return false
  if (e.originIds && e.originIds.length && !e.originIds.includes(s.originId)) return false
  if (e.flavors && e.flavors.length) return false // 忽略省份，取上界
  return true
}

console.log('总事件池', EVENTS.length)
for (const pid of [
  'banshiyuan',
  'keyuan',
  'fuzhenzhang',
  'zhenzhang',
  'fuxianzhang',
  'xianzhang',
  'shizhang',
  'fushengzhang',
]) {
  const s = createNewGame('shengkao', 'tianfu')
  s.postId = pid
  s.usedEvents = []
  s.recentEvents = []
  const pool = EVENTS.filter((e) => elig(s, e))
  const byKind: Record<string, number> = {}
  for (const e of pool) byKind[e.kind] = (byKind[e.kind] || 0) + 1
  console.log(
    pid.padEnd(12),
    'rank',
    String(getPost(pid).rank).padStart(4),
    '可抽',
    String(pool.length).padStart(3),
    JSON.stringify(byKind),
  )
}
