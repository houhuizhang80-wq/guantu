import type { GameEvent } from '../types'

/**
 * 县区篇剧本（云河县）
 * 主线 storyOrder 10–17；可玩窗口大约在 乡科级正职 → 县处级。
 */
export const COUNTY_EVENTS: GameEvent[] = [
  // ─── 主线 ───────────────────────────────────────────
  {
    id: 'cx_furen',
    kind: 'main',
    title: '县里来人考察',
    text: '你在镇长任上干满两年。县委组织部来人，茶还没凉透，问题已经很直白：愿不愿意到县直挑担子？「云河县的情况，你在基层更清楚。」窗外，青石镇的主街正在拓宽。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 10,
    minRank: 6,
    maxRank: 8,
    choices: [
      {
        label: '愿意，并谈对县域治理的判断',
        hint: '展格局',
        fx: { NL: 6, GX: 5, ZJ: 4 },
        successRate: 0.78,
        failFx: { GX: -3 },
        failText: '谈话记录写你「视野仍偏乡镇」。',
      },
      {
        label: '表服从安排，不谈太多',
        fx: { GX: 3, Lian: 2 },
      },
      {
        label: '希望再在镇上干一届打牢基础',
        fx: { ZJ: 3, MX: 4, GX: -2 },
      },
    ],
  },
  {
    id: 'cx_jiuzhang',
    kind: 'main',
    title: '青石旧账',
    text: '县审计局抄送一份说明：你在青石镇力推的园区配套道路，有一段施工单位与钱老板股权关联。有人在会上轻描淡写：「都是历史遗留。」你的名字，在附件第三页。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 11,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '主动说明决策过程，配合核查',
        fx: { Lian: 10, Risk: -8, GX: -4 },
        require: { Lian: 48 },
        npcFx: [{ id: 'jizhu', favor: 10 }],
      },
      {
        label: '推给前任与经办科室',
        fx: { Lian: -10, Risk: 8, GX: 4 },
      },
      {
        label: '找关系「先压一压」',
        fx: { GX: 6, Lian: -12, Risk: 12 },
        require: { GX: 55 },
        npcFx: [{ id: 'laoban', favor: 10 }],
      },
    ],
  },
  {
    id: 'cx_banzi_xian',
    kind: 'main',
    title: '县政府班子会',
    text: '第一次坐进县政府会议室。县长讲话很快，副县长们记笔记的速度也不慢。议题是年度重点项目清单——谁的条线多一票，谁明年就好过。你的分管领域还空着。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 12,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '主动要难啃的民生条线',
        fx: { MX: 8, ZJ: 5, GX: -3, NL: 4 },
        successRate: 0.72,
        failFx: { MX: 2, ZJ: -2 },
        failText: '清单最终版里，你的条线被「再研究」。',
      },
      {
        label: '接稳妥、好出数字的条线',
        fx: { ZJ: 6, GX: 4, MX: -2 },
      },
      {
        label: '先看风向，暂不表态',
        fx: { GX: 2, NL: 1 },
      },
    ],
  },
  {
    id: 'cx_minsheng',
    kind: 'main',
    title: '老旧小区改造',
    text: '你分管的第一件大事：十七个老旧小区改造。预算紧、诉求杂、施工扰民。有居民拉横幅，也有包工头在夜色里递烟。市里要进度，县里要稳定，群众要质量。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 13,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '公开招标 + 居民议事会全程参与',
        fx: { MX: 12, ZJ: 8, NL: 5, GX: -4 },
        successRate: 0.7,
        failFx: { MX: 4, ZJ: 2, Risk: 4 },
        failText: '议事会开成吵架会，进度落后被通报。',
      },
      {
        label: '特事特办，指定熟悉的队伍进场',
        fx: { ZJ: 8, GX: 6, Lian: -14, Risk: 12 },
        npcFx: [{ id: 'laoban', favor: 15 }],
      },
      {
        label: '分期试点，先干三个最急的小区',
        fx: { ZJ: 5, MX: 5, NL: 3 },
      },
    ],
  },
  {
    id: 'cx_xunshi',
    kind: 'main',
    title: '巡视组进驻',
    text: '市委巡视组进驻云河。谈话通知下到你这里。有人提前打招呼：「少说多听。」也有人说：「该说的要说清楚。」会议室的绿萝，叶片擦得发亮。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 14,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '如实反映问题，不点名攻击他人',
        fx: { Lian: 8, Risk: -6, GX: -5 },
        require: { Lian: 50 },
        npcFx: [{ id: 'jizhu', favor: 8 }],
      },
      {
        label: '只谈成绩与困难，不碰敏感',
        fx: { GX: 4, Lian: -2 },
      },
      {
        label: '暗示「某些同志」的问题',
        hint: '借刀，也结仇',
        fx: { GX: 2, Risk: 6, Lian: -6 },
        successRate: 0.55,
        failFx: { GX: -12, Risk: 10 },
        failText: '谈话对象名单泄露，你成了焦点。',
      },
    ],
  },
  {
    id: 'cx_weiji',
    kind: 'main',
    title: '暴雨与舆情',
    text: '汛期。西部乡镇受灾，道路中断。你在一线，浑身是泥。本地号已经发出「救援迟缓」的稿件，评论区在刷。市应急局电话打不通第三遍时，终于通了。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 15,
    monthMod: [6, 7, 8],
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '救人优先，信息每小时如实发布',
        fx: { MX: 14, ZJ: 10, NL: 5, Risk: -4 },
        successRate: 0.8,
        failFx: { MX: 5, ZJ: 4, Risk: 5 },
        failText: '有一处失联，后来找到了。通报写了「处置有力仍有不足」。',
      },
      {
        label: '先稳宣传口径，再慢慢救灾',
        fx: { GX: 4, MX: -10, Risk: 8 },
      },
      {
        label: '全部下沉，你自己在堤上值守',
        fx: { MX: 8, ZJ: 6, NL: 3 },
      },
    ],
  },
  {
    id: 'cx_shengqian',
    kind: 'main',
    title: '县长人选',
    text: '风声很紧：县长可能调市里，接任人选在几个副处里酝酿。有人约你「随便坐坐」，有人在市里替你说了好话——当然，也有人说了坏话。组织部的考察预告贴在公告栏，红纸黑字。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 16,
    minRank: 9,
    maxRank: 11,
    choices: [
      {
        label: '照常工作，不跑不要',
        fx: { Lian: 6, GX: -3, ZJ: 3 },
      },
      {
        label: '向市里有关领导汇报思想',
        fx: { GX: 10, Lian: -6, Risk: 4 },
        faction: 'B',
      },
      {
        label: '把分管工作做出可见样本',
        fx: { ZJ: 8, NL: 4, MX: 3 },
        successRate: 0.75,
        failFx: { ZJ: 2 },
        failText: '样本还没做完，风向已经变了。',
      },
    ],
  },
  {
    id: 'cx_jiuzhong',
    kind: 'main',
    title: '赴任或留下',
    text: '文件袋放在桌上，封口的火漆是新的。组织谈话很短。外头有人放鞭炮——不知道为谁。你想起青石镇第一次加班的那个夜晚，打印机卡纸，你一个人修到十二点。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 17,
    minRank: 10,
    maxRank: 11,
    choices: [
      {
        label: '接下更重的担子',
        fx: { ZJ: 5, NL: 4, GX: 3, Risk: 3 },
      },
      {
        label: '请组织再考虑，希望把县里的事做完',
        fx: { MX: 4, ZJ: 3, GX: -2 },
      },
    ],
  },

  // ─── 县区日常 ───────────────────────────────────────
  {
    id: 'cd_huiyi',
    kind: 'daily',
    title: '四会连开',
    text: '上午常务会，下午调度会，晚上还有一个「碰头会」。秘书把材料摞成三摞。你发现同一件事在不同会上被讲成了三个版本。',
    weight: 10,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '当场对齐口径，明确牵头单位',
        fx: { NL: 4, ZJ: 3, GX: -2 },
      },
      {
        label: '多听少说，会后单独找关键人',
        fx: { GX: 5, NL: 2 },
      },
      {
        label: '要求压会，合并议题',
        hint: '得罪会务与习惯',
        fx: { NL: 3, MX: 3, GX: -4 },
        successRate: 0.65,
        failFx: { GX: -6 },
        failText: '压会通知发了，人还是坐满——会议改在饭点接着开。',
      },
    ],
  },
  {
    id: 'cd_touzi',
    kind: 'daily',
    title: '招商饭局',
    text: '外地客商考察云河。酒过三巡，对方问：地价、税收、「弹性空间」。县商务局长在桌下轻轻碰了碰你的膝盖。',
    weight: 9,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '政策范围内给优惠，底线不碰',
        fx: { ZJ: 4, Lian: 3, GX: 2 },
      },
      {
        label: '先把项目落地再说细节',
        fx: { ZJ: 6, Lian: -8, Risk: 6 },
        npcFx: [{ id: 'laoban', favor: 8 }],
      },
      {
        label: '如实告知云河短板，请对方慎重',
        fx: { Lian: 4, NL: 3, ZJ: -1 },
      },
    ],
  },
  {
    id: 'cd_xinfangxian',
    kind: 'daily',
    title: '县信访局',
    text: '积案清零专项行动。第三十七号案：二十年前的宅基地。卷宗厚得像砖，双方都还活着，都还上访。经办人换了五任。',
    weight: 8,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '包案化解，一次见面听到底',
        fx: { MX: 8, ZJ: 4, NL: 3 },
        successRate: 0.68,
        failFx: { MX: 3, ZJ: 1 },
        failText: '见面很成功，签字时双方又翻回原点。',
      },
      {
        label: '依法终结，做好释法说理',
        fx: { Lian: 3, MX: -2, ZJ: 2 },
      },
      {
        label: '暂时搁置，集中力量在新案',
        fx: { ZJ: 1, MX: -4 },
      },
    ],
  },
  {
    id: 'cd_ganbu',
    kind: 'daily',
    title: '干部推荐',
    text: '你条线上要提一个科长。两个人选：一个能干但嘴臭，一个稳妥但平庸。打招呼的电话，昨晚已经来过两通。',
    weight: 8,
    minRank: 7,
    maxRank: 11,
    choices: [
      {
        label: '按实绩与测评，用能干的那个',
        fx: { NL: 4, ZJ: 4, GX: -5 },
        successRate: 0.7,
        failFx: { GX: -8, ZJ: 1 },
        failText: '人提上去了，有人在民主生活会上点了你的名。',
      },
      {
        label: '用稳妥的，少生事',
        fx: { GX: 3, NL: -1, ZJ: 1 },
      },
      {
        label: '再看看，都先不动',
        fx: { GX: 1, NL: 1 },
      },
    ],
  },
  {
    id: 'cd_shenji',
    kind: 'daily',
    title: '审计谈话',
    text: '县审计局请你说明一项专项资金的拨付节奏。问题很技术，但听的人很政治。你记得自己签过字，也记得签字前有人保证「程序都全」。',
    weight: 7,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '调出底稿，逐笔说明',
        fx: { Lian: 6, NL: 3, Risk: -4 },
        require: { Lian: 45 },
      },
      {
        label: '让经办科室先对接',
        fx: { GX: 2, Risk: 3, Lian: -2 },
      },
      {
        label: '强调「集体决策」',
        fx: { Risk: 4, GX: 3, Lian: -4 },
      },
    ],
  },
  {
    id: 'cd_meitixian',
    kind: 'daily',
    title: '外地号黑稿',
    text: '一篇「云河形象工程」的稿子在传播。配图是你出席开工仪式的照片，角度刁钻。宣传部长问：删，还是回应？',
    weight: 7,
    minRank: 7,
    maxRank: 11,
    choices: [
      {
        label: '公开项目预算与进度，欢迎监督',
        fx: { MX: 6, Lian: 5, GX: -3 },
        require: { Lian: 55 },
        successRate: 0.75,
        failFx: { MX: -3, Risk: 4 },
        failText: '回应稿被指「避重就轻」。',
      },
      {
        label: '请平台处理，同时线下沟通',
        fx: { Risk: -3, Lian: -4, GX: 4 },
      },
      {
        label: '冷处理，等下一个热点',
        fx: { MX: -3, Risk: 3 },
      },
    ],
  },
  {
    id: 'cd_jiatingxian',
    kind: 'daily',
    title: '家属',
    text: '爱人单位体检报告不太好。孩子小升初，你答应过家长会一定到。同一周，市里有一个不能缺席的推进会。',
    weight: 6,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '推进会去，家长会让爱人去',
        fx: { ZJ: 2, GX: 2, MX: -1 },
      },
      {
        label: '家长会一定到，推进会请假',
        fx: { MX: 3, GX: -3, ZJ: -1 },
      },
      {
        label: '两头都尽量顾，自己少睡',
        fx: { NL: 2, MX: 2, ZJ: 2 },
      },
    ],
  },
  {
    id: 'cd_laobanxian',
    kind: 'daily',
    title: '钱老板进县城',
    text: '钱老板把公司迁到了县城，新名片印着「云河商会副会长」。他说只叙旧，不办事。车后备箱打开着，像某种邀请。',
    weight: 7,
    minRank: 6,
    maxRank: 11,
    choices: [
      {
        label: '叙旧可以，办事按程序',
        fx: { Lian: 5, GX: 1 },
        npcFx: [{ id: 'laoban', favor: -5 }],
      },
      {
        label: '保持距离，少见面',
        fx: { Lian: 4, GX: -2, Risk: -2 },
      },
      {
        label: '借助他的商会资源做招商',
        hint: '资源与风险一起进门',
        fx: { ZJ: 5, GX: 4, Lian: -10, Risk: 8 },
        npcFx: [{ id: 'laoban', favor: 14 }],
      },
    ],
  },

  // ─── 危机 ───────────────────────────────────────────
  {
    id: 'cc_anquan',
    kind: 'crisis',
    title: '安全生产事故',
    text: '凌晨电话：园区一家企业车间爆燃。伤亡数字在变。你往现场赶的时候，手机里已经有现场视频在传。',
    weight: 0,
    minRisk: 25,
    minRank: 7,
    maxRank: 11,
    choices: [
      {
        label: '一线指挥，救人、管控、如实通报',
        fx: { MX: 8, ZJ: 6, Risk: -5, NL: 4 },
        require: { NL: 40 },
        successRate: 0.75,
        failFx: { Risk: 8, MX: -4 },
        failText: '二次舆情：有人质疑瞒报伤亡。',
      },
      {
        label: '先统一口径，避免「恐慌」',
        fx: { Risk: 8, MX: -8, Lian: -6 },
      },
      {
        label: '明确属地与部门责任，依法处置',
        fx: { Lian: 4, GX: -4, ZJ: 3 },
      },
    ],
  },
  {
    id: 'cc_jubao',
    kind: 'crisis',
    title: '实名举报',
    text: '市纪委转来一件实名举报，反映你「在项目中为特定企业提供便利」。举报人你认识——曾经的生意伙伴，后来闹翻了。',
    weight: 0,
    minRisk: 40,
    minRank: 7,
    maxRank: 11,
    choices: [
      {
        label: '全面配合，提供全部往来记录',
        fx: { Risk: -10, Lian: 6 },
        require: { Lian: 50 },
        npcFx: [{ id: 'jizhu', favor: 8 }],
      },
      {
        label: '先找人「了解案情」',
        fx: { Risk: 10, GX: 5, Lian: -8 },
      },
      {
        label: '公开表态欢迎监督',
        fx: { MX: 3, Lian: 2, Risk: -3 },
        successRate: 0.7,
        failFx: { Risk: 5 },
        failText: '表态被解读为「心虚」。',
      },
    ],
  },

  // ─── 人脉 ───────────────────────────────────────────
  {
    id: 'cn_shizhang',
    kind: 'npc',
    title: '市里的饭',
    text: '临江市一位副市长「路过云河」。席间他提起你在省里党校的同学，又提起自己当年在县里的难处。没有托你办事，但每一句都像在建档。',
    weight: 6,
    minRank: 8,
    maxRank: 12,
    choices: [
      {
        label: '认真听，适度汇报县情',
        fx: { GX: 6, NL: 2 },
      },
      {
        label: '少说，多敬酒',
        fx: { GX: 4, Lian: -2 },
        faction: 'B',
      },
      {
        label: '保持礼貌距离',
        fx: { Lian: 2, GX: -2 },
      },
    ],
  },
  {
    id: 'cn_laoshuji_shangji',
    kind: 'npc',
    title: '老书记来电',
    text: '已退休的周老书记打来电话，只问了一句：「县里的事，你还干净吗？」停顿三秒，他说：「干净就继续干。不干净，现在还来得及。」',
    weight: 0,
    minRank: 7,
    maxRank: 11,
    choices: [
      {
        label: '如实回答，并请教分寸',
        fx: { Lian: 4, NL: 3 },
        npcFx: [{ id: 'laoshuji', favor: 8 }],
      },
      {
        label: '报喜不报忧',
        fx: { GX: 1, Lian: -2 },
      },
    ],
  },

  // ─── 调节 ───────────────────────────────────────────
  {
    id: 'cq_jiaxiang',
    kind: 'calm',
    title: '回青石',
    text: '路过青石镇。主街拓宽了，路灯是新的。王婶在门口择菜，抬头认出你，喊了声「干部」，又改口喊「县长」。你纠正了两次，她还是那么喊。',
    weight: 5,
    minRank: 7,
    maxRank: 11,
    choices: [
      {
        label: '坐下聊半小时，问渠还通不通',
        fx: { MX: 5, NL: 1 },
        npcFx: [{ id: 'laobaixing', favor: 8 }],
      },
      {
        label: '看一眼就走，还有会',
        fx: { ZJ: 1 },
      },
    ],
  },
  {
    id: 'cq_dushu',
    kind: 'calm',
    title: '党校宿舍',
    text: '中青班宿舍。台灯下摊着一本县域经济案例集。同学在走廊抽烟，谈的都是「下一步」。你忽然很怀念写材料到凌晨、只有打印机声的夜晚。',
    weight: 5,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '把案例写成云河的对策',
        fx: { NL: 6, ZJ: 2 },
      },
      {
        label: '多和同学走动',
        fx: { GX: 6, NL: 1 },
        faction: 'B',
      },
      {
        label: '早睡，把身体当本钱',
        fx: { NL: 2, MX: 1 },
      },
    ],
  },
]

export function getCountyEvent(id: string): GameEvent | undefined {
  return COUNTY_EVENTS.find((x) => x.id === id)
}
