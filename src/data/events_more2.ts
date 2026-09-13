import type { GameEvent } from '../types'

/** 出身事件补全 + 家属冲突 */
export const MORE_EVENTS2: GameEvent[] = [
  {
    id: 'ox2_county',
    kind: 'daily',
    title: '县常委会专题研究',
    text: '你分管领域被列为常委会专题。你准备了三张图：成绩、短板、下一步。有人嫌「问题讲太多」。',
    weight: 6,
    minRank: 8,
    maxRank: 12,
    choices: [
      {
        label: '三张图都摆出来',
        fx: { ZJ: 4, NL: 3, Lian: 2, GX: -2 },
      },
      {
        label: '只讲成绩',
        fx: { ZJ: 2, GX: 3, Lian: -2 },
      },
    ],
  },
  {
    id: 'ox2_city',
    kind: 'daily',
    title: '市里营商环境排名',
    text: '临江在全省营商环境排名掉了两位。市长问你：是客观因素还是主观问题？你答：「都有，但主观能改。」',
    weight: 6,
    minRank: 12,
    maxRank: 15,
    choices: [
      {
        label: '列出可改清单',
        fx: { ZJ: 4, NL: 3, GX: -2 },
      },
      {
        label: '强调客观困难',
        fx: { GX: 2, ZJ: 1, MX: -2 },
      },
    ],
  },
  {
    id: 'ox2_prov',
    kind: 'daily',
    title: '省里改革试点',
    text: '省里要选改革试点县。你所在的县入选，你牵头。试点意味着资源，也意味着责任。',
    weight: 6,
    minRank: 14,
    maxRank: 18,
    choices: [
      {
        label: '试点出经验、可复制',
        fx: { ZJ: 6, NL: 4, MX: 3, GX: -2 },
      },
      {
        label: '稳妥推进，少出错',
        fx: { ZJ: 3, Lian: 2 },
      },
    ],
  },
  {
    id: 'fam_spouse_conflict',
    kind: 'crisis',
    title: '配偶单位与分管领域',
    text: '爱人所在单位正好在你分管领域内。有人暗示「可以关照」。你想起结婚时说过的「公事公办」。',
    weight: 8,
    minRank: 8,
    maxRank: 14,
    choices: [
      {
        label: '主动回避配偶单位事项',
        fx: { Lian: 6, MX: 2, GX: -3 },
      },
      {
        label: '按原则办事，不回避',
        fx: { Lian: 2, GX: 2 },
      },
      {
        label: '暗示下面「正常办」',
        fx: { Lian: -10, Risk: 8, GX: 5 },
      },
    ],
  },
  {
    id: 'ret_advise',
    kind: 'calm',
    title: '顾问调研',
    text: '退休后你受邀顾问调研。年轻人问你「基层最难的是什么」。你说：「把上面的好政策，变成老百姓能摸到的实惠。」',
    weight: 6,
    minRank: 8,
    maxRank: 18,
    choices: [
      {
        label: '认真写建议',
        fx: { NL: 3, MX: 3 },
      },
      {
        label: '随便说说',
        fx: { NL: 1 },
      },
    ],
  },
  {
    id: 'ret_book',
    kind: 'calm',
    title: '写回忆录',
    text: '你在整理材料与回忆。不涉及未公开事项，只写「怎么把事办成」。出版社说「太克制」。',
    weight: 5,
    minRank: 10,
    maxRank: 18,
    choices: [
      {
        label: '坚持克制',
        fx: { Lian: 3, MX: 2 },
      },
      {
        label: '加点「内幕」',
        fx: { Lian: -4, GX: 2, Risk: 3 },
      },
    ],
  },
  {
    id: 'ret_forum',
    kind: 'calm',
    title: '资政建言座谈会',
    text: '你参加座谈会。发言克制而具体。有人说「老领导还是有水平」。你笑了笑，想起第一次写材料的夜晚。',
    weight: 5,
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '讲具体建议',
        fx: { NL: 2, MX: 2, ZJ: 1 },
      },
      {
        label: '少讲',
        fx: { Lian: 1 },
      },
    ],
  },
]
