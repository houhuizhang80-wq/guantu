import type { GameEvent } from '../types'

/**
 * 扩展主线与日常
 * 主线 storyOrder: 县区 18-19，市级 28-29，省级 38-39
 */
export const EXPAND_EVENTS: GameEvent[] = [
  // ── 县区扩展主线 ─────────────────────────
  {
    id: 'cx_jiaodian',
    kind: 'main',
    title: '县里重点项目观摩',
    text: '全市重点项目观摩要来云河。你分管的点位被选中。有人连夜刷墙，有人连夜改汇报。你把观摩路线改成「既看点也看点问题」。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 18,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '看点 + 看问题，现场办公',
        fx: { ZJ: 6, MX: 5, NL: 3, GX: -3 },
        successRate: 0.72,
        failFx: { ZJ: 1, GX: -5 },
        failText: '观摩团对「问题点」兴趣不大，你被批「不会汇报」。',
      },
      {
        label: '只展示亮点',
        fx: { ZJ: 4, GX: 4, Lian: -3 },
      },
      {
        label: '低调应付，少出错',
        fx: { ZJ: 1, GX: 1 },
      },
    ],
  },
  {
    id: 'cx_banzi_diao',
    kind: 'main',
    title: '班子微调风声',
    text: '风传县里要动班子。有人请你吃饭，有人请你「别去饭局」。马主任递来一张手写名单，又当着你的面撕了。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 19,
    minRank: 9,
    maxRank: 11,
    choices: [
      {
        label: '不站队，只干活',
        fx: { Lian: 5, GX: -4, ZJ: 3 },
      },
      {
        label: '向市里有关领导汇报思想',
        fx: { GX: 8, Lian: -4, Risk: 3 },
        faction: 'B',
      },
      {
        label: '与县委主要领导交底',
        fx: { GX: 6, Lian: 2 },
        require: { npc: [{ id: 'laoshuji', min: 20 }] },
      },
    ],
  },
  // ── 市级扩展主线 ─────────────────────────
  {
    id: 'sc_minsheng_nian',
    kind: 'main',
    title: '市民生实事票决',
    text: '市里要票决年度民生实事。你的方案得票最高，也最花钱。财政局长看你的眼神像在看一张空头支票。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 28,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '得票高的先干，多渠道筹钱',
        fx: { MX: 8, ZJ: 6, NL: 3, GX: -3 },
        successRate: 0.7,
        failFx: { MX: 2, ZJ: 1, Risk: 3 },
        failText: '资金缺口被摆上会，你被要求「再优化」。',
      },
      {
        label: '按财政承受能力砍一半',
        fx: { ZJ: 3, GX: 3, MX: -4, Lian: 2 },
      },
      {
        label: '把难题抛给县区落实',
        fx: { GX: 2, MX: -5, ZJ: 1 },
      },
    ],
  },
  {
    id: 'sc_shuji_xinren',
    kind: 'main',
    title: '新书记三把火',
    text: '新任市委书记上任，提出「三个一」：一年一个大项目、一年一次大招商、一年一场大整治。你被点名牵头其中一件。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 29,
    minRank: 13,
    maxRank: 14,
    choices: [
      {
        label: '接最难的那件',
        fx: { ZJ: 6, NL: 4, MX: 3, GX: -3 },
      },
      {
        label: '接最好出数字的那件',
        fx: { ZJ: 5, GX: 4, Lian: -2 },
      },
      {
        label: '建议再细化方案',
        fx: { NL: 3, GX: -2, ZJ: 1 },
      },
    ],
  },
  // ── 省级扩展主线 ─────────────────────────
  {
    id: 'up_zhongda_xuanze',
    kind: 'main',
    title: '省级重大布局',
    text: '省里要在两个市之间选一个「区域中心城市」。方案各有利弊。你在会上被点名表态。你知道，这一票会影响很多年的资源配置。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 38,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '按数据与区位条件说话',
        fx: { NL: 5, Lian: 4, ZJ: 4, GX: -5 },
      },
      {
        label: '支持本市方案',
        fx: { ZJ: 5, GX: 5, MX: 3, Lian: -3 },
      },
      {
        label: '建议两市协同',
        fx: { GX: 3, NL: 3, ZJ: 2 },
      },
    ],
  },
  {
    id: 'up_jinjing_huibao',
    kind: 'main',
    title: '进京汇报',
    text: '你要就本省一项改革进京汇报。材料改了九稿。出发前夜，你把第一页的三个数字又核了一遍。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 39,
    minRank: 16,
    maxRank: 18,
    choices: [
      {
        label: '讲清成效与问题',
        fx: { ZJ: 6, Lian: 4, NL: 4, GX: 2 },
        successRate: 0.78,
        failFx: { ZJ: 2, GX: -2 },
        failText: '汇报被打断追问，节奏不理想。',
      },
      {
        label: '多讲成绩',
        fx: { ZJ: 3, GX: 3, Lian: -3 },
      },
    ],
  },
  // ── 日常扩展（县以上） ───────────────────
  {
    id: 'ex_xian_ting',
    kind: 'daily',
    title: '县长办公会纪要',
    text: '纪要初稿里，你的发言被「综合表述」成了领导意见。你要求恢复原话——有人觉得你较真。',
    weight: 9,
    minRank: 8,
    maxRank: 12,
    choices: [
      {
        label: '要求恢复原话',
        fx: { Lian: 3, GX: -3, NL: 2 },
      },
      {
        label: '算了，以大局为重',
        fx: { GX: 2, Lian: -1 },
      },
    ],
  },
  {
    id: 'ex_xian_jiceng',
    kind: 'daily',
    title: '村干部集体上访',
    text: '十几个村支书联名反映补贴发放慢。他们在县政府门口站成一排。你让人买了矿泉水，又让人把他们请进会议室。',
    weight: 10,
    minRank: 8,
    maxRank: 12,
    choices: [
      {
        label: '当面听、限期办',
        fx: { MX: 6, ZJ: 4, NL: 3, GX: -2 },
      },
      {
        label: '让乡镇回去消化',
        fx: { GX: 2, MX: -4 },
      },
    ],
  },
  {
    id: 'ex_shi_meiti',
    kind: 'daily',
    title: '市级舆论事件',
    text: '一段「干部与群众争执」的视频在本地号传播。你分管的口子躺枪。宣传部长问：回应还是沉默？',
    weight: 9,
    minRank: 12,
    maxRank: 15,
    choices: [
      {
        label: '两小时内核实回应',
        fx: { MX: 4, Lian: 3, Risk: -4 },
        successRate: 0.72,
        failFx: { Risk: 6, MX: -3 },
        failText: '回应被指「避重就轻」。',
      },
      {
        label: '请宣传口径统一',
        fx: { GX: 3, Risk: 2, Lian: -2 },
      },
    ],
  },
  {
    id: 'ex_shi_caizheng',
    kind: 'daily',
    title: '市财政碰头会',
    text: '财政局长把图表摊开：收入曲线在降，支出曲线在升。会议室安静得像在默哀。',
    weight: 8,
    minRank: 12,
    maxRank: 15,
    choices: [
      {
        label: '压支出、保民生底线',
        fx: { Lian: 3, MX: 3, GX: -3, ZJ: 2 },
      },
      {
        label: '想办法开源',
        fx: { ZJ: 3, NL: 3, Lian: -2, Risk: 2 },
      },
    ],
  },
  {
    id: 'ex_sheng_diaoyan',
    kind: 'daily',
    title: '省委调研组',
    text: '调研组不打招呼，直接进村。你在现场汇报，汗把衬衫粘在背上。问题清单很长，你的名字不在第一条。',
    weight: 9,
    minRank: 15,
    maxRank: 18,
    choices: [
      {
        label: '如实认领并交办',
        fx: { Lian: 4, ZJ: 3, MX: 4, GX: -2 },
      },
      {
        label: '强调客观困难',
        fx: { GX: 2, ZJ: 1, MX: -2 },
      },
    ],
  },
  {
    id: 'ex_sheng_tongbao',
    kind: 'daily',
    title: '全省通报',
    text: '你分管的一项工作被全省通报表扬，也被另一项通报批评。同一天，两份文件放在你桌上。',
    weight: 8,
    minRank: 15,
    maxRank: 18,
    choices: [
      {
        label: '表扬归零，批评整改',
        fx: { NL: 4, ZJ: 3, MX: 3, Lian: 2 },
      },
      {
        label: '先消化表扬',
        fx: { GX: 3, ZJ: 2, MX: -2 },
      },
    ],
  },
  {
    id: 'ex_difang_jiu',
    kind: 'daily',
    title: '地方保护与市场统一',
    text: '外地企业投诉本地「隐形门槛」。你查了三天，确实有几条「土政策」。有人说「保护本地就业」，有人说「破坏统一大市场」。',
    weight: 8,
    minRank: 10,
    maxRank: 16,
    choices: [
      {
        label: '清理土政策',
        fx: { Lian: 5, ZJ: 4, GX: -4, MX: 3 },
      },
      {
        label: '缓缓再说',
        fx: { GX: 3, Lian: -3, ZJ: 1 },
      },
    ],
  },
  {
    id: 'ex_minsheng_shiti',
    kind: 'daily',
    title: '老旧小区加装电梯',
    text: '一楼反对，六楼急切。你开了三场协调会。有人说「政府不该管这么细」，有人说「不管就是不作为」。',
    weight: 8,
    minRank: 8,
    maxRank: 12,
    choices: [
      {
        label: '搭平台，让居民自己谈',
        fx: { MX: 5, NL: 3, ZJ: 2 },
      },
      {
        label: '行政强推',
        fx: { ZJ: 2, MX: -4, Risk: 3 },
      },
    ],
  },
  // ── 乡科级副职（rank 4-6）日常 ─────────────
  {
    id: 'ex_fenzhi_paiban',
    kind: 'daily',
    title: '第一次自己拍板',
    text: '分管的一摊事第一次摆到你桌上。局长只说了一句「你定」，茶杯一端就出去了。办公室里就你一个人，窗外是刚栽的行道树，还绑着支撑木。',
    weight: 8,
    minRank: 4,
    maxRank: 6,
    choices: [
      {
        label: '先跑两个点，摸清底再定',
        fx: { NL: 4, ZJ: 3, MX: 2 },
        successRate: 0.8,
        failFx: { NL: 1, ZJ: -1 },
        failText: '跑了一圈，各说各话，你还是没底。',
      },
      {
        label: '照去年的办法办',
        fx: { ZJ: 2, GX: 3 },
      },
      {
        label: '先请示正职再动',
        fx: { GX: 4, Lian: 2, NL: -1 },
        npcFx: [{ id: 'zhuren', favor: 3 }],
      },
    ],
  },
  {
    id: 'ex_laotongshi_qiu',
    kind: 'daily',
    title: '老同事找上门',
    text: '以前一个办公室的老同事来了，坐下先把门带上。孩子的事情卡在你们这个环节，他说「不为难你，就问一句」。茶水在杯子里转了两圈，还没凉。',
    weight: 8,
    minRank: 4,
    maxRank: 7,
    choices: [
      {
        label: '照规矩办，材料不齐就是不能过',
        fx: { Lian: 6, MX: 2, GX: -4 },
        npcFx: [{ id: 'tongshi', favor: -5 }],
      },
      {
        label: '打个招呼，让下面先受理',
        fx: { GX: 5, Lian: -5, Risk: 3 },
        npcFx: [{ id: 'tongshi', favor: 8 }],
      },
      {
        label: '一句「再等等」，两边都不欠',
        fx: { Lian: 1, MX: -1, GX: -1 },
      },
    ],
  },
  {
    id: 'ex_bucha_cailiao',
    kind: 'daily',
    title: '检查前的台账',
    text: '上级要来检查，办公室通知「材料再完善一下」。你翻开台账，有三栏是空的——去年确实没做，纸上补不了地里的事。',
    weight: 8,
    minRank: 4,
    maxRank: 7,
    choices: [
      {
        label: '空栏照留，写清原因',
        fx: { Lian: 5, ZJ: -1, GX: -3 },
        npcFx: [{ id: 'zhuren', favor: -3 }],
      },
      {
        label: '赶出来一份，把字对齐',
        fx: { ZJ: 3, Lian: -4, Risk: 3 },
      },
      {
        label: '这两个月补做，再补台账',
        fx: { ZJ: 4, NL: 3, MX: 2 },
        successRate: 0.72,
        failFx: { ZJ: 1, MX: 1, Risk: 1 },
        failText: '到期没干完，只补上半数。',
      },
    ],
  },
  {
    id: 'ex_keshi_maodun',
    kind: 'daily',
    title: '两个科长不对付',
    text: '你分管的两个科室，科长互相不接电话，公文靠人跑。其中一个的姑父在市里。分管领导管不管，管到哪一层，是门手艺。',
    weight: 7,
    minRank: 5,
    maxRank: 8,
    choices: [
      {
        label: '重新划分职责边界，白纸黑字',
        fx: { NL: 4, ZJ: 2, GX: -3 },
      },
      {
        label: '各谈一次，各打五十大板',
        fx: { GX: 2, NL: 1, MX: 1 },
      },
      {
        label: '请正职出面协调',
        fx: { GX: 3, NL: -2, ZJ: -1 },
        npcFx: [{ id: 'zhuren', favor: 2 }],
      },
    ],
  },
  {
    id: 'ex_pilou_dandang',
    kind: 'daily',
    title: '分管口出了纰漏',
    text: '一份报出去的数据错了小数点。电话从上级打回来的时候，会场已经散了。谁写的、谁签的、谁该担，笔迹都在纸上。',
    weight: 7,
    minRank: 4,
    maxRank: 8,
    choices: [
      {
        label: '先认下来，再连夜整改',
        fx: { ZJ: 5, NL: 4, GX: -2, Risk: 2 },
        successRate: 0.75,
        failFx: { ZJ: 1, GX: -4, Risk: 4 },
        failText: '整改拖了三天，上级又追了一次。',
      },
      {
        label: '如实说明是哪个环节',
        fx: { ZJ: 2, Lian: -2, GX: -5 },
      },
      {
        label: '让科室自己去说明',
        fx: { GX: 1, NL: -3, MX: -2 },
      },
    ],
  },
  {
    id: 'ex_qunzhong_dumen',
    kind: 'daily',
    title: '门口来了十几个人',
    text: '十几个人堵在办公楼门口，手里举着按了红手印的材料。门卫拦着，有人已经蹲下了。你正好下楼倒水，被认出来了：「你就是管这事的吧？」',
    weight: 8,
    minRank: 4,
    maxRank: 9,
    choices: [
      {
        label: '请进会议室，当场记下诉求',
        fx: { MX: 6, NL: 3, ZJ: 2 },
        npcFx: [{ id: 'laobaixing', favor: 8 }],
      },
      {
        label: '让信访科室来接',
        fx: { MX: -3, GX: 2, ZJ: 1 },
        npcFx: [{ id: 'laobaixing', favor: -6 }],
      },
      {
        label: '「研究研究」，先稳住',
        fx: { MX: -1, ZJ: 1 },
      },
    ],
  },
  {
    id: 'ex_baocun_baodian',
    kind: 'daily',
    title: '包的那个村',
    text: '你包的村离镇上十二公里，土路下雨就断。村干部在电话里说「你来看看就行，别的不用管」。村里的问题写在纸上很整齐，走在路上不是。',
    weight: 7,
    minRank: 4,
    maxRank: 7,
    choices: [
      {
        label: '住一晚，跟几户人家坐下来聊',
        fx: { MX: 5, NL: 3, ZJ: 2, GX: 1 },
        npcFx: [{ id: 'laobaixing', favor: 6 }],
      },
      {
        label: '听汇报，看材料',
        fx: { ZJ: 1, MX: -2 },
      },
      {
        label: '拍两张照片交差',
        fx: { ZJ: 2, MX: -4, Lian: -2, Risk: 2 },
      },
    ],
  },
]
