import { getPost, POSTS } from '../src/data/posts'

const long: string[] = []
for (const p of POSTS) {
  if ((p.minMonths ?? 0) > 24) long.push(`post ${p.id} minMonths=${p.minMonths}`)
  for (const x of p.nextPaths) {
    if ((x.minMonths ?? 0) > 24) long.push(`path ${p.id}->${x.to} minMonths=${x.minMonths}`)
  }
}
console.log('over24 count', long.length)
console.log(long.slice(0, 20).join('\n'))
const d = getPost('guoqi_dong')
console.log('guoqi_dong', d.minMonths, d.nextPaths.map((x) => `${x.to}:${x.minMonths ?? 'inh'}`).join(' | '))
