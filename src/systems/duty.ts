import type { DutyKind, DutyRun, GameState } from '../types'
import { clamp, pushLog } from '../state/game'
import { getPost } from '../data/posts'
import { secretaryDutyBonus } from './office'
import {
  DUTY_META,
  getDutyItem,
  HUIYI_POOL,
  PISHI_POOL,
  QICAO_POOL,
  XINFANG_POOL,
  PEIXUN_DAYS,
} from '../data/duties'

export function dutyCost(kind: DutyKind): number {
  return DUTY_META.find((d) => d.kind === kind)?.cost ?? 1
}

export function canStartDuty(
  s: GameState,
  kind: DutyKind,
): { ok: boolean; reason: string } {
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.dutyRun && !s.dutyRun.done) return { ok: false, reason: '还有公务未办完' }
  if ((s.dutyDone ?? []).includes(kind)) return { ok: false, reason: '本月已办过此项公务' }
  const cost = dutyCost(kind)
  if (s.actionPoints < cost) return { ok: false, reason: `行动点不足（需 ${cost}）` }
  if (kind === 'peixun' && s.probationLeft > 0)
    return { ok: false, reason: '试用期内不宜离岗培训' }
  return { ok: true, reason: '' }
}

function pickFromPool(pool: typeof PISHI_POOL, rank: number, n: number): string[] {
  const ok = pool.filter((e) => {
    if (e.minRank != null && rank < e.minRank) return false
    if (e.maxRank != null && rank > e.maxRank) return false
    return true
  })
  const src = ok.length >= n ? ok : pool
  const bag = [...src]
  const out: string[] = []
  while (out.length < n && bag.length > 0) {
    const i = Math.floor(Math.random() * bag.length)
    out.push(bag.splice(i, 1)[0].id)
  }
  return out
}

export function startDuty(s: GameState, kind: DutyKind): DutyRun {
  const rank = getPost(s.postId).rank
  const cost = dutyCost(kind)
  s.actionPoints -= cost
  let run: DutyRun
  if (kind === 'pishi') {
    const queue = pickFromPool(PISHI_POOL, rank, 4)
    run = {
      kind,
      itemId: queue[0],
      step: 0,
      score: 50,
      picks: [],
      queue: queue.slice(1),
      done: false,
    }
  } else if (kind === 'xinfang') {
    const ids = pickFromPool(XINFANG_POOL, rank, 1)
    // 取有 next 链的主案例
    const start = XINFANG_POOL.find((x) => x.id === ids[0] && x.next) || XINFANG_POOL[0]
    run = {
      kind,
      itemId: start.id,
      step: 0,
      score: 50,
      picks: [],
      queue: [],
      done: false,
    }
  } else if (kind === 'qicao') {
    const ids = pickFromPool(QICAO_POOL, rank, 1)
    const start = QICAO_POOL.find((x) => x.id === ids[0]) || QICAO_POOL[0]
    run = {
      kind,
      itemId: start.id,
      step: 0,
      score: 50,
      picks: [],
      queue: [],
      done: false,
    }
  } else if (kind === 'huiyi') {
    const ids = pickFromPool(HUIYI_POOL, rank, 1)
    const start = HUIYI_POOL.find((x) => x.id === ids[0]) || HUIYI_POOL[0]
    run = {
      kind,
      itemId: start.id,
      step: 0,
      score: 50,
      picks: [],
      queue: [],
      done: false,
    }
  } else {
    run = {
      kind: 'peixun',
      itemId: PEIXUN_DAYS[0].id,
      step: 0,
      score: 50,
      picks: [],
      queue: [],
      done: false,
      day: 1,
    }
  }
  s.dutyRun = run
  return run
}

