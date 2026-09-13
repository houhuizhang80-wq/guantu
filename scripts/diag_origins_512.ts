/** 512 局分出身：结局、卡点、异常扫描 */
import { createNewGame, clamp } from '../src/state/game'
import { scheduleNextEvent, markEventUsed, meetsRequire } from '../src/systems/events'
import { getEvent } from '../src/data/events'
import { availablePaths, startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'
import { checkEnding } from '../src/systems/ending'
import { maybeInvestigation, riskTick } from '../src/systems/risk'
import { advanceJijian } from '../src/systems/jijian'
import { monthlyDrift } from '../src/systems/promotion'
import { familyTick } from '../src/systems/family'
import { networkTick } from '../src/systems/network'
import { factionHeatTick } from '../src/systems/focus'
import { ageTick } from '../src/systems/age'
import { noteChoice, noteEventHandled } from '../src/systems/engagement'
import { tickProjects } from '../src/data/projects'
import { runAnnualAppraisal } from '../src/systems/appraisal'
import { getPost } from '../src/data/posts'
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
function pickBest(s: any, ev: any): number {
  const scored: { i: number; score: number }[] = []
  ev.choices.forEach((c: any, i: number) => {
    if (!meetsRequire(s, c.require)) return
    const fx = c.fx || {}
    let score =
      (fx.Lian || 0) * 2 + (fx.ZJ || 0) * 1.5 + (fx.MX || 0) + (fx.NL || 0) * 0.8 - (fx.Risk || 0) * 1.2
    if (i === lastIdx) score -= 4
    scored.push({ i, score })
  })
  if (!scored.length) return 0
  scored.sort((a, b) => b.score - a.score)
  const pick = scored[0]
  lastIdx = pick.i
  return pick.i
}

const promoStrategies: Record<string, string> = {
  minzhu: 'taici',
  kaocha: 'rushi',
  gongshi: 'jingdai',
  piaojue: 'huiqian',
}

type Row = {
  origin: string
  bestLevel: string
  bestRank: number
  bestTitle: string
  ending: string | null
  age: number
  turn: number
  endPost: string
  mash: number
  handled: number
  months: number
  risk: number
  stuckSample: string
}

function play(originId: string): Row {
  lastIdx = -1
  const s: any = createNewGame(originId, 'qiantang')
  s.actionPoints = s.maxActionPoints
  let bestPost = getPost(s.postId)
  let guard = 0
  let stuck = ''
  while (!s.endingId && s.turn < 620 && guard++ < 2200) {
    if (!s.currentEventId) {
      const ev = scheduleNextEvent(s)
      if (ev) {
        s.currentEventId = ev.id
        markEventUsed(s, ev)
      }
    }
    if (s.currentEventId) {
      const ev = getEvent(s.currentEventId)
      if (!ev) s.currentEventId = null
      else {
        const i = pickBest(s, ev)
        const choice = ev.choices[i]
        noteChoice(s, i)
        let fx = { ...choice.fx }
        if ((choice.successRate ?? 1) < 1 && Math.random() > (choice.successRate ?? 1)) {
          fx = { ...choice.fx, ...(choice.failFx ?? {}) }
          s.failStreak += 1
        } else s.failStreak = 0
        applyAttrs(s, fx)
        markEventUsed(s, ev)
        noteEventHandled(s)
        s.currentEventId = null
      }
    } else {
      while (s.actionPoints > 0) {
        s.actionPoints -= 1
        if (s.risk > 40) {
          s.risk = clamp(s.risk - 5, 0, 100)
          s.attrs.Lian = clamp(s.attrs.Lian + 1)
        } else {
          s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
          s.attrs.GX = clamp(s.attrs.GX + 1)
          s.attrs.NL = clamp(s.attrs.NL + 1)
        }
      }
    }
    // 选拔与事件并行（与正式 Bot 一致）
    if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
      advancePromo(s, promoStrategies[s.promo.stage] || 'taici')
      if (s.promo?.stage === 'renmian') confirmAppointment(s)
    } else if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
    } else if (!s.promo) {
      const paths = availablePaths(s).filter((p) => p.ok)
      if (paths.length > 0) {
        paths.sort((a, b) => getPost(b.path.to).rank - getPost(a.path.to).rank)
        startPromo(s, paths[0].path)
      } else if (s.turn % 24 === 0) {
        const all = availablePaths(s)
        stuck = all[0]?.reason || 'no-path'
      }
    }
    s.turn++
    s.month++
    if (s.month > 12) {
      s.month = 1
      s.year++
    }
    s.flags.monthsInPost = ((s.flags.monthsInPost as number) ?? 0) + 1
    s.dutyDone = []
    s.dutyRun = null
    s.weekPlan = [null, null, null, null]
    s.weekPlanned = false
    monthlyDrift(s)
    riskTick(s)
    familyTick(s)
    networkTick(s)
    factionHeatTick(s)
    ageTick(s)
    maybeInvestigation(s)
    if (s.jijian) advanceJijian(s, 'peihe')
    tickProjects(s, (fx) => applyAttrs(s, fx))
    if (s.month === 1 && s.turn > 1) runAnnualAppraisal(s)
    if (checkEnding(s)) break
    s.actionPoints = s.maxActionPoints
    const p = getPost(s.postId)
    if (p.rank > bestPost.rank) bestPost = p
  }
  const end = getPost(s.postId)
  if (end.rank > bestPost.rank) bestPost = end
  return {
    origin: originId,
    bestLevel: bestPost.level,
    bestRank: bestPost.rank,
    bestTitle: bestPost.title,
    ending: s.endingId,
    age: s.age,
    turn: s.turn,
    endPost: end.id,
    mash: Math.round(s.mashScore ?? 0),
    handled: s.eventsHandledThisPost ?? 0,
    months: (s.flags.monthsInPost as number) ?? 0,
    risk: Math.round(s.risk),
    stuckSample: stuck,
  }
}

const rows: Row[] = []
let errors = 0
for (const o of ORIGINS) {
  for (let i = 0; i < 32; i++) {
    try {
      rows.push(play(o.id))
    } catch (e) {
      errors++
      console.log('EXCEPTION', o.id, String(e))
    }
  }
}
console.log('=== 512 局分出身诊断 ===')
console.log('异常次数', errors)
console.log()
for (const o of ORIGINS) {
  const rs = rows.filter((r) => r.origin === o.id)
  if (!rs.length) continue
  const avg = (rs.reduce((a, b) => a + b.bestRank, 0) / rs.length).toFixed(2)
  const maxR = Math.max(...rs.map((r) => r.bestRank))
  const endMap = new Map<string, number>()
  for (const r of rs) endMap.set(r.ending || 'null', (endMap.get(r.ending || 'null') || 0) + 1)
  const ends = [...endMap.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(' ')
  const avgMash = (rs.reduce((a, b) => a + b.mash, 0) / rs.length).toFixed(1)
  const avgAge = (rs.reduce((a, b) => a + b.age, 0) / rs.length).toFixed(1)
  console.log(
    o.id.padEnd(14),
    `均rank ${avg}`,
    `最高 ${maxR}`,
    `均龄 ${avgAge}`,
    `均草率 ${avgMash}`,
  )
  console.log('   结局', ends)
  const topStuck = new Map<string, number>()
  for (const r of rs) {
    if (r.stuckSample) topStuck.set(r.stuckSample.slice(0, 24), (topStuck.get(r.stuckSample.slice(0, 24)) || 0) + 1)
  }
  if (topStuck.size) {
    console.log('   卡点', [...topStuck.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}×${v}`).join(' | '))
  }
}
