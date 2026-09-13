import { POSTS } from '../src/data/posts'
import { EXTRA2_POSTS, EXTRA2_LINKS } from '../src/data/posts_extra2'

const ids = new Set<string>([...POSTS.map((p) => p.id), ...EXTRA2_POSTS.map((p) => p.id)])
const missing: string[] = []
for (const p of EXTRA2_POSTS) {
  for (const x of p.nextPaths) {
    if (!ids.has(x.to)) missing.push(`${p.id} -> ${x.to}`)
  }
}
for (const l of EXTRA2_LINKS) {
  if (!ids.has(l.from)) missing.push(`link from ${l.from}`)
  if (!ids.has(l.path.to)) missing.push(`link to ${l.path.to}`)
}
console.log('missing:', missing.length ? [...new Set(missing)].join('\n') : 'none')
console.log('extra2 posts', EXTRA2_POSTS.length, 'links', EXTRA2_LINKS.length)
console.log('total posts', new Set([...POSTS.map((p) => p.id), ...EXTRA2_POSTS.map((p) => p.id)]).size)
