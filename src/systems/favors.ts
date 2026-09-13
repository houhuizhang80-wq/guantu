import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'
import { npcsVisibleAt } from '../data/npcs'
import { getPost } from '../data/posts'

/** 托人办事：消耗好感换一次风险降低或程序助力 */
export function askFavor(
  s: GameState,
  npcId: string,
  kind: 'risk' | 'promo' | 'info',
): { ok: boolean; text: string } {
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref) return { ok: false, text: '没有这个人。' }
  const def = npcsVisibleAt(getPost(s.postId).rank).find((n) => n.id === npcId)
  if (!def) return { ok: false, text: '这个阶段不太方便开口。' }

  if (kind === 'risk') {
    if (ref.favor < 25) return { ok: false, text: `${def.name}交情不够，不好开口。` }
    if (s.favorCooldown > 0)
      return { ok: false, text: `托人办事冷却中（还剩 ${s.favorCooldown} 个月）。` }
    ref.favor = clamp(ref.favor - 15, -50, 100)
    s.risk = clamp(s.risk - 12, 0, 100)
    s.favorCooldown = 3
    pushLog(s, `【托人】请${def.name}帮忙「过问」了一下，风险下降。`)
    return { ok: true, text: `${def.name}帮你把事情「缓」了一缓。风险下降，人情消耗，冷却 3 个月。` }
  }
  if (kind === 'promo') {
    if (ref.favor < 35) return { ok: false, text: `${def.name}未必肯在这种事上使劲。` }
    if (s.favorCooldown > 0)
      return { ok: false, text: `托人办事冷却中（还剩 ${s.favorCooldown} 个月）。` }
    ref.favor = clamp(ref.favor - 20, -50, 100)
    s.attrs.GX = clamp(s.attrs.GX + 4)
    s.flags.favorPromoBoost = 1
    s.favorCooldown = 4
    pushLog(s, `【托人】${def.name}答应在程序上「说句公道话」。`)
    return { ok: true, text: `${def.name}点了头。下次票决会稍微好过一些（人情大耗，冷却 4 个月）。` }
  }
  // info
  if (ref.favor < 15) return { ok: false, text: `${def.name}最近很忙。` }
  if (s.favorCooldown > 0)
    return { ok: false, text: `托人办事冷却中（还剩 ${s.favorCooldown} 个月）。` }
  ref.favor = clamp(ref.favor - 8, -50, 100)
  s.risk = clamp(s.risk - 4, 0, 100)
  s.favorCooldown = 2
  pushLog(s, `【托人】从${def.name}处了解风声。`)
  return {
    ok: true,
    text: `${def.name}透露：最近组织在看「过程实绩」和「干净程度」。风险略降，冷却 2 个月。`,
  }
}
