import type { AttrFx, Attrs, GameState, NpcRef } from '../types'
import { EVENTS } from '../data/events'
import { NPCS } from '../data/npcs'
import { ORIGINS } from '../data/origins'
import { maxActionsForRank } from '../data/actions'
import { getProvince, flavorFx, DEFAULT_PROVINCE } from '../data/provinces'
import { startAge } from '../systems/age'
import { applyLegacy } from '../systems/extra'
import { writeSlot, readSlot, clearSlot, anySlot, SAVE_VER } from './saves'

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function createEmptyNpcs(): NpcRef[] {
  return NPCS.map((n) => ({ id: n.id, favor: 0 }))
}

/** 出身决定的 NPC 初始好感（16 种出身各不相同） */
export function originNpcFavor(originId: string): Record<string, number> {
  const m: Record<string, number> = {}
  switch (originId) {
    // 普通选调：组织在看，同批抱团，地方人头生
    case 'xuandiao_pu':
      m.tongshi = 12
      m.laoshuji = 6
      m.zhuren = 2
      m.fushuji = -4
      m.laoban = -2
      break
    // 定向选调：起点高，书记另眼相看，有人酸
    case 'xuandiao_ding':
      m.laoshuji = 10
      m.tongshi = 8
      m.zhuren = 4
      m.fushuji = -6
      m.jizhe = 4
      break
    // 省考：干净但生分
    case 'shengkao':
      m.laoshuji = 3
      m.zhuren = -1
      m.tongshi = 4
      m.laobaixing = 3
      m.laoban = -3
      break
    // 国考垂管：条线清楚，地方戒备
    case 'guokao':
      m.jizhu = 5
      m.laoshuji = 2
      m.zhuren = -4
      m.fushuji = -3
      m.laoban = -5
      break
    // 村官：群众底子厚
    case 'cunguan':
      m.laobaixing = 22
      m.laoshuji = 8
      m.zhuren = 3
      m.jizhe = 5
      m.laoban = -2
      break
    // 三支一扶：农口与群众
    case 'sanfuyi':
      m.laobaixing = 18
      m.laoshuji = 6
      m.tongshi = 3
      m.zhuren = 2
      m.laoban = -1
      break
    // 军转：纪委/书记认作风，商人远着
    case 'jizhuan':
      m.jizhu = 10
      m.laoshuji = 7
      m.zhuren = 1
      m.laoban = -6
      m.fushuji = -2
      m.laobaixing = 4
      break
    // 人才引进：专业被看见，机关关系薄
    case 'rencai':
      m.laoshuji = 7
      m.tongshi = 8
      m.zhuren = 2
      m.jizhe = 3
      m.fushuji = -5
      m.laoban = -2
      break
    // 事业调任：两边都熟一点，都不深
    case 'shiye_tiao':
      m.laoshuji = 5
      m.zhuren = 6
      m.laobaixing = 4
      m.tongshi = 2
      m.fushuji = -1
      break
    // 国企调任：商人热络，纪委盯一眼
    case 'guoqi_tiao':
      m.laoban = 18
      m.zhuren = 7
      m.fushuji = 4
      m.jizhu = -4
      m.laoshuji = -2
      m.laobaixing = -3
      break
    // 笔杆子：办与书记，对手警惕
    case 'biguan':
      m.zhuren = 12
      m.laoshuji = 9
      m.jizhe = 4
      m.fushuji = -5
      m.laoban = 1
      break
    // 技术口：群众与书记，商人想用你
    case 'jishu':
      m.laoshuji = 8
      m.laobaixing = 10
      m.laoban = 3
      m.zhuren = 2
      m.jizhu = 3
      m.fushuji = -3
      break
    // 本乡本土：乡亲与商人都熟，纪委多看一眼
    case 'benxiang':
      m.laobaixing = 16
      m.laoban = 10
      m.zhuren = 8
      m.laoshuji = 4
      m.jizhu = -3
      m.fushuji = 2
      break
    // 干部家庭：消息灵通，有人提防
    case 'ganbu_jun':
      m.zhuren = 16
      m.fushuji = 10
      m.laoshuji = -6
      m.jizhu = -2
      m.laoban = 6
      m.tongshi = 2
      break
    // 外省考入：人生地不熟
    case 'waisheng':
      m.zhuren = -5
      m.laoshuji = 2
      m.tongshi = 5
      m.laobaixing = 2
      m.fushuji = -4
      m.laoban = -2
      break
    // 西部回来：能吃苦被书记看见
    case 'xibu':
      m.laoshuji = 9
      m.laobaixing = 14
      m.tongshi = 4
      m.zhuren = 3
      m.laoban = -3
      break
    default:
      break
  }
  return m
}

