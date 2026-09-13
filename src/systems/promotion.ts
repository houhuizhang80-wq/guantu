import type { DocumentPayload, GameState, NextPath, PromoTrack } from '../types'
import { getPost, pathAvailable } from '../data/posts'
import { pushLog, clamp, applyFxToAttrs } from '../state/game'
import { canPromoteDespiteJijian } from './jijian'
import { PROMO_STRATEGIES } from '../data/promo_strategies'
import { localizePlace } from '../data/provinces'
import { factionVoteBonus } from './faction'
import { setPostRank, maxAgeForRank } from './age'
import { bondVoteBonus, syncBonds, patronGateRelax } from './network'

const STAGES: PromoTrack['stage'][] = ['minzhu', 'kaocha', 'gongshi', 'piaojue', 'renmian']

/**
 * 高层票决难度带。
 * 集中管理「进入省部正 / 省部副 / 副国 / 正国」四道门的压制量与通过线，
 * 方便整体校准登顶率（可用 scripts/_sweep.ts 做参数扫描）。数值越大越难。
 */
export const TUNE = {
  /** 进入省部级正职（rank 16-17）：基础压制 */
  buBase: 26,
  /** 进入省部级正职：五维不达标时的追加压制 */
  buWeak: 16,
  /** 进入省部级副职（rank 15） */
  fuBase: 20,
  fuWeak: 15,
  /** 进入副国（rank 18） */
  guoBase: 13,
  guoWeak: 11,
  guoRiskFrom: 8,
  guoRiskK: 1.0,
  /** 副国冲正国（rank 19） */
  topBase: 0,
  topWeak: 3,
  topRiskFrom: 14,
  topRiskK: 0.25,
  /** 票决通过线 */
  lineBase: 48,
  lineFu: 76,
  lineBu: 78,
  lineGuo: 80,
  /** 副国→正国通过线：73 是实测登顶率约 11% 的锚点（62~72 几乎无差别，76 起断崖式跌到 6%） */
  lineTop: 73,
}

export function monthsInPost(s: GameState): number {
  return (s.flags.monthsInPost as number) ?? 0
}

export function availablePaths(s: GameState): {
  path: NextPath
  ok: boolean
  reason: string
}[] {
  const from = getPost(s.postId)
  const jj = canPromoteDespiteJijian(s)
  const patron = patronGateRelax(s)
  const fromRank = from.rank
  return from.nextPaths.map((path) => {
    if (!jj.ok) return { path, ok: false, reason: jj.reason }
    const r = pathAvailable(s, monthsInPost(s), path, from)
    // 靠山助力：放宽任职月数与关系门槛（正部以上仍收紧）
    if (!r.ok && s.flags.patronAssist) {
      const softPath = {
        ...path,
        minMonths: Math.round((path.minMonths ?? from.minMonths) * patron.monthsFactor),
        minGX:
          path.minGX != null
            ? Math.round(path.minGX * (fromRank >= 15 ? Math.max(patron.gxFactor, 0.92) : patron.gxFactor))
            : path.minGX,
      }
      const soft = pathAvailable(s, monthsInPost(s), softPath, from)
      if (soft.ok) return { path, ok: true, reason: '' }
    }
    // 中层路径：关系门槛 92% 软放行；正部以上不软放（登顶要真门槛）
    if (
      !r.ok &&
      from.rank < 15 &&
      path.minGX != null &&
      path.minGX >= 70 &&
      s.attrs.GX >= path.minGX * 0.92
    ) {
      const soft = pathAvailable(s, monthsInPost(s), { ...path, minGX: path.minGX * 0.92 }, from)
      if (soft.ok) return { path, ok: true, reason: '' }
    }
    return { path, ok: r.ok, reason: r.reason }
  })
}

/** 是否有可启动的选拔 */
export function canStartPromo(s: GameState): { ok: boolean; reason: string } {
  if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian')
    return { ok: false, reason: '选拔程序进行中' }
  if (s.probationLeft > 0)
    return { ok: false, reason: `试用期还剩 ${s.probationLeft} 个月` }
  const jj = canPromoteDespiteJijian(s)
  if (!jj.ok) return jj
  const paths = availablePaths(s).filter((p) => p.ok)
  if (paths.length === 0) return { ok: false, reason: '暂无符合程序条件的去向' }
  return { ok: true, reason: '' }
}

