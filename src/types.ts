// 五维属性
export type AttrKey = 'ZJ' | 'GX' | 'Lian' | 'MX' | 'NL'

export interface Attrs {
  ZJ: number
  GX: number
  Lian: number
  MX: number
  NL: number
}

export type AttrFx = Partial<Attrs> & {
  Risk?: number
  WW?: number
}

export interface NpcRef {
  id: string
  favor: number
}

export type Faction = 'none' | 'A' | 'B' | 'local'

export type OriginId = string

export type Phase =
  | 'splash'
  | 'agreement'
  | 'auth'
  | 'guide'
  | 'title'
  | 'slots'
  | 'settings'
  | 'origin'
  | 'province'
  | 'play'
  | 'document'
  | 'ending'

/** 领导职务 | 职级（职务与职级并行） */
export type CareerTrack = 'leader' | 'rank'

export interface NextPath {
  /** 目标岗位 */
  to: string
  /** 路线说明：转任党务 / 晋镇长 / 职级晋升… */
  label: string
  kind: CareerTrack | 'transfer'
  hint?: string
  /** 最低本岗月数（可覆盖岗位默认） */
  minMonths?: number
  /** 额外属性门槛 */
  minZJ?: number
  minGX?: number
  minLian?: number
  minMX?: number
  minNL?: number
  maxRisk?: number
  /** 需要已有路径标记，如曾走党务 */
  needFlag?: string
  /** 成长地回避：不得在青石镇任主要领导 */
  avoidHometown?: boolean
  /** 需已完成交流任职（flags.jiaoliu） */
  needJiaoliu?: boolean
  /** 届中调整：更难通过票决 */
  midTermHarder?: boolean
  /** 目标岗位最高任职年龄限制 */
  maxAge?: number
}

export interface Post {
  id: string
  title: string
  /** 比较序数；同层次可并行 */
  rank: number
  stage: '乡镇' | '县区' | '市级' | '省级' | '中央'
  level:
    | '办事员'
    | '科员'
    | '股级（内设）'
    | '职级序列'
    | '乡科级副职'
    | '乡科级正职'
    | '县处级副职'
    | '县处级正职'
    | '厅局级副职'
    | '厅局级正职'
    | '省部级副职'
    | '省部级正职'
    | '国家级副职'
    | '国家级正职'
  levelShort: string
  leader: boolean
  track: CareerTrack
  /** 晋任下一岗位的默认最低任职月数（届中调整下限） */
  minMonths: number
  /** 正常任期满（月）。未满届为届中调整，门槛更严 */
  termMonths?: number
  /** 晋任门槛（路径可再收紧） */
  minZJ: number
  minGX: number
  minLian: number
  minMX: number
  minNL: number
  maxRisk: number
  /** 担任本职最高年龄（到龄原则上不再提拔） */
  maxAge?: number
  /** 担任本职最低年龄 */
  minAge?: number
  /** 分支去向 */
  nextPaths: NextPath[]
  /** 试用期月数（领导职务新任） */
  probationMonths?: number
}

/** 选拔程序阶段 */
export type PromoStage =
  | 'idle'
  | 'minzhu' // 民主推荐
  | 'kaocha' // 组织考察
  | 'gongshi' // 任前公示
  | 'piaojue' // 党委（党组）会议票决
  | 'renmian' // 研究任免（通过后试用）

export interface PromoTrack {
  targetId: string
  pathLabel: string
  stage: PromoStage
  /** 各阶段完成标记 */
  passed: string[]
  failNote?: string
}

export interface EventChoice {
  label: string
  hint?: string
  fx: AttrFx
  npcFx?: { id: string; favor: number }[]
  require?: Partial<Attrs> & {
    maxRisk?: number
    npc?: { id: string; min: number }[]
    afterEvent?: string
  }
  successRate?: number
  failFx?: AttrFx
  failText?: string
  faction?: Faction
}

export type EventKind = 'main' | 'daily' | 'crisis' | 'npc' | 'calm'

