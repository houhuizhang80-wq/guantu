import type { GameEvent } from '../types'

/**
 * 市级篇（临江市）
 * 岗位窗口：副市长 → 市长 → 市委书记（厅局级）
 * 主线 storyOrder 20–27
 */
export const CITY_EVENTS: GameEvent[] = [
  {
    id: 'sc_furen',
    kind: 'main',
    title: '市委谈话',
    text: '云河的工作干完了，市里的门开了。组织谈话很短：「临江的摊子，比县里大，也比县里杂。」窗外是江，货轮鸣笛，像某种催促。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 20,
    minRank: 12,
    maxRank: 12,
    choices: [
      {
        label: '服从安排，谈对市域协同的想法',
        fx: { NL: 6, GX: 5, ZJ: 3 },
        successRate: 0.8,
        failFx: { GX: -3 },
        failText: '谈话记录：「需进一步打开视野」。',
      },
      {
        label: '只表决心',
        fx: { GX: 3 },
      },
    ],
  },
  {
    id: 'sc_fenguan',
    kind: 'main',
    title: '分管口子',
    text: '副市长分工表下来。你分管发改、交通、生态——全是硬骨头，也是出数字的地方。有人祝贺，有人同情，有人已经在准备「对接材料」。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 21,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '先摸清三个口子的真实家底',
        fx: { NL: 6, ZJ: 3, GX: -2 },
      },
      {
        label: '先抓一个标志性项目立住',
        fx: { ZJ: 8, GX: 3, Risk: 3 },
        successRate: 0.7,
        failFx: { ZJ: 2, Risk: 5 },
        failText: '项目启动即遇征迁阻力，标题很大，进度很慢。',
      },
      {
        label: '多听老同志意见，少动',
        fx: { GX: 5, NL: 2 },
      },
    ],
  },
  {
    id: 'sc_gaotie',
    kind: 'main',
    title: '高铁枢纽之争',
    text: '省里规划过境线，东线走产业新区，西线照顾老区县。两边都有人，两边都有理，两边都把电话打到你手机上。市长只说一句：「市里要一个声音。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 22,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '按客货流与造价做公开比选',
        fx: { NL: 6, Lian: 5, GX: -8, ZJ: 5 },
        successRate: 0.68,
        failFx: { GX: -10, ZJ: 1 },
        failText: '比选报告被指「不够政治」，方案打回重议。',
      },
      {
        label: '服从省里倾向，做好解释',
        fx: { GX: 6, ZJ: 3, MX: -3 },
      },
      {
        label: '两头安抚，把决定权上交',
        fx: { Risk: -2, GX: 1, ZJ: -2 },
      },
    ],
  },
  {
    id: 'sc_huanbao',
    kind: 'main',
    title: '断面考核',
    text: '省环保约谈预通知：临江出境断面连续两月超标。化工园区贡献了税收，也贡献了泡沫。市长在会上没点名，但目光停在你这边三秒。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 23,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '停产整顿一批，公开整改清单',
        fx: { Lian: 8, MX: 6, ZJ: 4, GX: -10, Risk: -4 },
        successRate: 0.72,
        failFx: { ZJ: 2, GX: -8, Risk: 5 },
        failText: '企业联名上书，市里「再研究」。',
      },
      {
        label: '先保税收，加强在线监测',
        fx: { ZJ: 4, Lian: -10, Risk: 10 },
      },
      {
        label: '争取省级技改资金，边改边保',
        fx: { ZJ: 5, NL: 4, GX: 3 },
      },
    ],
  },
  {
    id: 'sc_shizhangjingxuan',
    kind: 'main',
    title: '市长人选',
    text: '市长到龄。省里来考察，名单上有你，也有别人。临江的 GDP 曲线、上访曲线、舆情曲线，一并被摊在会议桌上。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 24,
    minRank: 13,
    maxRank: 14,
    choices: [
      {
        label: '照常工作，用数据说话',
        fx: { ZJ: 5, Lian: 3, GX: -2 },
      },
      {
        label: '向省里有关同志汇报思想',
        fx: { GX: 10, Lian: -5, Risk: 4 },
        faction: 'B',
      },
      {
        label: '把民生短板补成亮点',
        fx: { MX: 8, ZJ: 4, NL: 3 },
        successRate: 0.7,
        failFx: { MX: 2, ZJ: 1 },
        failText: '补短板周期太长，考察组没看到。',
      },
    ],
  },
  {
    id: 'sc_tuwei',
    kind: 'main',
    title: '债务与项目',
    text: '化债专班进驻。有人建议把几个半拉子工程「包装盘活」，有人建议硬着头皮清。省里的口径是「不新增隐性债务」。财政局长的白发，一夜好像多了几根。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 25,
    minRank: 13,
    maxRank: 14,
    choices: [
      {
        label: '依法依规盘活，能缓则缓能停则停',
        fx: { Lian: 6, NL: 5, ZJ: 3, GX: -5 },
      },
      {
        label: '再上一批新项目拉增长',
        hint: '数字好看，债台更高',
        fx: { ZJ: 8, Risk: 12, Lian: -8 },
      },
      {
        label: '争取省级专项与转移支付',
        fx: { GX: 5, ZJ: 4, NL: 3 },
        successRate: 0.65,
        failFx: { GX: -2, ZJ: 1 },
        failText: '跑省里三趟，资金盘子比想象紧。',
      },
    ],
  },
  {
    id: 'sc_shuji',
    kind: 'main',
    title: '市委书记履新',
    text: '新书记从省直空降，第一周就开务虚会。他问：「临江的辨识度是什么？」会议室安静得能听见空调声。你知道，这个问题既是业务，也是站队前的摸底。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 26,
    minRank: 13,
    maxRank: 14,
    choices: [
      {
        label: '提交一份有数据的市情报告',
        fx: { NL: 5, ZJ: 4, GX: 3 },
      },
      {
        label: '全力配合新书记开局',
        fx: { GX: 8, Lian: -2 },
        faction: 'B',
      },
      {
        label: '先稳住分管领域，少表态',
        fx: { Lian: 2, ZJ: 2 },
      },
    ],
  },
  {
    id: 'sc_dazai',
    kind: 'main',
    title: '流域大灾',
    text: '上游暴雨，临江超警。三个县转移，一个化工厂管涌。你在指挥部，电话被打爆。省防指问：「能不能守住？」你听见自己的声音很稳，手在抖。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 27,
    monthMod: [6, 7, 8, 9],
    minRank: 13,
    maxRank: 14,
    choices: [
      {
        label: '科学调度，该撤就撤，该守就守',
        fx: { MX: 12, ZJ: 10, NL: 5, Risk: -5 },
        successRate: 0.78,
        failFx: { MX: 4, ZJ: 4, Risk: 6 },
        failText: '有一处决口，后来堵住了。省里通报「处置有力，教训深刻」。',
      },
      {
        label: '死保重点企业与园区',
        fx: { ZJ: 6, MX: -10, Lian: -5, Risk: 6 },
      },
      {
        label: '全部按最不利情况预案执行',
        fx: { NL: 4, MX: 6, ZJ: 5, GX: -3 },
      },
    ],
  },

  // ── 市级日常 ───────────────────────────────────────
  {
    id: 'sd_shengli',
    kind: 'daily',
    title: '跑省城',
    text: '高铁上改材料。处长约在午饭后十五分钟。你把临江的困难翻译成省里能听懂的「政策语言」，又把省里的难处翻译回市里能接受的「工作语言」。',
    weight: 9,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '材料扎实，当面把账算清',
        fx: { NL: 4, GX: 4, ZJ: 3 },
      },
      {
        label: '多走动，少谈具体困难',
        fx: { GX: 6, Lian: -2 },
      },
      {
        label: '视频会议解决，省下跑腿',
        fx: { ZJ: 2, GX: -3, NL: 2 },
      },
    ],
  },
  {
    id: 'sd_yiqing_fengxian',
    kind: 'daily',
    title: '重大项目风险评估',
    text: '一个百亿级项目要落地临江。环评、稳评、能评都「问题不大」。只有你注意到：股东穿透后，有影子。',
    weight: 8,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '要求穿透核查，暂缓签约',
        fx: { Lian: 8, NL: 4, GX: -6, Risk: -3 },
        require: { Lian: 55 },
      },
      {
        label: '先签框架协议，细节再谈',
        fx: { ZJ: 5, Lian: -6, Risk: 5 },
      },
      {
        label: '请省级部门联审',
        fx: { GX: 3, Risk: -2, ZJ: 2 },
      },
    ],
  },
  {
    id: 'sd_luoshi',
    kind: 'daily',
    title: '督查问责',
    text: '一项民生实事进度全省倒数。省督查组点名临江。责任清单上，你的名字在第一条。下面的人在等你的态度：扛，还是分。',
    weight: 8,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '认账领责，公开整改时间表',
        fx: { MX: 6, ZJ: 3, GX: -4, Lian: 3 },
      },
      {
        label: '说明客观原因，争取调整口径',
        fx: { GX: 3, MX: -2 },
      },
      {
        label: '压实县区责任',
        fx: { ZJ: 2, GX: 2, MX: -4 },
      },
    ],
  },
  {
    id: 'sd_meitishi',
    kind: 'daily',
    title: '舆情会商',
    text: '凌晨的舆情专报：临江「干部豪华食堂」。照片是三年前的，话题是今天的。宣传部长问怎么办。你想起自己在青石镇吃过的那些馒头。',
    weight: 7,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '说明情况并公开现行标准',
        fx: { Lian: 4, MX: 4, GX: -1 },
      },
      {
        label: '请平台处置不实信息',
        fx: { Risk: -2, GX: 2 },
      },
      {
        label: '冷处理',
        fx: { MX: -3, Risk: 3 },
      },
    ],
  },
  {
    id: 'sd_shangrenshi',
    kind: 'daily',
    title: '商会晚宴',
    text: '临江总商会年会。你代表市政府致辞。席间有人提起「当年在县里」的旧事，也有人递来折叠好的「情况反映」。',
    weight: 7,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '致辞后按程序收材料',
        fx: { Lian: 3, MX: 2 },
      },
      {
        label: '与重点客商单独交流',
        fx: { ZJ: 3, GX: 4, Lian: -3 },
      },
      {
        label: '讲完就走',
        fx: { Lian: 2, GX: -2 },
      },
    ],
  },
  {
    id: 'cd_jiating_shi',
    kind: 'daily',
    title: '孩子的电话',
    text: '孩子在电话里说学校的事，很轻。你说「爸爸忙完这阵」。挂了电话，窗外是临江的夜景，灯火连成一片，没有一盏是为你亮的。',
    weight: 5,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '周末一定回家',
        fx: { MX: 2, ZJ: -1 },
      },
      {
        label: '视频多聊一会儿',
        fx: { MX: 1 },
      },
      {
        label: '等忙完这阵',
        fx: { ZJ: 1, MX: -1 },
      },
    ],
  },

  // ── 危机 ───────────────────────────────────────────
  {
    id: 'sc_wenqun',
    kind: 'crisis',
    title: '出租车停运',
    text: '网约车与出租车矛盾激化，主干道被堵。人群里有人举手机直播。你在去现场的路上，市局建议「先清场」。',
    weight: 0,
    minRisk: 30,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '对话先行，依法处置打砸行为',
        fx: { MX: 8, NL: 4, ZJ: 4, Risk: -4 },
        require: { NL: 55 },
        successRate: 0.72,
        failFx: { Risk: 8, MX: -4 },
        failText: '对话破裂，清场画面被剪辑传播。',
      },
      {
        label: '果断清场恢复秩序',
        fx: { Risk: 5, MX: -6, GX: 3 },
      },
      {
        label: '承诺研究，先请代表座谈',
        fx: { MX: 3, ZJ: 1 },
      },
    ],
  },
  {
    id: 'sc_xunshi_shi',
    kind: 'crisis',
    title: '省委巡视',
    text: '巡视组约谈你。问题清单很长，有一条关于「重大项目决策程序」。你想起高铁比选、想起化工园区、想起无数个签字的夜晚。',
    weight: 0,
    minRisk: 35,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '逐项说明，提供全部决策记录',
        fx: { Risk: -8, Lian: 6 },
        require: { Lian: 52 },
        npcFx: [{ id: 'jizhu', favor: 8 }],
      },
      {
        label: '强调集体决策',
        fx: { Risk: 3, Lian: -3, GX: 2 },
      },
      {
        label: '先摸底再谈',
        fx: { Risk: 6, GX: 4, Lian: -6 },
      },
    ],
  },

  // ─── 调节 ───────────────────────────────────────
  {
    id: 'sq_huiqing',
    kind: 'calm',
    title: '回云河',
    text: '调研路过云河。县城多了两条快速路。老部下请你吃饭，菜还是那几样。有人说：「还是当年在镇上踏实。」你没接话，把茶喝完了。',
    weight: 5,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '多留半天，听真话',
        fx: { MX: 4, NL: 3 },
        npcFx: [{ id: 'laoshuji', favor: 5 }],
      },
      {
        label: '行程紧，吃完就走',
        fx: { ZJ: 1 },
      },
    ],
  },
]
