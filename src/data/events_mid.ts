import type { GameEvent } from '../types'

/** 乡镇低职级补充日常：加厚办事员–副镇阶段的可抽池 */
export const LOW_DAILY_EXTRA: GameEvent[] = [
  {
    id: 'low_yinshua',
    kind: 'daily',
    title: '材料印歪了',
    text: '明天要报的汇编印歪了两页，装订店已关门。办公室小林说可以手贴。你翻了翻，一共三十六份。',
    weight: 7,
    maxRank: 4,
    choices: [
      { label: '连夜重印，自己盯', fx: { NL: 3, ZJ: 2, MX: 1 } },
      { label: '手贴修补，能看就行', fx: { ZJ: 1, NL: 1 } },
      { label: '电子版先报，纸质后补', fx: { NL: 2, GX: 1 } },
    ],
  },
  {
    id: 'low_chezi',
    kind: 'daily',
    title: '公务用车',
    text: '司机说车被别的站所借走了。你要去县里开会，班车要等四十分钟。手机里有三个未接来电。',
    weight: 6,
    maxRank: 5,
    choices: [
      { label: '坐班车，准点到', fx: { Lian: 3, ZJ: 2 } },
      { label: '请朋友顺路捎一段', fx: { GX: 2, Lian: -1 } },
      { label: '改线上参会，会后补材料', fx: { NL: 2, ZJ: 1 } },
    ],
  },
  {
    id: 'low_toupiao',
    kind: 'daily',
    title: '测评表',
    text: '年度民主测评前，有人暗示你「别太较真」。表格最后一栏是开放意见，笔在你手里停了很久。',
    weight: 6,
    maxRank: 5,
    choices: [
      { label: '实事求是写问题', fx: { Lian: 5, GX: -3, MX: 2 } },
      { label: '写希望与建议，不点名', fx: { Lian: 2, GX: 2, NL: 1 } },
      { label: '全打勾，不写开放意见', fx: { GX: 3, Lian: -2 } },
    ],
  },
  {
    id: 'low_dianhua',
    kind: 'daily',
    title: '深夜电话',
    text: '十一点半，村支书来电：两家因地界吵到要动手。你披衣出门，月亮很亮，狗叫了一路。',
    weight: 7,
    maxRank: 5,
    choices: [
      { label: '赶到现场分开谈', fx: { MX: 5, ZJ: 3, NL: 1 } },
      { label: '通知司法所与驻村干部先去', fx: { NL: 3, GX: 2 } },
      { label: '电话稳住，明早再处理', fx: { ZJ: 1, Risk: 3, MX: -1 } },
    ],
  },
  {
    id: 'low_jianyan',
    kind: 'daily',
    title: '迎检台账',
    text: '检查组明天到，台账缺三年的会议记录。有人说「补签一下」，有人说「如实说明」。打印机还在吐纸。',
    weight: 7,
    maxRank: 5,
    choices: [
      { label: '如实说明缺口与整改计划', fx: { Lian: 5, ZJ: 2, NL: 2 } },
      { label: '组织力量连夜补做实事', fx: { MX: 3, ZJ: 3, NL: 2, Risk: 2 } },
      { label: '补签痕迹，先把检查过了', fx: { ZJ: 2, Risk: 8, Lian: -6 } },
    ],
  },
  {
    id: 'low_tongshi',
    kind: 'daily',
    title: '同事请假',
    text: '老王家里老人住院，他手上的报表和走访任务堆到你桌上。主任说「能者多劳」，笑了笑。',
    weight: 6,
    maxRank: 4,
    choices: [
      { label: '接过来，理清优先级', fx: { MX: 3, NL: 3, GX: 2 } },
      { label: '接一部分，请主任再分派', fx: { GX: 3, NL: 2 } },
      { label: '说自己也忙不过来', fx: { GX: -3, NL: 1 } },
    ],
  },
]

/**
 * 县处–厅局中局日常：补池子，降低「同一撮乡镇日常」的重复感。
 * 事件正文偏业务场景，选项侧重五维取舍而非单一最优。
 */
