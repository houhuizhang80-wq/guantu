import type { GameEvent } from '../types'

/** 按省份气质过滤的事件 */
export const FLAVOR_EVENTS: GameEvent[] = [
  {
    id: 'fl_coastal_1',
    kind: 'daily',
    title: '台风季',
    text: '预警连发。港口停工，渔船回港，你在指挥部看卫星云图。有人问：能不能「先保产值」。',
    weight: 10,
    flavors: ['coastal'],
    minRank: 2,
    maxRank: 14,
    monthMod: [7, 8, 9],
    choices: [
      {
        label: '人先上岸，再谈生产',
        fx: { MX: 6, ZJ: 4, NL: 2 },
      },
      {
        label: '尽量少停产',
        fx: { ZJ: 3, MX: -4, Risk: 4 },
      },
    ],
  },
  {
    id: 'fl_coastal_2',
    kind: 'daily',
    title: '外资企业投诉',
    text: '外商投诉「政策不稳定」。法务与商务口径打架。你在会上问：我们到底能不能给「确定性」。',
    weight: 8,
    flavors: ['coastal'],
    minRank: 5,
    maxRank: 14,
    choices: [
      {
        label: '依法给出可预期政策',
        fx: { ZJ: 4, Lian: 3, NL: 3, GX: -2 },
      },
      {
        label: '特事特办留人',
        fx: { ZJ: 3, Lian: -8, Risk: 6 },
      },
    ],
  },
  {
    id: 'fl_north_1',
    kind: 'daily',
    title: '供暖季',
    text: '寒潮来袭。老旧小区管网爆了两处。市长热线被打爆。你在现场看工人抢修，手冻得握不住笔。',
    weight: 10,
    flavors: ['north', 'northeast'],
    minRank: 2,
    maxRank: 12,
    monthMod: [11, 12, 1, 2],
    choices: [
      {
        label: '连夜抢修，公开进度',
        fx: { MX: 6, ZJ: 4, NL: 2 },
      },
      {
        label: '按计划报修',
        fx: { ZJ: 2, MX: -3 },
      },
    ],
  },
  {
    id: 'fl_north_2',
    kind: 'daily',
    title: '重化工业转型',
    text: '一家老国企要压减产能。工人堵了厂门。你想起「共和国长子」那句话，也想起财政报表。',
    weight: 8,
    flavors: ['north', 'northeast'],
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '稳妥安置 + 再就业培训',
        fx: { MX: 6, ZJ: 4, GX: -2, NL: 3 },
      },
      {
        label: '快刀斩乱麻',
        fx: { ZJ: 3, MX: -6, Risk: 4 },
      },
    ],
  },
  {
    id: 'fl_nw_1',
    kind: 'daily',
    title: '节水与产业',
    text: '高耗水项目要落地。环评说红线碰不得，招商说错过就没了。你站在干涸的渠边。',
    weight: 9,
    flavors: ['northwest'],
    minRank: 4,
    maxRank: 12,
    choices: [
      {
        label: '红线不能碰',
        fx: { Lian: 5, MX: 3, GX: -4, ZJ: 2 },
      },
      {
        label: '批，但加约束条款',
        fx: { ZJ: 4, Lian: -3, NL: 2 },
      },
    ],
  },
  {
    id: 'fl_nw_2',
    kind: 'daily',
    title: '边疆稳定与民生',
    text: '边境乡镇要修一条路。有人说「太偏不值」，有人说「路通了心就稳」。你看了地图很久。',
    weight: 8,
    flavors: ['northwest'],
    minRank: 5,
    maxRank: 14,
    choices: [
      {
        label: '修，作为稳边固边项目',
        fx: { MX: 6, ZJ: 5, GX: -1, NL: 2 },
      },
      {
        label: '缓一缓，先保经济指标',
        fx: { ZJ: 2, MX: -4 },
      },
    ],
  },
  {
    id: 'fl_sw_1',
    kind: 'daily',
    title: '山洪与地灾',
    text: '连日暴雨，地质灾害点告警。转移命令下了三次，仍有老人不肯走。你让人抬也要抬走。',
    weight: 10,
    flavors: ['southwest'],
    minRank: 3,
    maxRank: 12,
    monthMod: [6, 7, 8, 9],
    choices: [
      {
        label: '应转尽转，一个不漏',
        fx: { MX: 8, ZJ: 5, NL: 3 },
        successRate: 0.78,
        failFx: { MX: 3, Risk: 4 },
        failText: '有一处滑坡，幸无伤亡。',
      },
      {
        label: '劝导为主，不强制',
        fx: { MX: -3, Risk: 5 },
      },
    ],
  },
  {
    id: 'fl_sw_2',
    kind: 'daily',
    title: '生态红线',
    text: '文旅项目想「借」一点保护区。图纸上那条红线，你用尺子量了三遍。',
    weight: 8,
    flavors: ['southwest'],
    minRank: 5,
    maxRank: 14,
    choices: [
      {
        label: '红线就是红线',
        fx: { Lian: 5, MX: 3, GX: -3 },
      },
      {
        label: '微调边界「技术处理」',
        fx: { Lian: -10, Risk: 8, ZJ: 3 },
      },
    ],
  },
  {
    id: 'fl_central_1',
    kind: 'daily',
    title: '粮食安全责任',
    text: '耕地「非农化」苗头又起。卫星图斑下来一串。你在田埂上走了十里，鞋上全是黄泥。',
    weight: 9,
    flavors: ['central'],
    minRank: 3,
    maxRank: 12,
    choices: [
      {
        label: '复耕复种，追责到人',
        fx: { MX: 5, ZJ: 4, GX: -3, Lian: 3 },
      },
      {
        label: '先保招商形象',
        fx: { ZJ: 2, Lian: -5, Risk: 4 },
      },
    ],
  },
  {
    id: 'fl_central_2',
    kind: 'daily',
    title: '交通枢纽争夺',
    text: '高铁设站方案在邻县与本市之间摇摆。两边都来「汇报」。你知道，这站一设，十年格局就定了。',
    weight: 8,
    flavors: ['central'],
    minRank: 7,
    maxRank: 14,
    choices: [
      {
        label: '按客货流与规划说话',
        fx: { NL: 4, Lian: 3, ZJ: 3, GX: -3 },
      },
      {
        label: '全力争取设在本市',
        fx: { ZJ: 5, GX: 4, Lian: -2, Risk: 2 },
      },
    ],
  },
]
