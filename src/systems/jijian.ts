import type { GameState, JijianCase, PunishLevel } from '../types'
import { clamp, pushLog } from '../state/game'
import { getPost } from '../data/posts'
import { pathAvailable } from '../data/posts'
import { secretaryCaseAggravate } from './secretary_case'

const TIPS = [
  '群众举报「与管理服务对象交往过密」',
  '审计移送「专项资金拨付不规范」',
  '巡视移交「重大决策程序瑕疵」',
  '网络舆情「干部生活作风」相关线索',
  '内部反映「不如实报告个人有关事项」',
  '举报「违规接受宴请和礼品」',
  '反映「在工程项目中为亲属谋利」',
]

export function punishImpactMonths(level: PunishLevel): number {
  switch (level) {
    case 'tanhan':
      return 0
    case 'jiemian':
      return 6
    case 'jinggao':
      return 6
    case 'yanzhong':
      return 12
    case 'chexiao':
      return 24
    case 'kaitan':
      return 999
  }
}

export function punishLabel(level: PunishLevel): string {
  switch (level) {
    case 'tanhan':
      return '谈话提醒'
    case 'jiemian':
      return '诫勉'
    case 'jinggao':
      return '党内警告 / 政务警告'
    case 'yanzhong':
      return '严重警告 / 记过'
    case 'chexiao':
      return '撤销领导职务 / 降级'
    case 'kaitan':
      return '开除党籍、开除公职（移送）'
  }
}

export function punishFx(level: PunishLevel) {
  switch (level) {
    case 'tanhan':
      return { GX: -2, Risk: -8, Lian: 1 }
    case 'jiemian':
      return { GX: -6, ZJ: -3, Risk: -12, Lian: 2 }
    case 'jinggao':
      return { GX: -10, ZJ: -6, MX: -4, Risk: -15, Lian: 3 }
    case 'yanzhong':
      return { GX: -16, ZJ: -12, MX: -8, NL: -4, Risk: -20, Lian: 4 }
    case 'chexiao':
      return { GX: -25, ZJ: -20, MX: -12, NL: -8, Risk: -30, Lian: 5 }
    case 'kaitan':
      return { GX: -40, ZJ: -40, MX: -30 }
  }
}

/** 风险驱动：概率开启线索 */
export function maybeOpenJijian(s: GameState): boolean {
  if (s.jijian) return false
  if (s.probationLeft > 0) return false
  const risk = s.risk
  const lian = s.attrs.Lian
  // 廉洁高、风险低则几乎不开
  let p = 0
  if (risk >= 70) p = 0.35
  else if (risk >= 55) p = 0.18
  else if (risk >= 40) p = 0.08
  if (lian >= 75) p *= 0.35
  if (lian <= 35) p *= 1.6
  if (Math.random() >= p) return false

  const tip = TIPS[Math.floor(Math.random() * TIPS.length)]
  s.jijian = {
    stage: 'xiansuo',
    severity: Math.round(clamp(risk * 0.55 + (50 - lian) * 0.4, 10, 90)),
    tip,
    steps: ['线索受理'],
    cooperated: false,
  }
  pushLog(s, `【纪检监察】收到线索：${tip}`)
  return true
}

/**
 * 推进一阶段。playerChoice: 'peihé' | 'tuotie' | 'zhao' (找关系)
 * 返回展示文案；over 时落处分。
 */
