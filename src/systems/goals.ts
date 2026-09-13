/**
 * 年度目标责任书。
 *
 * 每年 1 月与上级签订 2–3 项可考核指标，12 月过完对照结算：
 * 全部达成有政绩与民心奖励，全部落空抬风险。目标值在「签订」那一刻按
 * 当时的属性锁定 —— 签的是承诺，不是随属性漂移的浮标。
 *
 * 目标池按职务层次分档：基层考执行力（经手事件、办结公务、民心），
 * 中层考统筹（台账、风险控制、廉洁），高层考结果（政绩、民心、廉洁）。
 *
 * 除 note 外全部为纯函数：同一存档状态必然得到同一进度与结算结果。
 */
import type { AnnualGoal, AnnualGoals, GameState, YearCounters } from '../types'
import { getPost } from '../data/posts'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

/** 从池中不重复抽取 n 项 */
function pick(n: number, pool: AnnualGoal[]): AnnualGoal[] {
  const rest = [...pool]
  const out: AnnualGoal[] = []
  while (out.length < n && rest.length > 0) {
    const i = Math.floor(Math.random() * rest.length)
    out.push(rest.splice(i, 1)[0])
  }
  return out
}

/**
 * 生成本年度责任书。
 *
 * 基层（rank<6）：执行力与口碑；中层（6–12）：统筹与守线；高层（>12）：结果。
 * 属性型目标 = 现值 + 8~14，够得着但必须全年朝一个方向使劲。
 */
export function generateAnnualGoals(s: GameState): AnnualGoals {
  const rank = getPost(s.postId).rank
  const pool: AnnualGoal[] = []

  const attrGoal = (id: string, label: string, cur: number): AnnualGoal => ({
    id,
    label,
    kind: id as AnnualGoal['kind'],
    target: clamp(cur + rnd(8, 14), 10, 96),
  })

  pool.push(attrGoal('attrZJ', '政绩再上台阶', s.attrs.ZJ))
  pool.push(attrGoal('attrMX', '民心明显提升', s.attrs.MX))
  pool.push(attrGoal('attrNL', '能力稳步提升', s.attrs.NL))
  pool.push(attrGoal('attrGX', '关系网再厚一层', s.attrs.GX))
  pool.push({
    id: 'lian',
    label: '廉洁底线不松动',
    kind: 'lian',
    target: clamp(s.attrs.Lian + rnd(4, 10), 60, 95),
  })
  pool.push({
    id: 'risk',
    label: '风险控制在警戒内',
    kind: 'risk',
    target: clamp(Math.round(s.risk) + rnd(5, 12), 22, 55),
    upper: true,
  })
  pool.push({
    id: 'duty',
    label: '深度公务办出实效',
    kind: 'duty',
    target: rank >= 6 ? rnd(4, 6) : rnd(3, 5),
  })
  pool.push({
    id: 'events',
    label: '经手事件件件有着落',
    kind: 'events',
    target: rnd(9, 13),
  })
  pool.push({
    id: 'projects',
    label: '台账项目办结',
    kind: 'projects',
    target: rnd(2, 3),
  })

  let chosen: AnnualGoal[]
  if (rank < 6) {
    // 基层：必有执行力类，属性类补位
    const exec = pool.filter((g) => g.kind === 'events' || g.kind === 'duty')
    const rest = pool.filter((g) => !exec.includes(g))
    chosen = [...pick(1, exec), ...pick(2, rest)]
  } else if (rank < 12) {
    // 中层：必有守线类（风险/廉洁）
    const guard = pool.filter((g) => g.kind === 'risk' || g.kind === 'lian')
    const rest = pool.filter((g) => !guard.includes(g))
    chosen = [...pick(1, guard), ...pick(2, rest)]
  } else {
    // 高层：必有结果类（政绩/民心）
    const outcome = pool.filter((g) => g.kind === 'attrZJ' || g.kind === 'attrMX')
    const rest = pool.filter((g) => !outcome.includes(g))
    chosen = [...pick(1, outcome), ...pick(2, rest)]
  }

  return { year: s.year, items: chosen }
}

/** 目标当前值。计数器只在同一年内有效，跨年后视为 0。 */
export function goalCurrent(s: GameState, g: AnnualGoal): number {
  const yc = s.yearCounters
  const counted = yc && yc.year === s.year ? yc : emptyCounters(s.year)
  switch (g.kind) {
    case 'attrZJ':
      return s.attrs.ZJ
    case 'attrMX':
      return s.attrs.MX
    case 'attrNL':
      return s.attrs.NL
    case 'attrGX':
      return s.attrs.GX
    case 'lian':
      return s.attrs.Lian
    case 'risk':
      return Math.round(s.risk)
    case 'duty':
      return counted.duties
    case 'events':
      return counted.events
    case 'projects':
      return counted.projects
  }
}

/** 目标达成判定：upper 为「不高于」型 */
export function goalDone(s: GameState, g: AnnualGoal): boolean {
  const cur = goalCurrent(s, g)
  return g.upper ? cur <= g.target : cur >= g.target
}

export interface GoalSettleResult {
  year: number
  done: number
  total: number
  allDone: boolean
  text: string
  /** 结算对五维与风险的直接影响，由调用方落到存档 */
  fx: { ZJ?: number; MX?: number; NL?: number; Risk?: number }
}

/**
 * 结算上一年责任书。无责任书或已结算返回 null。
 * 结算只产生结果与加减值，不直接改存档 —— 由 main.ts 统一应用并写日志。
 */
export function settleAnnualGoals(s: GameState): GoalSettleResult | null {
  const ag = s.annualGoals
  if (!ag || ag.settled) return null
  const done = ag.items.filter((g) => goalDone(s, g)).length
  const total = ag.items.length
  const allDone = done === total

  let text: string
  let fx: GoalSettleResult['fx']
  if (allDone) {
    text = `上年度 ${total} 项责任目标全部达成，考核组另眼相看。`
    fx = { ZJ: 5, MX: 3, NL: 2, Risk: -4 }
  } else if (done > 0) {
    text = `上年度责任目标达成 ${done}/${total}，总体说得过去。`
    fx = { ZJ: 2 }
  } else {
    text = `上年度 ${total} 项责任目标全部落空，上级要个说法。`
    fx = { Risk: 5, MX: -2 }
  }

  // 标记已结算，避免同一年重复触发
  ag.settled = true
  return { year: ag.year, done, total, allDone, text, fx }
}

/** 新一年计数器 */
export function emptyCounters(year: number): YearCounters {
  return { year, events: 0, duties: 0, projects: 0 }
}

/** 计数器自增（跨年自动重置） */
export function bumpCounter(
  s: GameState,
  kind: 'events' | 'duties' | 'projects',
): void {
  if (!s.yearCounters || s.yearCounters.year !== s.year) {
    s.yearCounters = emptyCounters(s.year)
  }
  s.yearCounters[kind] += 1
}

/** 责任书签订日志文案 */
export function goalSignLog(ag: AnnualGoals): string {
  const lines = ag.items.map((g) => `${g.label}（${goalTargetText(g)}）`)
  return `【目标】与上级签订 ${ag.year} 年度目标责任书：${lines.join('；')}。`
}

/** 目标的展示口径：上限型写「≤」 */
export function goalTargetText(g: AnnualGoal): string {
  return `${g.upper ? '≤' : '≥'}${g.target}`
}
