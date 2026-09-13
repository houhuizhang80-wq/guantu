import type { GameState } from '../types'
import { getPost } from '../data/posts'
import { ENDINGS } from '../data/endings'
import { localizePostTitle } from '../data/provinces'

/** 本局评分 0–100，用于终局展示与跨局记录 */
export function computeScore(s: GameState): number {
  const post = getPost(s.postId)
  const a = s.attrs
  let sc =
    post.rank * 3.2 +
    a.ZJ * 0.18 +
    a.Lian * 0.16 +
    a.MX * 0.12 +
    a.NL * 0.1 +
    a.GX * 0.08
  sc -= s.risk * 0.12
  sc -= (s.mashScore ?? 0) * 0.08
  sc += (s.achievements?.length ?? 0) * 0.4
  if (s.endingId === 'zhengguo' || s.endingId === 'zhengguo_jijian') sc += 12
  if (s.endingId === 'luoma' || s.endingId === 'kaichu') sc -= 25
  return Math.round(Math.max(0, Math.min(100, sc)))
}

export function scoreLabel(score: number): string {
  if (score >= 90) return '卓越'
  if (score >= 75) return '优秀'
  if (score >= 55) return '称职'
  if (score >= 35) return '平庸'
  return '落魄'
}

export function runSummary(s: GameState): string {
  const ending = ENDINGS.find((e) => e.id === s.endingId)
  const post = getPost(s.postId)
  return [
    `结局：${ending?.title ?? '—'}`,
    `岗位：${localizePostTitle(post.title, s.provinceId)}`,
    `评分：${computeScore(s)}（${scoreLabel(computeScore(s))}）`,
    `月数：${s.turn} · 成就：${s.achievements?.length ?? 0}`,
  ].join('\n')
}