export function startPromo(s: GameState, path: NextPath): DocumentPayload | null {
  const gateStart = canStartPromo(s)
  if (!gateStart.ok) return null
  const from = getPost(s.postId)
  const gate = pathAvailable(s, monthsInPost(s), path, from)
  const jj = canPromoteDespiteJijian(s)
  const patron = patronGateRelax(s)
  const patronOk =
    !gate.ok &&
    !!s.flags.patronAssist &&
    pathAvailable(
      s,
      monthsInPost(s),
      {
        ...path,
        minMonths: Math.round((path.minMonths ?? from.minMonths) * patron.monthsFactor),
        minGX: path.minGX != null ? Math.round(path.minGX * patron.gxFactor) : path.minGX,
      },
      from,
    ).ok
  // 高层 GX 软放行与 availablePaths 保持一致（正部以上不软放）
  const softOk =
    !gate.ok &&
    from.rank < 15 &&
    path.minGX != null &&
    path.minGX >= 70 &&
    s.attrs.GX >= path.minGX * 0.92 &&
    pathAvailable(s, monthsInPost(s), { ...path, minGX: path.minGX * 0.92 }, from).ok
  if ((!gate.ok && !softOk && !patronOk) || !jj.ok) return null
  s.promo = {
    targetId: path.to,
    pathLabel: path.label,
    stage: 'minzhu',
    passed: [],
  }
  pushLog(s, `启动选拔：${path.label}`)
  const seal = localizePlace('云河县委组织部', s.provinceId)
  return {
    kind: 'kaocha',
    title: '民主推荐',
    body: localizePlace(
      `根据工作需要和本人表现，现就「${path.label}」进行民主推荐。\n\n请配合做好谈话调研、推荐测评等工作。\n\n云河县委组织部\n${s.year} 年 ${s.month} 月`,
      s.provinceId,
    ),
    sealText: seal,
  }
}