export const MID_DAILY_EVENTS: GameEvent[] = [
  {
    id: 'mid_huiyi_tuichi',
    kind: 'daily',
    title: '会议改期',
    text: '政府常务会临时改到周五。三个部门的材料还没齐，办公室主任问你要不要「先上会再补件」。你看了看议题清单，有一项涉及资金。',
    weight: 8,
    minRank: 6,
    maxRank: 12,
    choices: [
      {
        label: '压后该项，其余照常上会',
        fx: { NL: 3, ZJ: 2, GX: -2 },
      },
      {
        label: '要求材料齐全再上',
        fx: { Lian: 3, NL: 2, ZJ: 1 },
      },
      {
        label: '先口头通报，会后补程序',
        fx: { ZJ: 3, Risk: 4, GX: 2 },
      },
    ],
  },
  {
    id: 'mid_yusuan',
    kind: 'daily',
    title: '预算盘子',
    text: '财政送来明年部门预算初盘。教育、交通都在争增量，你分管口子上还有两笔「历史遗留」挂账。桌上计算器按得发烫。',
    weight: 8,
    minRank: 7,
    maxRank: 13,
    choices: [
      {
        label: '优先保民生与教育',
        fx: { MX: 6, ZJ: 3, GX: -3 },
      },
      {
        label: '保在建项目与还本付息',
        fx: { ZJ: 5, Risk: -3, MX: -2 },
      },
      {
        label: '两边都压一点，先过会',
        fx: { GX: 4, NL: 2, MX: -1 },
      },
    ],
  },
  {
    id: 'mid_shangfang',
    kind: 'daily',
    title: '拦访变接访',
    text: '信访局来电：有一批人要去市里。你让人把代表请到接待室。茶倒了三回，诉求从征迁补偿扯到十年前的承包合同。',
    weight: 7,
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '当面建立台账，限期答复',
        fx: { MX: 7, NL: 3, ZJ: 2 },
      },
      {
        label: '请主管部门牵头，你督办',
        fx: { GX: 3, ZJ: 3, MX: 2 },
      },
      {
        label: '先稳住情绪，承诺研究',
        fx: { MX: 2, Risk: 3, GX: 2 },
      },
    ],
  },
  {
    id: 'mid_xiangmu_ka',
    kind: 'daily',
    title: '工地卡壳',
    text: '重点项目例会上，施工方说征迁还剩七户。属地街道诉苦，业主方催工期。投影仪的风扇声很响，像在替谁叹气。',
    weight: 8,
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '亲自下户，一户一策',
        fx: { MX: 5, ZJ: 5, NL: 2, GX: -2 },
      },
      {
        label: '压实街道包干，周通报',
        fx: { ZJ: 4, GX: 3, MX: 1 },
      },
      {
        label: '优化方案，避让敏感段',
        fx: { NL: 4, ZJ: 2, Risk: 2 },
      },
    ],
  },
  {
    id: 'mid_ganbu_tanxin',
    kind: 'daily',
    title: '干部谈心',
    text: '组织部门建议你跟两名「状态起伏」的科级干部谈谈。一人家里有事，一人被举报过（后查不实）。谈话室的绿植该浇水了。',
    weight: 6,
    minRank: 7,
    maxRank: 14,
    choices: [
      {
        label: '分别谈，既压担子也听诉求',
        fx: { GX: 5, NL: 3, MX: 2 },
      },
      {
        label: '会上点到为止，私下不深谈',
        fx: { ZJ: 2, GX: 2, MX: -1 },
      },
      {
        label: '建议调整岗位，减少摩擦',
        fx: { NL: 3, GX: -2, Risk: 2 },
      },
    ],
  },
  {
    id: 'mid_meiti',
    kind: 'daily',
    title: '自媒体镜头',
    text: '有人在政务大厅外直播，说「办事要找关系」。评论区已经过千。宣传口问你要不要「沟通一下」。你打开手机看了一分钟。',
    weight: 7,
    minRank: 6,
    maxRank: 15,
    choices: [
      {
        label: '公开回应，邀请来监督办事流程',
        fx: { MX: 6, Lian: 3, NL: 2 },
        successRate: 0.85,
      },
      {
        label: '责令大厅自查整改并通报',
        fx: { ZJ: 4, MX: 3, Lian: 2 },
      },
      {
        label: '找平台「降热度」',
        fx: { GX: 3, Risk: 6, Lian: -4 },
      },
    ],
  },
  {
    id: 'mid_tiaoyan_cailiao',
    kind: 'daily',
    title: '调研材料',
    text: '省厅调研组后天到。两办准备的稿子全是「高度重视、成效显著」。你把其中三页折了角，想听真问题。',
    weight: 7,
    minRank: 7,
    maxRank: 15,
    choices: [
      {
        label: '要求改写，补上短板与案例',
        fx: { NL: 5, Lian: 3, ZJ: 2 },
      },
      {
        label: '保留框架，现场再补充口头汇报',
        fx: { ZJ: 3, GX: 2, NL: 2 },
      },
      {
        label: '照原稿上，少说少错',
        fx: { ZJ: 1, Lian: -2, NL: -1 },
      },
    ],
  },
  {
    id: 'mid_shengcha',
    kind: 'daily',
    title: '审批加急',
    text: '一家企业托人来说，环评卡了两个月，想「特事特办」。材料看起来齐全，但选址紧挨着水源保护区的边缘线。',
    weight: 7,
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '依法按程序，不插队',
        fx: { Lian: 6, ZJ: 2, GX: -4 },
      },
      {
        label: '组织联审，公开进度与依据',
        fx: { Lian: 4, NL: 4, GX: -1 },
      },
      {
        label: '先批后补，把项目留下',
        fx: { ZJ: 5, GX: 5, Risk: 8, Lian: -6 },
      },
    ],
  },
  {
    id: 'mid_xiongdi_xian',
    kind: 'daily',
    title: '兄弟县取经',
    text: '邻县来考察产业基金做法。对方很客气，问题也很尖锐：「你们的容错机制是写在纸上还是落在事上？」会后合影，背景是你们新刷的标语。',
    weight: 6,
    minRank: 8,
    maxRank: 15,
    choices: [
      {
        label: '如实讲踩过的坑',
        fx: { Lian: 4, NL: 4, GX: 3 },
      },
      {
        label: '多讲成绩，少讲问题',
        fx: { ZJ: 3, GX: 4, Lian: -2 },
      },
      {
        label: '提议建立常态互派干部',
        fx: { GX: 5, NL: 3, ZJ: 2 },
      },
    ],
  },
  {
    id: 'mid_yingji',
    kind: 'daily',
    title: '应急值守',
    text: '气象台发布暴雨橙色预警。值班室电话此起彼伏，地质灾害点有两处需扩面转移。你披上雨衣往指挥部走，鞋已经湿了。',
    weight: 8,
    minRank: 6,
    maxRank: 14,
    monthMod: [5, 6, 7, 8, 9],
    choices: [
      {
        label: '靠前指挥，应转尽转',
        fx: { MX: 8, ZJ: 5, NL: 2, Risk: 2 },
      },
      {
        label: '坐镇指挥中心，统筹调度',
        fx: { NL: 4, ZJ: 4, MX: 3 },
      },
      {
        label: '按预案分级响应即可',
        fx: { ZJ: 2, MX: 1, Risk: 3 },
      },
    ],
  },
  {
    id: 'mid_lianxi_huiyi',
    kind: 'daily',
    title: '班子务虚',
    text: '年度务虚会，有人讲「守摊子」，有人讲「闯新路」。你被点名发言。白板上写了半面字，擦掉又写。',
    weight: 6,
    minRank: 7,
    maxRank: 14,
    monthMod: [11, 12, 1],
    choices: [
      {
        label: '提三条可落地的明年抓手',
        fx: { ZJ: 5, NL: 4, MX: 2 },
      },
      {
        label: '多听少说，会后个别沟通',
        fx: { GX: 4, Lian: 2, NL: 1 },
      },
      {
        label: '强调风险与合规底线',
        fx: { Lian: 4, Risk: -3, ZJ: 1 },
      },
    ],
  },
  {
    id: 'mid_jiceng_jiancha',
    kind: 'daily',
    title: '四不两直',
    text: '你不打招呼去了两个村。一个台账漂亮但群众说没享受过政策，一个材料一般但路口新装了路灯。回程车上没人说话。',
    weight: 7,
    minRank: 6,
    maxRank: 13,
    choices: [
      {
        label: '通报问题，责令限期整改',
        fx: { ZJ: 5, Lian: 3, GX: -3 },
      },
      {
        label: '把好做法提炼推广',
        fx: { MX: 4, ZJ: 3, NL: 2 },
      },
      {
        label: '两种都抓，纳入年度考核',
        fx: { ZJ: 4, NL: 3, MX: 2 },
      },
    ],
  },
]
