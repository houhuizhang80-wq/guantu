import { createNewGame } from '../src/state/game'
import { availablePaths, startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'
import { scheduleNextEvent, markEventUsed } from '../src/systems/events'
import { getEvent } from '../src/data/events'
import { checkEnding } from '../src/systems/ending'
import { monthlyDrift } from '../src/systems/promotion'
import { riskTick } from '../src/systems/risk'
import { familyTick } from '../src/systems/family'
import { networkTick } from '../src/systems/network'
import { factionHeatTick } from '../src/systems/focus'
import { noteEventHandled } from '../src/systems/engagement'
import { clamp } from '../src/state/game'

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

const s = createNewGame('xuandiao_pu', 'qiantang') as any
s.actionPoints = 2
console.log('start', s.postId, s.attrs, s.risk)

for (let i = 0; i < 80 && !s.endingId; i++) {
  if (!s.currentEventId) {
    const ev = scheduleNextEvent(s)
    if (ev) {
      s.currentEventId = ev.id
      markEventUsed(s, ev)
    }
  }
  if (s.currentEventId) {
    const ev = getEvent(s.currentEventId)
    const choice = ev.choices[0]
    applyAttrs(s, choice.fx)
    noteEventHandled(s)
    markEventUsed(s, ev)
    s.currentEventId = null
  }
  s.turn++
  s.month++
  if (s.month > 12) { s.month = 1; s.year++ }
  s.flags.monthsInPost = ((s.flags.monthsInPost as number) ?? 0) + 1
  monthlyDrift(s)
  riskTick(s)
  familyTick(s)
  networkTick(s)
  factionHeatTick(s)
  const paths = availablePaths(s)
  const ok = paths.filter((p) => p.ok)
  if (!s.promo && ok.length) {
    console.log('t', s.turn, 'post', s.postId, 'months', s.flags.monthsInPost, 'handled', s.eventsHandledThisPost, 'start', ok[0].path.label)
    startPromo(s, ok[0].path)
  }
  if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
    const r = advancePromo(s, 'taici')
    console.log('  promo', s.promo?.stage ?? 'null', r.failed || 'ok')
    if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
      console.log('  appointed', s.postId)
    }
  } else if (s.promo?.stage === 'renmian') {
    confirmAppointment(s)
    console.log('  appointed', s.postId)
  }
  if (i % 12 === 0) {
    console.log('t', s.turn, s.postId, 'ZJ', s.attrs.ZJ, 'months', s.flags.monthsInPost, 'handled', s.eventsHandledThisPost, 'risk', Math.round(s.risk))
  }
  s.actionPoints = s.maxActionPoints
}
console.log('end', s.postId, s.turn, s.endingId, s.attrs)
