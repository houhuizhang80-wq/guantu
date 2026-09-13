import type { GameState } from '../types'
import { clamp, pushLog, pushTimeline } from '../state/game'

export const FOCUS_OPTS = [
  { id: 'zj' as const, name: '主攻政绩', desc: '行动更易涨政绩，但耗精力' },
  { id: 'mx' as const, name: '主攻民生', desc: '行动更易涨民心' },
  { id: 'lian' as const, name: '主攻廉洁', desc: '行动更易降风险、涨廉洁' },
  { id: 'gx' as const, name: '主攻关系', desc: '行动更易涨关系，托人冷却-1' },
]

/** 行动后的焦点加成 */
export function focusBonus(s: GameState, kind: 'action' | 'visit') {
  const f = s.focus
  if (!f) return
  if (kind === 'action') {
    if (f === 'zj') s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
    if (f === 'mx') s.attrs.MX = clamp(s.attrs.MX + 1)
    if (f === 'lian') {
      s.attrs.Lian = clamp(s.attrs.Lian + 1)
      s.risk = clamp(s.risk - 1, 0, 100)
    }
    if (f === 'gx') s.attrs.GX = clamp(s.attrs.GX + 1)
  }
}

/** 突发打断：行动后低概率 */
export function maybeBurst(s: GameState): boolean {
  if (s.pendingBurst) return false
  const p = 0.12 + s.risk / 400
  if (Math.random() > p) return false
  const pool = [
    {
      title: '领导临时交办',
      text: '办公室来电：领导要一份补充材料，明早八点前。你看了看表，又看了看已经计划好的行程。',
      kind: 'work',
    },
    {
      title: '群众堵门',
      text: '政府门口来了七八个人，说是拆迁补偿的事。保安说已经劝了半小时。',
      kind: 'people',
    },
    {
      title: '媒体来电',
      text: '记者要就某项工作「了解一下」。你知道，了解和报道之间，隔着一整套口径。',
      kind: 'media',
    },
    {
      title: '上级突然检查',
      text: '督查组不打招呼，已经到楼下。你把桌上的材料往里推了推。',
      kind: 'check',
    },
  ]
  const item = pool[Math.floor(Math.random() * pool.length)]
  s.pendingBurst = item
  return true
}

export function resolveBurst(s: GameState, choice: 0 | 1): string {
  const b = s.pendingBurst
  s.pendingBurst = null
  if (!b) return ''
  if (b.kind === 'work') {
    if (choice === 0) {
      s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
      s.attrs.NL = clamp(s.attrs.NL + 2)
      s.family.spouseMood = clamp(s.family.spouseMood - 2)
      return '你熬夜把材料写完。政绩+，能力+，家里少说了两句话。'
    }
    s.attrs.ZJ = clamp(s.attrs.ZJ - 1)
    s.attrs.GX = clamp(s.attrs.GX - 2)
    return '你推说明天补。领导记下了。'
  }
  if (b.kind === 'people') {
    if (choice === 0) {
      s.attrs.MX = clamp(s.attrs.MX + 4)
      s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
      return '你亲自接待，把政策讲透，约定办理时限。民心+。'
    }
    s.attrs.MX = clamp(s.attrs.MX - 3)
    s.risk = clamp(s.risk + 3, 0, 100)
    return '你让下面去处理。事情没解决，视频先传开了。'
  }
  if (b.kind === 'media') {
    if (choice === 0) {
      s.attrs.Lian = clamp(s.attrs.Lian + 2)
      s.attrs.MX = clamp(s.attrs.MX + 2)
      return '你如实说明，欢迎监督。'
    }
    s.attrs.Lian = clamp(s.attrs.Lian - 3)
    s.risk = clamp(s.risk + 2, 0, 100)
    return '你让宣传口「统一口径」。记者把这句话写进了稿子。'
  }
  // check
  if (choice === 0) {
    s.attrs.Lian = clamp(s.attrs.Lian + 3)
    s.risk = clamp(s.risk - 3, 0, 100)
    return '你配合检查，材料齐全。'
  }
  s.risk = clamp(s.risk + 4, 0, 100)
  s.attrs.GX = clamp(s.attrs.GX + 2)
  return '你先摸清检查范围，心里有数了，但痕迹也被记下。'
}

/** 派系角力：每月升温，高时触发事件 */
export function factionHeatTick(s: GameState) {
  if (s.faction === 'none') {
    s.factionHeat = clamp(s.factionHeat - 0.5, 0, 100)
    return
  }
  s.factionHeat = clamp(s.factionHeat + 0.8 + s.attrs.GX / 200, 0, 100)
  if (s.factionHeat > 70 && Math.random() < 0.2) {
    pushLog(s, '派系角力升温，你被裹挟进更大的棋局。风险上升。')
    s.risk = clamp(s.risk + 3, 0, 100)
    pushTimeline(s, 'other', '派系角力升温')
  }
}

/** 项目办结分支 */
export function resolveProjectChoice(s: GameState, mode: 'public' | 'quiet'): string {
  s.pendingProjectChoice = null
  if (mode === 'public') {
    s.attrs.MX = clamp(s.attrs.MX + 4)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 3)
    s.attrs.GX = clamp(s.attrs.GX - 2)
    return '你高调总结，政绩与民心都上去了，也有人说你爱出风头。'
  }
  s.attrs.Lian = clamp(s.attrs.Lian + 2)
  s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
  return '你低调收尾，把功劳归给集体。'
}
