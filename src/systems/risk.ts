import type { GameState } from '../types'
import { clamp } from '../state/game'
import { getPost } from '../data/posts'
import { maybeOpenJijian, tickPunish } from './jijian'

/** 风险随回合微涨；高廉洁可抵消一部分 */
export function riskTick(s: GameState) {
  let delta = 0.4
  if (s.attrs.Lian >= 70) delta -= 0.2
  if (s.attrs.Lian <= 35) delta += 0.5
  if (s.faction !== 'none') delta += 0.15
  s.risk = clamp(s.risk + delta, 0, 100)
  tickPunish(s)
}

export function riskBarColor(risk: number) {
  if (risk >= 70) return 'var(--danger)'
  if (risk >= 40) return 'var(--accent)'
  return 'var(--ink-soft)'
}

/** 旧接口：现由纪检监察系统接管 */
export function maybeInvestigation(s: GameState) {
  return maybeOpenJijian(s)
}

export function describePosture(s: GameState) {
  const post = getPost(s.postId)
  return `${post.stage} · ${post.title}`
}
