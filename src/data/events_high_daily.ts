import type { GameEvent } from '../types'

/**
 * 厅局 / 省部 / 中央 日常与危机（填补高层空窗）
 */
export const HIGH_DAILY_EVENTS: GameEvent[] = [
  {
    id: 'hd_huiyi_chang',
    kind: 'daily',
    title: '连轴的会',
    text: '上午常务会，下午专题会，晚上碰头会。秘书把材料换了三回。你发现自己已经能在半睡状态抓住关键句。',
    weight: 12,
    minRank: 10,
    maxRank: 19,
    choices: [
      {
        label: '压会合并，提高含金量',
        fx: { NL: 3, ZJ: 3, GX: -3 },
        successRate: 0.7,
        failFx: { GX: -5 },
        failText: '压会通知发了，会议改在饭点接着开。',
      },
      {
        label: '按惯例开完',
        fx: { GX: 2 },
      },
      {
        label: '只参加必须到的',
        fx: { NL: 2, ZJ: 2, GX: -2 },
      },
    ],
  },
  {
    id: 'hd_paosheng',
    kind: 'daily',
    title: '跑省进京',
    text: '高铁上改汇报。处长只给十五分钟。你把三十页压成三页，又把三页压成三个数。',
    weight: 10,
    minRank: 10,
    maxRank: 19,
    choices: [
      {
        label: '数据说话，直奔主题',
        fx: { ZJ: 4, NL: 3, GX: 3 },
      },
      {
        label: '多走动，少谈困难',
        fx: { GX: 5, Lian: -2 },
      },
      {
        label: '视频会议解决',
        fx: { ZJ: 1, GX: -2 },
      },
    ],
  },
  {
    id: 'hd_yusqing',
    kind: 'crisis',
    title: '舆情突然起来',
    text: '凌晨两点，外地号一篇稿冲上热榜。配图是三年前的旧现场。宣传部长声音发紧：「领导，怎么办？」',
    weight: 0,
    minRisk: 35,
    minRank: 10,
    maxRank: 19,
    choices: [
      {
        label: '两小时内核实并回应',
        fx: { MX: 5, Lian: 4, Risk: -6, NL: 3 },
        require: { Lian: 50 },
        successRate: 0.72,
        failFx: { Risk: 8, MX: -5 },
        failText: '回应被指「避重就轻」，二次发酵。',
      },
      {
        label: '请平台处置不实信息',
        fx: { Risk: -3, GX: 3, Lian: -3 },
      },
      {
        label: '冷处理',
        fx: { Risk: 6, MX: -4 },
      },
    ],
  },
  {
    id: 'hd_anquan_gao',
    kind: 'crisis',
    title: '安全生产警报',
    text: '园区企业报警。你在去现场的路上，电话里伤亡数字还在变。全国的镜头可能都在路上。',
    weight: 0,
    minRisk: 30,
    minRank: 11,
    maxRank: 19,
    choices: [
      {
        label: '救人优先，如实通报',
        fx: { MX: 7, ZJ: 5, Lian: 4, Risk: -5 },
        successRate: 0.78,
        failFx: { Risk: 8 },
        failText: '二次舆情质疑瞒报。',
      },
      {
        label: '统一口径再发',
        fx: { Risk: 6, MX: -5, Lian: -4 },
      },
      {
        label: '授权现场指挥部',
        fx: { ZJ: 3, NL: 2 },
      },
    ],
  },
  {
    id: 'hd_zhaiwu',
    kind: 'daily',
    title: '化债专班碰头',
    text: '财政、发改、属地都在。有人建议「再包装两个项目」。你看了一眼窗外，又看了一眼会议纪要模板。',
    weight: 9,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '依法依规，能缓则缓',
        fx: { Lian: 5, NL: 3, ZJ: 3, GX: -3 },
      },
      {
        label: '新增项目拉增长',
        fx: { ZJ: 5, Risk: 10, Lian: -6 },
      },
      {
        label: '跑省里要转移支付',
        fx: { GX: 4, ZJ: 3 },
        successRate: 0.65,
        failFx: { GX: -2 },
        failText: '盘子比想象紧。',
      },
    ],
  },
  {
    id: 'hd_xuanba',
    kind: 'daily',
    title: '干部推荐谈话',
    text: '组织问你对某位同志的看法。你知道他能干，也知道他跟对家走得近。每一句评价都会进档案。',
    weight: 9,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '只谈工作实绩',
        fx: { Lian: 3, NL: 2, GX: -1 },
      },
      {
        label: '如实指出优缺点',
        fx: { Lian: 4, NL: 2, GX: -2 },
      },
      {
        label: '暗示「再看看」',
        fx: { GX: 2, Lian: -2, Risk: 2 },
      },
    ],
  },
  {
    id: 'hd_waishi',
    kind: 'daily',
    title: '外事与招商酒会',
    text: '同声传译在耳麦里很稳。对方问「政策连续性」。你想起无数个签字的夜晚，答得很克制。',
    weight: 7,
    minRank: 13,
    maxRank: 19,
    choices: [
      {
        label: '讲法治与规则',
        fx: { Lian: 3, ZJ: 3, NL: 2 },
      },
      {
        label: '给足「弹性空间」暗示',
        fx: { GX: 4, Lian: -6, Risk: 5 },
      },
    ],
  },
  {
    id: 'hd_jiceng',
    kind: 'daily',
    title: '不打招呼下乡',
    text: '你让司机拐进计划外的村。巷子很窄，狗叫得很凶。听到的话，比汇报里真。',
    weight: 8,
    minRank: 10,
    maxRank: 16,
    choices: [
      {
        label: '记下问题，限期交办',
        fx: { MX: 6, ZJ: 4, NL: 3 },
      },
      {
        label: '现场能解决的现场办',
        fx: { MX: 5, ZJ: 3 },
      },
    ],
  },
  {
    id: 'hd_laoren_gao',
    kind: 'calm',
    title: '老领导来电',
    text: '已退休的老领导只问了一句：「还干净吗？」停顿三秒，他说：「干净就继续干。」',
    weight: 5,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '如实回答',
        fx: { Lian: 3, NL: 2 },
      },
      {
        label: '报喜',
        fx: { GX: 1, Lian: -1 },
      },
    ],
  },
  {
    id: 'hd_jiating_gao2',
    kind: 'daily',
    title: '家属的沉默',
    text: '爱人把体检报告放在你书桌上，没说话。孩子升学的事，你答应过三次家长会。',
    weight: 7,
    minRank: 11,
    maxRank: 19,
    choices: [
      {
        label: '推掉应酬，陪家人',
        fx: { MX: 3, ZJ: -1, GX: -1 },
      },
      {
        label: '让秘书安排，自己走不开',
        fx: { ZJ: 1, MX: -2 },
      },
    ],
  },
  {
    id: 'hd_xunshi_sheng',
    kind: 'crisis',
    title: '巡视谈话',
    text: '谈话提纲里有一条：重大决策程序与廉洁风险。窗外的树影很长。你把这些年签过的字在心里过了一遍。',
    weight: 0,
    minRisk: 40,
    minRank: 14,
    maxRank: 19,
    choices: [
      {
        label: '全面配合，有一说一',
        fx: { Risk: -8, Lian: 5 },
        require: { Lian: 55 },
      },
      {
        label: '强调程序完备',
        fx: { Risk: 3, Lian: -2 },
      },
      {
        label: '先打听范围',
        fx: { Risk: 6, GX: 3, Lian: -5 },
      },
    ],
  },
  {
    id: 'hd_liangshi',
    kind: 'daily',
    title: '粮食安全责任制',
    text: '耕地保有量、播种面积、产量数据三张表对不齐。有人建议「技术处理」。你让人把原始台账搬进会议室。',
    weight: 7,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '实事求是，能种尽种',
        fx: { Lian: 5, MX: 4, ZJ: 3, GX: -2 },
      },
      {
        label: '先保考核过关',
        fx: { ZJ: 3, Lian: -6, Risk: 5 },
      },
    ],
  },
  {
    id: 'hd_shengtai',
    kind: 'daily',
    title: '环保督察回头看',
    text: '去年整改的点位，抽查又冒烟。督察组的相机很专业。属地书记脸色发白。',
    weight: 8,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '当场交办，公开整改',
        fx: { Lian: 4, MX: 4, ZJ: 3, GX: -3 },
      },
      {
        label: '先稳住督察组情绪',
        fx: { GX: 3, Lian: -3, Risk: 3 },
      },
    ],
  },
  {
    id: 'hd_jiaoshou',
    kind: 'calm',
    title: '回母校',
    text: '校庆邀请你讲话。礼堂里都是年轻眼睛。你没讲官话，只讲了第一次下村时鞋底的泥。',
    weight: 5,
    minRank: 13,
    maxRank: 19,
    choices: [
      {
        label: '讲真话',
        fx: { MX: 3, Lian: 2, NL: 1 },
      },
      {
        label: '讲场面话',
        fx: { GX: 2 },
      },
    ],
  },
  {
    id: 'hd_juece',
    kind: 'daily',
    title: '重大决策社会稳定风险评估',
    text: '评估报告写「低风险」。你要求把信访苗头单独附录。有人觉得你多事。',
    weight: 8,
    minRank: 11,
    maxRank: 19,
    choices: [
      {
        label: '坚持附录并预置方案',
        fx: { NL: 3, MX: 4, ZJ: 3, Risk: -3 },
      },
      {
        label: '按报告结论办',
        fx: { ZJ: 2, Risk: 3 },
      },
    ],
  },
]
