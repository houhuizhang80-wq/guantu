/** 校验：船上的人不在壮年误收档 */
import { createNewGame } from '../src/state/game'
import { ENDINGS } from '../src/data/endings'
import { getPost } from '../src/data/posts'
import { availablePaths } from '../src/systems/promotion'

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

const ending = ENDINGS.find((e) => e.id === 'paixi_yingjia')!
if (!ending) throw new Error('missing ending')

function base() {
  const s = createNewGame('jishu', 'tianfu')
  s.faction = 'B'
  s.attrs = { ZJ: 100, GX: 100, Lian: 96, MX: 100, NL: 100 }
  s.risk = 7
  s.eventsHandledThisPost = 30
  s.mashScore = 0
  s.probationLeft = 0
  s.flags.monthsInPost = 36
  return s
}

// 46 岁正厅、满维、站队 B：不应触发
const mid = base()
mid.postId = 'shizhang'
mid.age = 46
mid.turn = 220
if (ending.check(mid)) throw new Error('FAIL: 46岁正厅不应「船上的人」')
console.log('PASS 46岁正厅不收档')

// 55+ 且高层卡住：可以触发
const old = base()
old.postId = 'shizhang'
old.age = 58
old.turn = 320
old.attrs.ZJ = 50
old.attrs.GX = 90
old.risk = 20
const paths = availablePaths(old).filter((p) => p.ok)
if (paths.length > 0) {
  console.log('skip positive case: still has paths', paths[0].path.label)
} else {
  if (!ending.check(old)) throw new Error('FAIL: 58岁无路应可触发')
  console.log('PASS 58岁卡住可触发')
}

console.log('paixi_yingjia gate ok')
