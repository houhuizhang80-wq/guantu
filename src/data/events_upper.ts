import type { GameEvent } from '../types'

/**
 * 省级篇 + 中央篇
 * 岗位窗口：副省长 → 省长 → 省委书记 → 副总理 → 总理
 * 主线 storyOrder 30–38
 */
export const UPPER_EVENTS: GameEvent[] = [
  // ── 省 ─────────────────────────────────────────────
  {
    id: 'up_fusheng',
    kind: 'main',
    title: '进省班子',
    text: '文件很短，分量很重。第一次参加省委常委会，茶杯是统一的，座次是严格的。你分管工业与开放型经济——数字与风险，都在这里。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 30,
    minRank: 15,
    maxRank: 15,
    choices: [
      {
        label: '先调研再施政',
        fx: { NL: 5, ZJ: 3, GX: 2 },
      },
      {
        label: '迅速提出一揽子改革清单',
        fx: { ZJ: 6, GX: 3, Risk: 4 },
        successRate: 0.7,
        failFx: { ZJ: 2, GX: -3 },
        failText: '清单被批「步子太大」。',
      },
    ],
  },
  {
    id: 'up_chanye',
    kind: 'main',
    title: '链主企业',
    text: '省内一家链主企业要外迁研发中心。省长批示：稳住。企业开的条件包括土地、税收与「监管沙盒」。法务说有些口子不能开。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 31,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '合法合规给足支持，底线不破',
        fx: { ZJ: 5, Lian: 5, GX: 2 },
      },
      {
        label: '特事特办，先把人留住',
        fx: { ZJ: 7, Lian: -12, Risk: 10 },
      },
      {
        label: '顺势培育本土备份链',
        fx: { NL: 5, ZJ: 4, MX: 3 },
      },
    ],
  },
  {
    id: 'up_gongtong',
    kind: 'main',
    title: '省级督查「一刀切」',
    text: '下面为了完成指标，把整改搞成「一律关停」。企业叫苦，媒体批评「层层加码」。省长要一个解释，也要一个台阶。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 32,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '纠偏加码，公开正负面清单',
        fx: { MX: 8, Lian: 5, GX: -5, ZJ: 3 },
      },
      {
        label: '肯定下面「态度坚决」',
        fx: { GX: 4, MX: -6, Lian: -3 },
      },
      {
        label: '点到为止，会后单独敲打',
        fx: { GX: 3, NL: 2 },
      },
    ],
  },
  {
    id: 'up_shengzhang_jingxuan',
    kind: 'main',
    title: '省长人选',
    text: '中央来考察。谈话范围比想象大。有人说你「基层经历完整」，有人说你「锋芒偏露」。夜里你在江边走了很久，风很大。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 33,
    minRank: 16,
    maxRank: 17,
    choices: [
      {
        label: '保持定力，用治理答卷回应',
        fx: { ZJ: 6, Lian: 4, GX: -2 },
      },
      {
        label: '向老领导汇报思想',
        fx: { GX: 8, Lian: -4, Risk: 3 },
      },
      {
        label: '把民生与风险防控做扎实',
        fx: { MX: 6, NL: 4, Risk: -3 },
      },
    ],
  },
  {
    id: 'up_shengwei',
    kind: 'main',
    title: '省委书记履新或交接',
    text: '全省干部大会。主席台的灯光很亮。你在发言稿里写了一句「功成不必在我」，又亲手把「在我」的段落往前挪了挪。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 34,
    minRank: 16,
    maxRank: 17,
    choices: [
      {
        label: '谈十年后的省，不谈明年数字',
        fx: { NL: 4, MX: 4, ZJ: 3 },
      },
      {
        label: '谈眼前硬仗',
        fx: { ZJ: 5, GX: 3 },
      },
      {
        label: '少讲，多听',
        fx: { GX: 2, Lian: 2 },
      },
    ],
  },
  {
    id: 'up_jinjing',
    kind: 'main',
    title: '进京',
    text: '中组部通知。飞机穿云的时候，你想起第一次坐面包车去青石镇报到。舷窗外是连成片的灯火，窗内是自己的脸，比当年老了许多。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 35,
    minRank: 17,
    maxRank: 18,
    choices: [
      {
        label: '服从安排，准备迎接新的考题',
        fx: { NL: 4, GX: 4, ZJ: 3, Risk: 2 },
      },
      {
        label: '请组织再考虑，希望在省里做完事',
        fx: { MX: 3, ZJ: 2, GX: -2 },
      },
    ],
  },
  {
    id: 'up_zongyang_fenguan',
    kind: 'main',
    title: '国务院分工',
    text: '你分管的领域，牵一发而动全国。第一次列席，所有人都很克制。茶很淡，问题很重。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 36,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '深入调研，抓主要矛盾',
        fx: { NL: 6, ZJ: 4 },
      },
      {
        label: '先稳预期，少出台新政策',
        fx: { GX: 4, Lian: 2 },
      },
      {
        label: '推动一项标志性改革',
        fx: { ZJ: 8, Risk: 6, NL: 4 },
        successRate: 0.68,
        failFx: { ZJ: 2, Risk: 8 },
        failText: '改革遇阻，社会预期波动。',
      },
    ],
  },
  {
    id: 'up_zongli',
    kind: 'main',
    title: '历史的一天',
    text: '文件袋放在桌上。窗外没有鞭炮。你想起青石镇打印机卡纸的夜晚，想起王婶塑料袋里的材料，想起每一次签字前多看的那一眼附件。路，到这里了吗？——不，路只是又拐了一个弯。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 37,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '接下这副担子',
        fx: { ZJ: 5, NL: 5, GX: 3, Risk: 3 },
      },
      {
        label: '请组织再斟酌',
        fx: { Lian: 3, GX: -2 },
      },
    ],
  },

  // ── 省 / 中央日常 ───────────────────────────────────
  {
    id: 'ud_huiyi',
    kind: 'daily',
    title: '长会',
    text: '材料三百页，发言限时八分钟。你删掉所有形容词，只留数字与风险。会后有人说你「太实」，也有人说「终于像能落地的」。',
    weight: 8,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '坚持实数实说',
        fx: { NL: 3, Lian: 3, GX: -2 },
      },
      {
        label: '照顾各方面子，留余地',
        fx: { GX: 4, Lian: -1 },
      },
      {
        label: '会后单独向主要负责同志汇报',
        fx: { GX: 5, ZJ: 2 },
      },
    ],
  },
  {
    id: 'ud_diyan',
    kind: 'daily',
    title: '地方来电',
    text: '凌晨，某市一把手电话：突发事件，数字还在核。他要一个「口径」。你知道，口径既是稳定，也是责任。',
    weight: 7,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '要求先救人，再核实，再发布',
        fx: { MX: 6, Lian: 4, NL: 3 },
      },
      {
        label: '先稳住，等完整信息',
        fx: { Risk: 2, GX: 2 },
      },
      {
        label: '立即派工作组',
        fx: { ZJ: 4, NL: 3, GX: -2 },
      },
    ],
  },
  {
    id: 'ud_wai',
    kind: 'daily',
    title: '外部冲击',
    text: '国际市场波动，省内出口企业订单骤降。省长问「稳不稳得住」。你面前是产业图谱，红线与绿线交叉得像心电图。',
    weight: 7,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '一企一策 + 内需托底',
        fx: { ZJ: 5, NL: 4, MX: 3 },
      },
      {
        label: '财政直接补贴重点企业',
        fx: { ZJ: 4, Lian: -3, Risk: 3 },
      },
      {
        label: '交给市场出清，政府补人',
        fx: { MX: -2, Lian: 3, NL: 2 },
      },
    ],
  },
  {
    id: 'ud_jiating_gao',
    kind: 'daily',
    title: '家里',
    text: '爱人发来体检报告，一项指标箭头向上。你正在审一份不能带回住处的文件。窗外的城市已经睡了。',
    weight: 5,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '立刻安排复查，亲自陪同',
        fx: { MX: 3, ZJ: -1 },
      },
      {
        label: '请家人协助，自己走不开',
        fx: { ZJ: 1, MX: -1 },
      },
      {
        label: '视频里把话说软',
        fx: { MX: 2 },
      },
    ],
  },

  // ── 危机 ───────────────────────────────────────────
  {
    id: 'uc_chongda',
    kind: 'crisis',
    title: '重大事故（省级）',
    text: '矿山或化工，伤亡数字在变。你赶赴现场。全国的镜头都在。省委书记只说：「实事求是。」',
    weight: 0,
    minRisk: 35,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '救人、查明、追责、公开',
        fx: { MX: 8, ZJ: 6, Lian: 5, Risk: -6 },
        require: { Lian: 55 },
        successRate: 0.75,
        failFx: { Risk: 10, MX: -5 },
        failText: '二次瞒报质疑发酵。',
      },
      {
        label: '控制信息，避免「恐慌」',
        fx: { Risk: 10, MX: -10, Lian: -8 },
      },
      {
        label: '授权现场指挥部全权处置',
        fx: { ZJ: 4, NL: 3 },
      },
    ],
  },
  {
    id: 'uc_zhongyang_xunshi',
    kind: 'crisis',
    title: '中央巡视 / 审计',
    text: '谈话提纲里有一条：「重大决策程序与廉洁风险」。你把这些年签过的字在心里过了一遍。窗外的树，影子很长。',
    weight: 0,
    minRisk: 40,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '全面配合，有一说一',
        fx: { Risk: -10, Lian: 6 },
        require: { Lian: 58 },
      },
      {
        label: '强调程序完备',
        fx: { Risk: 3, Lian: -2 },
      },
      {
        label: '请老同事帮忙「了解情况」',
        fx: { Risk: 8, GX: 4, Lian: -8 },
      },
    ],
  },

  // ── 调节 ───────────────────────────────────────────
  {
    id: 'uq_qing',
    kind: 'calm',
    title: '青石镇来信',
    text: '一封手写信：王婶说渠修好了，路灯也亮了。信末画了个歪歪扭扭的太阳。你把信放进抽屉最上层，没有归档。',
    weight: 4,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '回一封短信',
        fx: { MX: 4, Lian: 1 },
      },
      {
        label: '把信念给秘书听',
        fx: { MX: 2, NL: 1 },
      },
    ],
  },
  {
    id: 'uq_ye',
    kind: 'calm',
    title: '凌晨三点',
    text: '醒了就睡不着。你站在窗前，城市像一块发亮的电路板。忽然很想念乡镇食堂那碗飘着油花的菜汤。',
    weight: 4,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '起来把明天的材料再过一遍',
        fx: { NL: 3, ZJ: 2 },
      },
      {
        label: '强迫自己再睡',
        fx: { NL: 1 },
      },
    ],
  },
]
