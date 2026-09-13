/** 正国/副国精确统计 */
import { createNewGame, clamp } from '../src/state/game'
import { scheduleNextEvent, markEventUsed, meetsRequire } from '../src/systems/events'
import { getEvent } from '../src/data/events'
import { availablePaths, startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'
import { checkEnding } from '../src/systems/ending'
import { maybeInvestigation, riskTick } from '../src/systems/risk'
import { advanceJijian } from '../src/systems/jijian'
import { monthlyDrift } from '../src/systems/promotion'
import { familyTick } from '../src/systems/family'
import { networkTick, pickNetworkNpc } from '../src/systems/network'
import { factionHeatTick } from '../src/systems/focus'
import { ageTick } from '../src/systems/age'
import { maybeFactionEvent } from '../src/systems/faction'
import { noteChoice, noteEventHandled } from '../src/systems/engagement'
import { tickProjects } from '../src/data/projects'
import { checkAchievements } from '../src/data/achievements'
import { runAnnualAppraisal } from '../src/systems/appraisal'
import { resolveVisit, networkDrama } from '../src/systems/floats'
import { getPost, POSTS } from '../src/data/posts'
import { startDuty, chooseDuty, dismissDuty, canStartDuty } from '../src/systems/duty'
import { getDutyItem } from '../src/data/duties'
import { doYuqing, setWeekPlan, startResearch, advanceResearch, hireSecretary, yuqingOf } from '../src/systems/office'
import { ORIGINS } from '../src/data/origins'

const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v) },
  removeItem: (k: string) => { mem.delete(k) },
}

function applyAttrs(s: any, fx: any) {
  for (const k of ['ZJ', 'GX', 'Lian', 'MX', 'NL'] as const) {
    const v = fx[k]
    if (typeof v === 'number') s.attrs[k] = clamp(s.attrs[k] + v)
  }
  if (typeof fx.Risk === 'number') s.risk = clamp(s.risk + fx.Risk, 0, 100)
}

let lastIdx = -1
function pickBestChoice(s: any, ev: any): number {
  const scored: { i: number; score: number }[] = []
  ev.choices.forEach((c: any, i: number) => {
    if (!meetsRequire(s, c.require)) return
    const fx = c.fx || {}
    let score = 0
    score += (fx.Lian || 0) * 3
    score += (fx.ZJ || 0) * 2
    score += (fx.MX || 0) * 1.5
    score += (fx.NL || 0) * 1
    score -= (fx.Risk || 0) * 2
    if (c.faction) score -= 8
    if (c.successRate != null && c.successRate < 0.7) score -= 3
    if (i === lastIdx) score -= 5
    scored.push({ i, score })
  })
  scored.sort((a, b) => b.score - a.score)
  const pick = scored[Math.floor(Math.random() * Math.min(2, scored.length))] || scored[0]
  lastIdx = pick.i
  return pick.i
}

const promoStrategies: Record<string, string> = {
  minzhu: 'taici',
  kaocha: 'rushi',
  gongshi: 'jingdai',
  piaojue: 'huiqian',
}

function runDutySmart(s: any) {
  const kinds = ['pishi', 'xinfang', 'qicao', 'huiyi', 'peixun'] as const
  for (const kind of kinds) {
    if (s.dutyRun && !s.dutyRun.done) {
      const item = getDutyItem(s.dutyRun.itemId)
      if (item) {
        const best = [...item.choices].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
        chooseDuty(s, best.id)
        continue
      }
    }
    if (!canStartDuty(s, kind).ok) continue
    if (kind === 'peixun' && s.turn % 6 !== 0) continue
    startDuty(s, kind)
    while (s.dutyRun && !s.dutyRun.done) {
      const item = getDutyItem(s.dutyRun.itemId)
      if (!item) break
      const best = [...item.choices].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
      chooseDuty(s, best.id)
    }
    dismissDuty(s)
  }
}

