import type { GameEvent } from '../types'

/**
 * 派系事件：改 faction / factionRep，影响后续门槛与结局观感
 * A 系 / B 系 / 地方系
 */
export const FACTION_EVENTS: GameEvent[] = [
  {
    id: 'fx_zhan_A',
    kind: 'npc',
    title: 'A 系的「茶」',
    text: '县里一位靠 A 系起来的领导约你喝茶。话很直：「班子要齐心。你材料好，缺的是靠山。」茶杯推过来，像递一份投名状。',
    weight: 9,
    onlyOnce: true,
    minRank: 2,
    maxRank: 8,
    choices: [
      {
        label: '表态靠拢',
        hint: '关系大涨，绑上战车',
        fx: { GX: 12, Lian: -6, Risk: 6, ZJ: 2 },
        faction: 'A',
        successRate: 0.8,
        failFx: { GX: -4 },
        failText: '对方笑笑：「再想想。」茶凉了。',
      },
      {
        label: '只谈工作，不谈站队',
        fx: { Lian: 4, GX: -2 },
      },
      {
        label: '婉拒，保持独立',
        fx: { Lian: 5, GX: -8, Risk: 2 },
      },
    ],
  },
  {
    id: 'fx_zhan_B',
    kind: 'npc',
    title: 'B 系的饭局',
    text: '市里下来的干部在县宾馆组局。有人介绍你：「这是××，笔头硬。」席间暗示：市里在看县班子，「自己人」好说话。',
    weight: 9,
    onlyOnce: true,
    minRank: 3,
    maxRank: 10,
    choices: [
      {
        label: '顺势靠近 B 系',
        fx: { GX: 12, Lian: -5, Risk: 5, ZJ: 3 },
        faction: 'B',
      },
      {
        label: '敬酒但不表态',
        fx: { GX: 3, Lian: -1 },
      },
      {
        label: '提前离席',
        fx: { GX: -6, Lian: 4 },
      },
    ],
  },
  {
    id: 'fx_difang',
    kind: 'npc',
    title: '「本地干部」的认同',
    text: '几位乡镇老资格请你喝酒，说你「不像上头下来的，像自己人」。这句话是褒奖，也是把你划进「地方圈」的印章。',
    weight: 8,
    onlyOnce: true,
    minRank: 2,
    maxRank: 7,
    choices: [
      {
        label: '认下这层认同',
        fx: { GX: 10, MX: 4, Lian: -3 },
        faction: 'local',
      },
      {
        label: '感谢但强调按规矩办',
        fx: { Lian: 3, GX: -2, MX: 2 },
      },
    ],
  },
  {
    id: 'fx_chongtu',
    kind: 'main',
    title: '站队被点名',
    text: '常委会上，A、B 两边就一项人事安排顶起来。主持会议的领导突然点你：「××，你什么意见？」全场安静。你知道，这句话会记很久。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 55,
    minRank: 4,
    maxRank: 10,
    choices: [
      {
        label: '支持 A 系人选',
        fx: { GX: 8, Lian: -6, Risk: 5 },
        faction: 'A',
      },
      {
        label: '支持 B 系人选',
        fx: { GX: 8, Lian: -6, Risk: 5 },
        faction: 'B',
      },
      {
        label: '就事论事，不点人名',
        fx: { Lian: 5, GX: -6, NL: 3 },
      },
      {
        label: '建议再酝酿',
        fx: { GX: -2, Lian: 2, Risk: 1 },
      },
    ],
  },
  {
    id: 'fx_beidi',
    kind: 'crisis',
    title: '对头发难',
    text: '有人把你「不站队」写成「墙头草」，材料递到上级。你也听说，是 B 系里对你有意见的人在做局。',
    weight: 0,
    onlyOnce: true,
    minRisk: 40,
    minRank: 3,
    maxRank: 10,
    choices: [
      {
        label: '用实绩和档案回应',
        fx: { ZJ: 4, Lian: 3, Risk: -5, GX: -2 },
        require: { Lian: 50 },
      },
      {
        label: '找 A 系斡旋',
        fx: { GX: 6, Lian: -4, Risk: 3 },
        faction: 'A',
      },
      {
        label: '找 B 系解释',
        fx: { GX: 5, Lian: -3 },
        faction: 'B',
      },
      {
        label: '硬扛，不求人',
        fx: { Lian: 4, GX: -5, Risk: 2 },
      },
    ],
  },
  {
    id: 'fx_diaozheng',
    kind: 'daily',
    title: '班子微调风声',
    text: '风传县里要微调分工。你若在 A 系，可能分管「肥差」；若独立，可能被塞「硬骨头」。马主任递来一张手写名单，又当着你的面撕了。',
    weight: 7,
    onlyOnce: true,
    minRank: 5,
    maxRank: 12,
    choices: [
      {
        label: '主动要难事',
        fx: { ZJ: 5, MX: 4, GX: -2 },
      },
      {
        label: '通过派系争取分管',
        fx: { GX: 6, Lian: -3, Risk: 3 },
      },
      {
        label: '听组织安排',
        fx: { Lian: 2, GX: 1 },
      },
    ],
  },
  {
    id: 'fx_pingheng',
    kind: 'calm',
    title: '夹缝里的分寸',
    text: 'A 系的人说你「跟 B 走得近」；B 系的人说你「还念着 A」。你忽然明白：不站队也是一种站队——站的是自己的椅子。',
    weight: 6,
    onlyOnce: true,
    minRank: 4,
    maxRank: 14,
    choices: [
      {
        label: '两头不得罪，埋头做事',
        fx: { ZJ: 3, NL: 2, Lian: 2, GX: -2 },
      },
      {
        label: '公开强调「只认组织」',
        fx: { Lian: 4, GX: -4, MX: 2 },
      },
    ],
  },
]
