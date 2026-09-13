/**
 * 省考出身：全满属性在典型年龄/任职月数下，晋升是否被误锁
 */
import { createNewGame } from '../src/state/game'
import { availablePaths } from '../src/systems/promotion'
import { getPost } from '../src/data/posts'
import { engagementGate } from '../src/systems/engagement'
import { startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'

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

function mk(postId: string, age: number, months: number, handled = 30) {
  const s = createNewGame('shengkao', 'tianfu')
  s.postId = postId
  s.age = age
  s.risk = 5
  s.attrs = { ZJ: 95, GX: 90, Lian: 92, MX: 90, NL: 95 }
  s.flags.monthsInPost = months
  s.eventsHandledThisPost = handled
  s.mashScore = 0
  s.failStreak = 0
  s.probationLeft = 0
  s.punishLeft = 0
  s.jijian = null
  return s
}

function tryPromo(s: any, label: string) {
  const post = getPost(s.postId)
  const paths = availablePaths(s)
  const open = paths.filter((p) => p.ok)
  console.log(
    `\n[${label}] ${post.id} age=${s.age} months=${s.flags.monthsInPost} handled=${s.eventsHandledThisPost} mash=${s.mashScore} rank=${post.rank}`,
  )
  if (!open.length) {
    for (const p of paths.slice(0, 5)) console.log('  LOCK', p.path.label, ':', p.reason)
    return
  }
  const target = open[0]
  console.log('  try', target.path.label, '→', target.path.to)
  const doc = startPromo(s, target.path)
  if (!doc) {
    console.log('  startPromo returned null despite path.ok')
    return
  }
  const stages = ['minzhu', 'kaocha', 'gongshi', 'piaojue']
  for (const st of stages) {
    const strat = { minzhu: 'taici', kaocha: 'rushi', gongshi: 'jingdai', piaojue: 'huiqian' }[st]
    const r = advancePromo(s, strat)
    if (r.failed) {
      console.log('  FAIL at', st, ':', r.failed)
      return
    }
  }
  if (s.promo?.stage === 'renmian') {
    const ok = confirmAppointment(s)
    console.log('  APPOINTED', ok, '→', s.postId, 'probation', s.probationLeft)
  } else {
    console.log('  stage is', s.promo?.stage)
  }
}

// 1) 刚满试用期、属性高但本岗时间不足
let s = mk('banshiyuan', 23, 0, 10)
tryPromo(s, '办事员 0月')

s = mk('banshiyuan', 23, 12, 10)
tryPromo(s, '办事员 12月')

s = mk('keyuan', 24, 12, 8)
tryPromo(s, '科员 12月')

// 2) 副镇长：省考常见卡点
s = mk('fuzhenzhang', 32, 24, 8)
tryPromo(s, '副镇长 24月/8件')

s = mk('fuzhenzhang', 32, 24, 4)
tryPromo(s, '副镇长 24月/仅4件')

s = mk('fuzhenzhang', 32, 6, 20)
tryPromo(s, '副镇长 仅6月')

// 3) 县级
s = mk('fuxianzhang', 40, 36, 12)
tryPromo(s, '副县长 36月/12件')

s = mk('fuxianzhang', 40, 36, 5)
tryPromo(s, '副县长 仅5件')

// 4) 高 mash
s = mk('fuzhenzhang', 32, 36, 20)
s.mashScore = 60
tryPromo(s, '副镇长 mash=60')

// 5) 草率分刚好低于门槛
s = mk('fuzhenzhang', 32, 36, 20)
s.mashScore = 54
tryPromo(s, '副镇长 mash=54')

console.log('\n=== 省考出身开局 ===')
const s0 = createNewGame('shengkao', 'tianfu')
console.log('start post', s0.postId, getPost(s0.postId).title, 'age', s0.age, 'attrs', s0.attrs)
const paths0 = availablePaths(s0)
console.log(
  'start paths',
  paths0.map((p) => `${p.ok ? 'OK' : 'NO'} ${p.path.label}: ${p.reason || ''}`),
)