/** 推进一阶段；strategyId 为该阶段的应对策略 */
export function advancePromo(
  s: GameState,
  strategyId?: string,
): { doc: DocumentPayload | null; failed?: string; note?: string } {
  if (!s.promo) return { doc: null }
  const stage = s.promo.stage
  const a = s.attrs
  const strat = PROMO_STRATEGIES[stage]?.find((x) => x.id === strategyId)

  // 选拔中途立案/处分影响期：立即中止
  if (stage !== 'renmian') {
    const jj = canPromoteDespiteJijian(s)
    if (!jj.ok) {
      s.promo = null
      pushLog(s, `【选拔中止】${jj.reason}`)
      return { doc: null, failed: `选拔中止：${jj.reason}` }
    }
  }

  // 风险/草率分：无论成败都记账；五维收益仅在过关后结算，防止反复刷失败策略白嫖属性
  if (strat) {
    if (strat.riskDelta) s.risk = clamp(s.risk + strat.riskDelta, 0, 100)
    if (strat.mashDelta) s.mashScore = clamp((s.mashScore ?? 0) + strat.mashDelta, 0, 100)
  }
  const grantStratFx = () => {
    if (strat) applyFxToAttrs(s.attrs, strat.fx)
  }

  if (stage === 'minzhu') {
    let power = a.GX * 0.4 + a.MX * 0.3 + a.NL * 0.2 + a.ZJ * 0.1
    power += strat?.passBonus ?? 0
    power -= (s.mashScore ?? 0) * 0.1
    if (power < 35) {
      const note = strat?.failText || '民主推荐票数不足，程序中止。'
      s.promo = null
      pushLog(s, note)
      return { doc: null, failed: note }
    }
    grantStratFx()
    s.promo.passed.push('minzhu')
    s.promo.stage = 'kaocha'
    const note = strat?.successText || '民主推荐通过。'
    pushLog(s, `【推荐】${note}`)
    return {
      doc: {
        kind: 'kaocha',
        title: '组织考察',
        body: `${note}\n\n现对你进行组织考察，请如实报告有关事项，配合个别谈话、查阅档案等。\n\n云河县委组织部\n${s.year} 年 ${s.month} 月`,
        sealText: '云河县委组织部',
      },
      note,
    }
  }

  if (stage === 'kaocha') {
    let power = a.Lian * 0.45 + (100 - s.risk) * 0.35 + a.NL * 0.2
    power += strat?.passBonus ?? 0
    power -= (s.mashScore ?? 0) * 0.08
    const fromR = getPost(s.postId).rank
    const kaochaLine = fromR >= 15 ? 68 : 50
    const riskHard = fromR >= 15 ? 38 : 55
    if (power < kaochaLine || (s.risk > riskHard && (strat?.passBonus ?? 0) < 10)) {
      const note = strat?.failText || '组织考察未通过（廉洁或风险方面）。'
      s.risk = clamp(s.risk + 5, 0, 100)
      s.promo = null
      pushLog(s, note)
      return { doc: null, failed: note }
    }
    grantStratFx()
    s.promo.passed.push('kaocha')
    s.promo.stage = 'gongshi'
    const note = strat?.successText || '组织考察通过。'
    pushLog(s, `【考察】${note}`)
    return {
      doc: {
        kind: 'gongshi',
        title: '任前公示',
        body: `${note}\n\n经研究，拟提拔（转任）使用。现予公示，公示期一般不少于五个工作日。\n\n如有意见，可向组织部门反映。\n\n云河县委组织部\n${s.year} 年 ${s.month} 月`,
        sealText: '云河县委组织部',
      },
      note,
    }
  }

  if (stage === 'gongshi') {
    const fromR2 = getPost(s.postId).rank
    let bust = s.risk >= 50 ? 0.28 : s.risk >= 35 ? 0.12 : 0.04
    if (fromR2 >= 15) bust += 0.08
    bust += (strat?.mashDelta ?? 0) * 0.01
    bust -= Math.max(0, strat?.passBonus ?? 0) * 0.008
    if (Math.random() < Math.max(0.02, bust)) {
      const note = strat?.failText || '公示期间收到反映，程序暂缓。'
      s.risk = clamp(s.risk + 8, 0, 100)
      s.promo = null
      pushLog(s, note)
      return { doc: null, failed: note }
    }
    grantStratFx()
    s.promo.passed.push('gongshi')
    s.promo.stage = 'piaojue'
    const note = strat?.successText || '公示期平稳。'
    pushLog(s, `【公示】${note}`)
    return {
      doc: {
        kind: 'kaocha',
        title: '党委（党组）会议票决',
        body: `${note}\n\n现提请党委（党组）会议研究、票决。请按会议纪律做好有关准备。\n\n云河县委组织部\n${s.year} 年 ${s.month} 月`,
        sealText: '云河县委组织部',
      },
      note,
    }
  }

  if (stage === 'piaojue') {
    const from = getPost(s.postId)
    const term = from.termMonths ?? (from.leader ? 60 : 36)
    const months = (s.flags.monthsInPost as number) ?? 0
    const midTerm = months < term
    let power = a.GX * 0.35 + a.Lian * 0.25 + a.ZJ * 0.2 + a.NL * 0.1 + (100 - s.risk) * 0.1
    // 职级并行/低职级届中惩罚较轻；领导职务届中更难
    // 年龄接近该职级上限，票决扣分（年轻化压力）
    const targetRank = getPost(s.promo.targetId).rank
    const maxA = maxAgeForRank(targetRank)
    const ageWindow = targetRank >= 18 ? 8 : targetRank >= 15 ? 7 : 4
    if (s.age > maxA - ageWindow) power -= targetRank >= 18 ? 18 : targetRank >= 15 ? 14 : 10
    if (midTerm)
      power -= from.track === 'rank' || from.rank < 4 ? 3 : from.rank >= 18 ? 18 : from.rank >= 15 ? 14 : 8
    // 五维极高时可部分抵消届中惩罚（高层抵消更少）
    if (a.ZJ >= 85 && a.Lian >= 75) power += from.rank >= 15 ? 2 : 6
    if (s.faction === 'A' || s.faction === 'B' || s.faction === 'local')
      power += from.rank >= 18 ? 0 : from.rank >= 15 ? 2 : 6
    power += factionVoteBonus(s)
    // 靠山：抵消部分届中惩罚
    if (s.flags.patronAssist && midTerm) power += from.rank >= 18 ? 0 : from.rank >= 15 ? 2 : 5
    if (s.flags.favorPromoBoost) {
      power += from.rank >= 18 ? 1 : from.rank >= 15 ? 3 : 8
      s.flags.favorPromoBoost = 0
    }
    if (s.factionRep) {
      const fr = s.factionRep
      const maxF = Math.max(fr.A ?? 0, fr.B ?? 0, fr.local ?? 0)
      if (maxF >= 50) power += from.rank >= 18 ? 0 : from.rank >= 15 ? 2 : 5
    }
    power += bondVoteBonus(s)
    power -= Math.round((s.mashScore ?? 0) * (from.rank >= 15 ? 0.45 : 0.2))
    if ((s.eventsHandledThisPost ?? 0) < (targetRank >= 19 ? 10 : from.rank >= 18 ? 13 : from.rank >= 15 ? 11 : 4))
      power -= targetRank >= 19 ? 8 : 13
    // 登顶线：正部以上额外压「高层认可」（不含副国→正国，那条单独算）
    if (targetRank >= 16 && targetRank < 18) {
      // 进入省部级正职（省长 / 省委书记 / 部长）：真正的分水岭
      power -= TUNE.buBase
      if (a.Lian < 86 || a.ZJ < 98) power -= TUNE.buWeak
    } else if (targetRank === 15) {
      // 进入省部级副职
      power -= TUNE.fuBase
      if (a.Lian < 80 || a.ZJ < 96) power -= TUNE.fuWeak
    }
    if (targetRank >= 18 && targetRank < 19) {
      // 进入副国：省部正→副国这一关要能过，够格就该上
      power -= TUNE.guoBase
      if (a.Lian < 88 || a.NL < 90 || a.MX < 68) power -= TUNE.guoWeak
      if (s.risk > TUNE.guoRiskFrom) power -= Math.round((s.risk - TUNE.guoRiskFrom) * TUNE.guoRiskK)
    } else if (targetRank >= 19) {
      // 副国冲正国：够格的人给足机会
      power -= TUNE.topBase
      if (a.Lian < 78 || a.NL < 82 || a.MX < 62) power -= TUNE.topWeak
      if (s.risk > TUNE.topRiskFrom) power -= Math.round((s.risk - TUNE.topRiskFrom) * TUNE.topRiskK)
    }
    power += strat?.passBonus ?? 0
    const passLine =
      targetRank >= 19
        ? TUNE.lineTop
        : targetRank >= 18
          ? TUNE.lineGuo
          : targetRank >= 16
            ? TUNE.lineBu
            : targetRank >= 15
              ? TUNE.lineFu
              : TUNE.lineBase
    if (power < passLine) {
      const note =
        strat?.failText ||
        (midTerm
          ? '党委（党组）会议未通过：届中调整，票决未过半。'
          : '党委（党组）会议票决未通过。')
      s.promo = null
      pushLog(s, note)
      return { doc: null, failed: note }
    }
    grantStratFx()
    s.promo.passed.push('piaojue')
    s.promo.stage = 'renmian'
    const note = strat?.successText || '会议票决通过。'
    pushLog(s, `【票决】${note}`)
    const target = getPost(s.promo.targetId)
    return {
      doc: {
        kind: 'promote',
        title: '干部任免通知',
        body: localizePlace(
          `${note}\n\n经党委（党组）会议研究决定：\n\n${s.promo.pathLabel}\n\n任命你担任 ${target.title}。\n职务层次：${target.level}。\n任职试用期一年。\n\n请于到任后十日内完成工作交接。\n\n云河县委组织部\n${s.year} 年 ${s.month} 月`,
          s.provinceId,
        ),
        sealText: '云河县委组织部',
      },
      note,
    }
  }

  return { doc: null }
}

