/** 本乡出身：本乡好名声不应锁死登顶（新规则：38 岁 + 无路可走 + stuckLong） */
import { createNewGame } from '../src/state/game'
import { ENDINGS } from '../src/data/endings'
import { getPost } from '../src/data/posts'
import type { GameState } from '../src/types'

function assert(c: boolean, m: string) {
  if (!c) throw new Error(m)
}

const ending = ENDINGS.find((e) => e.id === 'benxiang_liu')!
assert(!!ending, 'has ending')

function base(): GameState {
  const s = createNewGame('benxiang', 'tianfu')
  s.originId = 'benxiang'
  s.flags.originName = '本乡本土'
  s.attrs.MX = 70
  s.risk = 20
  s.flags.jiaoliu = false
  return s
}

// 早期：不应触发
const a = base()
a.turn = 36
a.age = 28
a.postId = 'keyuan'
assert(!ending.check(a), 'turn 36 科员不截断')

// 34 岁（旧阈值）即便无路也不该截——新规则要 38+
const young = base()
young.turn = 120
young.age = 34
young.postId = 'fuzhenzhang'
young.flags.monthsInPost = 40
assert(!ending.check(young), '34岁不截断')

// 38 岁副镇长未交流，但若仍有可走去向则不截
const canClimb = base()
canClimb.turn = 140
canClimb.age = 38
canClimb.postId = 'fuzhenzhang'
canClimb.flags.monthsInPost = 5
canClimb.attrs = { ZJ: 90, GX: 90, Lian: 90, MX: 80, NL: 90 }
canClimb.risk = 5
canClimb.eventsHandledThisPost = 20
canClimb.mashScore = 0
canClimb.probationLeft = 0
assert(!ending.check(canClimb), '38岁但有路不截断')

// 已交流升上去：不触发
const c = base()
c.turn = 140
c.age = 40
c.postId = 'xianzhang'
c.flags.jiaoliu = true
assert(!ending.check(c), '交流后县长不截断')

// 副县及以上职级：不触发
const d = base()
d.turn = 140
d.age = 40
d.postId = 'fuxianzhang'
assert(!ending.check(d), '副县不截断')

console.log('benxiang_liu gate ok', {
  early: getPost('keyuan').level,
  stay: getPost('fuzhenzhang').level,
  moved: getPost('xianzhang').level,
})
