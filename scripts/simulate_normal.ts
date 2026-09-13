/**
 * 普通玩家 Bot：非贪心登顶、会失误、会快进，统计各出身登顶率与卡点
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
import { noteChoice, noteEventHandled, applySkipMonthCost } from '../src/systems/engagement'
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

/** 普通玩家：在可选里随机偏好的一个，偶尔点同一个（草率） */
let lastIdx = -1
function pickNormalChoice(s: any, ev: any): number {
  const scored: { i: number; score: number }[] = []
  ev.choices.forEach((c: any, i: number) => {
    if (!meetsRequire(s, c.require)) return
    const fx = c.fx || {}
    let score = 0
    score += (fx.Lian || 0) * 2
    score += (fx.ZJ || 0) * 1.5
    score += (fx.MX || 0) * 1
    score += (fx.NL || 0) * 0.8
    score += (fx.GX || 0) * 1
    score -= (fx.Risk || 0) * 1.2
    // 12% 概率无视评分乱选（普通玩家不总最优）
    if (Math.random() < 0.12) score = Math.random() * 10
    scored.push({ i, score })
  })
  if (!scored.length) return 0
  scored.sort((a, b) => b.score - a.score)
  // 会玩的普通玩家：主要在前 2 名里选，偶尔完全随机
  if (Math.random() < 0.08 && scored.length > 2) {
    return scored[Math.floor(Math.random() * scored.length)].i
  }
  const top = scored.slice(0, Math.min(2, scored.length))
  const pick = top[Math.floor(Math.random() * top.length)]
  lastIdx = pick.i
  return pick.i
}

const promoStrategies: Record<string, string> = {
  minzhu: 'taici',
  kaocha: 'rushi',
  gongshi: 'jingdai',
  piaojue: 'huiqian',
}
/** 普通玩家选策略也不总最优 */
function pickStrat(stage: string): string {
  const best = promoStrategies[stage] || 'taici'
  if (Math.random() < 0.12) {
    const alts: Record<string, string[]> = {
      minzhu: ['gongkai', 'taici'],
      kaocha: ['rushi', 'tuoren'],
      gongshi: ['yuqing', 'jingdai'],
      piaojue: ['huiqian', 'bubiao'],
    }
    const list = alts[stage] || [best]
    return list[Math.floor(Math.random() * list.length)]
  }
  return best
}

type Stuck = Record<string, number>

function playNormal(originId: string, provinceId: string, maxTurns: number) {
  lastIdx = -1
  const s: any = createNewGame(originId, provinceId)
  s.actionPoints = s.maxActionPoints
  let bestPost = getPost(s.postId)
  let guard = 0
  let hitZhengguo = false
  let hitFuguo = false
  let hitZhengbu = false
  let hitShengbuFu = false
  let stuck: Stuck = {}

  const notePost = () => {
    const p = getPost(s.postId)
    if (p.rank > bestPost.rank) bestPost = p
    if (p.level === '国家级正职' || p.levelShort === '正国') hitZhengguo = hitFuguo = hitZhengbu = hitShengbuFu = true
    else if (p.level === '国家级副职' || p.levelShort === '副国') hitFuguo = hitZhengbu = hitShengbuFu = true
    else if (p.level === '省部级正职') hitZhengbu = hitShengbuFu = true
    else if (p.level === '省部级副职') hitShengbuFu = true
  }
  notePost()

  while (!s.endingId && s.turn < maxTurns && guard++ < 2200) {
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
        const idx = pickNormalChoice(s, ev)
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
      }
    } else {
      // 偶尔快进（普通玩家手滑/赶时间）
      // 注意力正常：几乎不快进
      if (s.actionPoints > 0 && Math.random() < 0.005) {
        applySkipMonthCost(s)
        s.actionPoints = 0
      }
      const dutyKinds = ['pishi', 'xinfang', 'qicao', 'huiyi'] as const
      if (Math.random() < 0.45) {
        const kind = dutyKinds[s.turn % dutyKinds.length]
        if (canStartDuty(s, kind).ok) {
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
      while (s.actionPoints > 0) {
        s.actionPoints -= 1
        if (s.risk > 45) {
          s.risk = clamp(s.risk - 4, 0, 100)
          s.attrs.Lian = clamp(s.attrs.Lian + 1)
        } else if (s.attrs.GX < 60) {
          s.attrs.GX = clamp(s.attrs.GX + 2)
        } else if (s.attrs.ZJ < s.attrs.MX) {
          s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
          s.attrs.NL = clamp(s.attrs.NL + 1)
        } else {
          s.attrs.MX = clamp(s.attrs.MX + 1)
          s.attrs.NL = clamp(s.attrs.NL + 1)
        }
      }
    }

    if (s.pendingVisit) resolveVisit(s, Math.random() < 0.7)
    if (s.jijian) advanceJijian(s, 'peihe')

    if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
      const strat = pickStrat(s.promo.stage)
      advancePromo(s, strat)
      if (s.promo?.stage === 'renmian') confirmAppointment(s)
    } else if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
    } else if (!s.promo) {
      const paths = availablePaths(s).filter((p) => p.ok)
      if (paths.length > 0) {
        // 85% 冲最高 rank，15% 随便一条
        let chosen = paths[0]
        if (Math.random() < 0.15) {
          chosen = paths[Math.floor(Math.random() * paths.length)]
        } else {
          const scored = paths
            .map((p) => ({ p, rank: getPost(p.path.to).rank }))
            .sort((a, b) => b.rank - a.rank)
          chosen = scored[0].p
        }
        startPromo(s, chosen.path)
      } else {
        // 记录卡点原因（每 24 月抽样一次）
        if (s.turn > 0 && s.turn % 24 === 0) {
          const all = availablePaths(s)
          const reason = all[0]?.reason || '无路径'
          const key = reason.slice(0, 18)
          stuck[key] = (stuck[key] || 0) + 1
        }
      }
    }

    s.turn++
    s.month++
    if (s.month > 12) {
      s.month = 1
      s.year++
      s.ffUsedThisYear = 0
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
    ending: s.endingId as string | null,
    age: s.age,
    turn: s.turn,
    hitZhengguo,
    hitFuguo,
    hitZhengbu,
    hitShengbuFu,
    stuck,
    endPost: getPost(s.postId).id,
  }
}

