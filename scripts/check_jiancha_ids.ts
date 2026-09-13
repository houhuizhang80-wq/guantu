import { POSTS } from '../src/data/posts'
import { JIANCHA_POSTS, JIANCHA_LINKS } from '../src/data/posts_jiancha'

const ids = new Set<string>([...POSTS.map((p) => p.id), ...JIANCHA_POSTS.map((p) => p.id)])
const missing: string[] = []
for (const p of JIANCHA_POSTS) {
  for (const x of p.nextPaths) {
    if (!ids.has(x.to)) missing.push(`${p.id} -> ${x.to}`)
  }
}
for (const l of JIANCHA_LINKS) {
  if (!ids.has(l.from)) missing.push(`link from ${l.from}`)
  if (!ids.has(l.path.to)) missing.push(`link to ${l.path.to}`)
}
console.log('missing:', missing.length ? missing.join('\n') : 'none')
console.log('jiancha posts', JIANCHA_POSTS.length, 'links', JIANCHA_LINKS.length)
console.log('xianjiwei_fu2', ids.has('xianjiwei_fu2'), 'shengjiwei_fu', ids.has('shengjiwei_fu'), 'jiancha_zhang', ids.has('jiancha_zhang'), 'shi_shirenda_fu', ids.has('shi_shirenda_fu'))
