/** 断言：壮年、仍有去路时，不应被叙事类结局误收档 */
import { createNewGame } from '../src/state/game'
import { resolveEnding } from '../src/data/endings'
import { availablePaths } from '../src/systems/promotion'
import { getPost } from '../src/data/posts'

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

function base(postId: string, age: number, turn: number) {
  const s = createNewGame('shengkao', 'tianfu')
  s.postId = postId
  s.age = age
  s.turn = turn
  s.attrs = { ZJ: 90, GX: 90, Lian: 90, MX: 90, NL: 90 }
  s.risk = 5
  s.eventsHandledThisPost = 30
  s.mashScore = 0
  s.probationLeft = 0
  s.flags.monthsInPost = 8
  return s
}

function assertNoEnd(name: string, s: ReturnType<typeof base>, ban: string[]) {
  const e = resolveEnding(s)
  if (e && ban.includes(e.id)) {
    throw new Error(`FAIL ${name}: 触发 ${e.id}（${e.title}）`)
  }
  console.log('PASS', name, e ? `→ ${e.id}（允许）` : '无结局')
}

// 1) 46 正厅站队：不得「船上的人」
{
  const s = base('shizhang', 46, 220)
  s.faction = 'B'
  assertNoEnd('46正厅站队', s, ['paixi_yingjia', 'jiafeng', 'jixu', 'yuyi', 'shengya_zanting'])
}

// 2) 40 副处家庭紧张：不得「家风有亏」终局
{
  const s = base('fuxianzhang', 40, 160)
  s.family = { spouse: true, spouseMood: 10, childAge: 2, parentHealth: 15 }
  assertNoEnd('40副处家风紧张', s, ['jiafeng', 'shengya_zanting', 'koubei'])
}

// 3) 35 副科风险高：舆情翻车要等资历
{
  const s = base('fuzhenzhang', 35, 80)
  s.risk = 80
  s.attrs.MX = 20
  assertNoEnd('35副科高风险', s, ['yuyi'])
}

// 4) 48 正科仍有路：不得生涯暂缓
{
  const s = base('zhenzhang', 52, 240)
  s.attrs = { ZJ: 80, GX: 80, Lian: 80, MX: 80, NL: 80 }
  assertNoEnd('52正科有路', s, ['shengya_zanting'])
}

// 5) turn 560 但仍年轻且可升：不得「仕途未尽」硬掐
{
  const s = base('xianzhang', 48, 560)
  s.flags.monthsInPost = 5
  assertNoEnd('560月仍可升', s, ['jixu'])
}

// 6) 本乡 34 岁：不得好名声
{
  const s = createNewGame('benxiang', 'tianfu')
  s.flags.originName = '本乡本土'
  s.age = 34
  s.turn = 120
  s.postId = 'siji_zhuren'
  s.attrs.MX = 80
  s.risk = 10
  assertNoEnd('34本乡', s, ['benxiang_liu'])
}

console.log('premature ending gates ok')