export interface GameEvent {
  id: string
  kind: EventKind
  title: string
  /** 默认正文；若配置 textByOrigin 则按出身覆盖 */
  text: string
  /** 按出身定制开场等文案 */
  textByOrigin?: Partial<Record<OriginId, string>>
  /** 仅这些出身可见（空/缺省=全部） */
  originIds?: OriginId[]
  /** 仅这些省份气质可见（coastal/north/...） */
  flavors?: string[]
  weight: number
  minRank?: number
  maxRank?: number
  minRisk?: number
  onlyOnce?: boolean
  storyOrder?: number
  require?: Partial<Attrs> & {
    maxRisk?: number
    npc?: { id: string; min: number }[]
    afterEvent?: string
  }
  monthMod?: number[]
  choices: EventChoice[]
}

export interface Origin {
  id: OriginId
  name: string
  /** 一句身份 */
  tag: string
  desc: string
  fx: AttrFx
  /** 初始路径标记 */
  paths?: string[]
  /** 风险初始修正（在 fx.Risk 之外可叠加展示） */
  risk?: number
}

export interface Ending {
  id: string
  title: string
  summary: string
  check: (s: GameState) => boolean
  priority: number
}

export interface DocumentPayload {
  title: string
  body: string
  sealText: string
  kind: 'promote' | 'transfer' | 'discipline' | 'ending' | 'gongshi' | 'kaocha'
}

export interface Project {
  id: string
  name: string
  progress: number
  tick: number
  doneFx: AttrFx
  flavor: string
}

export interface MonthSummary {
  year: number
  month: number
  lines: string[]
  projectUpdates: string[]
}

export type AppraisalGrade = '优秀' | '称职' | '基本称职' | '不称职'

export interface Appraisal {
  year: number
  grade: AppraisalGrade
  score: number
  note: string
  fx: AttrFx
  riskDelta: number
}

