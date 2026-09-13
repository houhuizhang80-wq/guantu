/** 一个月循环里玩家要碰多少次「同类决策」——枯燥感粗测 */
import { createNewGame } from '../src/state/game'
import { scheduleNextEvent, markEventUsed } from '../src/systems/events'
import { getEvent } from '../src/data/events'
import { availablePaths, startPromo, advancePromo, confirmAppointment } from '../src/systems/promotion'
import { checkEnding } from '../src/systems/ending'
import { monthlyDrift } from '../src/systems/promotion'
import { riskTick } from '../src/systems/risk'
import { familyTick } from '../src/systems/family'
import { networkTick } from '../src/systems/network'
import { factionHeatTick } from '../src/systems/focus'
import { ageTick } from '../src/systems/age'
import { noteChoice, noteEventHandled } from '../src/systems/engagement'
import { getPost } from '../src/data/posts'
import { runAnnualAppraisal } from '../src/systems/appraisal'
import { tickProjects } from '../src/data/projects'

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

const kinds = new Map<string, number>()
const evIds = new Map<string, number>()
const promoAttempts = { started: 0, failed: 0, appointed: 0 }
let months = 0
let noEventMonths = 0
let decisionClicks = 0

function applyFx(s: any, fx: any) {
  for (const k of ['ZJ', 'GX', 'Lian', 'MX', 'NL'] as const) {
    if (typeof fx?.[k] === 'number') s.attrs[k] = Math.max(0, Math.min(100, s.attrs[k] + fx[k]))
  }
  if (typeof fx?.Risk === 'number') s.risk = Math.max(0, Math.min(100, s.risk + fx.Risk))
}

const s: any = createNewGame('shengkao', 'tianfu')
s.actionPoints = s.maxActionPoints
let guard = 0

while (!s.endingId && s.turn < 400 && guard++ < 5000) {
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
      kinds.set(ev.kind, (kinds.get(ev.kind) || 0) + 1)
      evIds.set(ev.id, (evIds.get(ev.id) || 0) + 1)
      const idx = 0
      // 简单轮换选项，避免草率分锁死晋升
      const ci = (s.turn + ev.id.length) % Math.max(1, ev.choices.length)
      noteChoice(s, ci)
      applyFx(s, ev.choices[ci]?.fx || {})
      markEventUsed(s, ev)
      noteEventHandled(s)
      decisionClicks++
      s.currentEventId = null
    }
  } else {
    noEventMonths++
    // 模拟：点 1 次行动 + 有时点晋升
    decisionClicks += 1
    while (s.actionPoints > 0) {
      s.actionPoints -= 1
      s.attrs.ZJ = Math.min(100, s.attrs.ZJ + 1)
    }
  }

  if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
    decisionClicks++ // 选策略
    const r = advancePromo(s, s.promo.stage === 'kaocha' ? 'rushi' : s.promo.stage === 'gongshi' ? 'jingdai' : s.promo.stage === 'piaojue' ? 'huiqian' : 'taici')
    if (r.failed) promoAttempts.failed++
    if (s.promo?.stage === 'renmian') {
      confirmAppointment(s)
      promoAttempts.appointed++
    }
  } else if (!s.promo) {
    const paths = availablePaths(s).filter((p) => p.ok)
    if (paths.length > 0) {
      paths.sort((a, b) => getPost(b.path.to).rank - getPost(a.path.to).rank)
      if (startPromo(s, paths[0].path)) {
        promoAttempts.started++
        decisionClicks++
      }
    }
  }

  s.turn++
  months++
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
  tickProjects(s, (fx) => applyFx(s, fx))
  if (s.month === 1 && s.turn > 1) runAnnualAppraisal(s)
  if (checkEnding(s)) break
  s.actionPoints = s.maxActionPoints
}

console.log('=== 中局体验粗测（400 月 / 约 33 年）===')
console.log('结束岗位', getPost(s.postId).id, getPost(s.postId).level, 'age', s.age, 'ending', s.endingId)
console.log('月数', months, '无事件月', noEventMonths, '事件点击', decisionClicks - noEventMonths)
console.log('估计总决策点击', decisionClicks, '月均', (decisionClicks / months).toFixed(2))
console.log('事件类型分布', Object.fromEntries(kinds))
console.log('唯一事件 id 数', evIds.size, '· 重复最多:')
for (const [id, c] of [...evIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`  ${c}× ${id}`)
}
console.log('选拔', promoAttempts)
// 同一事件重复 3 次以上的比例
const repeated = [...evIds.values()].filter((c) => c >= 3).length
const totalTriggers = [...evIds.values()].reduce((a, b) => a + b, 0)
const repeatedHits = [...evIds.values()].filter((c) => c >= 3).reduce((a, b) => a + b, 0)
console.log(`出现≥3次的事件种类 ${repeated}/${evIds.size}，占触发次数 ${((repeatedHits / totalTriggers) * 100).toFixed(1)}%`)
