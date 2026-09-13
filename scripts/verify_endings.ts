/**
 * 复现并核查：36 岁副处、低风险、家庭和睦，本岗已满 3 年但属性暂不达晋升门槛时，
 * 是否会被误判收档（结局「家和事兴」）。
 *
 * 断言：
 *  1) 壮年期（<50 岁）岗位仍有上一级去路时，不应收档
 *  2) 年长后（>=55 岁）确实无去向时，「家和事兴」仍应正常触发（不能被改死）
 */
import { createNewGame } from '../src/state/game'
import { resolveEnding, ENDINGS } from '../src/data/endings'
import { availablePaths } from '../src/systems/promotion'
import { getPost } from '../src/data/posts'

function scenario(age: number, monthsInPost: number) {
  const s = createNewGame('kaosheng', 'beilu')
  s.postId = 'fuxianzhang' // 副县长：县处级副职
  s.age = age
  s.turn = (age - 23) * 12
  s.risk = 4
  s.attrs.ZJ = 62 // 低于正处岗位门槛（84），暂时升不上去
  s.attrs.GX = 50
  s.attrs.Lian = 70
  s.attrs.MX = 62
  s.attrs.NL = 60
  s.family = { spouse: true, spouseMood: 82, childAge: 8, parentHealth: 62 }
  s.flags.monthsInPost = monthsInPost
  s.retiredMode = false
  return s
}

const post = getPost('fuxianzhang')
console.log('岗位:', post.id, post.title, 'rank', post.rank, 'nextPaths', post.nextPaths.length)

const young = scenario(36, 48)
const pathsYoung = availablePaths(young)
console.log(
  '36岁副处可用去向:',
  pathsYoung.map((p) => `${p.path.label ?? p.path.to}:${p.ok ? 'ok' : 'no'}`).join(', ') || '(无)',
)
const e1 = resolveEnding(young)
console.log('36岁副处结局:', e1 ? `${e1.id} / ${e1.title}` : '(无，游戏继续)')

const old = scenario(58, 60)
const e2 = resolveEnding(old)
console.log('58岁副处结局:', e2 ? `${e2.id} / ${e2.title}` : '(无)')

// 补充：49 岁（仍在壮年保护内）也应继续游戏；52 岁（保护外）可收档
const mid = scenario(49, 60)
const e3 = resolveEnding(mid)
console.log('49岁副处结局:', e3 ? `${e3.id} / ${e3.title}` : '(无，游戏继续)')

// 补充：到龄退休兜底仍然有效（副处 63 岁）
const ret = scenario(63, 60)
const e4 = resolveEnding(ret)
console.log('63岁副处结局:', e4 ? `${e4.id} / ${e4.title}` : '(无)')

console.log('\n断言:')
console.log(' A 36 岁不收档:', e1?.id !== 'jiahe' ? 'PASS' : 'FAIL (误收档)')
console.log(' B 58 岁仍可触发家和事兴:', e2?.id === 'jiahe' ? 'PASS' : 'FAIL (结局被改死)')
console.log(' C 49 岁不收档:', e3?.id !== 'jiahe' ? 'PASS' : 'FAIL')
console.log(' D 63 岁到龄退休兜底:', e4?.id === 'tuixiu' || e4?.id === 'jiahe' ? 'PASS' : 'FAIL')

// 补充：正科（rank<=5）壮年期不应触发「生涯暂缓」
function zanTing(age: number) {
  const s = createNewGame('kaosheng', 'beilu')
  s.postId = 'fuzhenzhang' // 副镇长：乡科级副职（rank <= 5）
  s.age = age
  s.turn = Math.max(210, (age - 23) * 12)
  s.risk = 20
  s.attrs.ZJ = 55
  s.retiredMode = false
  return s
}
const zt = zanTing(54)
console.log('副镇长 rank:', getPost('fuzhenzhang').rank, '| 场景 turn:', zt.turn)
const e5 = resolveEnding(zanTing(40))
console.log('40岁副镇长结局:', e5 ? `${e5.id} / ${e5.title}` : '(无，游戏继续)')
const e6 = resolveEnding(zt)
console.log('54岁副镇长结局:', e6 ? `${e6.id} / ${e6.title}` : '(无，游戏继续)')
console.log(' E 40 岁不判生涯暂缓:', e5?.id !== 'shengya_zanting' ? 'PASS' : 'FAIL')
console.log(' F 54 岁仍可判生涯暂缓:', e6?.id === 'shengya_zanting' ? 'PASS' : 'FAIL')

// 附带：列出所有不含年龄门槛的收档结局（用 stuckLong 的）
const noAge = ENDINGS.filter((e) => e.check.toString().includes('stuckLong'))
console.log(
  '\n使用 stuckLong 的结局:',
  noAge.map((e) => e.id).join(', '),
)