/** 开局关系网一句话（写入日志） */
export function originNetworkLine(originId: string): string {
  switch (originId) {
    case 'xuandiao_pu':
      return '同批小林主动加了微信；李副书记看你像在看一张待观察的名单。'
    case 'xuandiao_ding':
      return '周书记多问了你两句专业；有人说「定向的，了不起」。'
    case 'shengkao':
      return '你和谁都不熟，但办事窗口的人记得你材料最齐。'
    case 'guokao':
      return '赵纪委对你点头致意；地方上的饭局暂时没人叫你。'
    case 'cunguan':
      return '王婶听说你调到镇上，第二天就来「看看老熟人」。'
    case 'sanfuyi':
      return '农口的老同事约你下地；机关里的人还在记你名字。'
    case 'jizhuan':
      return '周书记欣赏你的干脆；钱老板约你，你还没回。'
    case 'rencai':
      return '同批小林把你拉进「县里年轻人」群；马主任客气里带审视。'
    case 'shiye_tiao':
      return '两边都有熟面孔，两边都不把你当自己人。'
    case 'guoqi_tiao':
      return '钱老板的电话当晚就来了；赵纪委的名字出现在你的交接单备注里。'
    case 'biguan':
      return '马主任夸你「笔头硬」；李副书记看你的目光像在看下一稿。'
    case 'jishu':
      return '王婶问你灌溉渠的事；钱老板说「技术出身，靠谱」。'
    case 'benxiang':
      return '半条街的人跟你打招呼；赵纪委多看了你一眼出身栏。'
    case 'ganbu_jun':
      return '马主任几乎是小跑出来的；周书记只说了句「好好干」。'
    case 'waisheng':
      return '你听不懂的半句方言，马主任帮你「翻译」了——也省略了半句。'
    case 'xibu':
      return '周书记问你西边苦不苦；王婶送来一把青菜。'
    default:
      return '关系网从零开始。'
  }
}

export function createNewGame(originId: string, provinceId?: string): GameState {
  const legacy = originId === 'legacy'
  const found = legacy ? null : ORIGINS.find((o) => o.id === originId)
  const origin = found ?? ORIGINS[0]
  const resolvedId = legacy ? 'legacy' : origin.id
  const originName = legacy ? '老档案重生' : origin.name
  const originPaths = legacy ? ['difang'] : origin.paths
  const originFx = legacy
    ? ({ ZJ: 8, GX: 8, NL: 6, Lian: 5, MX: 5, Risk: 0 } as const)
    : origin.fx
  const prov = getProvince(provinceId || DEFAULT_PROVINCE.id)
  const base: Attrs = { ZJ: 15, GX: 15, Lian: 70, MX: 20, NL: 20 }
  const attrs = { ...base }
  applyFxToAttrs(attrs, originFx)
  applyFxToAttrs(attrs, flavorFx(prov.flavor))
  const startPaths = originPaths?.length ? [...originPaths] : ['difang']
  if (!startPaths.includes('difang') && !startPaths.includes('tiaoxian')) {
    startPaths.push('difang')
  }
  const npcs = createEmptyNpcs()
  const favorMap = originNpcFavor(resolvedId)
  for (const ref of npcs) {
    if (favorMap[ref.id] != null) ref.favor = favorMap[ref.id]
    if (legacy) ref.favor = clamp(ref.favor + 8, -50, 100)
  }

  const riskRaw =
    (!legacy && origin.risk != null
      ? origin.risk
      : originFx.Risk != null
        ? originFx.Risk
        : resolvedId === 'ganbu_jun' || resolvedId === 'guoqi_tiao'
          ? 8
          : 5) +
    (legacy ? 5 : 0) +
    (flavorFx(prov.flavor).Risk ?? 0)

  const st: GameState = {
    phase: 'play',
    year: 2012,
    month: 7,
    turn: 0,
    originId: resolvedId as GameState['originId'],
    provinceId: prov.id,
    postId: 'banshiyuan',
    age: startAge(resolvedId),
    attrs,
    risk: clamp(riskRaw, 0, 100),
    faction: 'none',
    npcs,
    usedEvents: [],
    recentEvents: [],
    flags: {
      monthsInPost: 0,
      originName,
      provinceName: prov.name,
      hometown: originId === 'benxiang' ? 'qingshi' : '',
      postRank: 0,
    },
    log: [
      `报到：${prov.places.county}${prov.places.town}人民政府 · 办事员。出身：${originName}（${prov.name}）。`,
      legacy
        ? '关系网：旧相识尚在，组织对你有一点点「印象分」。'
        : `关系网：${originNetworkLine(resolvedId)}`,
    ],
    currentEventId: null,
    pendingDocument: null,
    endingId: null,
    failStreak: 0,
    actionPoints: maxActionsForRank(0),
    maxActionPoints: maxActionsForRank(0),
    openNpcId: null,
    pendingActionId: null,
    lastFeedback: null,
    projects: [],
    lastMonthSummary: null,
    milestones: [],
    achievements: [],
    lastAppraisal: null,
    promo: null,
    probationLeft: 0,
    paths: startPaths,
    jijian: null,
    punishLeft: 0,
    lastPunish: null,
    slot: 0,
    saveVer: SAVE_VER,
    family: {
      spouse: originId === 'ganbu_jun' || originId === 'guoqi_tiao',
      spouseMood: 65,
      childAge: originId === 'ganbu_jun' ? 3 : 0,
      parentHealth: originId === 'jizhuan' ? 75 : 82,
    },
    factionRep: { A: 20, B: 20, local: originId === 'benxiang' ? 45 : 30 },
    timeline: [
      {
        year: 2012,
        month: 7,
        kind: 'report',
        text: `报到：${prov.places.county}${prov.places.town}人民政府 · 办事员。出身 ${origin.name} · ${prov.name}`,
      },
    ],
    eventsHandledThisPost: 0,
    choiceHistory: [],
    mashScore: 0,
    ffUsedThisYear: 0,
    lastActionKey: null,
    uiTab: 'duty',
    favorCooldown: 0,
    badAppraisalStreak: 0,
    focus: null,
    pendingBurst: null,
    pendingProjectChoice: null,
    factionHeat: 20,
    factionCd: 0,
    bondNpcIds: [],
    bondLetterCd: 0,
    dutyDone: [],
    dutyRun: null,
    dutyYearScore: 0,
    dutyMonthScore: 0,
    yuqingHeat: 12,
    yuqingActed: false,
    secretary: null,
    weekPlan: [null, null, null, null],
    weekPlanned: false,
    research: null,
    researchDone: [],
    rosterTags: {},
    rosterUsed: 0,
    duchaDone: false,
    duchaLast: null,
    tanxinCd: 0,
    campaign: null,
    policy: null,
    factionTask: null,
    pendingFactionTask: null,
    factionTaskDone: [],
    childPath: 'none',
    memoirPages: 0,
    life: 1,
    inherit: [],
    confidant: null,
    proteges: [],
    confidantTask: null,
    protegeTask: null,
  }
  // 多周目余荫（很克制的五维与门生好感）
  applyLegacy(st)
  return st
}