export interface GameState {
  phase: Phase
  year: number
  month: number
  turn: number
  originId: OriginId | null
  /** 所选架空省份 */
  provinceId: string | null
  postId: string
  /** 周岁年龄 */
  age: number
  attrs: Attrs
  risk: number
  faction: Faction
  npcs: NpcRef[]
  usedEvents: string[]
  /** 最近用过的事件 id（冷却用，与 onlyOnce 分离，避免冲掉一次性标记） */
  recentEvents: string[]
  /** 各事件累计触发次数（降权/正文变体用；旧档补空对象） */
  eventHits?: Record<string, number>
  flags: Record<string, boolean | number | string>
  log: string[]
  currentEventId: string | null
  pendingDocument: DocumentPayload | null
  endingId: string | null
  failStreak: number
  actionPoints: number
  maxActionPoints: number
  openNpcId: string | null
  pendingActionId: string | null
  lastFeedback: { title: string; text: string } | null
  projects: Project[]
  lastMonthSummary: MonthSummary | null
  milestones: string[]
  achievements: string[]
  lastAppraisal: Appraisal | null
  /** 在办选拔程序 */
  promo: PromoTrack | null
  /** 试用期剩余月数 */
  probationLeft: number
  /** 路径标记：dangwu / zhengwu / difang / tiaoxian … */
  paths: string[]
  /** 纪检监察在办件 */
  jijian: JijianCase | null
  /** 处分影响期剩余月数（期内不得晋升） */
  punishLeft: number
  /** 最近一次处分名称 */
  lastPunish: string | null
  /** 存档槽位 0-2 */
  slot: number
  /** 存档版本 */
  saveVer: number
  /** 家属 */
  family: FamilyState
  /** 派系声望 A/B/local 0-100 */
  factionRep: Record<string, number>
  /** 履历时间线 */
  timeline: TimelineEntry[]
  /** 本岗位已处置事件数（晋升门槛） */
  eventsHandledThisPost: number
  /** 最近选项下标（防连点同一键） */
  choiceHistory: number[]
  /** 草率分 0-100，越高越影响票决与考核 */
  mashScore: number
  /** 本年度快进次数 */
  ffUsedThisYear: number
  /** 最近行动 key，用于连续同一行动衰减 */
  lastActionKey: string | null
  /** UI：是否打开履历 */
  showTimeline?: boolean
  showSettings?: boolean
  showHelp?: boolean
  showCatalog?: boolean
  /** 新建时选中的槽位 */
  slotPick?: number
  /** 选完出身待选省份 */
  pendingOriginId?: string
  /** 对局底部页签 */
  uiTab?: UiTab
  /** 浅色/深色主题 */
  theme?: 'light' | 'dark'
  /** 托人办事冷却（月） */
  favorCooldown: number
  /** 连续不称职次数 */
  badAppraisalStreak: number
  /** 最近属性飘字 */
  floatFx?: { key: string; delta: number }[]
  /** 图鉴按出身筛选 */
  catalogOrigin?: string
  /** 图鉴按省份气质筛选 */
  catalogFlavor?: string
  /** 关系网主动来访待处理 */
  pendingVisit?: { npcId: string; favor: number } | null
  /** 本月焦点 */
  focus?: 'zj' | 'mx' | 'lian' | 'gx' | null
  /** 突发打断（行动后触发） */
  pendingBurst?: { title: string; text: string; kind: string } | null
  /** 项目办结时的分支选择 */
  pendingProjectChoice?: { id: string; name: string } | null
  /** 派系角力热度 0-100 */
  factionHeat: number
  /** 派系动作冷却 */
  factionCd: number
  /** 跨阶段羁绊：淡出交往圈但仍保持联系的旧人 id */
  bondNpcIds: string[]
  /** 写信冷却（月） */
  bondLetterCd?: number
  /** 本月已完成的深度公务 */
  dutyDone?: DutyKind[]
  /** 进行中的深度公务 */
  dutyRun?: DutyRun | null
  /** 本年公务质量累计（进年度考核） */
  dutyYearScore?: number
  /** 本月公务质量 */
  dutyMonthScore?: number
  /** 退休后余热阶段 */
  retiredMode?: boolean
  /** 述职侧重（影响下年事件加成） */
  appraisalFocus?: string
  /** 选拔失败复盘记录 */
  promoFailLog?: string[]
  /** 关系网引荐新人冷却 */
  introCd?: number
  /** 上次派系动作，防刷 */
  lastFactionAct?: string | null
  /** 派系会议投票待处理 */
  pendingVote?: { title: string; text: string } | null
  /** 复盘档案是否打开 */
  showFailLog?: boolean
  /** 图鉴按章节筛选 */
  catalogStage?: string
  /** 舆情热度 0-100 */
  yuqingHeat?: number
  /** 本月已做舆情动作 */
  yuqingActed?: boolean
  /** 秘书/联络员 */
  secretary?: { hired: boolean; name: string; skill: number } | null
  /** 周计划：本月四格优先事项 */
  weekPlan?: (string | null)[]
  /** 本月是否已排周计划 */
  weekPlanned?: boolean
  /** 调研课题（进行中） */
  research?: {
    topic: string
    progress: number
    quality: number
    months: number
  } | null
  /** 已完成调研报告 */
  researchDone?: { topic: string; quality: number; year: number }[]
  /** 干部名册：自定义标签 */
  rosterTags?: Record<string, string>
  /** 本年推荐次数 */
  rosterUsed?: number
  /** 督查暗访：本月是否已迎检 */
  duchaDone?: boolean
  /** 上次暗访结果（影响下次概率） */
  duchaLast?: 'ok' | 'warn' | 'bad' | null
  /** 谈心谈话冷却（月） */
  tanxinCd?: number
  /** 项目攻坚战役 */
  campaign?: {
    name: string
    step: number
    quality: number
    total: number
    /** 地方主官专项条线：zhao 招大引强 / zhai 债务化解 / sheng 生态督察整改 */
    major?: 'zhao' | 'zhai' | 'sheng'
  } | null
  /** 政策试点（县处及以上） */
  policy?: { id: string; name: string; step: number; total: number; quality: number } | null
  policyExcellent?: boolean
  /** 派系交办任务 */
  factionTask?: { id: string; title: string; text: string; monthsLeft: number; totalMonths: number } | null
  /** 本月待接的派系任务 id */
  pendingFactionTask?: string | null
  /** 本局已办结过的派系任务 id（避免立刻重复） */
  factionTaskDone?: string[]
  /** 子女升学/就业进度 */
  childPath?: 'none' | 'zhongkao' | 'gaokao' | 'jiuye' | 'done'
  /** 回忆录页数 */
  memoirPages?: number
  /** 多周目：第几世（1=首周目） */
  life?: number
  /** 多周目：继承的门生/余荫标记 */
  inherit?: string[]
  /** 年度目标责任书：每年 1 月与上级签订，12 月对照结算 */
  annualGoals?: AnnualGoals | null
  /** 本年计数器：经手事件 / 办结公务 / 办结台账（年度目标进度来源） */
  yearCounters?: YearCounters
  /** 上一年度目标结算结果（经营台展示用） */
  annualGoalResult?: { year: number; done: number; total: number; allDone: boolean } | null
  /** 秘书被举报案件（弹窗待处置） */
  pendingSecCase?: { name: string } | null
  /** 曾为秘书摆平问题（把柄：纪检立案时严重程度 +10） */
  secShielded?: boolean
}

