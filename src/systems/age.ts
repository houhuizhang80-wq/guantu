/**
 * 任用年龄：贴近现实干部任用与退休节奏（游戏化压缩）
 * 开局 23–34 岁（看出身）；每年 +1 岁。
 */
import type { GameState } from '../types'
import { getPost } from '../data/posts'

export function startAge(originId: string): number {
  switch (originId) {
    case 'xuandiao_pu':
    case 'xuandiao_ding':
    case 'shengkao':
    case 'cunguan':
    case 'sanfuyi':
      return 23
    case 'guokao':
    case 'biguan':
    case 'jishu':
    case 'benxiang':
    case 'waisheng':
      return 25
    case 'rencai':
    case 'xibu':
      return 27
    case 'shiye_tiao':
      return 30
    case 'jizhuan':
      return 32
    case 'guoqi_tiao':
      return 34
    case 'ganbu_jun':
      return 24
    case 'legacy':
      return 26
    default:
      return 24
  }
}

export function maxAgeForRank(rank: number): number {
  if (rank <= 3) return 45
  if (rank <= 5) return 48
  if (rank <= 7) return 52
  if (rank <= 9) return 55
  if (rank <= 11) return 58
  if (rank <= 12) return 60
  if (rank <= 14) return 63
  if (rank <= 15) return 65
  if (rank <= 17) return 67
  return 68
}

export function minAgeForRank(rank: number): number {
  if (rank <= 1) return 22
  if (rank <= 3) return 25
  if (rank <= 5) return 30
  if (rank <= 7) return 33
  if (rank <= 9) return 36
  if (rank <= 11) return 40
  if (rank <= 12) return 43
  if (rank <= 14) return 46
  if (rank <= 15) return 50
  if (rank <= 17) return 53
  return 55
}

export function retireAge(rank: number): number {
  if (rank <= 3) return 60
  if (rank <= 7) return 60
  if (rank <= 11) return 63
  if (rank <= 14) return 65
  if (rank <= 17) return 68
  return 70
}

export function ageTick(s: GameState) {
  if (s.month === 1) s.age += 1
}

export function ageGate(
  age: number,
  targetRank: number,
): { ok: boolean; reason: string } {
  const minA = minAgeForRank(targetRank)
  const maxA = maxAgeForRank(targetRank)
  if (age < minA)
    return {
      ok: false,
      reason: `年龄未到（需约 ${minA} 周岁，现 ${age}）——组织上还要再历练`,
    }
  if (age > maxA)
    return {
      ok: false,
      reason: `已超过该职级最高任职年龄（约 ${maxA} 周岁，现 ${age}）`,
    }
  return { ok: true, reason: '' }
}

export function isRetired(s: GameState): boolean {
  return s.age >= retireAge(getPost(s.postId).rank)
}

export function setPostRank(s: GameState, rank: number) {
  s.flags.postRank = rank
}
