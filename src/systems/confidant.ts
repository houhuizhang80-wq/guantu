import type { GameState } from '../types'
import { clamp, pushLog } from '../state/game'
import { getNpc } from '../data/npcs'
import { getPost } from '../data/posts'

/* ═══════════ 心腹 ═══════════ */

export const CONFIDANT_TRUST_MIN = 40

export function canAppointConfidant(
  s: GameState,
  npcId: string,
): { ok: boolean; reason: string } {
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.confidant) return { ok: false, reason: '已有心腹，可先解除再指定' }
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref) return { ok: false, reason: '交往圈里没有此人' }
  if (ref.favor < CONFIDANT_TRUST_MIN)
    return { ok: false, reason: `好感需 ≥${CONFIDANT_TRUST_MIN}（现 ${ref.favor}）` }
  return { ok: true, reason: '' }
}

export function appointConfidant(s: GameState, npcId: string): { ok: boolean; text: string } {
  const g = canAppointConfidant(s, npcId)
  if (!g.ok) return { ok: false, text: g.reason }
  const def = getNpc(npcId)
  const ref = s.npcs.find((n) => n.id === npcId)!
  s.confidant = {
    npcId,
    name: def.name,
    trust: clamp(ref.favor, 40, 100),
    cd: 0,
  }
  pushLog(s, `【心腹】你与${def.name}推心置腹，正式结为心腹。`)
  return {
    ok: true,
    text: `已指定${def.name}为心腹。此后可派私事、请其在票决前说话；信任不足或风险过高时也可能出事。`,
  }
}

export function dismissConfidant(s: GameState): { ok: boolean; text: string } {
  if (!s.confidant) return { ok: false, text: '当前没有心腹。' }
  const name = s.confidant.name
  s.confidant = null
  s.confidantTask = null
  s.attrs.Lian = clamp(s.attrs.Lian + 1)
  s.attrs.GX = clamp(s.attrs.GX - 2)
  pushLog(s, `【心腹】你与${name}保持距离，不再交办私事。`)
  return { ok: true, text: `已与${name}解除心腹关系。关系略降，程序上更干净。` }
}

export function tickConfidant(s: GameState) {
  const c = s.confidant
  if (!c) return
  if (c.cd > 0) c.cd -= 1
  const ref = s.npcs.find((n) => n.id === c.npcId)
  if (ref && Math.random() < 0.3) c.trust = clamp((c.trust + ref.favor) / 2, 0, 100)

  // 在办私事
  const t = s.confidantTask
  if (t) {
    t.monthsLeft -= 1
    if (t.monthsLeft <= 0) {
      s.confidantTask = null
      const power = c.trust * 0.6 + s.attrs.GX * 0.2 + (100 - s.risk) * 0.2
      if (t.kind === 'intel') {
        if (power >= 55) {
          s.risk = clamp(s.risk - 6, 0, 100)
          s.attrs.GX = clamp(s.attrs.GX + 3)
          pushLog(s, '【心腹】心腹带回可靠风声，你提前规避了一次风险。')
        } else {
          s.risk = clamp(s.risk + 3, 0, 100)
          pushLog(s, '【心腹】风声含糊其辞，反而让人起疑。')
        }
      } else if (t.kind === 'risk') {
        if (power >= 60) {
          s.attrs.ZJ = clamp(s.attrs.ZJ + 3)
          s.attrs.GX = clamp(s.attrs.GX + 2)
          pushLog(s, '【心腹】心腹把棘手事项办妥，政绩与关系小幅上升。')
        } else {
          s.risk = clamp(s.risk + 5, 0, 100)
          s.attrs.Lian = clamp(s.attrs.Lian - 3)
          pushLog(s, '【心腹】事项没办利索，还留了痕迹。')
        }
      } else {
        // cover：程序风险
        if (power >= 70) {
          s.risk = clamp(s.risk - 4, 0, 100)
          pushLog(s, '【心腹】心腹帮你挡了一次不必要的麻烦。')
        } else {
          s.risk = clamp(s.risk + 8, 0, 100)
          s.attrs.Lian = clamp(s.attrs.Lian - 4)
          pushLog(s, '【心腹】「摆平」没成，反而留下把柄。')
        }
      }
    }
  }

  // 高风险 + 低信任：出事
  if (s.risk >= 55 && c.trust < 45 && Math.random() < 0.08 && !s.flags.confidantScandal) {
    s.flags.confidantScandal = true
    s.risk = clamp(s.risk + 8, 0, 100)
    s.attrs.Lian = clamp(s.attrs.Lian - 5)
    pushLog(s, `【心腹】${c.name}被卷入一起传闻，检方或纪委可能找上门。`)
  }
}

export function confidantVoteBonus(s: GameState): number {
  if (!s.confidant) return 0
  if (s.confidant.trust >= 80) return s.flags.patronAssist ? 2 : 6
  if (s.confidant.trust >= 60) return 4
  return 0
}

export function appointSecretaryAsConfidant(s: GameState): { ok: boolean; text: string } {
  const sec = s.secretary
  if (!sec?.hired) return { ok: false, text: '尚未配备联络员。' }
  if (s.confidant) return { ok: false, text: '已有心腹。' }
  if ((sec.skill ?? 0) < 50) return { ok: false, text: '联络员熟练度不足（需 50）。' }
  s.confidant = { npcId: 'secretary', name: sec.name, trust: clamp(sec.skill, 50, 90), cd: 0 }
  pushLog(s, `【心腹】${sec.name}跟了你多年，你把他当成了心腹。`)
  return { ok: true, text: `${sec.name}已成为你的心腹。他更懂你的作息与边界，派私事更稳。` }
}

