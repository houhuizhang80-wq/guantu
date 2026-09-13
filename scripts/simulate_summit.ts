/**
 * 登顶统计：稳妥策略下各出身最高官职
 */
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
import { getPost } from '../src/data/posts'
import { startDuty, chooseDuty, dismissDuty, canStartDuty } from '../src/systems/duty'
import { getDutyItem } from '../src/data/duties'
import {
  doYuqing,
  setWeekPlan,
  startResearch,
  advanceResearch,
  hireSecretary,
  yuqingOf,
} from '../src/systems/office'
import { ORIGINS } from '../src/data/origins'

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
  let maxRank = getPost(s.postId).rank
  let maxTitle = getPost(s.postId).title
  let guard = 0
  while (!s.endingId && s.turn < maxTurns && guard++ < 3000) {
    if (!s.currentEventId) {
      const ev = scheduleNextEvent(s)
      if (ev) {
        s.currentEventId = ev.id
        markEventUsed(s, ev)
      }
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
      // 周计划
      if (!s.weekPlanned) {
        setWeekPlan(s, ['zj', 'lian', 'mx', 'gx'])
      }
      // 舆情
      if (yuqingOf(s) > 45 && !s.yuqingActed) {
        doYuqing(s, s.attrs.Lian >= 55 ? 'caifang' : 'huiying')
      }
      // 秘书
      if (!s.secretary?.hired && s.actionPoints > 0) hireSecretary(s)
      // 调研
      if (!s.research && s.actionPoints > 0 && s.turn % 10 === 0) {
        startResearch(s, 'minsheng')
      } else if (s.research && s.actionPoints > 0) {
        advanceResearch(s, s.attrs.NL >= 50 ? 'shuju' : 'dun')
      }
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
      const strat = promoStrategies[s.promo.stage] || 'taici'
      advancePromo(s, strat)
      if (s.promo?.stage === 'renmian') confirmAppointment(s)
    } else if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
    } else if (!s.promo) {
      const paths = availablePaths(s).filter((p) => p.ok)
      const scored = paths
        .map((p) => ({
          p,
          rank: getPost(p.path.to).rank,
          leader: p.path.kind === 'leader' ? 1 : 0,
        }))
        .sort((a, b) => b.rank - a.rank || b.leader - a.leader)
      if (scored[0]) startPromo(s, scored[0].p.path)
    }

    const pr = getPost(s.postId).rank
    if (pr > maxRank) {
      maxRank = pr
      maxTitle = getPost(s.postId).title
    }

    s.turn++
    s.month++
    if (s.month > 12) {
      s.month = 1
      s.year++
      s.rosterUsed = 0
    }
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
    turn: s.turn,
    maxRank,
    maxTitle,
    endRank: getPost(s.postId).rank,
    endTitle: getPost(s.postId).title,
    level: getPost(s.postId).level,
    ending: s.endingId,
    age: s.age,
    attrs: { ...s.attrs },
    risk: Math.round(s.risk),
  }
}

const ORIGIN_IDS = ORIGINS.map((o) => o.id)
const RUNS_PER = 3
const MAX_TURNS = 480

const rows: {
  origin: string
  maxRank: number
  maxTitle: string
  endTitle: string
  ending: string | null
  age: number
  turn: number
}[] = []

for (const oid of ORIGIN_IDS) {
  for (let i = 0; i < RUNS_PER; i++) {
    const r = playSmart(oid, 'tianfu', MAX_TURNS)
    rows.push({
      origin: oid,
      maxRank: r.maxRank,
      maxTitle: r.maxTitle,
      endTitle: r.endTitle,
      ending: r.ending,
      age: r.age,
      turn: r.turn,
    })
  }
}

const byRank = new Map<number, number>()
for (const r of rows) byRank.set(r.maxRank, (byRank.get(r.maxRank) || 0) + 1)

console.log('=== 登顶统计（稳妥 Bot × 各出身）===')
console.log('总局数', rows.length, '· 每出身', RUNS_PER)
console.log('最高职级 rank 分布', Object.fromEntries([...byRank.entries()].sort((a, b) => b[0] - a[0])))

const top = rows.filter((r) => r.maxRank >= 18)
console.log('冲进国家级(rank≥18)', top.length, '/', rows.length)
console.log(
  '到总理(rank19)',
  rows.filter((r) => r.maxRank >= 19).length,
)
console.log(
  '到副国(rank18)',
  rows.filter((r) => r.maxRank === 18).length,
)
console.log(
  '正部及以上(rank≥17)',
  rows.filter((r) => r.maxRank >= 17).length,
)
console.log(
  '副部及以上(rank≥16)',
  rows.filter((r) => r.maxRank >= 16).length,
)

// 出身最佳
const bestOf = new Map<string, (typeof rows)[0]>()
for (const r of rows) {
  const b = bestOf.get(r.origin)
  if (!b || r.maxRank > b.maxRank || (r.maxRank === b.maxRank && r.age < b.age)) {
    bestOf.set(r.origin, r)
  }
}
console.log('--- 各出身最佳 ---')
for (const o of ORIGIN_IDS) {
  const b = bestOf.get(o)!
  console.log(
    o.padEnd(14),
    `maxRank=${b.maxRank}`,
    b.maxTitle.slice(0, 24).padEnd(26),
    `age=${b.age}`,
    `end=${b.ending ?? '-'}`,
  )
}

const fail = rows.filter((r) => r.ending && r.ending !== 'zhengguo')
const failMap = new Map<string, number>()
for (const f of fail) failMap.set(f.ending!, (failMap.get(f.ending!) || 0) + 1)
console.log('未到正国结局', Object.fromEntries(failMap))
console.log(
  '平均最终年龄',
  Math.round(rows.reduce((s, r) => s + r.age, 0) / rows.length),
)
console.log(
  '样例总理局',
  rows
    .filter((r) => r.maxRank >= 19)
    .slice(0, 5)
    .map((r) => `${r.origin}@${r.age}岁#${r.turn}`),
)
