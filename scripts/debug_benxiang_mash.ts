/**
 * 本乡出身卡点 + 草率分衰减 + 认真玩家对照
 */
import { createNewGame, clamp } from '../src/state/game'
import { availablePaths } from '../src/systems/promotion'
import { getPost } from '../src/data/posts'
import { noteChoice, noteAction, applySkipMonthCost } from '../src/systems/engagement'
import { engagementGate } from '../src/systems/engagement'

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

console.log('=== 本乡出身开局 ===')
const s0 = createNewGame('benxiang', 'tianfu')
console.log('post', s0.postId, 'hometown', s0.flags.hometown, 'jiaoliu', s0.flags.jiaoliu)
console.log('attrs', s0.attrs, 'paths', s0.paths)

// 副镇长/镇长是否被成长地回避锁死
for (const pid of ['fuzhenzhang', 'zhenzhang', 'zhenweishuji']) {
  const s = createNewGame('benxiang', 'tianfu')
  s.postId = pid
  s.age = 35
  s.attrs = { ZJ: 90, GX: 90, Lian: 90, MX: 90, NL: 90 }
  s.risk = 5
  s.flags.monthsInPost = 60
  s.eventsHandledThisPost = 30
  s.mashScore = 0
  s.probationLeft = 0
  s.flags.hometown = 'qingshi'
  s.flags.jiaoliu = false
  const paths = availablePaths(s)
  console.log(`\n本乡 @${pid} jiaoliu=false`)
  for (const p of paths) {
    console.log(' ', p.ok ? 'OK ' : 'no ', p.path.label, '→', p.path.to, '|', p.reason || '')
  }
  s.flags.jiaoliu = true
  const paths2 = availablePaths(s)
  console.log(`本乡 @${pid} jiaoliu=true`)
  for (const p of paths2) {
    console.log(' ', p.ok ? 'OK ' : 'no ', p.path.label, '→', p.path.to, '|', p.reason || '')
  }
}

// 草率分：4 次同选后多少次认真选择才能降回 55 以下
console.log('\n=== 草率分恢复曲线 ===')
const s1 = createNewGame('shengkao', 'tianfu')
s1.mashScore = 0
for (let i = 0; i < 4; i++) noteChoice(s1, 0)
console.log('4次同选后 mash', s1.mashScore, 'gate@rank4', engagementGate(s1, 4).ok)
for (let n = 1; n <= 20; n++) {
  noteChoice(s1, n % 3) // 认真轮换
  if (n % 5 === 0 || n <= 5) console.log(`  再认真 ${n} 次 → mash ${s1.mashScore}`)
}
console.log('20次认真后 mash', s1.mashScore)

// 快进 10 次
const s2 = createNewGame('shengkao', 'tianfu')
for (let i = 0; i < 10; i++) applySkipMonthCost(s2)
console.log('快进10次 mash', s2.mashScore, 'ZJ', s2.attrs.ZJ, 'risk', s2.risk)
for (let n = 0; n < 30; n++) noteChoice(s2, n % 3)
console.log('再认真30次 mash', s2.mashScore)

// noteAction 重复行动
const s3 = createNewGame('shengkao', 'tianfu')
for (let i = 0; i < 20; i++) noteAction(s3, 'xiachen')
console.log('同行动20次 mash', s3.mashScore)
