import type { GameEvent } from '../types'

/** 厅局 / 省部 / 中央 第二批日常与危机 */
export const HIGH_DAILY_EVENTS2: GameEvent[] = [
  {
    id: 'hd2_zhongyang_hui',
    kind: 'daily',
    title: '进京开会',
    text: '会期三天，材料四十页。你在驻地把数字又核了一遍。邻座问你「地方上到底怎么样」——你说了实话的三分之二。',
    weight: 10,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '讲真话，带解决方案',
        fx: { NL: 4, ZJ: 4, GX: 2, Lian: 2 },
      },
      {
        label: '只报喜',
        fx: { ZJ: 2, GX: 3, Lian: -3 },
      },
      {
        label: '多听少说',
        fx: { NL: 3, GX: 2 },
      },
    ],
  },
  {
    id: 'hd2_buwei_xietiao',
    kind: 'daily',
    title: '部委司局协调会',
    text: '三个司、两个省、一套数据口径对不齐。你提出折中方案，会场安静了八秒，然后开始鼓掌。',
    weight: 9,
    minRank: 16,
    maxRank: 19,
    choices: [
      {
        label: '折中兼顾各方',
        fx: { GX: 5, NL: 4, ZJ: 3 },
      },
      {
        label: '坚持本省口径',
        fx: { ZJ: 4, GX: -5, Lian: 2 },
      },
    ],
  },
  {
    id: 'hd2_lingxi',
    kind: 'daily',
    title: '中央督导「回头看」',
    text: '督导组不打招呼，直接进村。你在现场汇报，汗把衬衫粘在背上。问题清单很长，你的名字不在第一条。',
    weight: 9,
    minRank: 14,
    maxRank: 19,
    choices: [
      {
        label: '如实认领并交办',
        fx: { Lian: 4, ZJ: 3, MX: 4, GX: -2 },
      },
      {
        label: '强调客观困难',
        fx: { GX: 2, ZJ: 1, MX: -2 },
      },
    ],
  },
  {
    id: 'hd2_xinren',
    kind: 'daily',
    title: '新老交替',
    text: '你推荐的接班人到任。他开会时看了你一眼，像在确认「谁说了算」。你把椅子往后挪了半格。',
    weight: 8,
    minRank: 13,
    maxRank: 19,
    choices: [
      {
        label: '扶上马送一程',
        fx: { GX: 5, Lian: 2, MX: 2, ZJ: 1 },
      },
      {
        label: '彻底放手',
        fx: { Lian: 3, GX: -1, NL: 1 },
      },
      {
        label: '留一手',
        fx: { GX: -3, Risk: 3, Lian: -2 },
      },
    ],
  },
  {
    id: 'hd2_lunxun',
    kind: 'daily',
    title: '中央党校/行政学院轮训',
    text: '同班同学来自五湖四海。夜里卧谈，有人讲经验，有人讲「不能讲的」。你记笔记记得很勤。',
    weight: 7,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '专心学习，少社交',
        fx: { NL: 5, Lian: 2 },
      },
      {
        label: '广结同窗',
        fx: { GX: 7, Lian: -1 },
        faction: 'B',
      },
    ],
  },
  {
    id: 'hd2_yuqing_guojia',
    kind: 'crisis',
    title: '全国性舆情',
    text: '你分管领域被全国媒体点名。省里连夜开会。你知道：镜头里的你，和会议室里的你，必须是同一个人。',
    weight: 0,
    minRisk: 45,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '第一时间核实并回应',
        fx: { MX: 5, Lian: 4, Risk: -6 },
        require: { Lian: 55 },
        successRate: 0.75,
        failFx: { Risk: 8, MX: -5 },
        failText: '回应被指「避重就轻」。',
      },
      {
        label: '配合宣传口径',
        fx: { GX: 3, Risk: 3, Lian: -2 },
      },
    ],
  },
  {
    id: 'hd2_anquan_sheng',
    kind: 'crisis',
    title: '全省安全生产大检查',
    text: '连续三起事故后，省长在会上拍了桌子。责任链要扣到人。你连夜把分管领域又过了一遍。',
    weight: 0,
    minRisk: 32,
    minRank: 14,
    maxRank: 19,
    choices: [
      {
        label: '自己带队夜查',
        fx: { ZJ: 5, MX: 4, NL: 3, Risk: -3 },
      },
      {
        label: '发文层层加压',
        fx: { ZJ: 2, MX: -2, GX: -1 },
      },
    ],
  },
  {
    id: 'hd2_shuji_duohua',
    kind: 'daily',
    title: '省委书记的一句话',
    text: '调研结束，书记握了握手：「你在基层待过，这很难得。」秘书在旁边记了三个字。你不知道那三个字是什么。',
    weight: 8,
    minRank: 16,
    maxRank: 19,
    choices: [
      {
        label: '回去把基层经验制度化',
        fx: { ZJ: 4, NL: 3, MX: 3 },
      },
      {
        label: '继续低调做事',
        fx: { Lian: 2, GX: 1 },
      },
    ],
  },
  {
    id: 'hd2_jiehun_zinv',
    kind: 'daily',
    title: '子女婚礼',
    text: '孩子要结婚。你定了规矩：不收管理服务对象礼金，只请至亲。有人笑你「装」，有人松了口气。',
    weight: 6,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '严格按规定办',
        fx: { Lian: 8, MX: 2, GX: -3 },
      },
      {
        label: '适当扩大宴请范围',
        fx: { GX: 5, Lian: -8, Risk: 6 },
      },
    ],
  },
  {
    id: 'hd2_tuixiu_yuxuan',
    kind: 'daily',
    title: '临近退休的「安排」',
    text: '有人暗示可以「提前安排」下一任，条件是若干「关照」。你想起第一次报到时的门卫大爷。',
    weight: 7,
    minRank: 14,
    maxRank: 19,
    choices: [
      {
        label: '拒绝，按组织程序办',
        fx: { Lian: 8, GX: -5, Risk: -3 },
      },
      {
        label: '模棱两可',
        fx: { Lian: -6, Risk: 8, GX: 4 },
      },
    ],
  },
]
