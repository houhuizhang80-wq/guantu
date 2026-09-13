/** 真实化晋升冒烟 */
import { createNewGame } from '../src/state/game'
import { POSTS, getPost, pathAvailable } from '../src/data/posts'
import { startPromo, advancePromo, confirmAppointment, availablePaths } from '../src/systems/promotion'
import type { GameState } from '../src/types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(POSTS.some((p) => p.track === 'rank'), 'has rank track')
assert(POSTS.some((p) => p.id === 'yiji_zhuren'), 'has 一级主任科员')
assert(POSTS.every((p) => p.nextPaths !== undefined), 'has nextPaths')
assert(POSTS.some((p) => p.probationMonths === 12), 'probation')

const fuzhen = getPost('fuzhenzhang')
assert(fuzhen.nextPaths.length >= 3, 'branching at 副镇长')
assert(POSTS.some((p) => (p.termMonths ?? 0) >= 60), 'has 5-year term default')

const s: GameState = createNewGame('xuandiao_pu')
s.postId = 'guzhang'
s.age = 35
s.flags.monthsInPost = 36
s.attrs = { ZJ: 70, GX: 60, Lian: 70, MX: 50, NL: 55 }
s.risk = 20
s.faction = 'none'
s.factionRep = { A: 40, B: 30, local: 40 }
s.eventsHandledThisPost = 8
s.mashScore = 0
s.failStreak = 0

const paths = availablePaths(s)
const toFuke = paths.find((p) => p.path.to === 'fuzhenzhang')
assert(!!toFuke && toFuke.ok, `path to fuke: ${toFuke?.reason}`)

const doc = startPromo(s, toFuke!.path)
assert(!!doc && s.promo?.stage === 'minzhu', 'start minzhu')
assert(advancePromo(s, 'taici').doc?.title === '组织考察', 'to kaocha')
assert(advancePromo(s, 'rushi').doc?.title === '任前公示', 'to gongshi')
assert(advancePromo(s, 'jingdai').doc?.title === '党委（党组）会议票决', 'to piaojue')
const ren = advancePromo(s, 'huiqian')
assert(ren.doc?.kind === 'promote' || ren.doc?.title.includes('任免'), 'to renmian')
assert(s.promo?.stage === 'renmian', 'stage renmian')
confirmAppointment(s)
assert(s.postId === 'fuzhenzhang', 'appointed')
assert(s.probationLeft === 12, 'probation 12')

// 任期不足不可动
s.probationLeft = 0
s.flags.monthsInPost = 3
const again = availablePaths(s).filter((p) => p.ok)
assert(again.length === 0, 'blocked by short term')

// 成长地回避字段存在
const zhenzhang = getPost('zhenzhang')
assert(zhenzhang.level === '乡科级正职', '镇长正科')
const zhenweishuji = getPost('zhenweishuji')
assert(zhenweishuji.level === '乡科级正职', '书记也是正科')

console.log('realistic promo smoke ok', {
  posts: POSTS.length,
  rankTrack: POSTS.filter((p) => p.track === 'rank').length,
})