function gradeDuty(score: number): { text: string; bonus: number } {
  if (score >= 85) return { text: '办得漂亮，组织部门记了一笔。', bonus: 6 }
  if (score >= 70) return { text: '处置得当，过程扎实。', bonus: 3 }
  if (score >= 50) return { text: '按程序办完了，中规中矩。', bonus: 0 }
  if (score >= 35) return { text: '有些勉强，留下隐患或遗憾。', bonus: -2 }
  return { text: '办砸了，议论已经起来了。', bonus: -5 }
}

export function chooseDuty(
  s: GameState,
  choiceId: string,
): { text: string; finished?: boolean } {
  const run = s.dutyRun
  if (!run || run.done) return { text: '' }
  const item = getDutyItem(run.itemId)
  if (!item) return { text: '公务材料缺失。' }
  const ch = item.choices.find((c) => c.id === choiceId)
  if (!ch) return { text: '无效选择。' }

  if (ch.fx) {
    for (const k of ['ZJ', 'GX', 'Lian', 'MX', 'NL'] as const) {
      const v = ch.fx[k]
      if (typeof v === 'number') s.attrs[k] = clamp(s.attrs[k] + v)
    }
  }
  if (typeof ch.riskDelta === 'number')
    s.risk = clamp(s.risk + ch.riskDelta, 0, 100)
  if (ch.score != null) run.score = clamp(run.score + (ch.score - 8) * 1.2, 0, 100)
  if (ch.faction && ch.faction !== 'none' && ch.factionRep) {
    if (!s.factionRep) s.factionRep = { A: 20, B: 20, local: 30 }
    s.factionRep[ch.faction] = Math.min(100, (s.factionRep[ch.faction] ?? 20) + ch.factionRep)
  }
  run.picks.push(ch.id)
  run.step += 1

  const note = ch.note || ''

  // 批示台：队列消化
  if (run.kind === 'pishi') {
    if (run.queue.length > 0) {
      run.itemId = run.queue[0]
      run.queue = run.queue.slice(1)
      return { text: `${item.title}：${note}` }
    }
    return finishDuty(s, `${item.title}：${note}`)
  }

  // 多轮链
  if (item.next) {
    run.itemId = item.next
    return { text: `${note}` }
  }

  return finishDuty(s, note)
}

function finishDuty(s: GameState, lastNote: string): { text: string; finished: boolean } {
  const run = s.dutyRun!
  // 联络员初核：小幅抬高质量分
  run.score = clamp(run.score + secretaryDutyBonus(s), 0, 100)
  const g = gradeDuty(run.score)
  run.done = true
  run.resultText = g.text
  s.dutyDone = [...new Set([...(s.dutyDone ?? []), run.kind])]
  s.dutyMonthScore = clamp((s.dutyMonthScore ?? 0) + Math.round(run.score / 5), 0, 40)
  s.dutyYearScore = clamp((s.dutyYearScore ?? 0) + Math.round(run.score / 8), 0, 100)
  if (g.bonus > 0) s.attrs.ZJ = clamp(s.attrs.ZJ + Math.min(3, g.bonus))
  if (g.bonus < 0) s.attrs.GX = clamp(s.attrs.GX + g.bonus)
  // 培训结业额外
  if (run.kind === 'peixun' && run.score >= 75) {
    s.attrs.NL = clamp(s.attrs.NL + 2)
    s.flags.peixunExcellent = true
  }
  const name = DUTY_META.find((d) => d.kind === run.kind)?.name ?? '公务'
  pushLog(s, `【${name}】${g.text}（质量 ${Math.round(run.score)}）`)
  return { text: `${lastNote}\n\n${g.text}`, finished: true }
}

export function dismissDuty(s: GameState) {
  if (s.dutyRun?.done) s.dutyRun = null
}

export function dutyLabel(kind: DutyKind): string {
  return DUTY_META.find((d) => d.kind === kind)?.name ?? kind
}

/** 年度考核叠加公务质量 */
export function dutyAppraisalBonus(s: GameState): number {
  const y = s.dutyYearScore ?? 0
  return Math.round(clamp(y * 0.08, 0, 8))
}