/** 签收任免通知后真正落位 */
export function confirmAppointment(s: GameState): boolean {
  if (!s.promo || s.promo.stage !== 'renmian') return false
  const jj = canPromoteDespiteJijian(s)
  if (!jj.ok) {
    s.promo = null
    pushLog(s, `【任免中止】${jj.reason}`)
    return false
  }
  const target = getPost(s.promo.targetId)
  const from = getPost(s.postId)
  s.postId = target.id
  s.flags.monthsInPost = 0
  setPostRank(s, target.rank)
  // 路径标记
  if (s.promo.pathLabel.includes('党务') || target.title.includes('党委') || target.title.includes('县委') || target.title.includes('省委') || target.title.includes('市委')) {
    if (!s.paths.includes('dangwu')) s.paths.push('dangwu')
    s.flags.path_dangwu = true
  }
  if (s.promo.pathLabel.includes('政务') || target.title.includes('政府') || target.title.includes('镇长') || target.title.includes('县长') || target.title.includes('市长') || target.title.includes('省长')) {
    if (!s.paths.includes('zhengwu')) s.paths.push('zhengwu')
    s.flags.path_zhengwu = true
  }
  if (s.promo.pathLabel.includes('条线') || target.title.includes('局')) {
    if (!s.paths.includes('tiaoxian')) s.paths.push('tiaoxian')
    s.flags.path_tiaoxian = true
  }
  if (
    target.title.includes('纪委') ||
    target.title.includes('监委') ||
    target.title.includes('巡视') ||
    target.title.includes('政法') ||
    target.title.includes('公安')
  ) {
    if (!s.paths.includes('jijian') && target.title.includes('纪委')) s.paths.push('jijian')
    if (target.title.includes('政法') || target.title.includes('公安')) {
      if (!s.paths.includes('zhengfa')) s.paths.push('zhengfa')
      s.flags.path_zhengfa = true
    }
    if (!s.paths.includes('dangwu')) s.paths.push('dangwu')
    s.flags.path_dangwu = true
  }
  if (target.title.includes('组织')) {
    if (!s.paths.includes('zuZhi')) s.paths.push('zuZhi')
    if (!s.paths.includes('dangwu')) s.paths.push('dangwu')
    s.flags.path_dangwu = true
    s.flags.path_zuZhi = true
  }
  if (target.title.includes('宣传')) {
    if (!s.paths.includes('xuanchuan')) s.paths.push('xuanchuan')
    if (!s.paths.includes('dangwu')) s.paths.push('dangwu')
    s.flags.path_dangwu = true
  }
  if (target.title.includes('国企') || target.title.includes('董事长') || target.title.includes('总经理')) {
    if (!s.paths.includes('guoqi')) s.paths.push('guoqi')
    s.flags.path_guoqi = true
  }
  if (target.title.includes('部委') || target.title.includes('国务院') || target.title.includes('部长')) {
    if (!s.paths.includes('buwei')) s.paths.push('buwei')
    s.flags.path_buwei = true
  }
  // 交流任职：离开青石镇主要领导岗位
  if (
    from.title.includes('青石镇') &&
    target.leader &&
    !target.title.includes('青石镇') &&
    target.rank >= 4
  ) {
    s.flags.jiaoliu = true
    if (!s.paths.includes('jiaoliu')) s.paths.push('jiaoliu')
  }
  // 试用期
  // 试用期：低职级较短，高层仍一年
  const prob = target.probationMonths ?? (target.leader ? (target.rank >= 12 ? 12 : target.rank >= 8 ? 9 : 6) : 0)
  s.probationLeft = prob
  pushLog(s, `任免：${localizePlace(from.title, s.provinceId)} → ${localizePlace(target.title, s.provinceId)}${prob ? `（试用期 ${prob} 个月）` : ''}`)
  s.promo = null
  s.eventsHandledThisPost = 0
  s.lastActionKey = null
  s.mashScore = Math.max(0, (s.mashScore ?? 0) - 15)
  // 用完靠山窗口：任免落位后清零，避免无限吃红利
  if (s.flags.patronAssist) {
    s.flags.patronAssist = 0
    s.flags.patronMonths = 0
    const who = String(s.flags.patronName || '靠山')
    pushLog(s, `【靠山】${who}的关照已在本次任免中兑现。`)
  }
  // 晋升后旧人淡出 → 同步羁绊
  const bondNote = syncBonds(s)
  if (bondNote) pushLog(s, bondNote)
  // 年龄接近上限时，晋升更难（票决已在 piaojue 处理）
  return true
}

