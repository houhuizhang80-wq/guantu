import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'
import { getPost } from '../data/posts'
import { NPCS, npcsVisibleAt } from '../data/npcs'

/** 每月关系网自然漂移：常互动的人缓慢升温，冷淡缓慢降温 */
export function networkTick(s: GameState) {
  if (!s.npcs) return
  const rank = getPost(s.postId).rank
  const visible = new Set(npcsVisibleAt(rank).map((n) => n.id))
  for (const ref of s.npcs) {
    if (!visible.has(ref.id)) continue
    // 轻微均值回归，避免卡死在极端值
    if (ref.favor > 0 && Math.random() < 0.35) ref.favor = clamp(ref.favor - 1, -50, 100)
    if (ref.favor < 0 && Math.random() < 0.25) ref.favor = clamp(ref.favor + 1, -50, 100)
  }
}

/** 从当前可见关系网里挑一位（优先好感极端，避免永远盯 NPC[0]） */
export function pickNetworkNpc(s: GameState): { id: string; favor: number } | null {
  if (!s.npcs?.length) return null
  const rank = getPost(s.postId).rank
  const visibleIds = new Set(npcsVisibleAt(rank).map((n) => n.id))
  const pool = s.npcs.filter((r) => visibleIds.has(r.id))
  if (pool.length === 0) return null
  const extreme = pool.filter((r) => Math.abs(r.favor) >= 15)
  const source = extreme.length > 0 ? extreme : pool
  source.sort((a, b) => Math.abs(b.favor) - Math.abs(a.favor))
  const top = source.slice(0, Math.min(5, source.length))
  const pick = top[Math.floor(Math.random() * top.length)]
  return { id: pick.id, favor: pick.favor }
}

/** 高层新人入场提示 */
export function maybeIntroduceNewNpc(s: GameState): string | null {
  const rank = getPost(s.postId).rank
  if (rank < 12) return null
  const key = `npcIntro_${rank}`
  if (s.flags[key]) return null
  const incoming = npcsVisibleAt(rank).filter((n) => (n.fromRank ?? 0) >= 12 && (n.fromRank ?? 0) <= rank)
  if (incoming.length === 0) return null
  s.flags[key] = true
  for (const n of incoming) ensureNpcExists(s, n.id)
  const names = incoming
    .slice(0, 4)
    .map((n) => n.name)
    .join('、')
  return `你进入了新的交往圈：${names}。关系网已更新。`
}

/** 首次触发提示 */
export function firstTimeHint(
  s: GameState,
  key: string,
  title: string,
  text: string,
): boolean {
  const flag = `hint_${key}`
  if (s.flags[flag]) return false
  s.flags[flag] = true
  s.lastFeedback = { title, text }
  pushLog(s, `【提示】${title}：${text}`)
  return true
}

export function ensureNpcExists(s: GameState, id: string) {
  if (!s.npcs.find((n) => n.id === id)) {
    const def = NPCS.find((n) => n.id === id)
    if (def) s.npcs.push({ id, favor: 0 })
  }
}

const BOND_FAVOR_IN = 55
const BOND_FAVOR_OUT = 30
const BOND_MAX = 3
/** 关键靠山：羁绊好感达到此值可请托铺路 */
export const PATRON_FAVOR = 80

export function isBond(s: GameState, id: string): boolean {
  return (s.bondNpcIds ?? []).includes(id)
}

export function bondRefs(s: GameState) {
  const ids = new Set(s.bondNpcIds ?? [])
  return s.npcs.filter((n) => ids.has(n.id))
}

export function isPatron(s: GameState, id: string): boolean {
  if (!isBond(s, id)) return false
  const ref = s.npcs.find((n) => n.id === id)
  return !!ref && ref.favor >= PATRON_FAVOR
}

export function hasActivePatron(s: GameState): boolean {
  return !!s.flags.patronAssist
}

