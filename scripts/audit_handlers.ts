/** 静态审计：main.ts 处理函数是否都有可见反馈 */
import { readFileSync } from 'node:fs'

const src = readFileSync('src/main.ts', 'utf8')

// 提取 handlers 对象里的每个 onXxx 函数体（粗粒度）
const start = src.indexOf('const handlers')
const chunk = start >= 0 ? src.slice(start) : src

const fnRe = /\b(on[A-Z][A-Za-z0-9]*)\s*:\s*(\([^)]*\)|[A-Za-z_][A-Za-z0-9_]*)\s*=>\s*\{/g
const results: { name: string; body: string }[] = []
let m: RegExpExecArray | null
while ((m = fnRe.exec(chunk))) {
  const name = m[1]
  // 从 { 开始括号匹配
  let i = fnRe.lastIndex - 1
  let depth = 0
  let end = i
  for (; end < chunk.length; end++) {
    if (chunk[end] === '{') depth++
    else if (chunk[end] === '}') {
      depth--
      if (depth === 0) {
        end++
        break
      }
    }
  }
  results.push({ name, body: chunk.slice(i, end) })
}

const suspicious: string[] = []
for (const r of results) {
  const b = r.body
  const hasDraw = b.includes('draw()')
  const hasFeedback = b.includes('lastFeedback') || b.includes('showAuthErr') || b.includes('alert(') || b.includes('confirm(')
  const hasConfirm = b.includes('confirm(')
  const hasPhase = b.includes('phase =')
  const hasShow = b.includes('show') || b.includes('mount') || b.includes('Show')
  const isPureState = b.includes('state.') && !hasDraw && b.includes('saveGame')
  // 仅改 phase 也应 draw
  if (!hasDraw && !isPureState) {
    // 短函数可能只是委托
    if (b.length < 400 && !hasDraw) {
      suspicious.push(`${r.name}: no draw() len=${b.length}`)
    }
  }
  if (!hasFeedback && !hasDraw && !hasPhase && !hasConfirm) {
    suspicious.push(`${r.name}: no feedback/draw/phase`)
  }
}

console.log('handlers found', results.length)
console.log('--- suspicious (sample) ---')
for (const s of suspicious.slice(0, 40)) console.log(s)

// 另外：render 里 data-act / data-* 是否都有监听
const render = readFileSync('src/ui/render.ts', 'utf8')
const acts = new Set<string>()
for (const mm of render.matchAll(/data-act="([^"]+)"/g)) acts.add(mm[1])
const wired = new Set<string>()
for (const mm of render.matchAll(/data-act="([^"]+)"[^)]*\)/g)) wired.add(mm[1])
// 更准：querySelector('[data-act="x"]')
const qs = new Set<string>()
for (const mm of render.matchAll(/\[data-act="([^"]+)"\]/g)) qs.add(mm[1])
console.log('data-act values', acts.size)
console.log('data-act without querySelector wire?', [...acts].filter((a) => !qs.has(a)).slice(0, 30))
