/** 批量缩短 posts.ts 的 minMonths（任职月数） */
import { readFileSync, writeFileSync } from 'node:fs'

const path = process.argv[2] || 'src/data/posts.ts'
let src = readFileSync(path, 'utf8')

// 仅替换 minMonths: N, 不动注释里的数字
const map: Record<string, string> = {
  '12': '10',
  '18': '14',
  '24': '18',
  '30': '20',
  '36': '24',
  '48': '30',
  '60': '36',
  '72': '42',
}

let count = 0
src = src.replace(/minMonths:\s*(\d+)/g, (full, n: string) => {
  const next = map[n]
  if (!next) return full
  count++
  return full.replace(String(n), next)
})

writeFileSync(path, src)
console.log('replaced', count, 'minMonths in', path)