/**
 * 跨阶段羁绊：淡出交往圈但好感仍高的旧人会保持联系。
 * 晋升后或每月同步；好感跌破阈值则断联。
 */
export function syncBonds(s: GameState): string | null {
  if (!s.npcs) return null
  const rank = getPost(s.postId).rank
  const visibleIds = new Set(npcsVisibleAt(rank).map((n) => n.id))
  const bonds = new Set(s.bondNpcIds ?? [])
  let gained: string | null = null

  for (const ref of s.npcs) {
    if (visibleIds.has(ref.id)) {
      bonds.delete(ref.id)
      continue
    }
    if (ref.favor >= BOND_FAVOR_IN && !bonds.has(ref.id) && bonds.size < BOND_MAX) {
      bonds.add(ref.id)
      const def = NPCS.find((n) => n.id === ref.id)
      gained = def?.name ?? ref.id
    } else if (ref.favor < BOND_FAVOR_OUT && bonds.has(ref.id)) {
      bonds.delete(ref.id)
    }
  }
  s.bondNpcIds = Array.from(bonds)
  if (gained) {
    return `旧交${gained}虽已不在本阶段交往圈，仍与你保持联系（跨阶段羁绊）。`
  }
  return null
}

/** 写信维系羁绊好感（冷却制，不耗行动点） */
export function writeBondLetter(
  s: GameState,
  npcId: string,
): { ok: boolean; text: string } {
  if (!isBond(s, npcId)) return { ok: false, text: '对方不在羁绊名单中。' }
  const cd = s.bondLetterCd ?? 0
  if (cd > 0) return { ok: false, text: `刚写过信，再等 ${cd} 个月。` }
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref) return { ok: false, text: '没有这个人。' }
  const def = NPCS.find((n) => n.id === npcId)
  const name = def?.name ?? npcId
  s.bondLetterCd = 3
  const roll = Math.random()
  if (roll < 0.2) {
    ref.favor = clamp(ref.favor + 2, -50, 100)
    return {
      ok: true,
      text: `你给${name}写了封短信。对方回得客气，交情稳住了一些。`,
    }
  }
  if (roll < 0.85) {
    ref.favor = clamp(ref.favor + 5, -50, 100)
    s.attrs.GX = clamp(s.attrs.GX + 1)
    return {
      ok: true,
      text: `你给${name}写信叙旧，也说了说近况。对方回信很认真。好感上升。`,
    }
  }
  ref.favor = clamp(ref.favor + 8, -50, 100)
  s.attrs.GX = clamp(s.attrs.GX + 2)
  return {
    ok: true,
    text: `${name}读完信专门打来电话，聊了很久。交情明显更深了。`,
  }
}

/**
 * 请关键靠山铺路：一次程序周期内的跨级助力。
 * 门槛高、耗好感、带风险——不是无限保送。
 */
export function requestPatron(
  s: GameState,
  npcId: string,
): { ok: boolean; text: string } {
  if (!isBond(s, npcId)) return { ok: false, text: '对方不在羁绊名单中。' }
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref) return { ok: false, text: '没有这个人。' }
  if (ref.favor < PATRON_FAVOR)
    return { ok: false, text: '交情还不够深，对方未必肯在这种事上使劲。' }
  if (s.flags.patronAssist)
    return { ok: false, text: '靠山助力已在生效，先把这次程序走完。' }
  if (s.probationLeft > 0)
    return { ok: false, text: '试用期内不宜请托调整。' }
  const def = NPCS.find((n) => n.id === npcId)
  const name = def?.name ?? npcId
  ref.favor = clamp(ref.favor - 25, -50, 100)
  s.flags.patronAssist = 1
  s.flags.patronName = name
  s.flags.patronMonths = 12
  s.risk = clamp(s.risk + 2, 0, 100)
  s.attrs.GX = clamp(s.attrs.GX + 3)
  pushLog(
    s,
    `【靠山】${name}答应在合适时机关照。下次选拔：任职年限要求放宽、关系门槛软化、票决显著助力（12 个月内有效）。`,
  )
  return {
    ok: true,
    text: `${name}沉吟片刻点了头：「看机会。」人情大耗；接下来一年内的选拔，门槛与票决都会宽松一些，但风声也更紧（风险略升）。`,
  }
}

