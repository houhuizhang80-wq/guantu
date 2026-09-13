import type { GameState } from '../types'
import { resolveEnding } from '../data/endings'
import { pushLog } from '../state/game'
import { markOriginDone } from '../state/origins_done'
import { schedulePushProgress } from '../state/progress'
import { saveLegacyFromGame } from './extra'

export function checkEnding(s: GameState): boolean {
  if (s.endingId) return true
  const e = resolveEnding(s)
  if (!e) return false
  s.endingId = e.id
  s.phase = 'ending'
  pushLog(s, `终局：${e.title}`)
  markOriginDone(s.originId)
  // 出身通关是跨局累计数据，结局产生时同步一次到云端
  schedulePushProgress()
  try {
    saveLegacyFromGame(s)
  } catch {
    /* ignore */
  }
  return true
}
