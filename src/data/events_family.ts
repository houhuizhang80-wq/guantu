import type { GameEvent } from '../types'

/** 家属系统事件（配偶/子女/父母） */
export const FAMILY_EVENTS: GameEvent[] = [
  {
    id: 'fam_peiou_gongzuo',
    kind: 'daily',
    title: '爱人的工作调动',
    text: '爱人单位要「优化」，暗示可以调到更清闲的岗位，条件是你「关照」一下对方的一个项目。',
    weight: 8,
    minRank: 3,
    maxRank: 14,
    choices: [
      {
        label: '明确拒绝，让爱人自己竞聘',
        fx: { Lian: 6, GX: -4, MX: 1 },
      },
      {
        label: '侧面打个招呼',
        fx: { Lian: -8, Risk: 6, GX: 4 },
      },
      {
        label: '让爱人辞职休息一阵',
        fx: { MX: 1, ZJ: -1, Lian: 2 },
      },
    ],
  },
  {
    id: 'fam_zinv_ruxue',
    kind: 'daily',
    title: '孩子升学',
    text: '重点中学的「共建」名额很诱人。校方说「都是为了孩子」。你想起自己当年怎么考上来的。',
    weight: 8,
    minRank: 4,
    maxRank: 14,
    choices: [
      {
        label: '按学区与成绩正常入学',
        fx: { Lian: 6, MX: 2 },
      },
      {
        label: '托关系「借读」',
        fx: { Lian: -10, Risk: 8, GX: 3 },
      },
      {
        label: '支持孩子上普通学校',
        fx: { Lian: 4, MX: 1, NL: 1 },
      },
    ],
  },
  {
    id: 'fam_fumu_bing',
    kind: 'crisis',
    title: '父母住院',
    text: '父亲突发心梗。医院说要排队，有人说「打个招呼就能住单间」。你站在走廊里，手里捏着手机。',
    weight: 10,
    minRank: 2,
    maxRank: 16,
    choices: [
      {
        label: '按规矩排队，自己请假陪护',
        fx: { Lian: 4, MX: 2, ZJ: -2, NL: 1 },
      },
      {
        label: '请朋友帮忙安排',
        fx: { Lian: -6, GX: 3, Risk: 3 },
      },
      {
        label: '找医院领导「了解情况」',
        fx: { Lian: -10, Risk: 8, GX: 4 },
      },
    ],
  },
  {
    id: 'fam_peiou_maoyuan',
    kind: 'daily',
    title: '「你只顾工作」',
    text: '爱人把结婚照从客厅挪到了卧室。你问为什么，对方说：「客厅是你一个人的。」',
    weight: 7,
    minRank: 2,
    maxRank: 14,
    choices: [
      {
        label: '推掉应酬回家吃饭',
        fx: { MX: 3, ZJ: -1, GX: -1 },
      },
      {
        label: '解释组织工作重要性',
        fx: { ZJ: 1, MX: -2 },
      },
      {
        label: '送礼物弥补',
        fx: { MX: 2, Lian: -1 },
      },
    ],
  },
  {
    id: 'fam_qinqi_tuo',
    kind: 'daily',
    title: '亲戚托你办事',
    text: '表弟想进你分管系统的事业单位。「就一个编制的事。」母亲在电话里也帮腔。',
    weight: 9,
    minRank: 4,
    maxRank: 12,
    choices: [
      {
        label: '明确拒绝，讲清纪律',
        fx: { Lian: 8, GX: -6, MX: 2 },
      },
      {
        label: '让表弟走公开招聘',
        fx: { Lian: 4, NL: 2, GX: -2 },
      },
      {
        label: '暗示下属「关注一下」',
        fx: { Lian: -12, Risk: 10, GX: 5 },
      },
    ],
  },
  {
    id: 'fam_zinv_chuguo',
    kind: 'daily',
    title: '子女出国',
    text: '孩子拿到国外 offer。有人说「领导孩子出国要报备」。你主动填了表，又有人说你「小题大做」。',
    weight: 6,
    minRank: 6,
    maxRank: 16,
    choices: [
      {
        label: '如实报备，不搞特殊',
        fx: { Lian: 5, MX: 1 },
      },
      {
        label: '托人「简化」手续',
        fx: { Lian: -8, Risk: 6 },
      },
    ],
  },
  {
    id: 'fam_jiehun_jinian',
    kind: 'calm',
    title: '结婚纪念日',
    text: '你难得准时回家。爱人做了你爱吃的菜，没提工作。饭后一起看了会儿电视，像普通夫妻那样。',
    weight: 5,
    minRank: 2,
    maxRank: 16,
    choices: [
      {
        label: '认真说谢谢',
        fx: { MX: 4, NL: 1 },
      },
      {
        label: '下次一定更早回来',
        fx: { MX: 2 },
      },
    ],
  },
  {
    id: 'fam_fumu_jiaoxun',
    kind: 'calm',
    title: '父亲的话',
    text: '父亲出院后第一次来你家。他看着墙上的奖状，说：「干净比出息重要。」你点头，没敢看他的眼睛。',
    weight: 5,
    minRank: 4,
    maxRank: 16,
    choices: [
      {
        label: '记在心里',
        fx: { Lian: 3, MX: 1 },
      },
      {
        label: '跟父亲聊工作难处',
        fx: { MX: 2, NL: 1 },
      },
    ],
  },
]