function playSmart(originId: string, provinceId: string, maxTurns: number) {
  const s: any = createNewGame(originId, provinceId)
  s.actionPoints = s.maxActionPoints
  let bestPost = getPost(s.postId)
  let guard = 0
  while (!s.endingId && s.turn < maxTurns && guard++ < 3000) {
    if (!s.currentEventId) {
      const ev = scheduleNextEvent(s)
      if (ev) { s.currentEventId = ev.id; markEventUsed(s, ev) }
    }
    if (s.currentEventId) {
      const ev = getEvent(s.currentEventId)
      const idx = pickBestChoice(s, ev)
      const choice = ev.choices[idx]
      noteChoice(s, idx)
      let fx = { ...choice.fx }
      const rate = choice.successRate ?? 1
      if (rate < 1 && Math.random() > rate) {
        fx = { ...choice.fx, ...(choice.failFx ?? {}) }
        s.failStreak += 1
      } else s.failStreak = 0
      applyAttrs(s, fx)
      markEventUsed(s, ev)
      noteEventHandled(s)
      s.currentEventId = null
    } else {
      if (!s.weekPlanned) setWeekPlan(s, ['zj', 'lian', 'mx', 'gx'])
      if (yuqingOf(s) > 45 && !s.yuqingActed) doYuqing(s, s.attrs.Lian >= 55 ? 'caifang' : 'huiying')
      if (!s.secretary?.hired && s.actionPoints > 0) hireSecretary(s)
      if (!s.research && s.actionPoints > 0 && s.turn % 10 === 0) startResearch(s, 'minsheng')
      else if (s.research && s.actionPoints > 0) advanceResearch(s, s.attrs.NL >= 50 ? 'shuju' : 'dun')
      runDutySmart(s)
      if (s.risk > 40 && s.actionPoints > 0) {
        s.actionPoints -= 1
        s.risk = clamp(s.risk - 6, 0, 100)
        s.attrs.Lian = clamp(s.attrs.Lian + 1)
      } else if (s.actionPoints > 0) {
        s.actionPoints -= 1
        s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
        s.attrs.NL = clamp(s.attrs.NL + 1)
        s.attrs.MX = clamp(s.attrs.MX + 1)
      }
    }
    if (s.family && (s.family.spouseMood < 50 || s.family.parentHealth < 40) && s.actionPoints > 0) {
      s.actionPoints -= 1
      s.family.spouseMood = clamp(s.family.spouseMood + 10)
      s.family.parentHealth = clamp(s.family.parentHealth + 6)
    } else if (s.actionPoints > 0 && s.attrs.GX < 75) {
      s.actionPoints -= 1
      s.attrs.GX = clamp(s.attrs.GX + 3)
    }
    if (s.pendingVisit) resolveVisit(s, true)
    if (s.jijian) advanceJijian(s, 'peihe')
    if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
      advancePromo(s, promoStrategies[s.promo.stage] || 'taici')
      if (s.promo?.stage === 'renmian') confirmAppointment(s)
    } else if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
    } else if (!s.promo) {
      const paths = availablePaths(s).filter((p) => p.ok)
      const scored = paths
        .map((p) => ({ p, rank: getPost(p.path.to).rank, leader: p.path.kind === 'leader' ? 1 : 0 }))
        .sort((a, b) => b.rank - a.rank || b.leader - a.leader)
      if (scored[0]) startPromo(s, scored[0].p.path)
    }
    const cur = getPost(s.postId)
    if (cur.rank > bestPost.rank) bestPost = cur
    s.turn++
    s.month++
    if (s.month > 12) { s.month = 1; s.year++; s.rosterUsed = 0 }
    s.flags.monthsInPost = ((s.flags.monthsInPost as number) ?? 0) + 1
    s.dutyDone = []
    s.dutyRun = null
    s.dutyMonthScore = 0
    s.weekPlan = [null, null, null, null]
    s.weekPlanned = false
    monthlyDrift(s)
    riskTick(s)
    familyTick(s)
    networkTick(s)
    factionHeatTick(s)
    ageTick(s)
    maybeFactionEvent(s)
    maybeInvestigation(s)
    const pick = pickNetworkNpc(s)
    if (pick) networkDrama(s, pick.id, pick.favor)
    tickProjects(s, (fx: any) => applyAttrs(s, fx))
    if (s.month === 1 && s.turn > 1) runAnnualAppraisal(s)
    checkAchievements(s)
    if (checkEnding(s)) break
    s.actionPoints = s.maxActionPoints
  }
  return {
    end: getPost(s.postId),
    best: bestPost,
    ending: s.endingId,
    age: s.age,
    turn: s.turn,
  }
}

const RUNS_PER = 3
const MAX_TURNS = 480
const rows: {
  origin: string
  bestLevel: string
  bestTitle: string
  bestRank: number
  endTitle: string
  ending: string | null
  age: number
}[] = []

for (const o of ORIGINS) {
  for (let i = 0; i < RUNS_PER; i++) {
    const r = playSmart(o.id, 'tianfu', MAX_TURNS)
    rows.push({
      origin: o.id,
      bestLevel: r.best.level,
      bestTitle: r.best.title,
      bestRank: r.best.rank,
      endTitle: r.end.title,
      ending: r.ending,
      age: r.age,
    })
  }
}

const n = rows.length
const isZhengguo = (s: string) => s === '国家级正职'
const isFuguo = (s: string) => s === '国家级副职'
const isZhengbu = (s: string) => s === '省部级正职'

const cnt = (fn: (r: (typeof rows)[0]) => boolean) => rows.filter(fn).length
console.log('=== 正国/副国登顶（稳妥 Bot）===')
console.log('总局数', n)
console.log('曾达正国级', cnt((r) => isZhengguo(r.bestLevel)), `(${Math.round((cnt((r) => isZhengguo(r.bestLevel)) / n) * 100)}%)`)
console.log('曾达副国级+', cnt((r) => isZhengguo(r.bestLevel) || isFuguo(r.bestLevel)), `(${Math.round((cnt((r) => isZhengguo(r.bestLevel) || isFuguo(r.bestLevel)) / n) * 100)}%)`)
console.log('曾达正部级+', cnt((r) => isZhengguo(r.bestLevel) || isFuguo(r.bestLevel) || isZhengbu(r.bestLevel)))
console.log('最终结局为正国结局', cnt((r) => (r.ending || '').startsWith('zhengguo')))

const levelMap = new Map<string, number>()
for (const r of rows) levelMap.set(r.bestLevel, (levelMap.get(r.bestLevel) || 0) + 1)
console.log('最高职级分布', Object.fromEntries([...levelMap.entries()].sort()))

const topPosts = new Map<string, number>()
for (const r of rows.filter((x) => isZhengguo(x.bestLevel) || isFuguo(x.bestLevel))) {
  topPosts.set(r.bestTitle, (topPosts.get(r.bestTitle) || 0) + 1)
}
console.log('国家级岗位触达次数:')
for (const [t, c] of [...topPosts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c} × ${t}`)
}

console.log('--- 各出身曾达最高 ---')
for (const o of ORIGINS) {
  const rs = rows.filter((r) => r.origin === o.id)
  const best = rs.reduce((a, b) => (b.bestRank > a.bestRank ? b : a))
  console.log(o.id.padEnd(14), best.bestLevel.padEnd(8), best.bestTitle.slice(0, 28), best.ending || '-')
}
