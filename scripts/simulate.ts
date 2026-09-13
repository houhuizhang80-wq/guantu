/**
 * 自动模拟：出身×省份，随机选择，跑到结局或回合上限
 * 用于发现逻辑崩溃、空窗、数值卡死
 */
// Node 环境 mock localStorage
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

import { createNewGame, pushLog } from '../src/state/game'
import { scheduleNextEvent, markEventUsed, meetsRequire } from '../src/systems/events'
import { getEvent } from '../src/data/events'
import { ORIGINS } from '../src/data/origins'
import { PROVINCES } from '../src/data/provinces'
import { tryPromote, availablePaths, startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'
import { checkEnding } from '../src/systems/ending'
import { ACTIONS, canDoAction } from '../src/data/actions'
import { maybeInvestigation, riskTick } from '../src/systems/risk'
import { advanceJijian } from '../src/systems/jijian'
import { monthlyDrift } from '../src/systems/promotion'
import { familyTick } from '../src/systems/family'
import { networkTick } from '../src/systems/network'
import { factionHeatTick } from '../src/systems/focus'
import { maybeFactionEvent, joinFaction, factionAct } from '../src/systems/faction'
import { noteChoice, noteEventHandled, noteAction, engagementGate } from '../src/systems/engagement'
import { tickProjects } from '../src/data/projects'
import { checkAchievements } from '../src/data/achievements'
import { runAnnualAppraisal } from '../src/systems/appraisal'
import { clamp } from '../src/state/game'
import { resolveVisit, networkDrama } from '../src/systems/floats'

function applyAttrs(s: any, fx: any) {
  for (const k of ['ZJ', 'GX', 'Lian', 'MX', 'NL'] as const) {
    const v = fx[k]
    if (typeof v === 'number') s.attrs[k] = clamp(s.attrs[k] + v)
  }
  if (typeof fx.Risk === 'number') s.risk = clamp(s.risk + fx.Risk, 0, 100)
}

function advanceMonthSim(s: any) {
  s.turn += 1
  s.month += 1
  if (s.month > 12) {
    s.month = 1
    s.year += 1
  }
  s.flags.monthsInPost = ((s.flags.monthsInPost as number) ?? 0) + 1
  monthlyDrift(s)
  riskTick(s)
  familyTick(s)
  networkTick(s)
  factionHeatTick(s)
  if (s.factionCd > 0) s.factionCd -= 1
  if (s.favorCooldown > 0) s.favorCooldown -= 1
  maybeFactionEvent(s)
  maybeInvestigation(s)
  networkDrama(s, s.npcs[0]?.id || 'zhuren', s.npcs[0]?.favor ?? 0)
  tickProjects(s, (fx) => applyAttrs(s, fx))
  if (s.month === 1 && s.turn > 1) {
    const ap = runAnnualAppraisal(s)
    if (ap.grade === '不称职' || ap.grade === '基本称职') {
      s.badAppraisalStreak = (s.badAppraisalStreak ?? 0) + 1
    } else s.badAppraisalStreak = 0
  }
  checkAchievements(s)
}

function playOnce(originId: string, provinceId: string, seed: number): { turn: number; post: string; ending: string | null; err?: string } {
  let s: GameStateLike = createNewGame(originId, provinceId) as any
  s.actionPoints = s.maxActionPoints
  let guard = 0
  try {
    while (!s.endingId && s.turn < 200 && guard++ < 500) {
      // 事件
      if (!s.currentEventId) {
        const ev = scheduleNextEvent(s)
        if (ev) {
          s.currentEventId = ev.id
          markEventUsed(s, ev)
        }
      }
      if (s.currentEventId) {
        const ev = getEvent(s.currentEventId)
        const okIdx = ev.choices
          .map((c, i) => ({ i, ok: meetsRequire(s, c.require) }))
          .filter((x) => x.ok)
        const pick = okIdx.length
          ? okIdx[Math.floor(Math.random() * okIdx.length)].i
          : 0
        const choice = ev.choices[pick]
        noteChoice(s, pick)
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
        // 行动
        const acts = ACTIONS.filter((a) => canDoAction(s, a).ok)
        if (acts.length && s.actionPoints > 0) {
          const a = acts[Math.floor(Math.random() * acts.length)]
          const v = a.variants[Math.floor(Math.random() * a.variants.length)]
          noteAction(s, `${a.id}/${v.id}`)
          s.actionPoints -= a.cost
          applyAttrs(s, v.fx)
        }
      }
      // 派系偶尔动一下
      if (Math.random() < 0.05 && s.faction === 'none' && s.turn > 6) {
        joinFaction(s, Math.random() < 0.5 ? 'A' : 'B')
      } else if (Math.random() < 0.04 && s.faction !== 'none' && s.factionCd <= 0) {
        factionAct(s, Math.random() < 0.5 ? 'loyal' : 'low')
      }
      // 托人
      if (Math.random() < 0.03 && s.favorCooldown <= 0 && s.npcs.length) {
        const ref = s.npcs.find((n) => n.favor >= 25)
        if (ref) {
          ref.favor = clamp(ref.favor - 10, -50, 100)
          s.risk = clamp(s.risk - 8, 0, 100)
          s.favorCooldown = 3
        }
      }
      // 来访
      if (s.pendingVisit) {
        resolveVisit(s, Math.random() < 0.7)
      }
      // 纪检
      if (s.jijian) {
        advanceJijian(s, Math.random() < 0.7 ? 'peihe' : 'tuotie')
      }
      // 选拔更积极
      if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
        advancePromo(s, 'taici')
        if (s.promo?.stage === 'renmian') confirmAppointment(s)
      } else if (s.promo?.stage === 'renmian') {
        confirmAppointment(s)
      } else if (!s.promo && Math.random() < 0.35) {
        const paths = availablePaths(s).filter((p) => p.ok)
        if (paths.length) {
          const p = paths[Math.floor(Math.random() * paths.length)]
          startPromo(s, p.path)
        }
      }

      advanceMonthSim(s)
      if (checkEnding(s)) break
      s.actionPoints = s.maxActionPoints
    }
  } catch (e) {
    return { turn: s.turn, post: s.postId, ending: s.endingId, err: String(e) }
  }
  return {
    turn: s.turn,
    post: s.postId,
    ending: s.endingId,
  }
}

type GameStateLike = any

// 主模拟
const results: any[] = []
let crashes = 0
const originSample = [ORIGINS[0], ORIGINS[3], ORIGINS[4], ORIGINS[9], ORIGINS[12]]
const provSample = [PROVINCES[0], PROVINCES[2], PROVINCES[8], PROVINCES[12], PROVINCES[24]]

for (const o of originSample) {
  for (const p of provSample) {
    for (let k = 0; k < 3; k++) {
      const r = playOnce(o.id, p.id, k)
      if (r.err) crashes++
      results.push({ o: o.id, p: p.id, ...r })
    }
  }
}

const ends = results.map((r) => r.ending || 'none')
const endCount: Record<string, number> = {}
for (const e of ends) endCount[e] = (endCount[e] || 0) + 1
const avgTurn = Math.round(results.reduce((a, b) => a + b.turn, 0) / results.length)
const maxRank = results.reduce((a, b) => Math.max(a, Number(b.post.length)), 0)

console.log('=== 官途模拟报告 ===')
console.log('局数', results.length, '崩溃', crashes)
console.log('平均回合', avgTurn)
console.log('结局分布', endCount)
console.log('样例', results.slice(0, 5))
console.log('最长局', results.reduce((a, b) => (a.turn > b.turn ? a : b)))
console.log('最短局', results.reduce((a, b) => (a.turn < b.turn ? a : b)))
