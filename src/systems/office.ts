import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'
import { getPost } from '../data/posts'

/** ── 舆情监测 ───────────────────────────── */

export function yuqingOf(s: GameState): number {
  return Math.round(s.yuqingHeat ?? 0)
}

export function yuqingLevel(h: number): string {
  if (h >= 75) return '热搜高位'
  if (h >= 55) return '热议中'
  if (h >= 35) return '有讨论'
  if (h >= 15) return '偶有提及'
  return '平静'
}

/** 每月舆情漂移 */
export function yuqingTick(s: GameState) {
  let h = s.yuqingHeat ?? 0
  // 高风险、低民心、高草率更容易起舆情
  h += s.risk * 0.04 + Math.max(0, 40 - s.attrs.MX) * 0.05 + (s.mashScore ?? 0) * 0.03
  h -= s.attrs.MX * 0.03 + s.attrs.Lian * 0.02
  if ((s.dutyMonthScore ?? 0) >= 20) h -= 2
  h += (Math.random() - 0.45) * 6
  s.yuqingHeat = clamp(h, 0, 100)
  s.yuqingActed = false
  // 高温惩罚
  const hv = s.yuqingHeat
  if (hv >= 70) {
    s.risk = clamp(s.risk + 2, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 1)
  } else if (hv >= 50 && Math.random() < 0.4) {
    s.risk = clamp(s.risk + 1, 0, 100)
  }
}

export type YuqingAct = 'huiying' | 'caifang' | 'yazhi' | 'zhengmian'

export function doYuqing(s: GameState, act: YuqingAct): { ok: boolean; text: string } {
  if (s.yuqingActed) return { ok: false, text: '本月舆情动作已用完。' }
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  s.actionPoints -= 1
  s.yuqingActed = true
  let h = s.yuqingHeat ?? 0
  if (act === 'huiying') {
    h -= 8
    s.attrs.MX = clamp(s.attrs.MX + 2)
    s.attrs.NL = clamp(s.attrs.NL + 1)
    return { ok: true, text: '你以事实回应关切，口径统一。热度下降，形象略稳。' }
  }
  if (act === 'caifang') {
    if (s.attrs.Lian < 50 || s.risk > 55) {
      h += 12
      s.risk = clamp(s.risk + 3, 0, 100)
      s.yuqingHeat = clamp(h, 0, 100)
      return { ok: true, text: '邀请媒体深挖后，旧闻被翻出。热度不降反升。' }
    }
    h -= 15
    s.attrs.MX = clamp(s.attrs.MX + 4)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    s.yuqingHeat = clamp(h, 0, 100)
    return { ok: true, text: '开放采访与现场，报道偏正面。热度明显回落。' }
  }
  if (act === 'yazhi') {
    h -= 18
    s.risk = clamp(s.risk + 6, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian - 3)
    s.yuqingHeat = clamp(h, 0, 100)
    return { ok: true, text: '多方「协调」后讨论变少。风险与廉洁承压，风声更紧。' }
  }
  // 正面宣传
  h -= 5
  s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
  s.attrs.MX = clamp(s.attrs.MX + 1)
  s.yuqingHeat = clamp(h, 0, 100)
  return { ok: true, text: '策划了一批基层故事，对冲了部分负面。' }
}

/** ── 秘书 / 联络员 ─────────────────────── */

const SECRETARY_NAMES = ['小周', '小吴', '小郑', '小王']

export function canHireSecretary(s: GameState): { ok: boolean; reason: string } {
  if (s.secretary?.hired) return { ok: false, reason: '已有联络员' }
  const rank = getPost(s.postId).rank
  if (rank < 4) return { ok: false, reason: '副科及以上方可配备联络力量' }
  if (s.attrs.GX < 35) return { ok: false, reason: '关系面不够，物色不到合适人选' }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  return { ok: true, reason: '' }
}

export function hireSecretary(s: GameState): { ok: boolean; text: string } {
  const g = canHireSecretary(s)
  if (!g.ok) return { ok: false, text: g.reason }
  s.actionPoints -= 1
  const name = SECRETARY_NAMES[Math.floor(Math.random() * SECRETARY_NAMES.length)]
  const skill = 40 + Math.floor(Math.random() * 30)
  s.secretary = { hired: true, name, skill }
  s.attrs.GX = clamp(s.attrs.GX - 2)
  pushLog(s, `【联络】物色${name}协助日常事务。`)
  return {
    ok: true,
    text: `${name}到岗。可分担来文初核、提醒舆情与写信冷却；能力会随磨合缓慢上升。`,
  }
}

