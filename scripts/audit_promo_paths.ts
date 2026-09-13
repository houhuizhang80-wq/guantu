/**
 * 全出身晋升路线连通性 + 死路/年龄陷阱扫描
 */
import { POSTS, getPost } from '../src/data/posts'
import { ORIGINS } from '../src/data/origins'
import { createNewGame } from '../src/state/game'
import { availablePaths } from '../src/systems/promotion'
import { minAgeForRank, maxAgeForRank } from '../src/systems/age'

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

// ── 1) 图连通：从每个 start 只沿 nextPaths（忽略数值门槛，只看结构） ──
function structuralEdges(postId: string): { to: string; path: any }[] {
  const p = getPost(postId)
  return p.nextPaths.map((path) => ({ to: path.to, path }))
}

function bfsReach(start: string): { reach: Set<string>; maxRank: number; maxId: string } {
  const reach = new Set<string>([start])
  const q = [start]
  let maxRank = getPost(start).rank
  let maxId = start
  while (q.length) {
    const cur = q.shift()!
    for (const e of structuralEdges(cur)) {
      if (reach.has(e.to)) continue
      reach.add(e.to)
      q.push(e.to)
      const r = getPost(e.to).rank
      if (r > maxRank) {
        maxRank = r
        maxId = e.to
      }
    }
  }
  return { reach, maxRank, maxId }
}

console.log('══════════ 结构连通性（忽略五维/月数/事件，只看图） ══════════')
const starts = new Map<string, string>()
for (const o of ORIGINS) {
  const s = createNewGame(o.id, 'tianfu')
  starts.set(o.id, s.postId)
  const { reach, maxRank, maxId } = bfsReach(s.postId)
  const canZhengguo = [...reach].some((id) => getPost(id).rank >= 19)
  const canFuguo = [...reach].some((id) => getPost(id).rank >= 18)
  const canShengbu = [...reach].some((id) => getPost(id).rank >= 16)
  console.log(
    o.id.padEnd(14),
    'start',
    s.postId.padEnd(12),
    '可达',
    String(reach.size).padStart(3),
    '最高',
    `${maxId}(r${maxRank})`,
    canZhengguo ? '★正国可达' : canFuguo ? '副国可达' : canShengbu ? '仅省部' : '★卡在厅局以下',
  )
}

// ── 2) 全图死路：没有任何 nextPaths 或 nextPaths 目标 rank 不更高且无并行 ──
console.log('\n══════════ 死路 / 窄路扫描 ══════════')
const dead: string[] = []
const narrow: string[] = []
for (const p of POSTS) {
  if (!p.nextPaths || p.nextPaths.length === 0) {
    // 终点岗（正国/主席）允许无路
    if (p.rank < 19) dead.push(`${p.id} r${p.rank} ${p.title} · 无 nextPaths`)
    continue
  }
  const higher = p.nextPaths.filter((x) => getPost(x.to).rank > p.rank)
  const sameOrLower = p.nextPaths.filter((x) => getPost(x.to).rank <= p.rank)
  if (higher.length === 0 && p.rank < 19) {
    dead.push(
      `${p.id} r${p.rank} ${p.title} · 无更高去路（仅并行/平调 ${p.nextPaths.map((x) => x.to).join(',')}）`,
    )
  } else if (higher.length === 1 && p.rank >= 4) {
    narrow.push(`${p.id} r${p.rank} ${p.title} → 唯一上升 ${higher[0].to}（${higher[0].label}）`)
  }
  void sameOrLower
}
if (dead.length) {
  console.log('死路:')
  for (const d of dead) console.log(' ', d)
} else console.log('死路: 无')
console.log('窄路（唯一上升去向）', narrow.length, '条，高层示例:')
for (const n of narrow.filter((x) => x.includes('r1') || x.includes('r8') || x.includes('r1') || /r1[0-9]/.test(x)).slice(0, 20)) {
  console.log(' ', n)
}
// 打印所有 rank>=12 的窄路
console.log('厅局及以上窄路:')
for (const n of narrow) {
  const m = n.match(/r(\d+)/)
  if (m && Number(m[1]) >= 12) console.log(' ', n)
}

// ── 3) needFlag 闭环：flag 能否在到达需要它的路径前拿到 ──
console.log('\n══════════ needFlag 可达性 ══════════')
// 从所有 start 做 BFS，模拟「能获得的 flag」（任免时按目标 title 打标）
// 简化：needFlag=dangwu 的路径，只要图上能到任何 title 含 党委/县委/市委/省委/纪委/组织/宣传 的岗即可
const dangwuTitles = /党委|县委|市委|省委|纪委|组织|宣传/
const { reach } = bfsReach('banshiyuan')
const canDangwu = [...reach].some((id) => dangwuTitles.test(getPost(id).title) || getPost(id).title.includes('党'))
console.log('从办事员图上可达含党务标记岗:', canDangwu)
for (const p of POSTS) {
  for (const path of p.nextPaths) {
    if (path.needFlag === 'dangwu') {
      // 该路径本身是否从可达图上
      console.log(`  needFlag=dangwu: ${p.id} → ${path.to} (${path.label})`)
    }
  }
}

// ── 4) 年龄窗口：出生 23/25/27/30/32/34 到各 rank 的窗口是否够走完 ──
console.log('\n══════════ 年龄窗口（理论最快，连续晋升） ══════════')
const agesStart = [23, 25, 27, 30, 32, 34]
// 粗算：每级 minMonths 之和（取领导职务默认）
const chain = [
  ['banshiyuan', 12],
  ['keyuan', 12],
  ['fuzhenzhang', 20],
  ['zhenzhang', 30],
  ['fuxianzhang', 30],
  ['xianzhang', 36],
  ['fushizhang', 36],
  ['shizhang', 36],
  ['fushengzhang', 36],
  ['shengzhang', 36],
  ['fuzongli', 24],
  ['zongli', 36],
] as const
let months = 0
console.log('理论最快爬到各节点所需月数/年龄（不含试用期）:')
for (const [id, m] of chain) {
  months += m
  const post = getPost(id)
  const rank = post.rank
  console.log(
    `  ${id.padEnd(12)} +${m}月 累计${months}月 → 开局23岁约${(23 + months / 12).toFixed(1)}岁 · 该职级年龄窗 ${minAgeForRank(rank)}–${maxAgeForRank(rank)}`,
  )
}
for (const a0 of agesStart) {
  const ageTop = a0 + months / 12
  const ok = ageTop <= maxAgeForRank(19)
  console.log(`开局 ${a0} 岁理论登顶约 ${ageTop.toFixed(1)} 岁 · ${ok ? '窗口够' : '★年龄窗不够'}`)
}

// ── 5) 全满属性下各出身真实 availablePaths（含年龄默认） ──
console.log('\n══════════ 各出身开局 availablePaths（原生状态） ══════════')
for (const o of ORIGINS) {
  const s = createNewGame(o.id, 'tianfu')
  const paths = availablePaths(s)
  console.log(
    o.id.padEnd(14),
    'age',
    s.age,
    'attrs',
    JSON.stringify(s.attrs),
    'paths',
    paths.map((p) => `${p.ok ? 'OK' : 'no'}:${p.path.label}(${p.reason || '可'})`).join(' | ') || '(无)',
  )
}
