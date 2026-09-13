/**
 * 秘书腐败分支。
 *
 * 联络员熟练度高以后，身边人出事是大概率事件：有人举报他「帮老板递材料、
 * 收感谢费」。怎么处置，是这个系统唯一要玩家回答的问题 —— 而每一种答案
 * 都会在后面某一天找回来。
 *
 * 三条处置线：
 *   jiege    切割：如实报告、配合调查。廉洁与风险改善，身边少了把好手。
 *   baoquan  保全：打招呼摆平。秘书留任，但把柄从此攥在他手里
 *            （secShielded 标记：之后纪检一旦立案，严重程度 +10）。
 *   baogao   报告并调离：中间路线，态度被肯定，代价是重新带人。
 *
 * 一局最多触发一次（flags.secCaseDone）。
 */
import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'

export function maybeSecretaryCase(s: GameState): boolean {
  const sec = s.secretary
  if (!sec?.hired) return false
  if (s.pendingSecCase) return false
  if (s.flags.secCaseDone) return false
  if (s.jijian) return false
  if (s.currentEventId) return false
  const skill = sec.skill ?? 0
  let p = 0
  if (skill >= 75) p = 0.09
  else if (skill >= 60) p = 0.04
  else return false
  if (s.risk >= 45) p *= 1.5
  if (Math.random() >= p) return false

  s.pendingSecCase = { name: sec.name }
  pushLog(s, `【联络员】有人举报${sec.name}在项目审批中「帮老板递材料、收了感谢费」。`)
  return true
}

export type SecCaseChoice = 'jiege' | 'baoquan' | 'baogao'

export function resolveSecCase(
  s: GameState,
  choice: SecCaseChoice,
): { ok: boolean; text: string } {
  const c = s.pendingSecCase
  if (!c) return { ok: false, text: '当前没有待处置的秘书问题。' }
  const name = c.name
  s.pendingSecCase = null
  s.flags.secCaseDone = true

  if (choice === 'jiege') {
    s.secretary = null
    s.attrs.Lian = clamp(s.attrs.Lian + 4)
    s.risk = clamp(s.risk - 6, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 3)
    pushLog(s, `【联络员】${name}被带走调查，你如实报告、配合调查。`)
    return {
      ok: true,
      text: `你向组织如实报告，全程配合调查。${name}被带走那天，你在办公室坐到很晚。身边人出事，账终究要自己认——廉洁与风险都改善了，只是身边少了把好手。`,
    }
  }

  if (choice === 'baoquan') {
    s.flags.secShielded = true
    if (s.secretary) s.secretary.skill = clamp((s.secretary.skill ?? 0) - 8, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian - 7)
    s.risk = clamp(s.risk + 10, 0, 100)
    pushLog(s, `【联络员】${name}的事被「了解」成了误会。`)
    return {
      ok: true,
      text: `你打了几个电话，把事情「了解」成了误会。${name}千恩万谢。从这天起，他把你的把柄揣在了兜里——哪天纪检立案，这些事会被一起翻出来。`,
    }
  }

  // baogao
  s.secretary = null
  s.attrs.Lian = clamp(s.attrs.Lian + 2)
  s.risk = clamp(s.risk + 3, 0, 100)
  s.attrs.NL = clamp(s.attrs.NL + 2)
  pushLog(s, `【联络员】${name}被调离机要岗位。`)
  return {
    ok: true,
    text: `你主动向组织说明情况，并建议将${name}调离机要岗位。组织肯定了你的态度，程序也走完了，只是身边又要重新带人。`,
  }
}

/** 把柄反噬：曾为秘书摆平问题的，纪检立案时严重程度加成 */
export function secretaryCaseAggravate(s: GameState): number {
  return s.flags.secShielded ? 10 : 0
}
