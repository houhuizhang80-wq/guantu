import type { GameEvent } from '../types'

/**
 * 军地交流事件：厅局级以上地方干部与军队/国防动员接触。
 * 不是独立军队晋升线，只做叙事与属性取舍。
 */
export const JUNDI_EVENTS: GameEvent[] = [
  {
    id: 'jd_dongyuan',
    kind: 'daily',
    title: '国防动员联席会',
    text: '军分区与市里开联席会：民兵整组、交通战备、经济动员潜力调查。部队同志说话很直：「地方数据要准，别只报喜。」',
    weight: 8,
    minRank: 12,
    maxRank: 17,
    choices: [
      { label: '如实编报潜力数据，压实部门责任', fx: { Lian: 4, NL: 4, ZJ: 4, MX: 2 } },
      { label: '抽调骨干与军分区合署办公', fx: { GX: 4, NL: 3, ZJ: 3 } },
      { label: '走过场，材料由办公室代拟', fx: { ZJ: 1, Lian: -2, Risk: 2 } },
    ],
  },
  {
    id: 'jd_yandong',
    kind: 'crisis',
    title: '部队过境驻训',
    text: '某部跨区驻训，要在你辖区补给休整。公路管制、粮油保障、群众纪律……参谋把需求单摊在桌上，很厚。',
    weight: 8,
    minRank: 12,
    maxRank: 17,
    choices: [
      { label: '亲自协调保障，同步做好群众工作', fx: { MX: 6, ZJ: 5, GX: 3, NL: 3 } },
      { label: '指定专班对接，你只抓关键节点', fx: { NL: 4, ZJ: 4, GX: 2 } },
      { label: '让属地乡镇自己扛', fx: { MX: -4, Risk: 4, GX: -2 } },
    ],
  },
  {
    id: 'jd_daizhi',
    kind: 'daily',
    title: '部队代职邀请',
    text: '上级通知：可选派厅级干部到部队代职一年。有人说「镀金」，有人说「吃苦」。组织部把表格放在你桌上。',
    weight: 7,
    minRank: 13,
    maxRank: 16,
    choices: [
      { label: '申请代职，补上军事素养短板', fx: { NL: 6, ZJ: 4, Lian: 2, GX: -2 } },
      { label: '推荐更年轻同志去', fx: { GX: 4, MX: 2, NL: 1 } },
      { label: '以地方工作离不开为由婉拒', fx: { ZJ: 2, GX: 1, NL: -1 } },
    ],
  },
  {
    id: 'jd_zhengbing',
    kind: 'daily',
    title: '征兵宣传日',
    text: '大学城门口，征兵展台前人不少。有学生问：「去两年，回来能安排工作吗？」你把政策解释了三遍。',
    weight: 6,
    minRank: 12,
    maxRank: 15,
    choices: [
      { label: '推动出台更实的优抚与就业衔接', fx: { MX: 7, ZJ: 4, NL: 3 } },
      { label: '加大宣传，讲清待遇与成长', fx: { MX: 4, GX: 2, ZJ: 2 } },
      { label: '压指标到各高校即可', fx: { ZJ: 1, MX: -3, Risk: 2 } },
    ],
  },
  {
    id: 'jd_junmin',
    kind: 'daily',
    title: '军民融合项目',
    text: '有企业拿着「军民融合」概念来要地、要政策。军分区同志私下说：「有的是真技术，有的是贴牌。」',
    weight: 7,
    minRank: 13,
    maxRank: 17,
    choices: [
      { label: '严格尽调，只上真项目', fx: { Lian: 6, NL: 5, ZJ: 4 } },
      { label: '与部队联合评审再供地', fx: { GX: 3, NL: 4, Lian: 3 } },
      { label: '先落地再规范，抢个概念', fx: { ZJ: 3, Lian: -6, Risk: 7 } },
    ],
  },
]
