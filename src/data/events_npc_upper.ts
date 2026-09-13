import type { GameEvent } from '../types'

/**
 * 市 / 省篇 NPC 专属互动
 * kind=npc，按权重穿插；部分带好感门槛。
 */
export const UPPER_NPC_EVENTS: GameEvent[] = [
  // ── 吴秘书长 ───────────────────────────────────────
  {
    id: 'np_wu_cailiao',
    kind: 'npc',
    title: '秘书长的「口径」',
    text: '吴秘书长把你堵在走廊：「明天市长要听的那页，数字再收一收。不是假，是要好看。」他递来的烟你没接，他自己点了。',
    weight: 7,
    minRank: 12,
    maxRank: 14,
    choices: [
      {
        label: '数字如实，表述可以更清楚',
        fx: { Lian: 4, NL: 2, GX: -2 },
      },
      {
        label: '按秘书长意思「收一收」',
        fx: { GX: 6, Lian: -6, Risk: 4 },
        npcFx: [{ id: 'mishuzhang', favor: 12 }],
      },
      {
        label: '直接跟市长说清账目口径',
        hint: '越过秘书长',
        fx: { Lian: 3, ZJ: 3, GX: -8 },
        npcFx: [
          { id: 'shizhang_daban', favor: 6 },
          { id: 'mishuzhang', favor: -12 },
        ],
      },
    ],
  },
  {
    id: 'np_wu_xiaoxi',
    kind: 'npc',
    title: '未公开的人事风声',
    text: '吴秘书长约你喝茶，只说「最近省里在看临江」。他不说是谁在看，也不说看谁。茶凉了他才补一句：「你材料写得好，别用错地方。」',
    weight: 6,
    minRank: 12,
    maxRank: 14,
    require: { npc: [{ id: 'mishuzhang', min: 15 }] },
    choices: [
      {
        label: '谢提醒，回去把工作做扎实',
        fx: { ZJ: 3, NL: 2, Lian: 2 },
        npcFx: [{ id: 'mishuzhang', favor: 6 }],
      },
      {
        label: '追问「看谁」',
        fx: { GX: 2, Lian: -2 },
        npcFx: [{ id: 'mishuzhang', favor: -4 }],
      },
    ],
  },

  // ── 顾市长 ─────────────────────────────────────────
  {
    id: 'np_gu_duxiang',
    kind: 'npc',
    title: '市长的夜间电话',
    text: '十一点四十，顾市长：「睡了没有？高铁那事，你怎么看。」他在等一个不含糊的答案，也在看你敢不敢不含糊。',
    weight: 7,
    minRank: 12,
    maxRank: 13,
    choices: [
      {
        label: '给出明确倾向与依据',
        fx: { ZJ: 5, NL: 3, GX: 4 },
        npcFx: [{ id: 'shizhang_daban', favor: 12 }],
        successRate: 0.75,
        failFx: { GX: -4, ZJ: -1 },
        failText: '市长沉默三秒：「再想想。」电话挂了。',
      },
      {
        label: '请市长定，自己全力执行',
        fx: { GX: 3, NL: 1 },
        npcFx: [{ id: 'shizhang_daban', favor: 4 }],
      },
      {
        label: '把矛盾摆开，建议上会',
        fx: { GX: -3, Lian: 2, NL: 2 },
        npcFx: [{ id: 'shizhang_daban', favor: -3 }],
      },
    ],
  },
  {
    id: 'np_gu_beigu',
    kind: 'npc',
    title: '当众被点名',
    text: '市政府常务会上，顾市长把你分管的一项滞后工作点了出来，语气不重，会议室很静。散会后有人拍拍你肩：「市长是为你好。」你不确定。',
    weight: 6,
    minRank: 12,
    maxRank: 13,
    choices: [
      {
        label: '当场认领，会后交整改表',
        fx: { ZJ: 3, MX: 2, GX: -1, Lian: 2 },
        npcFx: [{ id: 'shizhang_daban', favor: 6 }],
      },
      {
        label: '会上解释客观原因',
        fx: { GX: -4, ZJ: -1 },
        npcFx: [{ id: 'shizhang_daban', favor: -6 }],
      },
      {
        label: '会后单独找市长说清楚',
        fx: { GX: 3, NL: 2 },
        npcFx: [{ id: 'shizhang_daban', favor: 4 }],
      },
    ],
  },

  // ── 蒋会长 ─────────────────────────────────────────
  {
    id: 'np_jiang_cha',
    kind: 'npc',
    title: '商会「茶叙」',
    text: '蒋会长包下一间茶室，只你和他。他说要捐一所学校，又说「手续希望能快一点」。推过来的不是支票，是一张股权代持的空白页。',
    weight: 7,
    minRank: 12,
    maxRank: 17,
    choices: [
      {
        label: '捐赠欢迎，代持免谈',
        fx: { Lian: 8, MX: 3, GX: -3 },
        npcFx: [{ id: 'shanghui', favor: -8 }],
      },
      {
        label: '先放着，「研究研究」',
        fx: { Lian: -10, Risk: 10, GX: 5 },
        npcFx: [{ id: 'shanghui', favor: 14 }],
      },
      {
        label: '把捐赠引入正规慈善渠道',
        fx: { Lian: 4, NL: 3, MX: 4 },
        npcFx: [{ id: 'shanghui', favor: 4 }],
      },
    ],
  },
  {
    id: 'np_jiang_gongguan',
    kind: 'npc',
    title: '「朋友」的麻烦',
    text: '蒋会长旗下项目被投诉扰民。他请你「关心一下」。语气还是那么软，软得像在求你，又像在提醒你：他也有关心你的能力。',
    weight: 6,
    minRank: 12,
    maxRank: 17,
    choices: [
      {
        label: '依法核查，不因人废事',
        fx: { Lian: 5, MX: 4, GX: -5 },
        npcFx: [{ id: 'shanghui', favor: -10 }],
      },
      {
        label: '让属地「灵活处理」',
        fx: { Lian: -12, Risk: 10, GX: 4 },
        npcFx: [{ id: 'shanghui', favor: 12 }],
      },
      {
        label: '公开回应投诉，倒逼整改',
        fx: { MX: 5, Lian: 3, GX: -3 },
        require: { npc: [{ id: 'ribao', min: 0 }] },
        npcFx: [{ id: 'ribao', favor: 5 }],
      },
    ],
  },

  // ── 韩书记 ─────────────────────────────────────────
  {
    id: 'np_han_yue',
    kind: 'npc',
    title: '纪委约谈函',
    text: '不是电话，是函。韩书记请你「就有关情况作说明」。你走进那间会议室时，空调开得很足。',
    weight: 8,
    minRank: 12,
    maxRank: 17,
    minRisk: 35,
    choices: [
      {
        label: '如实说明，材料带齐',
        fx: { Risk: -10, Lian: 5 },
        require: { Lian: 50 },
        npcFx: [{ id: 'shijiwei_han', favor: 12 }],
      },
      {
        label: '先摸清「有关情况」指什么',
        fx: { Risk: 6, GX: 4, Lian: -4 },
        npcFx: [{ id: 'shijiwei_han', favor: -8 }],
      },
      {
        label: '避重就轻',
        fx: { Risk: 10, Lian: -6 },
        npcFx: [{ id: 'shijiwei_han', favor: -12 }],
      },
    ],
  },
  {
    id: 'np_han_yancha',
    kind: 'npc',
    title: '韩书记的茶',
    text: '非正式场合。韩书记说：「临江的干部，我见得多了。有人栽在钱上，有人栽在『朋友』上。」他给你续水，「你呢？」',
    weight: 5,
    minRank: 12,
    maxRank: 17,
    require: { npc: [{ id: 'shijiwei_han', min: 20 }] },
    choices: [
      {
        label: '直说自己的边界',
        fx: { Lian: 4, GX: 3 },
        npcFx: [{ id: 'shijiwei_han', favor: 8 }],
      },
      {
        label: '请教「怎么守」',
        fx: { NL: 3, Lian: 2 },
        npcFx: [{ id: 'shijiwei_han', favor: 6 }],
      },
    ],
  },

  // ── 林首席 ─────────────────────────────────────────
  {
    id: 'np_lin_xuanchuan',
    kind: 'npc',
    title: '首席要一篇「深度」',
    text: '林首席想写《临江治理现代化》。他说可以「多听你的思路」。你清楚：成稿是名片，也可能是把柄——取决于你给多少真话。',
    weight: 6,
    minRank: 12,
    maxRank: 17,
    choices: [
      {
        label: '给真实案例，允许批评性表述',
        fx: { Lian: 4, MX: 3, GX: -2 },
        npcFx: [{ id: 'ribao', favor: 8 }],
        require: { Lian: 55 },
      },
      {
        label: '只给成绩与亮点',
        fx: { GX: 3, Lian: -2 },
        npcFx: [{ id: 'ribao', favor: 4 }],
      },
      {
        label: '婉拒，工作以文件为准',
        fx: { Lian: 2, GX: -3 },
        npcFx: [{ id: 'ribao', favor: -5 }],
      },
    ],
  },
  {
    id: 'np_lin_heigao',
    kind: 'npc',
    title: '「有人在传」',
    text: '林首席发来截图：外地号准备发「临江副市长与商人过从甚密」。配图是商会年会那次。他说：「我可以压一压，也可以帮你澄清。」标点用得很讲究。',
    weight: 7,
    minRank: 12,
    maxRank: 17,
    minRisk: 25,
    choices: [
      {
        label: '请他核实事实，欢迎监督',
        fx: { Lian: 4, Risk: -4, MX: 2 },
        require: { Lian: 58 },
        npcFx: [{ id: 'ribao', favor: 6 }],
      },
      {
        label: '请他「先压一压」',
        fx: { Lian: -8, Risk: 6, GX: 4 },
        npcFx: [{ id: 'ribao', favor: 10 }],
      },
      {
        label: '不回应，等它过去',
        fx: { Risk: 5, MX: -3 },
      },
    ],
  },

  // ── 周处长 ─────────────────────────────────────────
  {
    id: 'np_zhou_xiangmu',
    kind: 'npc',
    title: '省里的「窗口期」',
    text: '周处长点拨：省里有一笔产业基金，申报窗口只有十天。「材料要硬，时间要快。」他笑，「当然，硬不硬，有时也看谁递。」',
    weight: 7,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '连夜组织过硬材料，公开申报',
        fx: { ZJ: 5, NL: 4, Lian: 2 },
        successRate: 0.7,
        failFx: { ZJ: 1, GX: -2 },
        failText: '材料很硬，还是差半步。',
      },
      {
        label: '请周处「指点路径」',
        fx: { GX: 6, Lian: -4, ZJ: 3 },
        npcFx: [{ id: 'shengfagai', favor: 10 }],
      },
      {
        label: '放弃窗口，练内功',
        fx: { NL: 3, ZJ: 1 },
      },
    ],
  },
  {
    id: 'np_zhou_fanma',
    kind: 'npc',
    title: '处长的「家宴」',
    text: '周处长说家里包了饺子，「就几个熟人」。到了才发现，熟人里有你分管领域的老板。饺子很香，空气很紧。',
    weight: 6,
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '吃完就走，不谈项目',
        fx: { GX: 2, Lian: 1 },
      },
      {
        label: '当场点破，以后少聚',
        fx: { Lian: 5, GX: -8 },
        npcFx: [{ id: 'shengfagai', favor: -10 }],
      },
      {
        label: '顺势聊「产业协同」',
        fx: { GX: 5, Lian: -6, Risk: 4 },
        npcFx: [{ id: 'shengfagai', favor: 8 }],
      },
    ],
  },

  // ── 陈秘书（省） ───────────────────────────────────
  {
    id: 'np_chen_richeng',
    kind: 'npc',
    title: '「领导下午有十五分钟」',
    text: '陈秘书的短信只有一行。你准备了三十页，最后讲了三页。出门时他说：「领导记住了两个数。哪两个，你自己清楚。」',
    weight: 6,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '复盘哪两个数，并落实',
        fx: { NL: 4, ZJ: 3 },
        npcFx: [{ id: 'sheng_mishu', favor: 6 }],
      },
      {
        label: '请陈秘书再安排一次补充汇报',
        fx: { GX: 5, ZJ: 2 },
        npcFx: [{ id: 'sheng_mishu', favor: 8 }],
      },
      {
        label: '不追问，按原计划推进',
        fx: { Lian: 2, GX: -1 },
      },
    ],
  },
  {
    id: 'np_chen_tiexin',
    kind: 'npc',
    title: '秘书的「善意」',
    text: '陈秘书提醒：「最近有人反映你条线上的事。不是大事，但传到领导耳朵里就不好。」他没说是谁传的。你分不清这是保护，还是投名状的邀请。',
    weight: 6,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '感谢提醒，自查并主动报告',
        fx: { Lian: 5, Risk: -4 },
        npcFx: [{ id: 'sheng_mishu', favor: 4 }],
        require: { Lian: 55 },
      },
      {
        label: '打听是谁在反映',
        fx: { GX: 4, Lian: -5, Risk: 5 },
        npcFx: [{ id: 'sheng_mishu', favor: 8 }],
      },
      {
        label: '当没听见',
        fx: { Risk: 3 },
      },
    ],
  },

  // ── 同僚副省长 ─────────────────────────────────────
  {
    id: 'np_tonglun_ban',
    kind: 'npc',
    title: '隔壁口子的「协同」',
    text: '同僚副省长提议：两省交界园区「共建共管」，数据共享、税收分成。听起来很美，细则里全是他的主场。',
    weight: 6,
    minRank: 15,
    maxRank: 17,
    choices: [
      {
        label: '赞成协同，细则请法制与财政把关',
        fx: { NL: 4, ZJ: 3, GX: 2, Lian: 2 },
      },
      {
        label: '全力支持，尽快签约',
        fx: { GX: 6, ZJ: 4, Lian: -4, Risk: 4 },
        npcFx: [{ id: 'sheng_tongzhi', favor: 10 }],
      },
      {
        label: '担心权责不清，建议缓议',
        fx: { GX: -5, Lian: 2, NL: 2 },
        npcFx: [{ id: 'sheng_tongzhi', favor: -6 }],
      },
    ],
  },
  {
    id: 'np_tonglun_bi',
    kind: 'npc',
    title: '名单上的并列',
    text: '风声：上面在比较你和他。他忽然对你格外客气，会上主动给你递话。你知道，客气有时比攻击更难接。',
    weight: 5,
    minRank: 16,
    maxRank: 17,
    choices: [
      {
        label: '礼尚往来，工作不掺私',
        fx: { GX: 3, Lian: 2 },
      },
      {
        label: '刻意拉开距离',
        fx: { GX: -4, Lian: 2 },
        npcFx: [{ id: 'sheng_tongzhi', favor: -5 }],
      },
      {
        label: '也向他「递话」',
        fx: { GX: 5, Lian: -3 },
        npcFx: [{ id: 'sheng_tongzhi', favor: 8 }],
        faction: 'B',
      },
    ],
  },

  // ── 董总 ───────────────────────────────────────────
  {
    id: 'np_dong_luodi',
    kind: 'npc',
    title: '链主要「确定性」',
    text: '董总的法务团队比你想象的年轻。他们要一份「政策稳定性承诺函」，用词精准得像已经写好了批复。董总微笑：「我们只想安心做产业。」',
    weight: 7,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '依法给出可预期政策，不写越权承诺',
        fx: { Lian: 5, ZJ: 4, NL: 3, GX: -2 },
        npcFx: [{ id: 'jituan', favor: -4 }],
      },
      {
        label: '特事特办，尽快落子',
        fx: { ZJ: 8, Lian: -10, Risk: 8 },
        npcFx: [{ id: 'jituan', favor: 14 }],
      },
      {
        label: '引入省级联审再签',
        fx: { Risk: -3, GX: 3, ZJ: 3 },
        npcFx: [{ id: 'shengfagai', favor: 5 }],
      },
    ],
  },
  {
    id: 'np_dong_yanxue',
    kind: 'npc',
    title: '「学术」赞助',
    text: '董总要赞助一个高端论坛，请你「担任指导单位领导」。出场费不叫出场费，叫「专家咨询费」。信封很薄，故事很长。',
    weight: 6,
    minRank: 15,
    maxRank: 19,
    choices: [
      {
        label: '出席但不收任何费用',
        fx: { Lian: 5, MX: 2, GX: 1 },
      },
      {
        label: '婉拒一切关联',
        fx: { Lian: 4, GX: -3 },
        npcFx: [{ id: 'jituan', favor: -6 }],
      },
      {
        label: '收下，算「讲课劳务」',
        fx: { Lian: -14, Risk: 12, GX: 5 },
        npcFx: [{ id: 'jituan', favor: 12 }],
      },
    ],
  },

  // ── 司长（中央） ───────────────────────────────────
  {
    id: 'np_buwei_bianhan',
    kind: 'npc',
    title: '部委便函',
    text: '司里来函，对地方一项试点「请再斟酌」。措辞客气，意思明确。司长约你「沟通」，时间：二十分钟。',
    weight: 7,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '带完整方案去沟通，可改不可废',
        fx: { NL: 4, ZJ: 3, GX: 2 },
        npcFx: [{ id: 'buwei_si', favor: 6 }],
      },
      {
        label: '完全按部委口径调整',
        fx: { GX: 5, ZJ: 1 },
        npcFx: [{ id: 'buwei_si', favor: 8 }],
      },
      {
        label: '坚持地方试点必要性',
        fx: { ZJ: 3, GX: -5, Lian: 2 },
        npcFx: [{ id: 'buwei_si', favor: -6 }],
        successRate: 0.65,
        failFx: { ZJ: -1, GX: -4 },
        failText: '试点被要求「再评估」。',
      },
    ],
  },
  {
    id: 'np_buwei_canguan',
    kind: 'npc',
    title: '司长下去调研',
    text: '司长到基层，轻车简从——至少名单上是。地方同志层层陪同。司长只问了三个数据，每个都像刀。',
    weight: 5,
    minRank: 18,
    maxRank: 19,
    choices: [
      {
        label: '数据如实，问题不回避',
        fx: { Lian: 4, MX: 3, GX: -2 },
        npcFx: [{ id: 'buwei_si', favor: 5 }],
      },
      {
        label: '精心安排「典型」路线',
        fx: { GX: 3, Lian: -4, MX: -2 },
        npcFx: [{ id: 'buwei_si', favor: 3 }],
      },
    ],
  },
]

export function getUpperNpcEvent(id: string): GameEvent | undefined {
  return UPPER_NPC_EVENTS.find((x) => x.id === id)
}
