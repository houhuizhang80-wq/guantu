/** 统计到达副国/正国的回合与年龄 */
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
import { doYuqing, setWeekPlan, startResearch, advanceResearch, hireSecretary, yuqingOf } from '../src/systems/office'
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
  const startAge = s.age
  let hitZhengbu: { turn: number; age: number; title: string } | null = null
  let hitFuguo: { turn: number; age: number; title: string } | null = null
  let hitZhengguo: { turn: number; age: number; title: string } | null = null
  let guard = 0

  const mark = () => {
    const p = getPost(s.postId)
    const rec = { turn: s.turn, age: s.age, title: p.title }
    if (!hitZhengbu && p.level === '省部级正职') hitZhengbu = rec
    if (!hitFuguo && p.level === '国家级副职') hitFuguo = rec
    if (!hitZhengguo && p.level === '国家级正职') hitZhengguo = rec
  }

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
        .map((p) => ({
          p,
          rank: getPost(p.path.to).rank,
          leader: p.path.kind === 'leader' ? 1 : 0,
        }))
        .sort((a, b) => b.rank - a.rank || b.leader - a.leader)
      if (scored[0]) startPromo(s, scored[0].p.path)
    }
    mark()
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
    startAge,
    endTurn: s.turn,
    endAge: s.age,
    endTitle: getPost(s.postId).title,
    ending: s.endingId,
    hitZhengbu,
    hitFuguo,
    hitZhengguo,
  }
}

const RUNS = 48
const rows: ReturnType<typeof playSmart>[] = []
for (let i = 0; i < RUNS; i++) {
  const o = ORIGINS[i % ORIGINS.length]
  rows.push(playSmart(o.id, 'tianfu', 480))
}

const years = (t: number) => (t / 12).toFixed(1)
const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)

const zb = rows.filter((r) => r.hitZhengbu)
const fg = rows.filter((r) => r.hitFuguo)
const zg = rows.filter((r) => r.hitZhengguo)

console.log('=== 到达时间统计（稳妥 Bot ×', RUNS, '局）===')
console.log(
  `正部 ${zb.length}/${RUNS} · 副国 ${fg.length}/${RUNS} · 正国 ${zg.length}/${RUNS}`,
)
if (zb.length) {
  console.log(
    `正部：平均 ${years(avg(zb.map((r) => r.hitZhengbu!.turn)))} 年 · ${avg(zb.map((r) => r.hitZhengbu!.age))} 岁 · ${zb.map((r) => r.hitZhengbu!.title)[0]}`,
  )
}
if (fg.length) {
  console.log(
    `副国：平均 ${years(avg(fg.map((r) => r.hitFuguo!.turn)))} 年 · ${avg(fg.map((r) => r.hitFuguo!.age))} 岁`,
  )
}
if (zg.length) {
  console.log(
    `正国：平均 ${years(avg(zg.map((r) => r.hitZhengguo!.turn)))} 年 · ${avg(zg.map((r) => r.hitZhengguo!.age))} 岁`,
  )
}

// 中位数
function med(nums: number[]) {
  if (!nums.length) return 0
  const a = [...nums].sort((x, y) => x - y)
  return a[Math.floor(a.length / 2)]
}
if (fg.length) {
  console.log(
    `副国中位：${years(med(fg.map((r) => r.hitFuguo!.turn)))} 年 · ${med(fg.map((r) => r.hitFuguo!.age))} 岁`,
  )
}
if (zg.length) {
  console.log(
    `正国中位：${years(med(zg.map((r) => r.hitZhengguo!.turn)))} 年 · ${med(zg.map((r) => r.hitZhengguo!.age))} 岁`,
  )
}

// 样例
console.log('--- 副国样例 ---')
for (const r of fg.slice(0, 5)) {
  console.log(
    `  ${years(r.hitFuguo!.turn)}年 ${r.hitFuguo!.age}岁 · ${r.hitFuguo!.title}`,
  )
}
console.log('--- 正国样例 ---')
for (const r of zg.slice(0, 5)) {
  console.log(
    `  ${years(r.hitZhengguo!.turn)}年 ${r.hitZhengguo!.age}岁 · ${r.hitZhengguo!.title}`,
  )
}
console.log(
  '开局年龄',
  avg(rows.map((r) => r.startAge)),
  '终局年龄',
  avg(rows.map((r) => r.endAge)),
  '终局回合',
  years(avg(rows.map((r) => r.endTurn))),
  '年',
)
