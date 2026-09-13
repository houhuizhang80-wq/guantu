/** 从办事员 BFS：各条线最高可达职级 */
import { POSTS, getPost } from '../src/data/posts'

function neighbors(id: string): string[] {
  return getPost(id).nextPaths.map((p) => p.to)
}

function bfs(start: string) {
  const reach = new Set<string>([start])
  const q = [start]
  let best = getPost(start)
  while (q.length) {
    const cur = q.shift()!
    for (const n of neighbors(cur)) {
      if (reach.has(n)) continue
      reach.add(n)
      q.push(n)
      const p = getPost(n)
      if (p.rank > best.rank) best = p
    }
  }
  return { reach, best }
}

const { reach, best } = bfs('banshiyuan')
console.log('从办事员可达岗位数', reach.size, '/ 全部', POSTS.length)
console.log('最高', best.id, best.level, 'rank', best.rank)

const maxByLevel = new Map<string, { id: string; rank: number }>()
for (const id of reach) {
  const p = getPost(id)
  const prev = maxByLevel.get(p.level)
  if (!prev || p.rank > prev.rank) maxByLevel.set(p.level, { id: p.id, rank: p.rank })
}
console.log('\n各职务层次可达最高：')
for (const [lv, v] of [...maxByLevel.entries()].sort((a, b) => b[1].rank - a[1].rank)) {
  console.log(' ', lv.padEnd(8), v.id, 'r' + v.rank)
}

// 按 title 关键字看条线是否通顶
const tracks: { name: string; test: (t: string) => boolean }[] = [
  { name: '地方主官/政府', test: (t) => /省长|省委书记|市长|县长|镇长/.test(t) },
  { name: '党委党务', test: (t) => /书记|党委|县委|市委|省委/.test(t) && !/纪委/.test(t) },
  { name: '组织', test: (t) => /组织部|组织部部长/.test(t) },
  { name: '宣传', test: (t) => /宣传/.test(t) },
  { name: '政法公安', test: (t) => /政法|公安/.test(t) },
  { name: '纪检巡视', test: (t) => /纪委|监委|巡视/.test(t) },
  { name: '群团', test: (t) => /团委|总工会|妇联|群团/.test(t) },
  { name: '人大政协', test: (t) => /人大|政协/.test(t) },
  { name: '国企央企', test: (t) => /国企|央企|中央企业/.test(t) },
  { name: '部委', test: (t) => /国务院|部委|部长/.test(t) },
  { name: '职级并行', test: (t) => /科员|主任科员|调研员/.test(t) },
  { name: '军委', test: (t) => /军委/.test(t) },
]

console.log('\n条线最高（办事员出发）：')
for (const tr of tracks) {
  const posts = [...reach].map((id) => getPost(id)).filter((p) => tr.test(p.title))
  if (!posts.length) {
    console.log(' ', tr.name.padEnd(10), '无可达岗位')
    continue
  }
  posts.sort((a, b) => b.rank - a.rank)
  const top = posts[0]
  console.log(
    ' ',
    tr.name.padEnd(10),
    'n=' + String(posts.length).padStart(2),
    '最高 r' + String(top.rank).padEnd(5),
    top.level.padEnd(8),
    top.title.slice(0, 22),
    top.rank >= 19 ? '★正国' : top.rank >= 18 ? '★副国' : top.rank >= 15 ? '省部' : '',
  )
}

// 不可达岗位（孤立）
const unreachable = POSTS.filter((p) => !reach.has(p.id))
console.log('\n办事员不可达岗位数', unreachable.length)
if (unreachable.length) {
  console.log(unreachable.slice(0, 15).map((p) => `${p.id} r${p.rank} ${p.title}`).join('\n'))
}
