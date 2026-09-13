import type { GameEvent } from '../types'

/**
 * 逆境随机事件：举报 / 污蔑 / 打压 / 离间
 * 权重较高，穿插在日常中制造阻力
 */
export const ADVERSITY_EVENTS: GameEvent[] = [
  {
    id: 'adv_jubao',
    kind: 'crisis',
    title: '一封匿名举报信',
    text: '县纪委转来一封没有署名的信，反映你「与管理服务对象交往过密、接受宴请」。信纸是打印的，细节却像有人盯着你写。',
    weight: 14,
    minRank: 1,
    maxRank: 16,
    choices: [
      {
        label: '主动约谈说明，提交往来记录',
        fx: { Lian: 5, Risk: -6, GX: -2 },
        require: { Lian: 48 },
        successRate: 0.8,
        failFx: { Risk: 5 },
        failText: '说明被要求「再补充」。',
      },
      {
        label: '按程序配合，不扩大事态',
        fx: { Lian: 2, Risk: 1 },
      },
      {
        label: '找人打听是谁写的',
        fx: { GX: 4, Lian: -6, Risk: 8 },
      },
    ],
  },
  {
    id: 'adv_wumie',
    kind: 'crisis',
    title: '被泼脏水',
    text: '本地群里流传一张模糊照片，配文暗示你「私会某老板」。照片是三年前的公开活动剪裁。转发已经过百。',
    weight: 12,
    minRank: 1,
    maxRank: 16,
    choices: [
      {
        label: '公开澄清并保留追责权利',
        fx: { MX: 3, Lian: 3, Risk: -4, GX: -1 },
        successRate: 0.72,
        failFx: { MX: -3, Risk: 4 },
        failText: '澄清帖被二次剪辑。',
      },
      {
        label: '不回应，等它过去',
        fx: { MX: -3, Risk: 4 },
      },
      {
        label: '请朋友「压一压」传播',
        fx: { Lian: -5, Risk: 5, GX: 3 },
      },
    ],
  },
  {
    id: 'adv_daya',
    kind: 'daily',
    title: '被穿小鞋',
    text: '你负责的项目，资金批文「刚好」卡在流程里。经办人笑得很客气：「材料还要再完善完善。」你知道，比你晚交的都过了。',
    weight: 12,
    minRank: 1,
    maxRank: 14,
    choices: [
      {
        label: '补齐材料，当面催办',
        fx: { ZJ: 2, NL: 3, GX: -2 },
        successRate: 0.7,
        failFx: { ZJ: -1 },
        failText: '又说缺一份附件。',
      },
      {
        label: '越级反映卡壳问题',
        fx: { ZJ: 3, GX: -6, Risk: 2 },
        successRate: 0.6,
        failFx: { GX: -10 },
        failText: '被批「不讲程序」。',
      },
      {
        label: '找中间人疏通',
        fx: { GX: 5, Lian: -4, ZJ: 2 },
      },
    ],
  },
  {
    id: 'adv_lijian',
    kind: 'npc',
    title: '有人传你坏话',
    text: '周书记找你谈话，语气平和：「有人说你在背后议论班子。」你愣住——你记得自己只说过「材料口径要统一」。传话的人，你猜得到几个。',
    weight: 11,
    minRank: 2,
    maxRank: 12,
    choices: [
      {
        label: '当面解释原话，不猜是谁',
        fx: { GX: 3, Lian: 2, MX: 1 },
        npcFx: [{ id: 'laoshuji', favor: 6 }],
        successRate: 0.75,
        failFx: { GX: -4 },
        failText: '书记说「我知道了」，表情看不出信没信。',
      },
      {
        label: '反过来查谁在传',
        fx: { GX: -4, Risk: 3, Lian: -2 },
      },
      {
        label: '用工作结果说话',
        fx: { ZJ: 4, NL: 2 },
      },
    ],
  },
  {
    id: 'adv_jiedao',
    kind: 'daily',
    title: '功劳被截胡',
    text: '你牵头的试点在县里大会上被表扬，发言的是分管领导，从头到尾没提你的名字。台下有人看你，你鼓掌，手有点重。',
    weight: 12,
    minRank: 2,
    maxRank: 14,
    choices: [
      {
        label: '会后向领导补送完整材料',
        fx: { GX: 3, ZJ: 1, Lian: 1 },
      },
      {
        label: '在自己条线内部正名',
        fx: { MX: 3, GX: -2, ZJ: 2 },
      },
      {
        label: '咽下，继续干下一件',
        fx: { NL: 2, MX: 1, GX: -1 },
      },
    ],
  },
  {
    id: 'adv_weixie',
    kind: 'crisis',
    title: '软硬兼施',
    text: '一个「熟人」打电话，说他手里有你「当年签过字」的材料影印件，「大家都不容易」。电话挂断前，他说了你孩子的学校名。',
    weight: 8,
    minRisk: 35,
    minRank: 2,
    maxRank: 16,
    choices: [
      {
        label: '报警并报告组织',
        fx: { Lian: 6, Risk: -5, GX: -2 },
        require: { Lian: 50 },
      },
      {
        label: '找中间人「了结」',
        fx: { Lian: -12, Risk: 12, GX: 4 },
      },
      {
        label: '硬扛，不回应',
        fx: { Risk: 6, MX: -1 },
      },
    ],
  },
  {
    id: 'adv_paiban',
    kind: 'daily',
    title: '班子会上的冷场',
    text: '你提的议题，会场安静了五秒。李副书记端起茶杯吹了吹，才有人附和「再研究」。你知道，「再研究」有时等于「不办」。',
    weight: 10,
    minRank: 3,
    maxRank: 12,
    choices: [
      {
        label: '会后单独找关键同志沟通',
        fx: { GX: 4, NL: 3, Lian: -1 },
      },
      {
        label: '把方案改得更可执行再上会',
        fx: { NL: 4, ZJ: 3, GX: -1 },
      },
      {
        label: '坚持原方案，硬推',
        fx: { ZJ: 3, GX: -5, Risk: 2 },
        successRate: 0.55,
        failFx: { GX: -8 },
        failText: '议题被搁置，还落了个「不懂规矩」。',
      },
    ],
  },
  {
    id: 'adv_jinsheng',
    kind: 'crisis',
    title: '晋升前的「意外」',
    text: '风声说组织在考虑你。没过几天，一封「反映材料」出现在上级收件箱。内容半真半假，时间点巧得像算过。',
    weight: 9,
    minRank: 3,
    maxRank: 14,
    choices: [
      {
        label: '请组织核查，欢迎监督',
        fx: { Lian: 5, Risk: -6, GX: -2 },
        require: { Lian: 52 },
        successRate: 0.78,
        failFx: { Risk: 4 },
        failText: '核查启动，程序暂缓。',
      },
      {
        label: '私下找关系「摆平」',
        fx: { Lian: -10, Risk: 10, GX: 5 },
      },
      {
        label: '不解释，等组织结论',
        fx: { Risk: 3, Lian: 2 },
      },
    ],
  },
  {
    id: 'adv_jiating_yalı',
    kind: 'daily',
    title: '家属被「关心」',
    text: '爱人单位领导「随口」问：你家属最近工作还好吧？语气很软，你却听出了另一层意思。',
    weight: 7,
    minRank: 4,
    maxRank: 14,
    choices: [
      {
        label: '让家属按规矩办事，不求人',
        fx: { Lian: 4, MX: 2, GX: -3 },
      },
      {
        label: '自己出面打招呼',
        fx: { GX: 4, Lian: -5, Risk: 3 },
      },
    ],
  },
]
