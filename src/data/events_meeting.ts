import type { GameEvent } from '../types'

/**
 * 议事与会议事件：常委会、常务会、书记专题会、民主生活会、党政联席会、党组会，
 * 以及检察反贪条线。覆盖县（rank 8–11）、市（12–14）、省（15–17）三个层次。
 *
 * 会议场景的表态影响声望（威望）、派系声望与风险；部分选项有 successRate。
 */

export const MEETING_EVENTS: GameEvent[] = [
  /* ── 县级：常委会 / 常务会 / 书记专题会 ─────────────────── */
  {
    id: 'mt_xian_changwei_renshi',
    kind: 'daily',
    title: '县委常委会 · 人事议题',
    text: '常委会研究三名乡镇长人选。组织部逐个介绍考察情况，说到第二名时，有一名常委插了话：「这个同志我了解，年轻，就是有时候急。」会议室安静了两秒。',
    weight: 9,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '按程序办：考察材料发言，一视同仁',
        fx: { ZJ: 3, Lian: 3, NL: 2 },
      },
      {
        label: '顺着那位常委的话压一压',
        fx: { GX: 3, Lian: -3, Risk: 3 },
      },
      {
        label: '建议再考察一轮，下次会再议',
        fx: { Risk: -2, ZJ: -1, NL: 1 },
      },
    ],
  },
  {
    id: 'mt_xian_changwu_caizheng',
    kind: 'daily',
    title: '县政府常务会 · 应急支出',
    text: '财政局提请追加一笔防汛应急支出，程序上先干了再补手续。审计出身的老局长在底下递了张条子：「钱没问题，手续有问题。」',
    weight: 8,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '钱照拨，限期补齐程序，通报批评',
        fx: { ZJ: 3, MX: 2, Lian: 2 },
      },
      {
        label: '先撂着，手续齐了再拨',
        fx: { Lian: 3, MX: -4, Risk: -2 },
      },
      {
        label: '签了，手续的事以后再说',
        fx: { ZJ: 2, MX: 2, Risk: 6, Lian: -3 },
      },
    ],
  },
  {
    id: 'mt_shuji_zhuanti_xinfang',
    kind: 'daily',
    title: '书记专题会 · 信访积案',
    text: '书记把几个信访积案摆上专题会。轮到你分管的那件，书记说：「你表个态。」所有人都看着你。',
    weight: 8,
    minRank: 8,
    maxRank: 14,
    choices: [
      {
        label: '给时限、给方案、给责任人',
        fx: { ZJ: 3, MX: 4, NL: 2 },
        successRate: 0.85,
        failFx: { ZJ: -2, Risk: 2 },
        failText: '方案定了，钱没跟上，积案还是积案。',
      },
      {
        label: '讲客观困难，请求政策支持',
        fx: { GX: 1, ZJ: -1 },
      },
      {
        label: '把矛盾往属地推',
        fx: { Risk: 4, MX: -4, Lian: -2 },
      },
    ],
  },
  {
    id: 'mt_minzhu_shenghuo_xian',
    kind: 'daily',
    title: '民主生活会 · 批评与自我批评',
    text: '会前谈心时，班长希望你「对他提点真意见」。你确实有意见，也确实知道有些话不能说全。',
    weight: 7,
    minRank: 8,
    maxRank: 17,
    choices: [
      {
        label: '提真问题：点到具体事，留足分寸',
        fx: { Lian: 4, NL: 3, GX: -1 },
        successRate: 0.85,
        failFx: { GX: -3 },
        failText: '话是实的，听的人脸挂不住了。',
      },
      {
        label: '提「希望」：学习不够、方法欠妥',
        fx: { GX: 2, Lian: -2 },
      },
      {
        label: '先把自己摆进去，深挖狠批',
        fx: { Lian: 3, NL: 1, MX: 1 },
      },
    ],
  },
  /* ── 市级：常委会 / 常务会 / 联席会 / 全会 ───────────────── */
  {
    id: 'mt_shi_changwei_qingshi',
    kind: 'daily',
    title: '市委常委会 · 重大事项请示报告',
    text: '一项涉及全市的重大决策要上会。办公室主任提醒：按规定，这类事项应当先向书记专题汇报，再上会研究。',
    weight: 9,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '先专题汇报，再上会',
        fx: { GX: 3, ZJ: 2, NL: 2, Lian: 1 },
      },
      {
        label: '直接上会，用议程倒逼共识',
        fx: { ZJ: 3, GX: -4, Risk: 4 },
        successRate: 0.7,
        failFx: { ZJ: -3, GX: -2 },
        failText: '会上议而不决，还落了个「程序意识不强」。',
      },
      {
        label: '压一压，放一放再说',
        fx: { Risk: -3, ZJ: -2 },
      },
    ],
  },
  {
    id: 'mt_shi_changwu_gaizhi',
    kind: 'daily',
    title: '市政府常务会 · 国企改制',
    text: '一家老国企的改制方案到了常务会：职工安置是底线，资产处置是难点，市场上已经有人递了三版方案。',
    weight: 8,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '职工安置优先，资产公开挂牌',
        fx: { MX: 5, Lian: 3, ZJ: 2 },
        successRate: 0.8,
        failFx: { ZJ: -2 },
        failText: '公开挂牌引来两家缠诉，改制拖了一个季度。',
      },
      {
        label: '定向交给有实力的老伙伴',
        fx: { GX: 4, Lian: -5, Risk: 7 },
      },
      {
        label: '再论证，成立专班清产核资',
        fx: { NL: 3, Risk: -3, ZJ: -2 },
      },
    ],
  },
  {
    id: 'mt_lianxi_zhaoshang',
    kind: 'daily',
    title: '党政联席会 · 招商口径',
    text: '同一个客商，政府口允了税收返还，党委口在大会上强调「严禁违规承诺」。两条线在联席会上撞了车。',
    weight: 8,
    minRank: 12,
    maxRank: 16,
    choices: [
      {
        label: '统一口径：谁承诺谁负责，收回重谈',
        fx: { Lian: 4, NL: 3, GX: -2 },
      },
      {
        label: '政府口先行，向党委口报备',
        fx: { ZJ: 3, GX: 2, Risk: 2 },
      },
      {
        label: '各说各话，先把客商稳住',
        fx: { ZJ: 1, Risk: 5, Lian: -2 },
      },
    ],
  },
  {
    id: 'mt_shi_quanhui_dibuchang',
    kind: 'calm',
    title: '市委全会 · 递补委员',
    text: '一名市委委员调离，全会递补候补委员。你是签到表上离主席台第十三排的人，鼓掌，记录，散会后在走廊多站了一分钟。',
    weight: 5,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '把会议精神带回分管口落实',
        fx: { ZJ: 2, NL: 2 },
      },
      {
        label: '散会后留下来，向老委员请教',
        fx: { GX: 3, NL: 1 },
      },
    ],
  },
  /* ── 省级：常委会博弈 ─────────────────────────────────── */
  {
    id: 'mt_sheng_changwei_renshi_yunn',
    kind: 'daily',
    title: '省委常委会 · 人事酝酿',
    text: '书记提前吹风：一名市委副书记拟进常委班子。分管口普遍认为另一个人选更合适。酝酿阶段的每一次表态，都会被记住。',
    weight: 10,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '按程序摆事实，提自己的看法',
        fx: { ZJ: 4, NL: 4, Lian: 2, GX: -2 },
        successRate: 0.75,
        failFx: { GX: -4, ZJ: -2 },
        failText: '看法没被采纳，还被记了「有想法」。',
      },
      {
        label: '跟定书记的吹风',
        fx: { GX: 5, Lian: -2 },
      },
      {
        label: '议题回避，请假不参会',
        fx: { Risk: -2, GX: -3, ZJ: -2 },
      },
    ],
  },
  {
    id: 'mt_sheng_changwei_yiti',
    kind: 'daily',
    title: '省委常委会 · 议题排序',
    text: '政府党组报的三个议题，书记只圈了一个。秘书长来探口风：另外两个，是挤进这次会，还是等下一次？',
    weight: 9,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '只上圈定的那个，其余改专题会',
        fx: { GX: 4, NL: 2, Lian: 1 },
      },
      {
        label: '据理力争，三个都上',
        fx: { ZJ: 4, GX: -3, Risk: 3 },
        successRate: 0.65,
        failFx: { ZJ: -3, GX: -3 },
        failText: '会开得很长，三个议题只过了半个。',
      },
      {
        label: '私下再沟通，本轮先不上',
        fx: { Risk: -2, NL: 1 },
      },
    ],
  },
  {
    id: 'mt_sheng_changwei_biaojue',
    kind: 'daily',
    title: '省委常委会 · 表决前夜',
    text: '明天常委会表决一项重大规划。今晚两个阵营都在数票，你手里的那一票，被两边同时估算着。',
    weight: 9,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '按分管领域实际投',
        fx: { ZJ: 4, Lian: 3, NL: 2 },
      },
      {
        label: '投向多数派，锁定关系',
        fx: { GX: 5, Lian: -3, Risk: 2 },
      },
      {
        label: '投反对票，逼出第二次论证',
        fx: { NL: 3, GX: -5, MX: 2 },
        successRate: 0.6,
        failFx: { GX: -3, ZJ: -2 },
        failText: '方案原样通过，你的反对成了记录在案的一笔。',
      },
    ],
  },
  {
    id: 'mt_sheng_minzhu_xunshi',
    kind: 'daily',
    title: '省委巡视整改专题民主生活会',
    text: '巡视整改专题民主生活会，对照清单逐条检视。轮到你分管的条线，有两项整改进度被指「与承诺不符」。',
    weight: 8,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '认领问题，当场定整改时限',
        fx: { Lian: 5, NL: 3, MX: 2 },
      },
      {
        label: '说明客观因素，承诺加快',
        fx: { ZJ: 1, Lian: -2, Risk: 3 },
      },
      {
        label: '把责任分解给下级单位',
        fx: { Risk: 6, Lian: -4, GX: -2 },
      },
    ],
  },
  /* ── 党组会（通用机关场景） ────────────────────────────── */
  {
    id: 'mt_dangzu_sanZhongYiDa',
    kind: 'daily',
    title: '党组会 · 三重一大',
    text: '「三重一大」事项上党组会：一笔大额资金、一项机构调整、一次人事任免，都在这张议程表上。列席的纪检组长翻着材料，没抬头。',
    weight: 9,
    minRank: 6,
    maxRank: 17,
    choices: [
      {
        label: '逐项过会，票决留痕',
        fx: { Lian: 4, NL: 3, ZJ: 2 },
      },
      {
        label: '先关起门来通个气，会上走程序',
        fx: { GX: 3, Lian: -3, Risk: 4 },
      },
      {
        label: '把最难的议题拿掉，下次再议',
        fx: { Risk: -2, ZJ: -1 },
      },
    ],
  },
  {
    id: 'mt_fanpan_diaojuan',
    kind: 'daily',
    title: '检察院调卷',
    text: '市检察院反贪部门来函：一起行贿案的供词里出现了你条线上一个熟悉的名字，希望调阅相关会议记录与批示原件。',
    weight: 8,
    minRank: 6,
    maxRank: 17,
    choices: [
      {
        label: '如实提供，配合调查',
        fx: { Lian: 4, Risk: -3, GX: -2 },
      },
      {
        label: '按程序走，能拖就拖',
        fx: { Risk: 4, Lian: -2 },
      },
      {
        label: '打招呼，「妥善处理」',
        fx: { Risk: 10, Lian: -6 },
        successRate: 0.55,
        failFx: { Risk: 8, ZJ: -3 },
        failText: '打招呼的记录比卷宗先到了检察院。',
      },
    ],
  },
  {
    id: 'mt_fanpan_yuetan',
    kind: 'crisis',
    title: '反贪约谈',
    text: '你被通知到检察院说明情况——不是被立案，是作为「相关人员」接受询问。走廊尽头，你看见了你曾经签过字的那份文件。',
    weight: 0,
    minRisk: 45,
    minRank: 6,
    maxRank: 17,
    choices: [
      {
        label: '如实陈述，签字画押',
        fx: { Lian: 5, Risk: -8, MX: 2 },
        successRate: 0.8,
        failFx: { Risk: 6 },
        failText: '陈述里有一处对不上，检察官记下了时间。',
      },
      {
        label: '请律师陪同，谨慎作答',
        fx: { Risk: -4, GX: -2, NL: 1 },
      },
      {
        label: '托人打听问询重点',
        fx: { Risk: 9, Lian: -5 },
      },
    ],
  },
]
