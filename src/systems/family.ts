import type { GameState } from '../types'
import { clamp, pushLog, pushTimeline } from '../state/game'

/** 每月家属自然变化 */
export function familyTick(s: GameState) {
  const f = s.family
  if (!f) return
  let mood = -0.3
  if (s.risk > 60) mood -= 0.5
  if (s.attrs.MX >= 60) mood += 0.2
  f.spouseMood = clamp(f.spouseMood + mood)
  if (f.childAge > 0 && f.childAge < 18) f.childAge += 1 / 12
  f.parentHealth = clamp(f.parentHealth - 0.15)
  // 家属状态拖累履职
  if (f.spouseMood < 30) {
    s.attrs.NL = clamp(s.attrs.NL - 1)
    if (Math.random() < 0.18) pushLog(s, '家里气氛冷，你白天有点走神。')
  }
  if (f.parentHealth < 35) {
    s.attrs.NL = clamp(s.attrs.NL - 1)
    s.attrs.ZJ = clamp(s.attrs.ZJ - 1)
    if (Math.random() < 0.22) pushLog(s, '父母身体不好，你分心不少。')
  }
  if (f.spouseMood < 25) {
    pushLog(s, '家里气氛冷。爱人说你「只把家当旅馆」。')
  }
  if (f.parentHealth < 40 && Math.random() < 0.15) {
    pushLog(s, '家里来电：父母身体不太好。')
    pushTimeline(s, 'other', '父母健康告警')
  }
}

export function familyApply(s: GameState, dx: { mood?: number; parent?: number }) {
  const f = s.family
  if (!f) return
  if (dx.mood) f.spouseMood = clamp(f.spouseMood + dx.mood)
  if (dx.parent) f.parentHealth = clamp(f.parentHealth + dx.parent)
}

export function familyPressure(s: GameState): number {
  const f = s.family
  if (!f) return 0
  let p = 0
  if (f.spouse && f.spouseMood < 35) p += 1
  if (f.parentHealth < 40) p += 1
  return p
}