export function startConfidantTask(
  s: GameState,
  kind: 'intel' | 'risk' | 'cover',
): { ok: boolean; text: string } {
  if (!s.confidant) return { ok: false, text: '尚未指定心腹。' }
  if (s.confidantTask) return { ok: false, text: '心腹已有交办在办。' }
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  if (s.confidant.cd > 0) return { ok: false, text: `心腹冷却还剩 ${s.confidant.cd} 个月。` }
  s.actionPoints -= 1
  s.confidant.cd = 2
  const months = kind === 'cover' ? 2 : 1
  s.confidantTask = { kind, monthsLeft: months }
  const label = kind === 'intel' ? '打听风声' : kind === 'risk' ? '办棘手事' : '挡一次麻烦'
  pushLog(s, `【心腹】你请${s.confidant.name}「${label}」。`)
  return { ok: true, text: `已请心腹去办：${label}（约 ${months} 个月）。信任越高越稳，程序风险请自行掂量。` }
}

/* ═══════════ 门生 ═══════════ */

const PROTEGE_NAMES = ['小赵', '小钱', '小孙', '小李', '小周', '小吴', '小郑', '小王']

export function addProtege(s: GameState, name?: string): string {
  if (!s.proteges) s.proteges = []
  if (s.proteges.length >= 5) return '门生已满（最多 5 人）。'
  const id = `ps_${Date.now().toString(36)}_${s.proteges.length}`
  const nm = name ?? PROTEGE_NAMES[Math.floor(Math.random() * PROTEGE_NAMES.length)]
  const skill = 30 + Math.floor(Math.random() * 30)
  s.proteges.push({ id, name: nm, skill, loyalty: 50 })
  pushLog(s, `【门生】你收下${nm}作门生，愿其日后独当一面。`)
  return `已收${nm}为门生。可在关系页派其做事。`
}

export function tickProteges(s: GameState): string | null {
  if (!s.proteges?.length) return null
  for (const p of s.proteges) {
    if (p.skill < 90 && Math.random() < 0.15) p.skill = clamp(p.skill + 2, 0, 100)
  }
  const t = s.protegeTask
  if (t) {
    t.monthsLeft -= 1
    if (t.monthsLeft <= 0) {
      const p = s.proteges.find((x) => x.id === t.id)
      s.protegeTask = null
      if (!p) return null
      if (t.kind === 'work') {
        if (p.skill >= 55) {
          s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
          s.dutyYearScore = clamp((s.dutyYearScore ?? 0) + 3, 0, 100)
          p.loyalty = clamp(p.loyalty + 5, 0, 100)
          const line = `【门生】${p.name}把交办事项办得很漂亮，你的政绩账上添了一笔。`
          pushLog(s, line)
          return line
        }
        s.risk = clamp(s.risk + 3, 0, 100)
        p.loyalty = clamp(p.loyalty - 5, 0, 100)
        const line = `【门生】${p.name}办事不力，还牵连到你这边。`
        pushLog(s, line)
        return line
      }
      // watch
      if (p.skill >= 50) {
        s.risk = clamp(s.risk - 4, 0, 100)
        const line = `【门生】${p.name}帮你盯住了几处苗头，风险下降。`
        pushLog(s, line)
        return line
      }
      s.risk = clamp(s.risk + 2, 0, 100)
      const line = `【门生】${p.name}没盯住，风声还是传了出来。`
      pushLog(s, line)
      return line
    }
  }
  // 随机来访 / 出事
  if (s.turn >= 48 && Math.random() < 0.03) {
    const p = s.proteges[Math.floor(Math.random() * s.proteges.length)]
    if (p.loyalty >= 60 && Math.random() < 0.55) {
      s.attrs.GX = clamp(s.attrs.GX + 2)
      s.attrs.MX = clamp(s.attrs.MX + 1)
      const line = `【门生】${p.name}来汇报工作，顺带问了一句「老师身体可好」。`
      pushLog(s, line)
      return line
    }
    if (p.loyalty < 40 && Math.random() < 0.5) {
      s.risk = clamp(s.risk + 4, 0, 100)
      s.attrs.GX = clamp(s.attrs.GX - 2)
      const line = `【门生】${p.name}在外惹了事，电话里支支吾吾。你让人按规矩办，心里却沉了一下。`
      pushLog(s, line)
      return line
    }
  }
  return null
}

export function assignProtege(
  s: GameState,
  protegeId: string,
  kind: 'work' | 'watch',
): { ok: boolean; text: string } {
  if (!s.proteges?.length) return { ok: false, text: '尚未收门生。' }
  if (s.protegeTask) return { ok: false, text: '已有门生交办在办。' }
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  const p = s.proteges.find((x) => x.id === protegeId)
  if (!p) return { ok: false, text: '没有这位门生。' }
  s.actionPoints -= 1
  s.protegeTask = { id: p.id, name: p.name, kind, monthsLeft: 2 }
  const label = kind === 'work' ? '交办一件实事' : '帮你盯住风声'
  pushLog(s, `【门生】你让${p.name}「${label}」。`)
  return { ok: true, text: `已让${p.name}去办：${label}。能力与忠诚影响结果。` }
}

export function maybeAutoAddProtege(s: GameState): string | null {
  // 升到副处及以上、且名册推荐过，偶发收门生
  const rank = getPost(s.postId).rank
  if (rank < 8) return null
  if ((s.rosterUsed ?? 0) < 1 && (s.proteges?.length ?? 0) === 0) return null
  if ((s.proteges?.length ?? 0) >= 5) return null
  if (Math.random() > 0.02) return null
  return addProtege(s)
}
