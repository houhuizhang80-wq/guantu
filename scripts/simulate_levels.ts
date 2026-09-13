/**
 * 稳妥 Bot 大样本：正国 / 副国 / 省部（含省委）触达率
 * 逻辑与 simulate_smart 一致，只加统计。
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

type RunResult = {
  bestLevel: string
  bestTitle: string
  bestRank: number
  ending: string | null
  age: number
  turn: number
  hitZhengguo: boolean
  hitFuguo: boolean
  hitZhengbu: boolean
  hitShengbuFu: boolean
  hitShengwei: boolean
  endingZhengguo: boolean
}

function playSmart(originId: string, provinceId: string, maxTurns: number): RunResult {
  lastIdx = -1
  const s: any = createNewGame(originId, provinceId)
  s.actionPoints = s.maxActionPoints
  let bestPost = getPost(s.postId)
  let guard = 0
  let hitZhengguo = false
  let hitFuguo = false
  let hitZhengbu = false
  let hitShengbuFu = false
  let hitShengwei = false

  const notePost = () => {
    const p = getPost(s.postId)
    if (p.rank > bestPost.rank) bestPost = p
    if (p.level === '国家级正职' || p.levelShort === '正国') {
      hitZhengguo = true
      hitFuguo = true
      hitZhengbu = true
      hitShengbuFu = true
    } else if (p.level === '国家级副职' || p.levelShort === '副国') {
      hitFuguo = true
      hitZhengbu = true
      hitShengbuFu = true
    } else if (p.level === '省部级正职') {
      hitZhengbu = true
      hitShengbuFu = true
    } else if (p.level === '省部级副职') {
      hitShengbuFu = true
    }
    if (p.title.includes('省委')) hitShengwei = true
  }
  notePost()

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
      const dutyKinds = ['pishi', 'xinfang', 'qicao', 'huiyi', 'peixun'] as const
      for (const kind of dutyKinds) {
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
      s.attrs.MX = clamp(s.attrs.MX + 1)
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
    notePost()
  }

  return {
    bestLevel: bestPost.level,
    bestTitle: bestPost.title,
    bestRank: bestPost.rank,
    ending: s.endingId,
    age: s.age,
    turn: s.turn,
    hitZhengguo,
    hitFuguo,
    hitZhengbu,
    hitShengbuFu,
    hitShengwei,
    endingZhengguo: String(s.endingId || '').startsWith('zhengguo'),
  }
}

const RUNS_PER_ORIGIN = Number(process.env.RUNS_PER || 8)
const MAX_TURNS = Number(process.env.MAX_TURNS || 620)

const t0 = Date.now()
const rows: (RunResult & { origin: string })[] = []
for (const o of ORIGINS) {
  for (let i = 0; i < RUNS_PER_ORIGIN; i++) {
    rows.push({ ...playSmart(o.id, 'qiantang', MAX_TURNS), origin: o.id })
  }
}
const n = rows.length
const pct = (c: number) => `${((c / n) * 100).toFixed(1)}%`
const cnt = (fn: (r: (typeof rows)[0]) => boolean) => rows.filter(fn).length

console.log('=== 稳妥 Bot · 正国 / 副国 / 省部 触达率 ===')
console.log(`总局数 ${n} · 每出身 ${RUNS_PER_ORIGIN} 局 · 上限 ${MAX_TURNS} 月 · 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`)
console.log()
console.log(`曾达正国（国家级正职）           ${cnt((r) => r.hitZhengguo)}  ${pct(cnt((r) => r.hitZhengguo))}`)
console.log(`曾达副国及以上（国家级副职+）     ${cnt((r) => r.hitFuguo)}  ${pct(cnt((r) => r.hitFuguo))}`)
console.log(`  其中只到副国、未到正国         ${cnt((r) => r.hitFuguo && !r.hitZhengguo)}  ${pct(cnt((r) => r.hitFuguo && !r.hitZhengguo))}`)
console.log()
console.log(`曾达省部级正职及以上（省长/书记/更高） ${cnt((r) => r.hitZhengbu)}  ${pct(cnt((r) => r.hitZhengbu))}`)
console.log(`曾到过省委相关岗位               ${cnt((r) => r.hitShengwei)}  ${pct(cnt((r) => r.hitShengwei))}`)
console.log(`曾达省部级副职及以上             ${cnt((r) => r.hitShengbuFu)}  ${pct(cnt((r) => r.hitShengbuFu))}`)
console.log()
console.log(`最终结局是正国结局               ${cnt((r) => r.endingZhengguo)}  ${pct(cnt((r) => r.endingZhengguo))}`)

const levelMap = new Map<string, number>()
for (const r of rows) levelMap.set(r.bestLevel, (levelMap.get(r.bestLevel) || 0) + 1)
console.log()
console.log('最高职级分布:')
for (const [lv, c] of [...levelMap.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(4)}  ${pct(c).padStart(6)}  ${lv}`)
}

console.log()
console.log('=== 各出身 ===')
for (const o of ORIGINS) {
  const rs = rows.filter((r) => r.origin === o.id)
  if (!rs.length) continue
  const zg = rs.filter((r) => r.hitZhengguo).length
  const fg = rs.filter((r) => r.hitFuguo).length
  const sb = rs.filter((r) => r.hitZhengbu).length
  const sw = rs.filter((r) => r.hitShengwei).length
  console.log(
    o.id.padEnd(14),
    `正国 ${zg}/${rs.length}`,
    `副国+ ${fg}/${rs.length}`,
    `省部正+ ${sb}/${rs.length}`,
    `省委 ${sw}/${rs.length}`,
  )
}