/** 秘书每月协助 */
export function secretaryTick(s: GameState) {
  const sec = s.secretary
  if (!sec?.hired) return
  if (sec.skill < 80 && Math.random() < 0.25) sec.skill = clamp(sec.skill + 2, 0, 100)
  const h = s.yuqingHeat ?? 0
  if (h >= 55 && sec.skill >= 50) {
    s.yuqingHeat = clamp(h - 3, 0, 100)
    pushLog(s, `【联络】${sec.name}提前盯住舆情苗头，热度略降。`)
  }
  if ((s.bondLetterCd ?? 0) > 0 && sec.skill >= 60) {
    s.bondLetterCd = Math.max(0, (s.bondLetterCd ?? 0) - 1)
  }
}

/** 批示质量：秘书初核加成 */
export function secretaryDutyBonus(s: GameState): number {
  if (!s.secretary?.hired) return 0
  return Math.round(s.secretary.skill / 25)
}

/** ── 周计划 ───────────────────────────── */

export const WEEK_PLAN_OPTS = [
  { id: 'zj', label: '抓项目政绩' },
  { id: 'mx', label: '下村听民声' },
  { id: 'lian', label: '自查与风控' },
  { id: 'gx', label: '跑关系协调' },
  { id: 'nl', label: '学习与材料' },
  { id: 'duty', label: '消化来文批示' },
  { id: 'rest', label: '留白缓冲' },
] as const

export function setWeekPlan(s: GameState, slots: (string | null)[]): { ok: boolean; text: string } {
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.weekPlanned) return { ok: false, text: '本月已排过周计划。' }
  const filled = slots.filter(Boolean).length
  if (filled < 2) return { ok: false, text: '至少安排两周的重点。' }
  s.weekPlan = slots.slice(0, 4)
  s.weekPlanned = true
  const named = s.weekPlan
    .map((id) => WEEK_PLAN_OPTS.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(' / ')
  pushLog(s, `【周计划】本月侧重：${named}`)
  return { ok: true, text: `已排出四周侧重：${named}。执行中会有小幅加成；漏排或空转会吃草率分。` }
}

/** 月末结算周计划 */
export function settleWeekPlan(s: GameState) {
  if (!s.weekPlanned) {
    s.mashScore = clamp((s.mashScore ?? 0) + 4, 0, 100)
    pushLog(s, '【周计划】本月未排计划，工作显得随意（草率分上升）。')
    return
  }
  const plan = s.weekPlan ?? []
  const done = plan.filter(Boolean).length
  for (const id of plan) {
    if (!id) continue
    if (id === 'zj') s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
    else if (id === 'mx') s.attrs.MX = clamp(s.attrs.MX + 1)
    else if (id === 'lian') s.risk = clamp(s.risk - 1, 0, 100)
    else if (id === 'gx') s.attrs.GX = clamp(s.attrs.GX + 1)
    else if (id === 'nl') s.attrs.NL = clamp(s.attrs.NL + 1)
    else if (id === 'duty') s.dutyMonthScore = clamp((s.dutyMonthScore ?? 0) + 2, 0, 40)
    else if (id === 'rest') s.family && (s.family.spouseMood = clamp(s.family.spouseMood + 2))
  }
  if (done >= 3) s.mashScore = clamp((s.mashScore ?? 0) - 3, 0, 100)
  pushLog(s, `【周计划】本月按侧重推进（${done}/4），相关工作有小幅加成。`)
}

/** ── 调研报告 ─────────────────────────── */

export const RESEARCH_TOPICS = [
  { id: 'xiangcun', name: '乡村产业与集体经济', base: 50 },
  { id: 'jiceng', name: '基层减负与形式主义', base: 55 },
  { id: 'anquan', name: '安全生产责任链', base: 48 },
  { id: 'minsheng', name: '民生诉求响应机制', base: 52 },
  { id: 'shizi', name: '干部队伍建设短板', base: 58 },
] as const

export function canStartResearch(s: GameState): { ok: boolean; reason: string } {
  if (s.research) return { ok: false, reason: '已有在研课题' }
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  return { ok: true, reason: '' }
}

