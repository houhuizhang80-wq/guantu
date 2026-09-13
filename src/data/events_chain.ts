import type { GameEvent } from '../types'

/**
 * 中局 3 个月连续专项（危机/攻坚链）：
 * 用 afterEvent 串成链，县处–厅局阶段插入，给「等晋升」一点连续剧情。
 */
export const CHAIN_EVENTS: GameEvent[] = [
  // ── 暴雨应急链 ──
  {
    id: 'chain_yu_1',
    kind: 'crisis',
    title: '暴雨橙色预警',
    text: '气象台连发预警，地质灾害点和低洼片区电话打爆。指挥部白板上写了五个村名，有两个下面画了星号。',
    weight: 12,
    onlyOnce: true,
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '扩面转移，宁可十防九空',
        fx: { MX: 6, ZJ: 4, NL: 2, Risk: 2 },
        successRate: 0.9,
        failText: '转移车辆调度混乱，群众有怨言。',
      },
      {
        label: '按预案分级，重点盯星号点',
        fx: { ZJ: 3, NL: 3, MX: 3 },
      },
      {
        label: '先要求各乡镇报数，再统一令',
        fx: { NL: 2, GX: 2, Risk: 3 },
      },
    ],
  },
  {
    id: 'chain_yu_2',
    kind: 'crisis',
    title: '次生灾害',
    text: '雨停了。一处路基塌方，两户房屋进水。有人拍了视频，点赞涨得比水位还快。',
    weight: 12,
    onlyOnce: true,
    require: { afterEvent: 'chain_yu_1' },
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '现场办公，当天拿出安置方案',
        fx: { MX: 7, ZJ: 5, NL: 2 },
      },
      {
        label: '统一口径发布，同步核灾',
        fx: { Lian: 3, NL: 3, MX: 2, GX: 2 },
      },
      {
        label: '先压视频，避免「炒作」',
        fx: { GX: 2, Risk: 7, Lian: -4 },
      },
    ],
  },
  {
    id: 'chain_yu_3',
    kind: 'calm',
    title: '复盘会',
    text: '防汛复盘。有人说「这次运气好」，有人说「体系比去年硬」。你让把问题清单贴在会议室门口。',
    weight: 12,
    onlyOnce: true,
    require: { afterEvent: 'chain_yu_2' },
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '把清单变成明年汛前任务书',
        fx: { ZJ: 6, NL: 4, MX: 3, Risk: -4 },
      },
      {
        label: '表彰先进，问题会后单独谈',
        fx: { GX: 4, MX: 2, ZJ: 2 },
      },
      {
        label: '请上级来「指导」，分摊责任',
        fx: { GX: 5, Lian: -2, ZJ: 1 },
      },
    ],
  },

  // ── 招商项目黄灯链 ──
  {
    id: 'chain_zs_1',
    kind: 'crisis',
    title: '项目黄灯',
    text: '重点招商项目进度亮黄灯：环评与征迁双卡。投资方副总在电话里很客气，也很明确——再拖就要「重新评估」。',
    weight: 12,
    onlyOnce: true,
    minRank: 7,
    maxRank: 14,
    choices: [
      {
        label: '专班驻点，一周两次调度',
        fx: { ZJ: 5, NL: 3, GX: 2, Risk: 2 },
      },
      {
        label: '依法把环评做透，不赶工期',
        fx: { Lian: 5, NL: 3, ZJ: 2 },
      },
      {
        label: '请上级出面「打招呼」',
        fx: { GX: 6, Lian: -5, Risk: 5 },
      },
    ],
  },
  {
    id: 'chain_zs_2',
    kind: 'crisis',
    title: '征迁对峙',
    text: '最后六户在临时板房前摆了小马扎。有人认识你，喊了一声你的职务。摄像机在人群后面。',
    weight: 12,
    onlyOnce: true,
    require: { afterEvent: 'chain_zs_1' },
    minRank: 7,
    maxRank: 14,
    choices: [
      {
        label: '逐户谈，公开补偿口径',
        fx: { MX: 8, ZJ: 4, Lian: 3, GX: -2 },
      },
      {
        label: '请乡贤与律师一起进场',
        fx: { GX: 4, NL: 4, MX: 3 },
      },
      {
        label: '先清场保施工，事后再谈',
        fx: { ZJ: 3, Risk: 10, MX: -6, Lian: -4 },
      },
    ],
  },
  {
    id: 'chain_zs_3',
    kind: 'calm',
    title: '开工或搁置',
    text: '投资方来函：要么本周确认开工节点，要么项目「暂缓研究」。桌上两份稿子，一份写保障，一份写止损。',
    weight: 12,
    onlyOnce: true,
    require: { afterEvent: 'chain_zs_2' },
    minRank: 7,
    maxRank: 14,
    choices: [
      {
        label: '条件成熟就开工，不成熟的砍掉',
        fx: { Lian: 6, ZJ: 5, NL: 3, GX: -2 },
      },
      {
        label: '再争取一轮，给出明确时间表',
        fx: { ZJ: 4, GX: 3, NL: 2 },
      },
      {
        label: '无论如何先把开工仪式办了',
        fx: { ZJ: 6, Risk: 6, Lian: -3 },
      },
    ],
  },

  // ── 巡视反馈整改链 ──
  {
    id: 'chain_xs_1',
    kind: 'crisis',
    title: '巡视反馈',
    text: '巡视组反馈三条问题：形式主义痕迹、专项资金拨付慢、个别干部不担当。签收单上你的名字被加粗打印。',
    weight: 12,
    onlyOnce: true,
    minRank: 8,
    maxRank: 15,
    choices: [
      {
        label: '照单全收，立行立改',
        fx: { Lian: 6, ZJ: 4, NL: 3, GX: -3 },
      },
      {
        label: '分类处置：能改的改，需周期的报计划',
        fx: { NL: 5, ZJ: 4, Lian: 3 },
      },
      {
        label: '强调客观困难，争取「从轻」表述',
        fx: { GX: 3, Lian: -3, Risk: 4 },
      },
    ],
  },
  {
    id: 'chain_xs_2',
    kind: 'daily',
    title: '整改台账',
    text: '整改方案上会。有人主张「销号要快」，有人主张「销号要实」。你要求每一条写清责任人和时限。',
    weight: 12,
    onlyOnce: true,
    require: { afterEvent: 'chain_xs_1' },
    minRank: 8,
    maxRank: 15,
    choices: [
      {
        label: '公开台账，接受监督',
        fx: { Lian: 5, MX: 4, ZJ: 3 },
      },
      {
        label: '内部督办，月通报',
        fx: { NL: 4, ZJ: 3, GX: 2 },
      },
      {
        label: '先挑几条「容易销」的做示范',
        fx: { ZJ: 2, GX: 3, Lian: -2 },
      },
    ],
  },
  {
    id: 'chain_xs_3',
    kind: 'calm',
    title: '销号评估',
    text: '三个月后回头看：两条已销号，一条因历史原因申请延期。巡视办要一份「举一反三」材料。',
    weight: 12,
    onlyOnce: true,
    require: { afterEvent: 'chain_xs_2' },
    minRank: 8,
    maxRank: 15,
    choices: [
      {
        label: '如实写延期原因与补救路径',
        fx: { Lian: 5, NL: 4, ZJ: 3 },
      },
      {
        label: '重点写成效与长效机制',
        fx: { ZJ: 4, GX: 3, MX: 2 },
      },
      {
        label: '请笔杆子「润色」到好看',
        fx: { ZJ: 2, Risk: 5, Lian: -4 },
      },
    ],
  },
]