/** 年度目标：一项可考核的年度指标 */
export interface AnnualGoal {
  id: string
  label: string
  /** 目标值 */
  target: number
  /** 度量口径 */
  kind: 'attrZJ' | 'attrMX' | 'attrNL' | 'attrGX' | 'lian' | 'risk' | 'duty' | 'events' | 'projects'
  /** true 表示「不高于」型（如风险控制） */
  upper?: boolean
}

/** 年度目标责任书 */
export interface AnnualGoals {
  /** 签订年份 */
  year: number
  items: AnnualGoal[]
  /** 是否已结算（防重复） */
  settled?: boolean
}

/** 本年计数器 */
export interface YearCounters {
  year: number
  events: number
  duties: number
  projects: number
}

export interface FamilyState {
  /** 配偶：0 无；1 有 */
  spouse: boolean
  spouseMood: number
  childAge: number // 0 无孩子
  parentHealth: number
}

export interface TimelineEntry {
  year: number
  month: number
  text: string
  kind: 'report' | 'promote' | 'appraisal' | 'punish' | 'crisis' | 'other'
}

/** 纪检程序阶段（对应现实：线索→初核→审查调查→处分） */
export type JijianStage =
  | 'xiansuo' // 线索受理 / 信访举报
  | 'hanxun' // 谈话函询
  | 'chuhe' // 初步核实
  | 'lian' // 立案审查调查
  | 'shenli' // 审理 / 作出处分
  | 'over'

export type PunishLevel =
  | 'tanhan' // 谈话提醒
  | 'jiemian' // 诫勉
  | 'jinggao' // 党内/政务警告
  | 'yanzhong' // 严重警告 / 记过
  | 'chexiao' // 撤销职务 / 降级
  | 'kaitan' // 开除 / 移送

export interface JijianCase {
  stage: JijianStage
  /** 累计严重程度 0-100 */
  severity: number
  /** 线索类型 */
  tip: string
  /** 已走过的程序 */
  steps: string[]
  /** 是否主动配合过 */
  cooperated: boolean
}

export interface OriginMods {
  id: OriginId
  name: string
  desc: string
  fx: AttrFx
}

/** 深度公务类型 */
export type DutyKind = 'pishi' | 'xinfang' | 'qicao' | 'huiyi' | 'peixun'

/** 底部页签 */
export type UiTab =
  | 'duty'
  | 'file'
  | 'net'
  | 'favor'
  | 'faction'
  | 'family'
  | 'proj'
  | 'more'

export interface DutyChoice {
  id: string
  label: string
  hint?: string
  fx?: AttrFx
  riskDelta?: number
  /** 累计质量分（批示/起草/信访） */
  score?: number
  /** 派系相关 */
  faction?: 'A' | 'B' | 'local' | 'none'
  factionRep?: number
  note?: string
}

export interface DutyItem {
  id: string
  kind: DutyKind
  title: string
  text: string
  minRank?: number
  maxRank?: number
  choices: DutyChoice[]
  /** 多轮下一项 id */
  next?: string
  /** 轮次标签 */
  stepLabel?: string
}

/** 进行中的深度公务 */
export interface DutyRun {
  kind: DutyKind
  itemId: string
  /** 已完成轮次 */
  step: number
  /** 累计质量 0-100 */
  score: number
  picks: string[]
  /** 批示台剩余文书 id */
  queue: string[]
  done: boolean
  resultText?: string
  /** 培训天数等 */
  day?: number
}
