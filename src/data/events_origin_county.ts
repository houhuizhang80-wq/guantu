import type { GameEvent } from '../types'

/**
 * 县区段出身专属（minRank 5–8）：出身故事在更高岗位回响
 */
export const ORIGIN_COUNTY_EVENTS: GameEvent[] = [
  {
    id: 'oxc_xd_zuzhi',
    kind: 'main',
    title: '组织回访选调生',
    text: '你已任镇领导。县委组织部旧档里仍有你的选调编号。回访表有一栏：「是否仍扎根基层意愿强烈」。你填「是」，笔顿了顿。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 70,
    originIds: ['xuandiao_pu', 'xuandiao_ding'],
    minRank: 5,
    maxRank: 8,
    choices: [
      {
        label: '如实写，并举具体工作',
        fx: { Lian: 3, ZJ: 4, GX: 3 },
      },
      {
        label: '争取交流到上级机关',
        fx: { GX: 5, ZJ: 2, MX: -2 },
      },
    ],
  },
  {
    id: 'oxc_sk_zhiyuan',
    kind: 'daily',
    title: '当年的考场',
    text: '省考面试考场设在县一中。你以考官身份回去，走廊里全是紧张的年轻人。有人认出你：「学长，怎么才能上岸？」',
    weight: 6,
    onlyOnce: true,
    originIds: ['shengkao', 'waisheng', 'xuandiao_pu'],
    minRank: 5,
    maxRank: 8,
    choices: [
      {
        label: '讲真话：上岸只是开始',
        fx: { MX: 3, Lian: 2, NL: 2 },
      },
      {
        label: '只讲技巧',
        fx: { NL: 1, GX: 1 },
      },
    ],
  },
  {
    id: 'oxc_gk_shangji',
    kind: 'main',
    title: '条线上级来县座谈',
    text: '你以县领导身份接待垂管上级。当年你听他们的，现在他们听你汇报县情。座位换了，条令与块块的张力没换。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 70,
    originIds: ['guokao', 'jishu', 'shiye_tiao'],
    minRank: 6,
    maxRank: 9,
    choices: [
      {
        label: '争取条线项目落地县里',
        fx: { ZJ: 6, GX: 4, NL: 3 },
      },
      {
        label: '强调地方统筹',
        fx: { MX: 4, GX: 3, ZJ: 2 },
      },
    ],
  },
  {
    id: 'oxc_cg_laocun2',
    kind: 'npc',
    title: '原服务村的路',
    text: '你分管交通。原服务村的路要升级，方案里有一条「绕开」的备选。村支书打电话：「领导，不能绕啊。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 71,
    originIds: ['cunguan', 'sanfuyi', 'xibu', 'benxiang'],
    minRank: 5,
    maxRank: 8,
    choices: [
      {
        label: '依法依规争取主线过村',
        fx: { MX: 8, ZJ: 5, Lian: 2, GX: -3 },
      },
      {
        label: '服从规划，做解释工作',
        fx: { Lian: 3, MX: -3, GX: 2 },
      },
      {
        label: '打招呼让方案「照顾」',
        fx: { MX: 4, Lian: -10, Risk: 8, GX: 4 },
      },
    ],
  },
  {
    id: 'oxc_jz_baoxian',
    kind: 'daily',
    title: '维稳演练',
    text: '县里搞应急演练，让你「按部队标准」挑毛病。你一口气列出七处漏洞。有人脸挂不住，有人偷偷记笔记。',
    weight: 6,
    onlyOnce: true,
    originIds: ['jizhuan'],
    minRank: 5,
    maxRank: 9,
    choices: [
      {
        label: '硬标准，会后培训',
        fx: { NL: 4, ZJ: 4, GX: -3 },
      },
      {
        label: '点到为止',
        fx: { GX: 2, ZJ: 2 },
      },
    ],
  },
  {
    id: 'oxc_rc_xiangmu',
    kind: 'main',
    title: '专家论证会',
    text: '县里重大规划请专家。你坐在主席位，台下有你当年的导师。导师私下说：「你现在更像官员，不像学者。」你笑了笑，没反驳。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 70,
    originIds: ['rencai', 'biguan', 'xuandiao_ding'],
    minRank: 6,
    maxRank: 9,
    choices: [
      {
        label: '把学术标准写进决策流程',
        fx: { NL: 5, ZJ: 5, Lian: 2 },
      },
      {
        label: '更强调可执行与稳定',
        fx: { ZJ: 4, GX: 3, NL: 1 },
      },
    ],
  },
  {
    id: 'oxc_sy_bianzhi',
    kind: 'daily',
    title: '机构改革',
    text: '县里机构改革，事业单位与行政编制重新划。你经历过一次身份转换，这次是给别人画线。手里的笔很沉。',
    weight: 6,
    onlyOnce: true,
    originIds: ['shiye_tiao', 'guoqi_tiao'],
    minRank: 6,
    maxRank: 9,
    choices: [
      {
        label: '公开公平，按方案来',
        fx: { Lian: 5, GX: -3, MX: 3 },
      },
      {
        label: '照顾「老同志」',
        fx: { GX: 6, Lian: -4, Risk: 3 },
      },
    ],
  },
  {
    id: 'oxc_gq_zhaoshang',
    kind: 'main',
    title: '老东家来县投资',
    text: '你曾任职的国企要到县里上项目。对接会上，对方熟稔地喊你旧职务。你说：「现在我是县里的干部。」全场安静了两秒。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 70,
    originIds: ['guoqi_tiao'],
    minRank: 6,
    maxRank: 9,
    choices: [
      {
        label: '回避，交由专班依法招引',
        fx: { Lian: 8, GX: -5, ZJ: 2 },
      },
      {
        label: '积极对接，要优惠条件',
        fx: { ZJ: 6, Lian: -8, Risk: 6, GX: 5 },
      },
      {
        label: '参与但全程留痕',
        fx: { Lian: 3, ZJ: 4, NL: 3 },
      },
    ],
  },
  {
    id: 'oxc_bg_diaoyan',
    kind: 'daily',
    title: '大兴调查研究',
    text: '县里要求班子成员蹲点调研。你带的组报告写得最好，有人酸：「笔杆子下基层，还是写材料。」你把附件里的走访照片又加了三页。',
    weight: 6,
    onlyOnce: true,
    originIds: ['biguan', 'xuandiao_pu'],
    minRank: 5,
    maxRank: 8,
    choices: [
      {
        label: '用问题清单推动整改',
        fx: { ZJ: 5, MX: 4, NL: 3 },
      },
      {
        label: '报告写好即可',
        fx: { NL: 2, GX: 1 },
      },
    ],
  },
  {
    id: 'oxc_js_zhiliang2',
    kind: 'crisis',
    title: '分管领域的质量事故',
    text: '你分管的工程出了质量问题。检测报告像一份判决书。签字栏里有你的名字——三年前签的。',
    weight: 0,
    onlyOnce: true,
    originIds: ['jishu', 'shiye_tiao', 'jizhuan'],
    minRisk: 30,
    minRank: 6,
    maxRank: 10,
    choices: [
      {
        label: '主动担责并启动追责整改',
        fx: { Lian: 6, ZJ: 3, MX: 4, GX: -4, Risk: -4 },
      },
      {
        label: '强调历史原因与程序',
        fx: { Lian: -4, GX: 3, Risk: 4 },
      },
      {
        label: '全力补救，淡化责任',
        fx: { ZJ: 2, MX: 2, Lian: -6, Risk: 5 },
      },
    ],
  },
  {
    id: 'oxc_bx_huibi',
    kind: 'main',
    title: '成长地交流',
    text: '组织谈话：按回避与交流要求，你可能要离开云河或到市里任职。父亲电话里沉默很久，只说：「公事公办。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 72,
    originIds: ['benxiang'],
    minRank: 7,
    maxRank: 10,
    choices: [
      {
        label: '服从交流安排',
        fx: { Lian: 6, GX: 2, MX: 2 },
      },
      {
        label: '申请暂留，把事做完',
        fx: { ZJ: 4, GX: -2, Risk: 2 },
      },
    ],
  },
  {
    id: 'oxc_gj_yinbi',
    kind: 'daily',
    title: '「余荫」的反噬',
    text: '巡视谈话问及你与「父辈旧部」的交往。你列了饭局时间地点，一条不落。有人觉得你小题大做，你知道这是护身符。',
    weight: 6,
    onlyOnce: true,
    originIds: ['ganbu_jun'],
    minRank: 5,
    maxRank: 10,
    choices: [
      {
        label: '主动报备全部往来',
        fx: { Lian: 6, Risk: -5, GX: -2 },
      },
      {
        label: '拣重要的说',
        fx: { Lian: -2, GX: 2, Risk: 2 },
      },
    ],
  },
  {
    id: 'oxc_ws_waidi',
    kind: 'daily',
    title: '「外地干部」标签',
    text: '有人在背后说你「迟早要走，不会真给云河办事」。你把年度民生实事完成率做到全县第一。标签没消，数字在那里。',
    weight: 6,
    onlyOnce: true,
    originIds: ['waisheng', 'jizhuan', 'rencai'],
    minRank: 5,
    maxRank: 9,
    choices: [
      {
        label: '用数字回应',
        fx: { ZJ: 6, MX: 5, NL: 2 },
      },
      {
        label: '少解释，多下乡',
        fx: { MX: 4, NL: 2, GX: 1 },
      },
    ],
  },
  {
    id: 'oxc_xb_yuanqu',
    kind: 'main',
    title: '对口协作',
    text: '市里安排云河与西部某县结对。你主动请缨牵头。有人说你「作秀」，你在方案里写了三年指标，不写口号。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 70,
    originIds: ['xibu', 'cunguan', 'sanfuyi'],
    minRank: 6,
    maxRank: 9,
    choices: [
      {
        label: '务实结对，少搞仪式',
        fx: { ZJ: 5, MX: 5, Lian: 3, NL: 2 },
      },
      {
        label: '大造声势',
        fx: { GX: 4, ZJ: 3, Lian: -2 },
      },
    ],
  },
  {
    id: 'oxc_sf_nongji',
    kind: 'daily',
    title: '农技推广的老问题',
    text: '你分管农业。农技站还是「会开得多、田进得少」。你想起自己三支一扶时的办法：把课开到地头。',
    weight: 6,
    onlyOnce: true,
    originIds: ['sanfuyi', 'jishu', 'cunguan'],
    minRank: 5,
    maxRank: 8,
    choices: [
      {
        label: '推广地头课堂',
        fx: { MX: 6, NL: 3, ZJ: 3 },
      },
      {
        label: '考核压实乡镇',
        fx: { ZJ: 3, GX: -2, MX: 2 },
      },
    ],
  },
]