/** 羁绊助力：票决时若有高好感羁绊，小幅加成；靠山额外加成；正部以上整体压低 */
export function bondVoteBonus(s: GameState): number {
  const rank = getPost(s.postId).rank
  const bonds = bondRefs(s)
  let bonus = 0
  for (const b of bonds) {
    if (b.favor >= PATRON_FAVOR) bonus += rank >= 18 ? 1 : rank >= 15 ? 2 : 5
    else if (b.favor >= 70) bonus += rank >= 18 ? 0 : rank >= 15 ? 1 : 3
    else if (b.favor >= 55) bonus += rank >= 15 ? 0 : 1
  }
  if (s.flags.patronAssist) bonus += rank >= 18 ? 3 : rank >= 15 ? 5 : 10
  return Math.min(rank >= 18 ? 4 : rank >= 15 ? 6 : 18, bonus)
}

/** 靠山助力：放宽任职月数与关系门槛（pathAvailable / availablePaths 共用） */
export function patronGateRelax(s: GameState): {
  monthsFactor: number
  gxFactor: number
} {
  if (!s.flags.patronAssist) return { monthsFactor: 1, gxFactor: 1 }
  return { monthsFactor: 0.55, gxFactor: 0.82 }
}

/** 每月羁绊音讯：来信、托人带话、偶发人情麻烦 */
export function maybeBondEvent(s: GameState): string | null {
  const bonds = bondRefs(s)
  if (bonds.length === 0) return null
  if (Math.random() > 0.1) return null
  const pick = bonds[Math.floor(Math.random() * bonds.length)]
  const def = NPCS.find((n) => n.id === pick.id)
  const name = def?.name ?? pick.id
  const roll = Math.random()
  if (pick.favor >= 65 && roll < 0.45) {
    s.attrs.GX = clamp(s.attrs.GX + 2)
    s.risk = clamp(s.risk - 2, 0, 100)
    pick.favor = clamp(pick.favor + 1, -50, 100)
    return `【羁绊】${name}来信指点近况，话不多但管用。关系略升，风险略降。`
  }
  if (pick.favor >= 55 && roll < 0.75) {
    pick.favor = clamp(pick.favor + 2, -50, 100)
    s.attrs.GX = clamp(s.attrs.GX + 1)
    return `【羁绊】与${name}通了电话。旧交情还在，心里踏实一些。`
  }
  if (roll < 0.9) {
    pick.favor = clamp(pick.favor - 2, -50, 100)
    s.attrs.GX = clamp(s.attrs.GX - 1)
    return `【羁绊】${name}那边人情往来变多，你婉拒了一次请托。交情略淡。`
  }
  s.risk = clamp(s.risk + 1, 0, 100)
  return `【羁绊】有旧人打着你的旗号打听事。你赶紧澄清，风险仍略升。`
}

/** 写信冷却递减；靠山助力到期 */
export function bondLetterTick(s: GameState) {
  if ((s.bondLetterCd ?? 0) > 0) {
    s.bondLetterCd = (s.bondLetterCd ?? 0) - 1
    if (s.bondLetterCd === 0) pushLog(s, '可以再次给羁绊旧交写信了。')
  }
  if (s.flags.patronAssist) {
    const left = ((s.flags.patronMonths as number) ?? 12) - 1
    s.flags.patronMonths = left
    if (left <= 0) {
      s.flags.patronAssist = 0
      s.flags.patronMonths = 0
      const who = String(s.flags.patronName || '靠山')
      pushLog(s, `【靠山】${who}的关照窗口已过，后续仍须靠自身程序。`)
    }
  }
}
