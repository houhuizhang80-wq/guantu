import type { Appraisal, GameState } from '../types'
import { clamp } from '../state/game'
import { getPost } from '../data/posts'
import { familyPressure } from './family'

/**
 * 年度考核：参照公务员考核「优秀/称职/基本称职/不称职」
 * 综合五维 + 风险；结果影响属性与风险。
 */
export function runAnnualAppraisal(s: GameState): Appraisal {
  const a = s.attrs
  const risk = s.risk
  // 加权分：政绩与民心重、廉洁一票否决压力
  let score =
    a.ZJ * 0.28 + a.MX * 0.22 + a.NL * 0.18 + a.GX * 0.16 + a.Lian * 0.16
  score -= risk * 0.12
  // 在办台账未结清扣分
  if (s.projects.length > 0) score -= s.projects.length * 2
  // 草率决策与快进荒政
  score -= Math.round((s.mashScore ?? 0) * 0.12)
  score -= Math.min(8, (s.ffUsedThisYear ?? 0) * 2)
  // 深度公务质量加分
  score += Math.round(clamp((s.dutyYearScore ?? 0) * 0.06, 0, 6))
  // 政策试点结项加分（本年内）
  const polBonus = Number(s.flags.policyYearBonus ?? 0)
  if (polBonus > 0) score += Math.round(clamp(polBonus, 0, 12))
  // 家庭压力拖累考核
  score -= familyPressure(s) * 2
  score = Math.round(clamp(score, 0, 100))

  let grade: Appraisal['grade']
  let note: string
  let fx: Appraisal['fx']
  let riskDelta = 0

  if (score >= 78 && risk < 45 && a.Lian >= 55) {
    grade = '优秀'
    note =
      polBonus > 0
        ? `工作实绩突出（含政策试点加分 +${Math.round(clamp(polBonus, 0, 12))}），廉洁自律较好，建议继续重点培养。`
        : '工作实绩突出，廉洁自律较好，建议继续重点培养。'
    fx = { ZJ: 4, GX: 5, MX: 3, NL: 2 }
    riskDelta = -4
    s.flags.appraisalExcellent = true
  } else if (score >= 58) {
    grade = '称职'
    note = '能够履行岗位职责，完成年度工作任务。'
    fx = { ZJ: 2, GX: 2, NL: 1 }
  } else if (score >= 40) {
    grade = '基本称职'
    note = '基本完成任务，但存在短板。建议下年侧重：把台账做实，少空转。'
    fx = { ZJ: 1, GX: -2, MX: -1 }
    riskDelta = 3
  } else {
    grade = '不称职'
    note = '年度考核不称职，组织将予以诫勉或调整。建议下年侧重：补短板、降风险、多经手实事。'
    fx = { ZJ: -4, GX: -6, MX: -3, NL: -2 }
    riskDelta = 8
  }

  // 述职侧重：下年小幅偏向所选维度
  const focus = s.flags.appraisalFocus as string | undefined
  if (focus === 'zj') fx.ZJ = (fx.ZJ ?? 0) + 2
  if (focus === 'mx') fx.MX = (fx.MX ?? 0) + 2
  if (focus === 'lian') {
    fx.Lian = (fx.Lian ?? 0) + 2
    s.risk = clamp(s.risk - 2, 0, 100)
  }

  // 高廉洁可抵消一点风险冲击
  if (a.Lian >= 75 && riskDelta > 0) riskDelta = Math.max(0, riskDelta - 2)

  s.attrs.ZJ = clamp(s.attrs.ZJ + (fx.ZJ ?? 0))
  s.attrs.GX = clamp(s.attrs.GX + (fx.GX ?? 0))
  s.attrs.Lian = clamp(s.attrs.Lian + (fx.Lian ?? 0))
  s.attrs.MX = clamp(s.attrs.MX + (fx.MX ?? 0))
  s.attrs.NL = clamp(s.attrs.NL + (fx.NL ?? 0))
  s.risk = clamp(s.risk + riskDelta, 0, 100)
  // 消费本年试点加分
  s.flags.policyYearBonus = 0

  return {
    year: s.year,
    grade,
    score,
    note,
    fx,
    riskDelta,
  }
}

export function appraisalTitle(s: GameState) {
  return `${s.year} 年度考核 · ${getPost(s.postId).levelShort}`
}
