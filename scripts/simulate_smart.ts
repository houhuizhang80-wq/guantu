/**
 * 稳妥型 Bot：优先清廉/政绩，积极选拔，避免派系与高风险
 * 目标：看能否到国家级
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
import { networkTick } from '../src/systems/network'
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

/** 在最优的几个里轮换，避免草率分 */
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

function playSmart(originId: string, provinceId: string, maxTurns: number) {
  const s: any = createNewGame(originId, provinceId)
  s.actionPoints = s.maxActionPoints
  let guard = 0
  while (!s.endingId && s.turn < maxTurns && guard++ < 2000) {
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
      // 深度公务：批示/信访/起草/会议（培训隔月）
      const dutyKinds = ['pishi', 'xinfang', 'qicao', 'huiyi', 'peixun'] as const
      for (const kind of dutyKinds) {
        if (s.dutyRun && !s.dutyRun.done) {
          const item = getDutyItem(s.dutyRun.itemId)
          if (item) {
            // 选分最高的
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
      // 行动：自查降风险 / 写材料涨能力 / 下沉涨民心
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
    // 顾家 + 联络
    if (s.family && (s.family.spouseMood < 50 || s.family.parentHealth < 40) && s.actionPoints > 0) {
      s.actionPoints -= 1
      s.family.spouseMood = clamp(s.family.spouseMood + 10)
      s.family.parentHealth = clamp(s.family.parentHealth + 6)
      s.attrs.MX = clamp(s.attrs.MX + 1)
    } else if (s.actionPoints > 0 && s.attrs.GX < 75) {
      s.actionPoints -= 1
      s.attrs.GX = clamp(s.attrs.GX + 3)
    }
    if (s.pendingVisit) resolveVisit(s, true)
    if (s.jijian) advanceJijian(s, 'peihe')
    // 选拔
    if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
      const strat = promoStrategies[s.promo.stage] || 'taici'
      advancePromo(s, strat)
      if (s.promo?.stage === 'renmian') confirmAppointment(s)
    } else if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
    } else if (!s.promo) {
      const paths = availablePaths(s).filter((p) => p.ok)
      if (s.turn % 80 === 0 && paths.length === 0) {
        const all = availablePaths(s)
        console.log('  t', s.turn, 'no path', getPost(s.postId).id, 'months', s.flags.monthsInPost, 'handled', s.eventsHandledThisPost, all.map((p) => `${p.path.label}:${p.ok ? 'ok' : p.reason}`).join(' | '))
      }
      const scored = paths
        .map((p) => ({
          p,
          rank: getPost(p.path.to).rank,
          leader: p.path.kind === 'leader' ? 1 : 0,
        }))
        .sort((a, b) => b.rank - a.rank || b.leader - a.leader)
      if (scored[0]) startPromo(s, scored[0].p.path)
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
    s.dutyMonthScore = 0
    monthlyDrift(s)
    riskTick(s)
    familyTick(s)
    networkTick(s)
    factionHeatTick(s)
    ageTick(s)
    maybeFactionEvent(s)
    maybeInvestigation(s)
    networkDrama(s, s.npcs[0]?.id || 'zhuren', s.npcs[0]?.favor ?? 0)
    tickProjects(s, (fx) => applyAttrs(s, fx))
    if (s.month === 1 && s.turn > 1) runAnnualAppraisal(s)
    checkAchievements(s)
    if (checkEnding(s)) break
    s.actionPoints = s.maxActionPoints
  }
  return {
    turn: s.turn,
    post: getPost(s.postId).title,
    rank: getPost(s.postId).rank,
    level: getPost(s.postId).level,
    ending: s.endingId,
    attrs: { ...s.attrs },
    risk: Math.round(s.risk),
    age: s.age,
  }
}

console.log('=== 稳妥 Bot · 冲刺国家级 ===')
for (let i = 0; i < 2; i++) {
  lastIdx = -1
  const r = playSmart('xuandiao_pu', 'qiantang', 620)
  console.log(`#${i + 1}`, r.turn, '月', r.age, '岁', r.level, r.post, '结局', r.ending, '政', r.attrs.ZJ, '廉', r.attrs.Lian, '险', r.risk, 'rank', r.rank)
}
console.log('--- 不同出身 ---')
for (const o of ['cunguan', 'jizhuan', 'biguan', 'guoqi_tiao']) {
  const r = playSmart(o, 'qiantang', 400)
  console.log(o, r.turn, r.level, r.post, r.ending, '政', r.attrs.ZJ, '廉', r.attrs.Lian)
}
