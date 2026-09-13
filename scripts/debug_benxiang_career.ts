/** 本乡出身：记录前 200 月的岗位与卡点 */
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
import { getPost } from '../src/data/posts'
import { runAnnualAppraisal } from '../src/systems/appraisal'

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

const s: any = createNewGame('benxiang', 'qiantang')
s.actionPoints = s.maxActionPoints
let lastPost = s.postId
let guard = 0
const maxTurns = 300

while (!s.endingId && s.turn < maxTurns && guard++ < 3200) {
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
      let best = 0
      let bestScore = -1e9
      ev.choices.forEach((c: any, i: number) => {
        if (!meetsRequire(s, c.require)) return
        const fx = c.fx || {}
        const sc = (fx.Lian || 0) * 2 + (fx.ZJ || 0) * 1.5 + (fx.MX || 0) - (fx.Risk || 0) * 1.5
        if (sc > bestScore) {
          bestScore = sc
          best = i
        }
      })
      const choice = ev.choices[best]
      noteChoice(s, best)
      let fx = { ...choice.fx }
      const rate = choice.successRate ?? 1
      if (rate < 1 && Math.random() > rate) fx = { ...choice.fx, ...(choice.failFx ?? {}) }
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
  if (s.jijian) advanceJijian(s, 'peihe')

  if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
    const strat =
      s.promo.stage === 'minzhu'
        ? 'taici'
        : s.promo.stage === 'kaocha'
          ? 'rushi'
          : s.promo.stage === 'gongshi'
            ? 'jingdai'
            : 'huiqian'
    advancePromo(s, strat)
    if (s.promo?.stage === 'renmian') confirmAppointment(s)
  } else if (s.promo?.stage === 'renmian') {
    confirmAppointment(s)
  } else if (!s.promo) {
    const paths = availablePaths(s).filter((p) => p.ok)
    if (paths.length > 0) {
      paths.sort((a, b) => getPost(b.path.to).rank - getPost(a.path.to).rank)
      startPromo(s, paths[0].path)
    } else if (s.turn % 12 === 0) {
      const all = availablePaths(s)
      console.log(
        `t${s.turn} ${s.postId} age${s.age} months${s.flags.monthsInPost} jiaoliu=${s.flags.jiaoliu} mash${s.mashScore} handled${s.eventsHandledThisPost}`,
      )
      for (const p of all.slice(0, 4)) console.log('   ', p.ok ? 'OK' : 'no', p.path.label, p.reason)
    }
  }

  s.turn++
  s.month++
  if (s.month > 12) {
    s.month = 1
    s.year++
  }
  s.flags.monthsInPost = ((s.flags.monthsInPost as number) ?? 0) + 1
  monthlyDrift(s)
  riskTick(s)
  familyTick(s)
  networkTick(s)
  factionHeatTick(s)
  ageTick(s)
  maybeInvestigation(s)
  tickProjects(s, (fx) => applyAttrs(s, fx))
  if (s.month === 1 && s.turn > 1) runAnnualAppraisal(s)
  if (checkEnding(s)) break
  s.actionPoints = s.maxActionPoints

  if (s.postId !== lastPost) {
    console.log(
      `t${s.turn} CHANGE ${lastPost} → ${s.postId} rank=${getPost(s.postId).rank} jiaoliu=${s.flags.jiaoliu} age${s.age}`,
    )
    lastPost = s.postId
  }
}

console.log('END', s.postId, getPost(s.postId).level, 'rank', getPost(s.postId).rank, 'age', s.age, 'ending', s.endingId)
console.log('jiaoliu', s.flags.jiaoliu, 'hometown', s.flags.hometown, 'paths', s.paths)