export function startResearch(s: GameState, topicId: string): { ok: boolean; text: string } {
  const g = canStartResearch(s)
  if (!g.ok) return { ok: false, text: g.reason }
  const t = RESEARCH_TOPICS.find((x) => x.id === topicId)
  if (!t) return { ok: false, text: '无此课题。' }
  s.actionPoints -= 1
  s.research = { topic: t.name, progress: 10, quality: t.base, months: 1 }
  pushLog(s, `【调研】立项：${t.name}`)
  return { ok: true, text: `课题「${t.name}」立项。接下来每月可投入深化，约 3 个月结题。` }
}

export type ResearchDepth = 'guohua' | 'dun' | 'shuju'

export function advanceResearch(
  s: GameState,
  depth: ResearchDepth,
): { ok: boolean; text: string; finished?: boolean } {
  if (!s.research) return { ok: false, text: '没有在研课题。' }
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  s.actionPoints -= 1
  const r = s.research
  r.months += 1
  if (depth === 'guohua') {
    r.progress = clamp(r.progress + 18, 0, 100)
    r.quality = clamp(r.quality - 4, 0, 100)
  } else if (depth === 'dun') {
    r.progress = clamp(r.progress + 28, 0, 100)
    r.quality = clamp(r.quality + 6, 0, 100)
    s.attrs.MX = clamp(s.attrs.MX + 1)
  } else {
    r.progress = clamp(r.progress + 35, 0, 100)
    r.quality = clamp(r.quality + (s.attrs.NL >= 55 ? 8 : 2), 0, 100)
    s.attrs.NL = clamp(s.attrs.NL + 1)
  }
  if (r.progress < 100) {
    return { ok: true, text: `调研推进至 ${r.progress}%（质量 ${Math.round(r.quality)}）。` }
  }
  // 结题
  const q = r.quality
  const topic = r.topic
  s.researchDone = [...(s.researchDone ?? []), { topic, quality: q, year: s.year }]
  s.research = null
  s.attrs.NL = clamp(s.attrs.NL + (q >= 70 ? 4 : 2))
  s.attrs.ZJ = clamp(s.attrs.ZJ + (q >= 70 ? 4 : 2))
  s.dutyYearScore = clamp((s.dutyYearScore ?? 0) + Math.round(q / 12), 0, 100)
  pushLog(s, `【调研】结题《${topic}》质量 ${Math.round(q)}，进入报告库。`)
  return {
    ok: true,
    finished: true,
    text: `《${topic}》结题，质量 ${Math.round(q)}。${q >= 75 ? '获上级批示肯定。' : q >= 55 ? '材料扎实，可供决策参考。' : '材料偏薄，仅作内部参考。'}`,
  }
}

/** ── 干部名册 ─────────────────────────── */

export function rosterEntries(s: GameState) {
  const list = s.npcs
    .filter((n) => n.favor >= 15)
    .map((n) => ({
      id: n.id,
      favor: n.favor,
      tag: s.rosterTags?.[n.id] ?? '',
    }))
    .sort((a, b) => b.favor - a.favor)
  return list
}

export function setRosterTag(s: GameState, npcId: string, tag: string): { ok: boolean; text: string } {
  if (!s.rosterTags) s.rosterTags = {}
  s.rosterTags[npcId] = tag.slice(0, 12)
  return { ok: true, text: '名册已标注。' }
}

/** 推荐用人：耗冷却，换关系与政绩 */
export function recommendTalent(s: GameState, npcId: string): { ok: boolean; text: string } {
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if ((s.rosterUsed ?? 0) >= 2) return { ok: false, text: '本年推荐名额已用完（2 次）。' }
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref || ref.favor < 40) return { ok: false, text: '交情不够，不便贸然推荐。' }
  s.actionPoints -= 1
  s.rosterUsed = (s.rosterUsed ?? 0) + 1
  ref.favor = clamp(ref.favor + 5, -50, 100)
  s.attrs.GX = clamp(s.attrs.GX + 3)
  s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
  const name = ref.id
  pushLog(s, `【名册】向组织推荐可用之才（${name}）。`)
  return { ok: true, text: '你以工作实绩为据作了推荐。组织记下一笔，对方也领情。' }
}

export function resetRosterYear(s: GameState) {
  s.rosterUsed = 0
}