export function applyFxToAttrs(attrs: Attrs, fx: AttrFx) {
  const keys: (keyof Attrs)[] = ['ZJ', 'GX', 'Lian', 'MX', 'NL']
  for (const k of keys) {
    const v = fx[k]
    if (typeof v === 'number') attrs[k] = clamp(attrs[k] + v)
  }
}

export function applyNpcFx(npcs: NpcRef[], list?: { id: string; favor: number }[]) {
  if (!list) return
  for (const item of list) {
    const n = npcs.find((x) => x.id === item.id)
    if (n) n.favor = clamp(n.favor + item.favor, -50, 100)
  }
}

export function saveGame(s: GameState) {
  writeSlot(s)
}

export function loadGame(slot = 0): GameState | null {
  return readSlot(slot)
}

export function clearSave(slot = 0) {
  clearSlot(slot)
}

export function hasSave() {
  return anySlot()
}

export function dateLabel(s: GameState) {
  return `${s.year}.${String(s.month).padStart(2, '0')}`
}

export function riskLevel(risk: number) {
  if (risk >= 80) return '极高'
  if (risk >= 60) return '高'
  if (risk >= 40) return '偏高'
  if (risk >= 20) return '注意'
  return '平稳'
}

export function prestige(s: GameState) {
  const a = s.attrs
  return Math.round(a.ZJ * 0.3 + a.MX * 0.3 + a.NL * 0.2 + a.GX * 0.2)
}

export function pushLog(s: GameState, msg: string) {
  s.log.unshift(msg)
  if (s.log.length > 40) s.log.pop()
}

export function pushTimeline(
  s: GameState,
  kind: import('../types').TimelineEntry['kind'],
  text: string,
) {
  s.timeline = s.timeline || []
  s.timeline.unshift({ year: s.year, month: s.month, kind, text })
  if (s.timeline.length > 80) s.timeline.pop()
}

export function formatFx(fx: AttrFx): string {
  const map: [keyof AttrFx, string][] = [
    ['ZJ', '政绩'],
    ['GX', '关系'],
    ['Lian', '廉洁'],
    ['MX', '民心'],
    ['NL', '能力'],
    ['Risk', '风险'],
  ]
  const parts: string[] = []
  for (const [k, label] of map) {
    const v = fx[k]
    if (typeof v === 'number' && v !== 0) {
      parts.push(`${label}${v > 0 ? '+' : ''}${v}`)
    }
  }
  return parts.join('  ') || '—'
}

/** 供调试/平衡：暴露事件池长度 */
export function eventPoolSize() {
  return EVENTS.length
}
