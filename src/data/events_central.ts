import type { GameEvent } from '../types'

/** 中央篇加密：副国/正国日常 */
export const CENTRAL_DAILY_EVENTS: GameEvent[] = [
  {
    id: 'cd_zhongyang_1',
    kind: 'daily',
    title: '国常会材料',
    text: '议题涉及多个部门。你把每一页的「责任主体」用铅笔标出来。有人说你较真。你知道，较真才能落地。',
    weight: 10,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '责任写进纪要',
        fx: { ZJ: 4, NL: 4, GX: -2 },
      },
      {
        label: '原则通过，细则再议',
        fx: { GX: 3, ZJ: 2 },
      },
    ],
  },
  {
    id: 'cd_zhongyang_2',
    kind: 'daily',
    title: '外事会见',
    text: '对方试探你的底线。翻译很稳，你的措辞更稳。会后有人说「刚才那句很有分量」。',
    weight: 8,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '原则清晰、留有余地',
        fx: { NL: 3, GX: 3, Lian: 2 },
      },
      {
        label: '强硬表态',
        fx: { ZJ: 3, GX: -3, MX: 2 },
      },
    ],
  },
  {
    id: 'cd_zhongyang_3',
    kind: 'daily',
    title: '基层联系点',
    text: '你的基层联系点还是那个县。汇报材料写「形势向好」。你要求看原始台账，和一张三年前的对比图。',
    weight: 9,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '要真数据',
        fx: { Lian: 4, MX: 4, NL: 3 },
      },
      {
        label: '听汇报即可',
        fx: { ZJ: 1, Lian: -2 },
      },
    ],
  },
  {
    id: 'cd_zhongyang_4',
    kind: 'daily',
    title: '深夜改稿',
    text: '一份讲话稿改到第七版。你把「高度重视」全部删掉，换成三个可检查的动作。窗外天快亮了。',
    weight: 8,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '可检查才可追责',
        fx: { NL: 4, ZJ: 3, Lian: 2 },
      },
      {
        label: '保留传统文风',
        fx: { GX: 2 },
      },
    ],
  },
  {
    id: 'cd_zhongyang_5',
    kind: 'crisis',
    title: '全国性突发事件',
    text: '你在指挥部。屏幕上的曲线还在爬。你说：「先把人救出来，数字我来扛。」',
    weight: 0,
    minRisk: 40,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '救人优先、信息公开',
        fx: { MX: 8, ZJ: 6, Lian: 4, Risk: -5 },
        successRate: 0.8,
        failFx: { Risk: 8, MX: -4 },
        failText: '二次舆情质疑响应速度。',
      },
      {
        label: '先稳内部再对外',
        fx: { Risk: 5, MX: -5, Lian: -3 },
      },
    ],
  },
  {
    id: 'cd_zhongyang_6',
    kind: 'calm',
    title: '旧镇来信',
    text: '一封没有寄信人的信：「老领导，渠修好了。」你把信收进抽屉最上层。秘书问要不要归档，你说不用。',
    weight: 5,
    minRank: 16,
    maxRank: 19,
    choices: [
      {
        label: '收好',
        fx: { MX: 2, Lian: 1 },
      },
      {
        label: '让秘书代回',
        fx: { MX: 1 },
      },
    ],
  },
  {
    id: 'cd_zhongyang_7',
    kind: 'daily',
    title: '政策吹风会',
    text: '你解释一项全国性政策。记者问「会不会一刀切」。你答了三分钟，没有用一个「进一步」。',
    weight: 8,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '讲清边界与例外',
        fx: { NL: 3, MX: 4, GX: 2 },
      },
      {
        label: '只念通稿',
        fx: { GX: 1, MX: -1 },
      },
    ],
  },
  {
    id: 'cd_buwei_1',
    kind: 'daily',
    title: '部际联席会',
    text: '五部门会签一份方案，四家都同意「原则同意」，分歧全压在最后一页的分工表上。牵头还是配合，笔一落就定调。',
    weight: 10,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '牵头单位写自己，责任揽过来',
        fx: { ZJ: 4, NL: 3, GX: -2 },
      },
      {
        label: '分工请兄弟部门认领，你来协调',
        fx: { GX: 4, ZJ: 2, NL: 1 },
        successRate: 0.85,
        failFx: { ZJ: -2, NL: -1 },
        failText: '推了三轮，分工表还是空的，会期一拖再拖。',
      },
      {
        label: '各管一段，留待实践中磨合',
        fx: { ZJ: 1, Risk: 3 },
      },
    ],
  },
  {
    id: 'cd_buwei_2',
    kind: 'daily',
    title: '专项规划报批',
    text: '五年专项规划到了最后会签。综合部门要求压规模、砍项目，业务司局说这是底线任务。两本账摆在你面前。',
    weight: 9,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '按综合部门口径压',
        fx: { NL: 3, Lian: 2, GX: -1 },
      },
      {
        label: '保重点、压一般',
        fx: { ZJ: 4, NL: 2 },
        successRate: 0.85,
        failFx: { ZJ: -2, Risk: 3 },
        failText: '重点没保住，一般的也没压干净，两头不讨好。',
      },
      {
        label: '再论证一轮，明年再报',
        fx: { Risk: -2, ZJ: -2 },
      },
    ],
  },
  {
    id: 'cd_buwei_3',
    kind: 'daily',
    title: '人大专题询问',
    text: '专题询问现场，委员的问题一个比一个具体，问的全是你分管条线上真实存在、年年报「已解决」的问题。',
    weight: 9,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '摆实情、给时限、列清单',
        fx: { MX: 5, Lian: 3, NL: 3 },
        successRate: 0.85,
        failFx: { ZJ: -2 },
        failText: '时限许得太大，后头来函催办。',
      },
      {
        label: '讲成绩为主，问题带过',
        fx: { ZJ: 2, MX: -4, Lian: -2 },
      },
      {
        label: '请分管司局长替答',
        fx: { NL: -1, MX: -2, GX: 1 },
      },
    ],
  },
  {
    id: 'cd_buwei_4',
    kind: 'crisis',
    title: '中办国办督办件',
    text: '一份督办函到了案头，点名你条线上「整改不力、屡报屡犯」，要求一个月内报结果。处里连夜写说明，你看了三遍，把「客观原因」四个字全划了。',
    weight: 7,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '真改：先免两个责任人再报结果',
        fx: { Lian: 5, MX: 4, Risk: -6, ZJ: 2 },
        successRate: 0.8,
        failFx: { GX: -3, Risk: 3 },
        failText: '动了人，司局怨气不小，说明也不太好写。',
      },
      {
        label: '按惯例写说明、表态度',
        fx: { Risk: 5, Lian: -3, ZJ: -2 },
      },
      {
        label: '上门汇报，当面领任务',
        fx: { GX: 3, Risk: -2, NL: 1 },
        successRate: 0.85,
        failFx: { ZJ: -2 },
        failText: '当面挨了顿批，回来连夜改方案。',
      },
    ],
  },
  {
    id: 'cd_buwei_5',
    kind: 'daily',
    title: '直属单位审计',
    text: '审计报告点名部属一家单位：课题经费互抵、会议费超标。分管副手说「历史遗留」，纪检部门的意见是「先查再说」。',
    weight: 8,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '支持纪检先查',
        fx: { Lian: 6, Risk: -4, GX: -3 },
      },
      {
        label: '先自查自纠，内部处理',
        fx: { Lian: 2, Risk: 2, GX: 2 },
      },
      {
        label: '把报告压一压再说',
        fx: { Risk: 8, Lian: -5 },
      },
    ],
  },
  {
    id: 'cd_buwei_6',
    kind: 'daily',
    title: '两套数据打架',
    text: '同一项指标，业务司报的是 92%，统计口径算出来 78%。分管领导让你「定个口径」。你知道，定错了口径，就是定错了政策。',
    weight: 9,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '从严定口径，宁低勿高',
        fx: { Lian: 4, NL: 4, ZJ: -1 },
      },
      {
        label: '按业务司口径报',
        fx: { ZJ: 3, Risk: 5, Lian: -2 },
      },
      {
        label: '两套并报，附说明',
        fx: { NL: 3, MX: 2, GX: -1 },
      },
    ],
  },
  {
    id: 'cd_buwei_7',
    kind: 'crisis',
    title: '巡视组进驻',
    text: '中央巡视组进驻你所在单位。进驻当天，举报箱前排了队。班子成员开会，有人建议「主动说明几个问题，争取主动」。',
    weight: 7,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '全面配合，有啥说啥',
        fx: { Lian: 5, Risk: -5, NL: 2 },
      },
      {
        label: '正常接待，材料按流程给',
        fx: { ZJ: 1, Risk: 2 },
      },
      {
        label: '打招呼、打招呼、打招呼',
        fx: { Risk: 12, Lian: -6, GX: 2 },
        successRate: 0.5,
        failFx: { Risk: 8, ZJ: -4 },
        failText: '招呼打到了巡视组那里，成了新线索。',
      },
    ],
  },
  {
    id: 'cd_buwei_8',
    kind: 'daily',
    title: '机构改革职能划转',
    text: '新一轮机构改革，你条线上两个司要划走，编随人走。老处长在你办公室坐了很久，说「干了一辈子，想跟队伍一起走」。',
    weight: 7,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '人随事走，一碗水端平',
        fx: { ZJ: 3, NL: 3, MX: 2 },
      },
      {
        label: '保骨干留核心，账面合规',
        fx: { ZJ: 2, GX: -2, Risk: 2 },
      },
      {
        label: '替老同志向编办争一争',
        fx: { MX: 3, GX: 3, ZJ: -1 },
        successRate: 0.75,
        failFx: { ZJ: -2, NL: -1 },
        failText: '编办没有松口，情分欠下了，事没办成。',
      },
    ],
  },
  {
    id: 'cd_buwei_9',
    kind: 'daily',
    title: '八分钟汇报',
    text: '向分管领导汇报条线工作，日程临时压缩，你只有八分钟。秘书准备了四十页的材料，你抽出了三页。',
    weight: 9,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '三页讲完，留两页备问',
        fx: { NL: 4, ZJ: 3, GX: 2 },
      },
      {
        label: '全讲，讲完为止',
        fx: { NL: -1, GX: -2 },
      },
      {
        label: '只讲要钱要政策',
        fx: { ZJ: 2, NL: -1, Lian: -1 },
      },
    ],
  },
  {
    id: 'cd_buwei_10',
    kind: 'calm',
    title: '老部长座谈会',
    text: '退休老部长们在座谈会上提意见，话说得很直。有人说「这个方案十年前我们就论证过」。会议室安静了一下，都看你。',
    weight: 6,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '记下来，能改的当场认',
        fx: { NL: 3, MX: 3, Lian: 2 },
      },
      {
        label: '感谢关心，按既定方案推',
        fx: { ZJ: 2, GX: -1 },
      },
      {
        label: '散会后登门请教',
        fx: { GX: 4, NL: 2 },
        successRate: 0.85,
        failFx: { GX: -1 },
        failText: '老部长出门讲学去了，没见着。',
      },
    ],
  },
]
