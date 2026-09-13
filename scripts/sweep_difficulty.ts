/**
 * 难度参数扫描：固定随机种子，一次跑多组 TUNE 配置，对比登顶率。
 * 用法：npx tsx scripts/sweep_difficulty.ts
 *
 * 目标口径（最高职级分布）：正国 10% / 副国 15% / 省部正 20%
 */
import { createNewGame, clamp } from '../src/state/game'
import { scheduleNextEvent, markEventUsed, meetsRequire } from '../src/systems/events'
import { getEvent } from '../src/data/events'
import { TUNE, availablePaths, startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'
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
import { doYuqing, setWeekPlan, startResearch, advanceResearch, hireSecretary, yuqingOf } from '../src/systems/office'
import { ORIGINS } from '../src/data/origins'

const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v) },
  removeItem: (k: string) => { mem.delete(k) },
}

// —— 固定种子 PRNG：所有配置共用同一串随机数，降低对比噪声 ——
let seedState = 1
function mulberry32(): number {
  seedState = (seedState + 0x6d2b79f5) | 0
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
Math.random = mulberry32 as unknown as () => number

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

const MAX_TURNS = 480

function playSmart(originId: string, provinceId: string) {
  lastIdx = -1
  const s: any = createNewGame(originId, provinceId)
  s.actionPoints = s.maxActionPoints
  let bestPost = getPost(s.postId)
  let guard = 0
  while (!s.endingId && s.turn < MAX_TURNS && guard++ < 3000) {
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
  return { best: bestPost }
}

interface Cfg {
  name: string
  tune: Partial<typeof TUNE>
}

const CONFIGS: Cfg[] = [
  { name: '最终参数（源码实际值）', tune: {} },
]

const SEEDS = [20260912, 777, 31337, 424242, 99991, 13, 55555, 8080, 1234, 98765, 2024, 60606]
const RUNS = 6
const results: string[] = []

/** 源码默认值快照：用于每个配置开始前复位，避免上一组配置污染下一组 */
const DEFAULT_TUNE = { ...TUNE }

for (const cfg of CONFIGS) {
  Object.assign(TUNE, DEFAULT_TUNE)
  Object.assign(TUNE, cfg.tune)

  const levels: string[] = []
  for (const sd of SEEDS) {
    seedState = sd
    for (const o of ORIGINS) {
      for (let i = 0; i < RUNS; i++) {
        const r = playSmart(o.id, 'tianfu')
        levels.push(r.best.level)
      }
    }
  }
  const n = levels.length
  const c = (lv: string) => levels.filter((x) => x === lv).length
  const p = (lv: string) => ((c(lv) / n) * 100).toFixed(1)
  results.push(
    `${cfg.name.padEnd(24)} n=${n}  正国 ${p('国家级正职').padStart(5)}%  副国 ${p('国家级副职').padStart(5)}%  省部正 ${p('省部级正职').padStart(5)}%  省部副 ${p('省部级副职').padStart(5)}%  厅局正 ${p('厅局级正职').padStart(5)}%`,
  )
}

console.log('=== 难度参数扫描（' + SEEDS.length + ' 种子 × ' + ORIGINS.length * RUNS + ' 局 = ' + SEEDS.length * ORIGINS.length * RUNS + ' 局/配置）===')
console.log('目标：正国 10% / 副国 15% / 省部正 20%')
console.log('实际 TUNE:', JSON.stringify(DEFAULT_TUNE))
console.log()
for (const r of results) console.log(r)
