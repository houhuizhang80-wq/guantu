/**
 * 诊断：五维拉满、经手足够、任职足够时，各职级 availablePaths 是否被卡住
 */
import { createNewGame } from '../src/state/game'
import { availablePaths } from '../src/systems/promotion'
import { getPost, POSTS } from '../src/data/posts'
import { engagementGate } from '../src/systems/engagement'
import { canPromoteDespiteJijian } from '../src/systems/jijian'
import { ageGate } from '../src/systems/age'

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

function maxState(postId: string, age = 50, months = 80, handled = 40) {
  const s = createNewGame('kaosheng', 'tianfu')
  s.postId = postId
  s.age = age
  s.risk = 0
  s.attrs = { ZJ: 100, GX: 100, Lian: 100, MX: 100, NL: 100 }
  s.flags.monthsInPost = months
  s.eventsHandledThisPost = handled
  s.mashScore = 0
  s.failStreak = 0
  s.probationLeft = 0
  s.punishLeft = 0
  s.jijian = null
  s.paths = ['difang', 'dangwu', 'zhengwu', 'tiaoxian', 'jiaoliu']
  s.flags.jiaoliu = true
  s.flags.hometown = 'other'
  return s
}

const samplePosts = [
  'banshiyuan',
  'keyuan',
  'fuzhenzhang',
  'zhenzhang',
  'fuxianzhang',
  'xianzhang',
  'fushizhang',
  'shizhang',
  'fushengzhang',
  'shengzhang',
  'shengwei_shuji',
  'fuzongli',
  'zongli',
]

console.log('=== 全满属性下的可用晋升路径 ===')
for (const id of samplePosts) {
  let post
  try {
    post = getPost(id)
  } catch {
    console.log(id, 'NO POST')
    continue
  }
  // 年龄放在该职级舒适区
  const age = Math.min(62, Math.max(36, Math.round((post.rank >= 15 ? 52 : post.rank >= 12 ? 46 : 36))))
  const s = maxState(id, age, 90, 50)
  const eng = engagementGate(s, post.rank)
  const jj = canPromoteDespiteJijian(s)
  const paths = availablePaths(s)
  const open = paths.filter((p) => p.ok)
  const locked = paths.filter((p) => !p.ok)
  console.log('\n', id, post.level, 'rank', post.rank, 'age', age, 'nextPaths', paths.length)
  console.log('  engagement', eng.ok ? 'ok' : eng.reason)
  console.log('  jijian', jj.ok ? 'ok' : jj.reason)
  console.log('  OPEN', open.length, open.map((p) => `${p.path.label}→${p.path.to}`).join(' | ') || '(无)')
  const reasons = new Map<string, number>()
  for (const p of locked) {
    const key = p.reason || '?'
    reasons.set(key, (reasons.get(key) || 0) + 1)
  }
  for (const [r, c] of [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
    console.log(`  LOCK x${c}:`, r)
  }
}

// needFlag 扫描：哪些路径要 flag 但从未在任免里设置
const flagNeed = new Map<string, number>()
for (const p of POSTS) {
  for (const path of p.nextPaths) {
    if (path.needFlag) flagNeed.set(path.needFlag, (flagNeed.get(path.needFlag) || 0) + 1)
  }
}
console.log('\n=== nextPaths.needFlag 使用统计 ===')
for (const [f, c] of [...flagNeed.entries()].sort()) console.log(`  needFlag=${f} ×${c}`)

// 路径目标不存在？
let badTo = 0
for (const p of POSTS) {
  for (const path of p.nextPaths) {
    try {
      getPost(path.to)
    } catch {
      console.log('BAD to', path.to, 'from', p.id, path.label)
      badTo++
    }
  }
}
console.log('bad target count', badTo)