const RUNS = Number(process.env.RUNS_PER || 20)
const MAX_TURNS = Number(process.env.MAX_TURNS || 620)
const t0 = Date.now()
const rows: any[] = []
const allStuck: Stuck = {}

for (const o of ORIGINS) {
  for (let i = 0; i < RUNS; i++) {
    const r = playNormal(o.id, 'qiantang', MAX_TURNS)
    rows.push({ ...r, origin: o.id })
    for (const [k, v] of Object.entries(r.stuck)) allStuck[k] = (allStuck[k] || 0) + v
  }
}

const n = rows.length
const pct = (c: number) => `${((c / n) * 100).toFixed(1)}%`
const cnt = (fn: (r: any) => boolean) => rows.filter(fn).length

console.log('=== 普通玩家 Bot · 登顶率（会失误/会快进/不总选最高） ===')
console.log(`总局数 ${n} · 每出身 ${RUNS} · 上限 ${MAX_TURNS} 月 · 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`)
console.log()
console.log(`正国     ${cnt((r) => r.hitZhengguo)}  ${pct(cnt((r) => r.hitZhengguo))}`)
console.log(`副国+    ${cnt((r) => r.hitFuguo)}  ${pct(cnt((r) => r.hitFuguo))}`)
console.log(`省部正+  ${cnt((r) => r.hitZhengbu)}  ${pct(cnt((r) => r.hitZhengbu))}`)
console.log(`省部副+  ${cnt((r) => r.hitShengbuFu)}  ${pct(cnt((r) => r.hitShengbuFu))}`)

const levelMap = new Map<string, number>()
for (const r of rows) levelMap.set(r.bestLevel, (levelMap.get(r.bestLevel) || 0) + 1)
console.log('\n最高职级分布:')
for (const [lv, c] of [...levelMap.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(4)}  ${pct(c).padStart(6)}  ${lv}`)
}

console.log('\n卡点原因 TOP（采样）:')
for (const [k, c] of [...Object.entries(allStuck)].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${String(c).padStart(4)}  ${k}`)
}

console.log('\n=== 各出身 ===')
for (const o of ORIGINS) {
  const rs = rows.filter((r) => r.origin === o.id)
  const zg = rs.filter((r) => r.hitZhengguo).length
  const fg = rs.filter((r) => r.hitFuguo).length
  const sb = rs.filter((r) => r.hitZhengbu).length
  const sf = rs.filter((r) => r.hitShengbuFu).length
  const avgRank = (rs.reduce((a, b) => a + b.bestRank, 0) / rs.length).toFixed(2)
  console.log(
    o.id.padEnd(14),
    `正国 ${String(zg).padStart(2)}/${rs.length}`,
    `副国+ ${String(fg).padStart(2)}/${rs.length}`,
    `省部正+ ${String(sb).padStart(2)}/${rs.length}`,
    `省部副+ ${String(sf).padStart(2)}/${rs.length}`,
    `均rank ${avgRank}`,
  )
}
