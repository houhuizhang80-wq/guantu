/** 本乡出身：本乡好名声不应锁死登顶 */
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
  return s
}

// 早期高民心：不应触发
const a = base()
a.turn = 36
a.age = 28
a.postId = 'keyuan'
assert(!ending.check(a), 'turn 36 科员不截断')

// 长期乡镇未交流且年过而立：应触发
const b = base()
b.turn = 108
b.age = 34
b.postId = 'fuzhenzhang'
b.flags.jiaoliu = false
assert(ending.check(b), '108月副镇长未交流截断')

// 已交流出去升上去：不触发
const c = base()
c.turn = 108
c.age = 34
c.postId = 'xianzhang'
c.flags.jiaoliu = true
assert(!ending.check(c), '交流后县长不截断')

// 职级超过乡镇主要领导：不触发
const d = base()
d.turn = 108
d.age = 36
d.postId = 'fuxianzhang'
d.flags.jiaoliu = false
assert(!ending.check(d), '副县不截断')

// 年龄未到 34：不触发
const e = base()
e.turn = 108
e.age = 32
e.postId = 'fuzhenzhang'
e.flags.jiaoliu = false
assert(!ending.check(e), '32岁不截断')

console.log('benxiang_liu gate ok', {
  early: getPost('keyuan').level,
  stay: getPost('fuzhenzhang').level,
  moved: getPost('xianzhang').level,
})
