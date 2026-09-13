import type { AttrFx, PromoStage, GameState } from '../types'
import { getPost } from './posts'

export interface PromoStrategy {
  id: string
  label: string
  hint: string
  /** 结算时的额外修正 */
  fx: AttrFx
  /** 对本阶段通过率的加成/惩罚（百分点） */
  passBonus: number
  /** 草率分变化 */
  mashDelta?: number
  /** 风险变化 */
  riskDelta?: number
  successText: string
  failText: string
}

export const PROMO_STRATEGIES: Record<PromoStage, PromoStrategy[]> = {
  idle: [],
  minzhu: [
    {
      id: 'taici',
      label: '用实绩台账说话',
      hint: '稳，依赖政绩与能力',
      fx: { ZJ: 2, NL: 2 },
      passBonus: 8,
      successText: '推荐会上，台账与现场照片成了最硬的发言。',
      failText: '台账很厚，推荐票还是很薄。',
    },
    {
      id: 'zoudong',
      label: '会前认真走访谈话',
      hint: '靠关系，耗时伤廉洁',
      fx: { GX: 6, Lian: -3 },
      passBonus: 12,
      riskDelta: 2,
      successText: '你把该谈的人都谈到了，票面上去了。',
      failText: '走访显得刻意，有人反感。',
    },
    {
      id: 'gongkai',
      label: '公开述职，欢迎监督',
      hint: '涨民心，可能被挑刺',
      fx: { MX: 6, Lian: 2, GX: -3 },
      passBonus: 4,
      successText: '述职现场有人点头，也有人记笔记。',
      failText: '公开场合被追问历史遗留问题。',
    },
  ],
  kaocha: [
    {
      id: 'rushi',
      label: '如实报告个人有关事项',
      hint: '干净最稳',
      fx: { Lian: 5, Risk: -3 },
      passBonus: 15,
      successText: '考察组对材料完整性没有异议。',
      failText: '有一处填报不全，被要求补充说明。',
    },
    {
      id: 'zhuangji',
      label: '突出亮点、淡化瑕疵',
      hint: '好看，有风险',
      fx: { ZJ: 3, Lian: -5 },
      passBonus: 5,
      riskDelta: 4,
      mashDelta: 5,
      successText: '亮点讲得很漂亮。',
      failText: '考察组追问了「淡化」的那一段。',
    },
    {
      id: 'tuoren',
      label: '请老领导帮着说句话',
      hint: '借力，绑关系',
      fx: { GX: 5, Lian: -2 },
      passBonus: 6,
      successText: '有分量的评价进了考察材料。',
      failText: '「帮说话」反而引起注意。',
    },
  ],
  gongshi: [
    {
      id: 'jingdai',
      label: '静待公示期，不私下活动',
      hint: '清白，看运气',
      fx: { Lian: 3 },
      passBonus: 6,
      riskDelta: -2,
      successText: '公示期平稳度过。',
      failText: '公示期间出现反映。',
    },
    {
      id: 'yuqing',
      label: '主动排查舆情与矛盾',
      hint: '积极，耗精力',
      fx: { NL: 3, MX: 2, Risk: -4 },
      passBonus: 10,
      successText: '苗头性问题提前化解。',
      failText: '排查反而惊动了更多人。',
    },
    {
      id: 'yashe',
      label: '找人「打招呼」压反映',
      hint: '危险',
      fx: { Lian: -10, Risk: 10, GX: 3 },
      passBonus: 4,
      mashDelta: 12,
      successText: '暂时安静。',
      failText: '打招呼本身成了反映内容。',
    },
  ],
  piaojue: [
    {
      id: 'huiqian',
      label: '会前充分汇报分管工作',
      hint: '靠实绩',
      fx: { ZJ: 3, NL: 2 },
      passBonus: 10,
      successText: '会上有人替你算了账。',
      failText: '汇报被打断：「说重点。」',
    },
    {
      id: 'paixi',
      label: '请派系同志会前沟通',
      hint: '靠人，绑紧战车',
      fx: { GX: 8, Lian: -4, Risk: 3 },
      passBonus: 12,
      mashDelta: 4,
      successText: '该打招呼的都打到了。',
      failText: '沟通痕迹太重，有人警觉。',
    },
    {
      id: 'bubiao',
      label: '不预设结果，按程序到会',
      hint: '干净，看基本盘',
      fx: { Lian: 3 },
      passBonus: 2,
      successText: '你按议程发言，不多不少。',
      failText: '会场气氛对你不利。',
    },
  ],
  renmian: [],
}

export function stageTitle(stage: PromoStage): string {
  switch (stage) {
    case 'minzhu':
      return '民主推荐'
    case 'kaocha':
      return '组织考察'
    case 'gongshi':
      return '任前公示'
    case 'piaojue':
      return '党委（党组）会议票决'
    case 'renmian':
      return '研究任免'
    default:
      return ''
  }
}

export function stageBlurb(stage: PromoStage): string {
  switch (stage) {
    case 'minzhu':
      return '推荐测评与谈话调研。票数不足则程序中止。你选择如何面对推荐环节。'
    case 'kaocha':
      return '个别谈话、查阅档案、核实有关事项。廉洁与风险是硬约束。'
    case 'gongshi':
      return '公示期一般不少于五个工作日。高风险容易被反映。'
    case 'piaojue':
      return '党委（党组）会议研究票决。届中调整更难；派系与口碑有影响。'
    case 'renmian':
      return '会议通过后，签发任免通知。领导职务试用期一年。'
    default:
      return ''
  }
}

/** 粗略通过率估算（不暴露完整公式） */
export function estimatePass(s: GameState, stage: PromoStage): number {
  const a = s.attrs
  const mash = s.mashScore ?? 0
  let base = 50
  if (stage === 'minzhu') base = a.GX * 0.35 + a.MX * 0.25 + a.NL * 0.2 + a.ZJ * 0.2
  else if (stage === 'kaocha') base = a.Lian * 0.4 + (100 - s.risk) * 0.35 + a.NL * 0.25
  else if (stage === 'gongshi') base = 75 - s.risk * 0.4 + (a.Lian - 50) * 0.15
  else if (stage === 'piaojue') {
    base = a.GX * 0.3 + a.Lian * 0.25 + a.ZJ * 0.25 + a.NL * 0.2
    const from = getPost(s.postId)
    const term = from.termMonths ?? 60
    const months = (s.flags.monthsInPost as number) ?? 0
    if (months < term) base -= 12
    if (s.faction !== 'none') base += 6
  }
  base -= mash * 0.15
  return Math.round(Math.max(8, Math.min(92, base)))
}
