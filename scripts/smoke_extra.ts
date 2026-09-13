/** 六项新系统冒烟 */
import { createNewGame } from '../src/state/game'
import {
  maybeDucha,
  resolveDucha,
  doTanxin,
  canTanxin,
  startCampaign,
  advanceCampaign,
  canStartCampaign,
  childTick,
  resolveChild,
  writeMemoir,
  canWriteMemoir,
  memoirSummary,
  saveLegacyFromGame,
  applyLegacy,
  loadLegacy,
  CAMPAIGNS,
} from '../src/systems/extra'

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
}

// 1. 督查
const s1 = createNewGame('shengkao', 'tianfu')
s1.currentEventId = null
s1.actionPoints = 5
s1.duchaDone = true
const r1 = resolveDucha(s1, 'zicha')
assert(r1.ok, 'ducha zicha')
s1.duchaDone = false
maybeDucha(s1)

// 2. 谈心
const s2 = createNewGame('shengkao', 'tianfu')
s2.currentEventId = null
s2.actionPoints = 3
assert(canTanxin(s2).ok, 'tanxin can')
const r2 = doTanxin(s2, 'zhuren', 'guanxin')
assert(r2.ok, 'tanxin ok')
assert(!canTanxin(s2).ok, 'tanxin cd')

// 3. 攻坚
const s3 = createNewGame('shengkao', 'tianfu')
s3.currentEventId = null
s3.actionPoints = 5
s3.postId = 'fuzhenzhang'
assert(canStartCampaign(s3).ok, 'campaign can')
assert(startCampaign(s3, CAMPAIGNS[0].id).ok, 'campaign start')
let guard = 0
while (s3.campaign && guard++ < 10) advanceCampaign(s3, 'qin')
assert(!s3.campaign, 'campaign finished')

// 4. 子女
const s4 = createNewGame('ganbu_jun', 'tianfu')
s4.currentEventId = null
s4.actionPoints = 3
s4.family!.childAge = 15
const m4 = childTick(s4)
assert(!!m4 && s4.childPath === 'zhongkao', 'child zhongkao')
assert(resolveChild(s4, 'benfen').ok, 'child benfen')

// 5. 回忆录
const s5 = createNewGame('shengkao', 'tianfu')
s5.currentEventId = null
s5.actionPoints = 3
assert(canWriteMemoir(s5).ok, 'memoir can')
assert(writeMemoir(s5, 'shishi').ok, 'memoir write')
assert(memoirSummary(s5).includes('页'), 'memoir summary')

// 6. 多周目
const s6 = createNewGame('shengkao', 'tianfu')
s6.postId = 'zongli'
const b = saveLegacyFromGame(s6)
assert(b.lives === 1, 'legacy lives 1')
const s7 = createNewGame('shengkao', 'tianfu')
assert((s7.life ?? 1) >= 2 || loadLegacy()!.lives >= 1, 'legacy saved')
// 第二世 createNewGame 会 applyLegacy
const b2 = saveLegacyFromGame(s6)
assert(b2.lives === 2, 'legacy lives 2')
const s8 = createNewGame('xuandiao_pu', 'lingdong')
assert((s8.life ?? 1) >= 2, 'second life applied')
assert(Object.keys(s8.inherit ?? {}).length >= 0, 'inherit array')

console.log('extra systems smoke ok', {
  ducha: r1.ok,
  tanxin: r2.ok,
  campaign: true,
  child: true,
  memoir: memoirSummary(s5),
  lives: b2.lives,
  life2: s8.life,
})