export function advanceJijian(
  s: GameState,
  choice: 'peihe' | 'tuotie' | 'zhaoguanxi',
): { text: string; over?: boolean; punish?: PunishLevel; ending?: boolean } {
  if (!s.jijian) return { text: '' }
  const c = s.jijian
  const a = s.attrs

  if (choice === 'peihe') {
    c.cooperated = true
    // 后期配合效果更强（认错悔错）
    const drop = c.stage === 'chuhe' || c.stage === 'lian' || c.stage === 'shenli' ? 12 : 8
    c.severity = clamp(c.severity - drop, 5, 100)
    a.Lian = clamp(a.Lian + (c.stage === 'shenli' ? 2 : 1))
  } else if (choice === 'zhaoguanxi') {
    c.severity = clamp(c.severity + 12, 5, 100)
    s.risk = clamp(s.risk + 5, 0, 100)
    a.Lian = clamp(a.Lian - 6)
    if (c.stage === 'lian' || c.stage === 'shenli') {
      c.severity = clamp(c.severity + 8, 5, 100)
      s.risk = clamp(s.risk + 6, 0, 100)
    }
  } else {
    c.severity = clamp(c.severity + 4, 5, 100)
  }

  // 阶段推进
  if (c.stage === 'xiansuo') {
    c.stage = 'hanxun'
    c.steps.push('谈话函询')
    return {
      text:
        choice === 'peihe'
          ? '你按要求如实说明有关情况，提交了书面材料。纪委决定进行谈话函询。'
          : choice === 'zhaoguanxi'
            ? '你四处打听。纪委同志照常约谈——表情很平静。'
            : '你收到谈话函询通知，要求在规定期限内说明问题。',
    }
  }

  if (c.stage === 'hanxun') {
    const power = a.Lian * 0.5 + (100 - s.risk) * 0.3 + (c.cooperated ? 15 : 0)
    if (power >= 62 && c.severity < 45) {
      c.steps.push('函询了结')
      s.jijian = null
      s.risk = clamp(s.risk - 18, 0, 100)
      pushLog(s, '【纪检监察】函询了结，未再立案。')
      return {
        text: '说明被采信。经研究，函询了结。你走出办公楼时，腿有点软。',
        over: true,
      }
    }
    c.stage = 'chuhe'
    c.steps.push('初步核实')
    return {
      text:
        choice === 'peihe'
          ? '你提交了完整时间线与凭证。核查组开始调阅材料。'
          : '函询后仍有疑点，转入初步核实。核查组开始调阅材料、走访相关人员。',
    }
  }

  if (c.stage === 'chuhe') {
    const power = a.Lian * 0.45 + (100 - s.risk) * 0.35 + (c.cooperated ? 12 : 0)
    if (power >= 70 && c.severity < 40) {
      c.steps.push('初核未发现问题')
      s.jijian = null
      s.risk = clamp(s.risk - 22, 0, 100)
      pushLog(s, '【纪检监察】初核未发现严重问题。')
      return { text: '初核结束：未发现需要立案的严重问题。线索存档。', over: true }
    }
    c.stage = 'lian'
    c.steps.push('立案审查调查')
    // 秘书腐败分支的把柄：曾「摆平」过的那些事，会一起翻出来
    const backfire = secretaryCaseAggravate(s)
    if (backfire > 0) {
      c.severity = clamp(c.severity + backfire, 5, 100)
      s.risk = clamp(s.risk + 4, 0, 100)
    }
    s.risk = clamp(s.risk + 6, 0, 100)
    const backfireNote =
      backfire > 0
        ? '核查组翻出了此前你替身边人「摆平」的那些事，一并列入了问题线索。'
        : ''
    return {
      text:
        (choice === 'peihe'
          ? '你继续配合核查。经审批，仍予以立案——但你的配合已被记录。'
          : choice === 'zhaoguanxi'
            ? '打听的动作被记入笔录。经审批，予以立案审查调查。'
            : '经审批，予以立案审查调查。你的手机在深夜响过两次，你没接。') + backfireNote,
    }
  }

  if (c.stage === 'lian') {
    c.stage = 'shenli'
    c.steps.push('案件审理')
    const transfer = c.severity >= 75
    if (transfer) c.steps.push('涉嫌犯罪问题移送检察机关')
    return {
      text:
        (choice === 'peihe'
          ? '审查期间你如实说明、主动退缴。案件移送审理，态度将写入报告。'
          : '审查调查结束，移送审理。处分档次将根据违纪事实、认错悔错态度等综合确定。') +
        (transfer
          ? '\n因涉嫌职务犯罪，问题线索已同步移送检察机关依法审查起诉——案件性质变了。'
          : ''),
    }
  }

  // shenli → 处分
  let level: PunishLevel
  const sev = c.severity
  if (sev < 25 && c.cooperated) level = 'tanhan'
  else if (sev < 40) level = 'jiemian'
  else if (sev < 55) level = 'jinggao'
  else if (sev < 72) level = 'yanzhong'
  else if (sev < 90) level = 'chexiao'
  else level = 'kaitan'

  if (c.cooperated && (level === 'jinggao' || level === 'yanzhong')) {
    level = level === 'yanzhong' ? 'jinggao' : 'jiemian'
  }

  const fx = punishFx(level)
  for (const [k, v] of Object.entries(fx)) {
    if (k === 'Risk') s.risk = clamp(s.risk + (v as number), 0, 100)
    else {
      const key = k as keyof typeof a
      a[key] = clamp(a[key] + (v as number))
    }
  }

  const months = punishImpactMonths(level)
  s.punishLeft = months
  s.lastPunish = punishLabel(level)
  s.jijian = null
  pushLog(s, `【纪检监察】处分：${punishLabel(level)}${months > 0 && months < 900 ? `（影响期 ${months} 个月）` : ''}`)

  // 撤职：降一岗
  if (level === 'chexiao') {
    const post = getPost(s.postId)
    // 简单降级：rank 降 1 找最近较低岗位——用 flags 记，仅提示
    pushLog(s, `【纪检监察】已撤销现职（${post.levelShort}），另行安排。`)
    // 退回正股/科员级代表岗位
    if (post.rank >= 8) s.postId = 'xianju_fu'
    else if (post.rank >= 6) s.postId = 'guzhang'
    else if (post.rank >= 4) s.postId = 'keyuan'
    else s.postId = 'banshiyuan'
    s.flags.monthsInPost = 0
  }

  if (level === 'kaitan') {
    return {
      text: `处分决定：${punishLabel(level)}。`,
      over: true,
      punish: level,
      ending: true,
    }
  }

  return {
    text: `处分决定：${punishLabel(level)}。${months > 0 ? `处分影响期 ${months} 个月，期内不得晋升。` : ''}`,
    over: true,
    punish: level,
  }
}

export function stageLabel(stage: string) {
  const map: Record<string, string> = {
    xiansuo: '线索受理',
    hanxun: '谈话函询',
    chuhe: '初步核实',
    lian: '立案审查',
    shenli: '案件审理',
    over: '已办结',
  }
  return map[stage] ?? stage
}

export function canPromoteDespiteJijian(s: GameState): { ok: boolean; reason: string } {
  if (s.punishLeft > 0)
    return { ok: false, reason: `处分影响期还剩 ${s.punishLeft} 个月，不得晋升` }
  if (s.jijian && (s.jijian.stage === 'lian' || s.jijian.stage === 'shenli'))
    return { ok: false, reason: '立案审查调查期间，不得提拔使用' }
  return { ok: true, reason: '' }
}

/** 供 promotion.pathAvailable 叠加 */
export function jijianBlock(s: GameState): { ok: boolean; reason: string } {
  return canPromoteDespiteJijian(s)
}

export function tickPunish(s: GameState) {
  if (s.punishLeft > 0 && s.punishLeft < 900) {
    s.punishLeft -= 1
    if (s.punishLeft === 0) pushLog(s, '处分影响期满。')
  }
}

// 避免 tree-shake 误删 pathAvailable 引用（供后续扩展）
void pathAvailable
export type { JijianCase }
