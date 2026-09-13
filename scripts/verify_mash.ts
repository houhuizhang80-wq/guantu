/** 草率分阶梯与恢复自检 */
import { createNewGame } from '../src/state/game'
import {
  noteChoice,
  applySkipMonthCost,
  engagementGate,
  mashLimitFor,
  applyPromoMashOnce,
} from '../src/systems/engagement'

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

function assert(c: boolean, m: string) {
  if (!c) throw new Error(m)
  console.log('PASS', m)
}

const s = createNewGame('shengkao', 'tianfu')
s.mashScore = 0
noteChoice(s, 0)
noteChoice(s, 1)
assert(s.mashScore === 0, '轮换不涨')
noteChoice(s, 2)
noteChoice(s, 2) // streak 2
assert(s.mashScore === 4, `连2 +4 got ${s.mashScore}`)
noteChoice(s, 2) // streak 3
assert(s.mashScore === 12, `连3 +8 got ${s.mashScore}`)
noteChoice(s, 2) // streak 4
assert(s.mashScore === 24, `连4 +12 got ${s.mashScore}`)
noteChoice(s, 3) // break
assert(s.mashScore === 19, `认真 −5（因≥40? 24<40 应为-3）got ${s.mashScore}`)
// 24 < 40 so decay 3 → 21
s.mashScore = 40
noteChoice(s, 0)
noteChoice(s, 1)
assert(s.mashScore === 35, `≥40 认真 −5 got ${s.mashScore}`)

s.mashScore = 20
s.weekPlanned = false
applySkipMonthCost(s)
assert(s.mashScore === 24, `快进 +4 got ${s.mashScore}`)
s.mashScore = 20
s.weekPlanned = true
applySkipMonthCost(s)
assert(s.mashScore === 22, `快进+周计划 +2 got ${s.mashScore}`)

s.mashScore = 10
s.year = 2030
s.month = 5
applyPromoMashOnce(s, 12)
applyPromoMashOnce(s, 12)
assert(s.mashScore === 22, `危险策略同月只加一次 got ${s.mashScore}`)

assert(mashLimitFor(4) === 60 && mashLimitFor(18) === 28, '锁死线')
s.mashScore = 25
s.eventsHandledThisPost = 10
const g = engagementGate(s, 4)
assert(g.ok, '25/60 可选拔')
s.mashScore = 60
assert(!engagementGate(s, 4).ok, '60/60 锁死')

console.log('mash system ok')