export function cancelPromo(s: GameState) {
  if (!s.promo) return
  pushLog(s, `暂缓选拔：${s.promo.pathLabel}`)
  s.promo = null
}

/** 兼容旧接口：不再自动发调令 */
export function tryPromote(_s: GameState): DocumentPayload | null {
  return null
}

export function monthlyDrift(s: GameState) {
  if (Math.random() < 0.25) s.attrs.NL = clamp(s.attrs.NL + 1)
  if (s.risk > 10 && Math.random() < 0.4) s.risk = clamp(s.risk - 1, 0, 100)
  // 试用期递减
  if (s.probationLeft > 0) {
    s.probationLeft -= 1
    if (s.probationLeft === 0) pushLog(s, '试用期满，正式任职。')
  }
  // 本乡出身：乡镇副职试用期满即安排交流，打开回避限制
  const post = getPost(s.postId)
  if (
    s.flags.hometown === 'qingshi' &&
    s.flags.jiaoliu !== true &&
    post.leader &&
    post.rank >= 4 &&
    post.rank < 6 &&
    post.title.includes('青石镇') &&
    s.probationLeft <= 0 &&
    ((s.flags.monthsInPost as number) ?? 0) >= 12
  ) {
    s.flags.jiaoliu = true
    if (!s.paths.includes('jiaoliu')) s.paths.push('jiaoliu')
    pushLog(s, '【交流】组织安排你跨单位交流任职，成长地回避限制解除。')
  }
}

export { STAGES }
