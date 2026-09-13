import { POSTS } from '../src/data/posts'
import { MASS_POSTS, MASS_LINKS } from '../src/data/posts_quntuan'

const ids = new Set<string>([...POSTS.map((p) => p.id), ...MASS_POSTS.map((p) => p.id)])
const missing: string[] = []
for (const p of MASS_POSTS) {
  for (const x of p.nextPaths) {
    if (!ids.has(x.to)) missing.push(`${p.id} -> ${x.to}`)
  }
}
for (const l of MASS_LINKS) {
  if (!ids.has(l.from)) missing.push(`link from ${l.from}`)
  if (!ids.has(l.path.to)) missing.push(`link to ${l.path.to}`)
}
console.log('missing:', missing.length ? missing.join('\n') : 'none')
console.log('mass', MASS_POSTS.length, 'links', MASS_LINKS.length)
// sample ids
console.log('has renda_fu', ids.has('renda_fu'), 'zhengxie_fu', ids.has('zhengxie_fu'), 'buwei_zhang', ids.has('buwei_zhang'), 'guowuweiyuan', ids.has('guowuweiyuan'), 'shengshu_zuzhi', ids.has('shengshu_zuzhi'), 'dangweiyuan', ids.has('dangweiyuan'))
