import type { GameEvent } from '../types'

/**
 * 16 种出身专属剧情
 * - kind=main + storyOrder 50+：出身主线（在乡镇主线 1–8 之后穿插）
 * - kind=daily/npc/calm：出身日常
 * 仅 originIds 匹配的出身可见
 */
export const ORIGIN_EVENTS: GameEvent[] = [
  // ══════════════════ 1. 普通选调 xuandiao_pu ══════════════════
  {
    id: 'ox_pu_1',
    kind: 'main',
    title: '组织部的第一次谈话',
    text: '县委组织部来人「了解选调生表现」。问题很标准：适不适应基层？有没有实际困难？你说到夜里写材料、食堂饭菜时，对方笔停了停，抬眼看你——像在分清「诉苦」和「情况」。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['xuandiao_pu'],
    maxRank: 2,
    choices: [
      {
        label: '谈工作感受与具体困难',
        fx: { GX: 4, NL: 2, MX: 2 },
        successRate: 0.75,
        failFx: { GX: -3 },
        failText: '记录上写「需进一步加强基层历练」。',
      },
      {
        label: '只谈收获，不谈困难',
        fx: { GX: 2, Lian: 1 },
      },
      {
        label: '汇报一项自己办成的小事',
        fx: { ZJ: 4, NL: 3, GX: 3 },
      },
    ],
  },
  {
    id: 'ox_pu_2',
    kind: 'main',
    title: '「墩苗」期满评估',
    text: '镇上给你出了鉴定：「工作踏实，群众工作有待加强。」有人说可以争取提前结束锻炼回县直；也有人说，再蹲一年更稳。周书记把鉴定推给你：「你自己怎么看？」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['xuandiao_pu'],
    minRank: 1,
    maxRank: 3,
    choices: [
      {
        label: '请求继续在乡镇多干一段',
        fx: { MX: 6, ZJ: 3, NL: 2 },
        npcFx: [{ id: 'laoshuji', favor: 12 }],
      },
      {
        label: '争取到县直综合岗位',
        fx: { GX: 6, NL: 3, MX: -2 },
      },
      {
        label: '服从组织安排',
        fx: { GX: 2, Lian: 2 },
      },
    ],
  },
  {
    id: 'ox_pu_d1',
    kind: 'daily',
    title: '同批微信群',
    text: '群里有人晒市里加班照片，有人晒遴选上岸。你关掉手机，继续对台账。过了一会儿又打开，发了一句「乡镇也挺好」，秒删。',
    weight: 7,
    onlyOnce: true,
    originIds: ['xuandiao_pu', 'xuandiao_ding'],
    maxRank: 3,
    choices: [
      {
        label: '把精力放回手头的事',
        fx: { NL: 3, ZJ: 2 },
      },
      {
        label: '约同批交流基层经验',
        fx: { GX: 4, NL: 2 },
        npcFx: [{ id: 'tongshi', favor: 8 }],
      },
    ],
  },
  {
    id: 'ox_pu_d2',
    kind: 'daily',
    title: '第一次独立包村',
    text: '你被安排联系一个中等村。村支书客气里带着考较：「大学生，能待住不？」',
    weight: 7,
    onlyOnce: true,
    originIds: ['xuandiao_pu'],
    maxRank: 2,
    choices: [
      {
        label: '每周固定进村，先认门',
        fx: { MX: 6, NL: 3, ZJ: 2 },
      },
      {
        label: '先理清问题清单再下村',
        fx: { NL: 4, MX: 2 },
      },
    ],
  },

  // ══════════════════ 2. 定向选调 xuandiao_ding ══════════════════
  {
    id: 'ox_ding_1',
    kind: 'main',
    title: '「名校光环」的副作用',
    text: '县里开年轻干部座谈会，主持人特意介绍：「这位是××大学定向选调。」会后有人热情加微信，也有人撇嘴：「书生气。」你知道光环是通行证，也是靶子。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['xuandiao_ding'],
    maxRank: 3,
    choices: [
      {
        label: '用一件具体工作证明自己',
        fx: { ZJ: 6, NL: 4, GX: -1 },
        successRate: 0.72,
        failFx: { ZJ: 1, GX: -3 },
        failText: '工作没出彩，「只会说」的印象又深了一层。',
      },
      {
        label: '低调不解释',
        fx: { Lian: 2, GX: -2 },
      },
      {
        label: '主动请缨最难的活',
        fx: { ZJ: 5, MX: 4, NL: 3, GX: -2 },
      },
    ],
  },
  {
    id: 'ox_ding_2',
    kind: 'main',
    title: '急需专业 vs 乡镇杂事',
    text: '你的专业在省里是紧缺，到了乡镇成了「什么都管」。领导说：「基层没有不对口。」你望着成堆的报表，第一次认真想：专业是资本，还是枷锁？',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['xuandiao_ding', 'rencai'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '把专业用在项目论证上',
        fx: { NL: 5, ZJ: 5, GX: 2 },
      },
      {
        label: '全面适应杂务，暂放专业',
        fx: { MX: 3, GX: 3, NL: -1, ZJ: 2 },
      },
      {
        label: '向上反映专业使用问题',
        fx: { GX: -3, NL: 2, Risk: 2 },
      },
    ],
  },
  {
    id: 'ox_ding_d1',
    kind: 'daily',
    title: '讲座邀约',
    text: '县中学请你回去做励志讲座。讲台上你说「到祖国最需要的地方去」，台下眼睛发亮。回程车上，你想起自己签三方时的手抖。',
    weight: 6,
    onlyOnce: true,
    originIds: ['xuandiao_ding', 'rencai', 'xuandiao_pu'],
    maxRank: 3,
    choices: [
      {
        label: '如实讲基层的苦与值',
        fx: { MX: 4, Lian: 2, NL: 1 },
      },
      {
        label: '只讲正能量',
        fx: { GX: 2, MX: 2 },
      },
    ],
  },
  {
    id: 'ox_ding_d2',
    kind: 'daily',
    title: '数据模型没人用',
    text: '你做的进度模型很漂亮，会前被换成了一张手画的表格。马主任解释：「领导爱看这个。」',
    weight: 6,
    onlyOnce: true,
    originIds: ['xuandiao_ding', 'rencai', 'biguan'],
    maxRank: 3,
    choices: [
      {
        label: '把模型翻译成手画表',
        fx: { NL: 3, ZJ: 3, GX: 2 },
      },
      {
        label: '坚持数字化推进',
        fx: { NL: 4, GX: -3, ZJ: 1 },
      },
    ],
  },

  // ══════════════════ 3. 省考 shengkao ══════════════════
  {
    id: 'ox_sk_1',
    kind: 'main',
    title: '笔试第一的「无用」',
    text: '有人翻出你省考成绩：行测申论双高。酒桌上有人说「考试型干部」；办事窗口前，群众不看你分数，只看你能不能把章盖对。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['shengkao'],
    maxRank: 3,
    choices: [
      {
        label: '用办事效率说话',
        fx: { ZJ: 5, MX: 5, NL: 3 },
      },
      {
        label: '少提成绩，多跑现场',
        fx: { MX: 4, NL: 3, GX: 1 },
      },
      {
        label: '把考试方法用在培训同事上',
        fx: { NL: 3, GX: 4, ZJ: 2 },
      },
    ],
  },
  {
    id: 'ox_sk_2',
    kind: 'main',
    title: '服务期与遴选',
    text: '满服务期可以考遴选了。市里岗位光鲜，乡镇工作刚顺手。领导暗示「镇上需要你」；家里说「能往上市里就往上」。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['shengkao', 'xuandiao_pu', 'waisheng'],
    minRank: 1,
    maxRank: 3,
    choices: [
      {
        label: '报名遴选，准备离开',
        fx: { NL: 4, ZJ: 2, GX: -4, MX: -2 },
      },
      {
        label: '留下，把包的村做出样子',
        fx: { MX: 8, ZJ: 5, NL: 3 },
        npcFx: [{ id: 'laoshuji', favor: 10 }],
      },
      {
        label: '两手准备，低调备考',
        fx: { NL: 3, Lian: -1, Risk: 2 },
      },
    ],
  },
  {
    id: 'ox_sk_d1',
    kind: 'daily',
    title: '窗口值班',
    text: '你在便民服务中心坐班。一天盖了八十多个章，说了三百多句「请稍等」。嗓子哑了，流程倒背如流。',
    weight: 8,
    onlyOnce: true,
    originIds: ['shengkao', 'waisheng'],
    maxRank: 2,
    choices: [
      {
        label: '优化告知清单，少让群众跑',
        fx: { MX: 6, ZJ: 3, NL: 2 },
      },
      {
        label: '严格按规程，不求快',
        fx: { Lian: 3, MX: 1 },
      },
    ],
  },
  {
    id: 'ox_sk_d2',
    kind: 'daily',
    title: '体测与加班',
    text: '当年一起刷题的朋友进了企业，年薪好看。你在防汛值班室吃泡面。电话响了，是母亲：「工作累不累？」',
    weight: 6,
    onlyOnce: true,
    originIds: ['shengkao', 'xuandiao_pu', 'waisheng'],
    maxRank: 3,
    choices: [
      {
        label: '说「还好」，继续值班',
        fx: { ZJ: 2, MX: 1, NL: 1 },
      },
      {
        label: '实话实说，但也说踏实',
        fx: { MX: 2, NL: 1 },
      },
    ],
  },

  // ══════════════════ 4. 国考垂管 guokao ══════════════════
  {
    id: 'ox_gk_1',
    kind: 'main',
    title: '条线考核与地方考核',
    text: '年终，垂管上级要业务排名，地方党委政府要服务中心工作。两边开会时间撞车。你分身乏术，只能选一个先到。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['guokao'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '先保条线硬指标',
        fx: { ZJ: 4, GX: -4, NL: 3 },
      },
      {
        label: '先跟地方中心工作',
        fx: { GX: 6, MX: 3, ZJ: 2 },
      },
      {
        label: '提前报备，两边错峰',
        fx: { NL: 4, GX: 3, Lian: 2 },
        successRate: 0.7,
        failFx: { GX: -3 },
        failText: '两边都觉得你「不重视」。',
      },
    ],
  },
  {
    id: 'ox_gk_2',
    kind: 'main',
    title: '上级暗访',
    text: '垂管部门不打招呼下来查业务规范。台账是你亲手建的，有一处历史数据「补录」过。检查组的笔尖在那一行停了很久。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['guokao', 'jishu', 'shiye_tiao'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '如实说明补录原因',
        fx: { Lian: 6, Risk: -4, ZJ: -1 },
        require: { Lian: 50 },
      },
      {
        label: '强调业务需要与历史原因',
        fx: { Lian: -4, Risk: 4, GX: 2 },
      },
      {
        label: '当场整改并书面报告',
        fx: { Lian: 4, ZJ: 3, NL: 3, Risk: -2 },
      },
    ],
  },
  {
    id: 'ox_gk_d1',
    kind: 'daily',
    title: '系统填报',
    text: '条线系统月报，地方系统周报，两套口径三套表。你做了一个对照模板，被隔壁乡镇抄走了。',
    weight: 7,
    onlyOnce: true,
    originIds: ['guokao', 'jishu'],
    maxRank: 3,
    choices: [
      {
        label: '共享模板，带带同事',
        fx: { GX: 4, NL: 2, MX: 2 },
      },
      {
        label: '自己用，少出风头',
        fx: { NL: 2, Lian: 1 },
      },
    ],
  },
  {
    id: 'ox_gk_d2',
    kind: 'daily',
    title: '「上面有人」的误会',
    text: '有人传你是「上面下来锻炼的，迟早要走」。工作交办时，有人客气，有人观望。',
    weight: 6,
    onlyOnce: true,
    originIds: ['guokao', 'rencai'],
    maxRank: 3,
    choices: [
      {
        label: '用长期项目证明会扎根',
        fx: { ZJ: 4, MX: 3, GX: 1 },
      },
      {
        label: '不解释，少社交',
        fx: { Lian: 2, GX: -2 },
      },
    ],
  },

  // ══════════════════ 5. 大学生村官 cunguan ══════════════════
  {
    id: 'ox_cg_1',
    kind: 'main',
    title: '村里最后一公里',
    text: '你服务过的村要接自来水，差最后一百米管道。资金缺口不大，协调很难。老支书说：「你在镇上，说话有人听。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['cunguan', 'sanfuyi'],
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '两头协调，限时通水',
        fx: { MX: 10, ZJ: 6, NL: 3 },
        successRate: 0.72,
        failFx: { MX: 3, ZJ: 1 },
        failText: '通了，但拖了一个月，有人埋怨。',
      },
      {
        label: '按程序报项目，明年再说',
        fx: { ZJ: 2, MX: -3, Lian: 2 },
      },
      {
        label: '发动乡贤捐一点',
        fx: { MX: 5, GX: 4, Lian: -2, Risk: 2 },
      },
    ],
  },
  {
    id: 'ox_cg_2',
    kind: 'main',
    title: '从「村里人」到「镇上干部」',
    text: '转任后第一次以镇干部身份回原服务村开会。座位从后排到了主桌。有人喊你「大学生」，有人已经改口「领导」。你开口第一句还是：「我还是那个小×。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['cunguan'],
    minRank: 1,
    maxRank: 3,
    choices: [
      {
        label: '公事公办，回避原村利益事项',
        fx: { Lian: 6, MX: 3, GX: -2 },
      },
      {
        label: '继续深度包村',
        fx: { MX: 8, ZJ: 4, Lian: -1 },
      },
      {
        label: '逐步交接给新村官',
        fx: { NL: 2, GX: 2, MX: 2 },
      },
    ],
  },
  {
    id: 'ox_cg_d1',
    kind: 'daily',
    title: '夜访',
    text: '你沿用当村官时的习惯：晚饭后串门。狗叫了半条街，倒听出两起隐患、一起邻里积怨。',
    weight: 7,
    onlyOnce: true,
    originIds: ['cunguan', 'sanfuyi', 'benxiang', 'xibu'],
    maxRank: 3,
    choices: [
      {
        label: '连夜记录并次日交办',
        fx: { MX: 5, ZJ: 3, NL: 2 },
      },
      {
        label: '现场能调的当场调',
        fx: { MX: 4, NL: 3 },
      },
    ],
  },
  {
    id: 'ox_cg_d2',
    kind: 'daily',
    title: '原来的村官接替者',
    text: '接替你的新村官来请教。你倾囊相授，又怕「教太多」显得自己恋栈。',
    weight: 6,
    onlyOnce: true,
    originIds: ['cunguan', 'sanfuyi'],
    maxRank: 3,
    choices: [
      {
        label: '认真带一带',
        fx: { MX: 3, NL: 2, GX: 3 },
      },
      {
        label: '点到为止',
        fx: { GX: 1, Lian: 1 },
      },
    ],
  },

  // ══════════════════ 6. 三支一扶 sanfuyi ══════════════════
  {
    id: 'ox_sf_1',
    kind: 'main',
    title: '支农站的老同事',
    text: '原服务单位请你「回去看看」。技术推广卡在最后一公里：会开得不少，示范田没人敢种。老同事说：「还是你说话农户信。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['sanfuyi', 'jishu'],
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '包一块示范田带种',
        fx: { MX: 8, ZJ: 5, NL: 3 },
      },
      {
        label: '请镇里发文推动',
        fx: { ZJ: 3, GX: 3, MX: 2 },
      },
      {
        label: '只出技术方案',
        fx: { NL: 3, MX: 1 },
      },
    ],
  },
  {
    id: 'ox_sf_2',
    kind: 'main',
    title: '扶贫档案的后续',
    text: '脱贫攻坚时期的帮扶对象，有的返贫风险仍在。系统里「已脱贫」，入户一看，还是难。你纠结：报上去影响数据，不报对不住人。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['sanfuyi', 'xibu', 'cunguan'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '如实纳入监测帮扶',
        fx: { MX: 8, Lian: 5, ZJ: 3, GX: -3 },
      },
      {
        label: '先内部消化，能帮就帮',
        fx: { MX: 4, Lian: 1, GX: 2 },
      },
      {
        label: '按系统口径上报',
        fx: { ZJ: 2, MX: -4, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_sf_d1',
    kind: 'daily',
    title: '田间课堂',
    text: '你把农技课开到地头。来了十几个老人，记不住笔记，但记得住你蹲在垄沟里的样子。',
    weight: 6,
    onlyOnce: true,
    originIds: ['sanfuyi', 'jishu', 'cunguan'],
    maxRank: 3,
    choices: [
      {
        label: '再办两期',
        fx: { MX: 5, NL: 2, ZJ: 2 },
      },
      {
        label: '改成广播+明白纸',
        fx: { MX: 3, NL: 2 },
      },
    ],
  },
  {
    id: 'ox_sf_d2',
    kind: 'daily',
    title: '服务期满纪念',
    text: '原单位给你发了服务纪念证书。照片里你黑瘦。同事说：「那时候你是真拼。」你笑了笑，把证书收进抽屉最底层。',
    weight: 5,
    onlyOnce: true,
    originIds: ['sanfuyi', 'xibu'],
    maxRank: 3,
    choices: [
      {
        label: '把证书摆出来提醒自己',
        fx: { Lian: 2, MX: 2 },
      },
      {
        label: '收好，往前看',
        fx: { NL: 1, ZJ: 1 },
      },
    ],
  },

  // ══════════════════ 7. 军转 jizhuan ══════════════════
  {
    id: 'ox_jz_1',
    kind: 'main',
    title: '第一次主持协调会',
    text: '你按部队习惯：议程清晰、限时发言、当场定责任人。会开得很「硬」。散会有人竖大拇指，有人皱眉：「地方上不能这么搞。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['jizhuan'],
    maxRank: 3,
    choices: [
      {
        label: '保持效率，微调表达',
        fx: { ZJ: 5, NL: 4, GX: 1, MX: 2 },
      },
      {
        label: '彻底改成地方「软协调」',
        fx: { GX: 5, MX: 3, NL: -1 },
      },
      {
        label: '坚持原风格',
        fx: { ZJ: 4, GX: -5 },
      },
    ],
  },
  {
    id: 'ox_jz_2',
    kind: 'main',
    title: '防汛就像打仗',
    text: '橙色预警。你按预案把人、物、点位全部网格化。有人嫌你「小题大做」。夜里堤段出险，你的网格第一时间到位。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['jizhuan'],
    monthMod: [6, 7, 8],
    minRank: 0,
    maxRank: 4,
    choices: [
      {
        label: '按战时标准再检查一遍',
        fx: { MX: 8, ZJ: 8, NL: 4 },
        successRate: 0.8,
        failFx: { ZJ: 3, MX: 3, Risk: 3 },
        failText: '有一处渗漏，幸无大碍。',
      },
      {
        label: '相信基层自查',
        fx: { ZJ: 3, MX: 1, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_jz_d1',
    kind: 'daily',
    title: '内务与作风',
    text: '你把办公室收拾得像营房。年轻人背后说你「有病」。直到上级来检查，你的台账和现场被点名表扬。',
    weight: 6,
    onlyOnce: true,
    originIds: ['jizhuan'],
    maxRank: 3,
    choices: [
      {
        label: '不解释，继续标准',
        fx: { Lian: 3, ZJ: 3, GX: -1 },
      },
      {
        label: '教大家简单可行的规矩',
        fx: { NL: 3, GX: 3, MX: 2 },
      },
    ],
  },
  {
    id: 'ox_jz_d2',
    kind: 'daily',
    title: '敬礼的手改拿茶杯',
    text: '老部队首长路过，见面还想敬礼。你手抬到一半，改成握手。两人都笑了，笑里有点东西。',
    weight: 5,
    onlyOnce: true,
    originIds: ['jizhuan'],
    maxRank: 4,
    choices: [
      {
        label: '认真汇报转业后的活',
        fx: { ZJ: 2, NL: 2, GX: 2 },
      },
      {
        label: '只叙旧',
        fx: { GX: 2, MX: 1 },
      },
    ],
  },

  // ══════════════════ 8. 人才引进 rencai ══════════════════
  {
    id: 'ox_rc_1',
    kind: 'main',
    title: '安家费与服务期',
    text: '人才补贴到账，服务期协议摊在桌上。违约金条款很长。领导笑：「安心干。」你也笑，心里在算另一笔账。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['rencai'],
    maxRank: 2,
    choices: [
      {
        label: '扎根，把服务期干满干好',
        fx: { Lian: 3, ZJ: 4, MX: 3 },
      },
      {
        label: '打听提前解约与调动',
        fx: { GX: 3, Lian: -2, Risk: 3 },
      },
      {
        label: '用专业成果换更高平台',
        fx: { NL: 5, ZJ: 3, GX: -1 },
      },
    ],
  },
  {
    id: 'ox_rc_2',
    kind: 'main',
    title: '专家还是干部',
    text: '县里让你「牵头搞个规划」，又让你「包村收医保」。你在会议室讲产业模型，在农户家讲缴费档次。两种身份叠在一个人身上。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['rencai'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '规划落地，亲自跟项目',
        fx: { ZJ: 6, NL: 4, MX: 3 },
      },
      {
        label: '重心放包村群众工作',
        fx: { MX: 6, ZJ: 3, GX: 2 },
      },
      {
        label: '申请只管专业条线',
        fx: { NL: 4, GX: -4, MX: -2 },
      },
    ],
  },
  {
    id: 'ox_rc_d1',
    kind: 'daily',
    title: '论文与公文',
    text: '你写惯了英文摘要，公文却要「高度重视、狠抓落实」。第一稿被打回三次。',
    weight: 6,
    onlyOnce: true,
    originIds: ['rencai', 'biguan'],
    maxRank: 2,
    choices: [
      {
        label: '苦练公文腔',
        fx: { NL: 4, GX: 2, ZJ: 2 },
      },
      {
        label: '图表说话，少堆套话',
        fx: { NL: 3, ZJ: 3, GX: -1 },
      },
    ],
  },
  {
    id: 'ox_rc_d2',
    kind: 'daily',
    title: '同学在顶刊',
    text: '博士同学发了顶刊。你在改厕所革命验收表。两种「成就」没法换算，你还是把表改完了。',
    weight: 5,
    onlyOnce: true,
    originIds: ['rencai'],
    maxRank: 3,
    choices: [
      {
        label: '真心祝贺，继续手头事',
        fx: { NL: 2, ZJ: 2, MX: 1 },
      },
      {
        label: '心里发堵，找人喝酒',
        fx: { GX: 2, MX: -1 },
      },
    ],
  },

  // ══════════════════ 9. 事业调任 shiye_tiao ══════════════════
  {
    id: 'ox_sy_1',
    kind: 'main',
    title: '编制故事',
    text: '调任文件到了，事业编转公务员。原单位欢送，新单位有人嘀咕：「事业上来的，底子薄不薄？」你把专业资格证压在玻璃板下，没解释。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['shiye_tiao'],
    maxRank: 2,
    choices: [
      {
        label: '用业务能力打底',
        fx: { NL: 5, ZJ: 4, Lian: 2 },
      },
      {
        label: '主动学机关运转规则',
        fx: { GX: 4, NL: 3 },
      },
      {
        label: '少说话多干活',
        fx: { ZJ: 3, GX: -1, Lian: 2 },
      },
    ],
  },
  {
    id: 'ox_sy_2',
    kind: 'main',
    title: '两套人马的旧情',
    text: '原事业单位的老同事来办事，希望「加急」。你按规矩排队。对方说：「你现在是公务员了，不一样了。」语气像夸，也像扎。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['shiye_tiao', 'guoqi_tiao'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '依法加急（符合容缺受理）',
        fx: { Lian: 4, MX: 3, NL: 2 },
      },
      {
        label: '插队办了',
        fx: { Lian: -10, Risk: 8, GX: 5 },
      },
      {
        label: '公事公办，事后解释',
        fx: { Lian: 5, GX: -3 },
      },
    ],
  },
  {
    id: 'ox_sy_d1',
    kind: 'daily',
    title: '职称 vs 职务',
    text: '原单位还在评职称。你已走职务序列。有人问你后不后悔，你想起实验室的灯和会议室的灯。',
    weight: 5,
    onlyOnce: true,
    originIds: ['shiye_tiao', 'rencai', 'jishu'],
    maxRank: 3,
    choices: [
      {
        label: '走职务，把管理做扎实',
        fx: { ZJ: 3, NL: 3, GX: 2 },
      },
      {
        label: '业务不丢，两条腿',
        fx: { NL: 4, ZJ: 2 },
      },
    ],
  },
  {
    id: 'ox_sy_d2',
    kind: 'daily',
    title: '「你们事业编那套」',
    text: '开会有人习惯性说「你们以前事业单位……」。你没接茬，把一份专业意见放在会议材料最上面。',
    weight: 5,
    onlyOnce: true,
    originIds: ['shiye_tiao'],
    maxRank: 3,
    choices: [
      {
        label: '用专业意见说话',
        fx: { NL: 3, ZJ: 3 },
      },
      {
        label: '会后单独沟通',
        fx: { GX: 3, NL: 1 },
      },
    ],
  },

  // ══════════════════ 10. 国企调任 guoqi_tiao ══════════════════
  {
    id: 'ox_gq_1',
    kind: 'main',
    title: '从酒桌到会场',
    text: '你在企业谈惯了「先交朋友再谈事」。进机关后第一次主持谈判，对方律师把每句话往纪要里写。你后背出汗——以前靠人情，现在靠条文。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['guoqi_tiao'],
    maxRank: 3,
    choices: [
      {
        label: '恶补法规，改走程序',
        fx: { NL: 5, Lian: 4, ZJ: 3 },
      },
      {
        label: '仍靠老关系推进',
        fx: { GX: 6, Lian: -6, Risk: 5 },
      },
      {
        label: '请法制部门提前介入',
        fx: { Lian: 3, NL: 3, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_gq_2',
    kind: 'main',
    title: '老东家要「政策确定性」',
    text: '原公司希望你在土地、税费上给「明确预期」。法律顾问说部分承诺越权。老领导电话里说：「就当帮老东家。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['guoqi_tiao'],
    minRank: 1,
    maxRank: 5,
    choices: [
      {
        label: '只给合法合规的政策解读',
        fx: { Lian: 8, ZJ: 3, GX: -6 },
        npcFx: [{ id: 'laoban', favor: -10 }],
      },
      {
        label: '帮忙「协调」弹性空间',
        fx: { Lian: -14, Risk: 12, GX: 8, ZJ: 4 },
        npcFx: [{ id: 'laoban', favor: 15 }],
      },
      {
        label: '引入公开竞争程序',
        fx: { Lian: 4, NL: 3, ZJ: 3, GX: -2 },
      },
    ],
  },
  {
    id: 'ox_gq_d1',
    kind: 'daily',
    title: '预算表像资产负债表',
    text: '你看财政报表像看财报。同事佩服你「会算账」。你知道：政府的账，多一层政治含义。',
    weight: 6,
    onlyOnce: true,
    originIds: ['guoqi_tiao'],
    maxRank: 4,
    choices: [
      {
        label: '帮大家把账讲明白',
        fx: { NL: 3, GX: 3, ZJ: 2 },
      },
      {
        label: '只做好本职测算',
        fx: { NL: 2, Lian: 1 },
      },
    ],
  },
  {
    id: 'ox_gq_d2',
    kind: 'daily',
    title: '年薪与工资条',
    text: '工资到账短信很短。你想起在企业时的年终奖。窗外镇政府的国旗在风里响。',
    weight: 5,
    onlyOnce: true,
    originIds: ['guoqi_tiao'],
    maxRank: 3,
    choices: [
      {
        label: '认了，干好眼前事',
        fx: { ZJ: 2, Lian: 2 },
      },
      {
        label: '心里不平衡，找人吐槽',
        fx: { GX: 2, MX: -1 },
      },
    ],
  },

  // ══════════════════ 11. 笔杆子 biguan ══════════════════
  {
    id: 'ox_bg_1',
    kind: 'main',
    title: '材料里的真话与漂亮话',
    text: '数字对不上。如实写，会「影响进度形象」；写漂亮，审计来时是雷。你在两种「政治」之间找第三种：把问题写成「正在解决的路径」。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['biguan'],
    maxRank: 3,
    choices: [
      {
        label: '实事求是 + 解决方案',
        fx: { Lian: 5, NL: 4, ZJ: 3, GX: -2 },
        successRate: 0.75,
        failFx: { GX: -5, ZJ: -1 },
        failText: '领导说「再提炼」，意思是别那么实。',
      },
      {
        label: '突出亮点',
        fx: { GX: 5, Lian: -4, ZJ: 2 },
      },
      {
        label: '按旧模板改日期',
        fx: { GX: 1, NL: -1, Risk: 3 },
      },
    ],
  },
  {
    id: 'ox_bg_2',
    kind: 'main',
    title: '从写到干',
    text: '周书记说：「光会写不够。」你被派去啃一个信访积案。笔能生花，人未必买账。第一次上门，门差点拍你脸上。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['biguan'],
    minRank: 1,
    maxRank: 3,
    choices: [
      {
        label: '把材料能力用在案情梳理',
        fx: { NL: 4, ZJ: 4, MX: 4 },
      },
      {
        label: '多跑，少写',
        fx: { MX: 5, NL: 3, GX: 2 },
      },
      {
        label: '申请换人，发挥笔头优势',
        fx: { GX: -3, NL: 1, MX: -2 },
      },
    ],
  },
  {
    id: 'ox_bg_d1',
    kind: 'daily',
    title: '半夜的打印机',
    text: '打印机又卡纸。你修好它，像修好一段人生。第三稿的标题终于对了。',
    weight: 6,
    onlyOnce: true,
    originIds: ['biguan'],
    maxRank: 3,
    choices: [
      {
        label: '继续磨稿',
        fx: { NL: 3, ZJ: 2 },
      },
      {
        label: '准点下班，明天再改',
        fx: { MX: 1, NL: 1 },
      },
    ],
  },
  {
    id: 'ox_bg_d2',
    kind: 'daily',
    title: '讲话稿里的你',
    text: '领导念你写的稿，掌声起来。没有人知道哪句是你写的。你鼓掌，手有点轻。',
    weight: 5,
    onlyOnce: true,
    originIds: ['biguan'],
    maxRank: 3,
    choices: [
      {
        label: '无名就无名',
        fx: { Lian: 2, NL: 2 },
      },
      {
        label: '会后找机会署名或汇报',
        fx: { GX: 3, ZJ: 2, Lian: -1 },
      },
    ],
  },

  // ══════════════════ 12. 技术口 jishu ══════════════════
  {
    id: 'ox_js_1',
    kind: 'main',
    title: '技术方案过不了「人情关」',
    text: '你选的施工工艺最科学，不是最「熟」的那一挂。有人递话：「用老队伍，稳。」你把检测报告拍在桌上，又轻轻收回来。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['jishu', 'shiye_tiao'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '公开比选，技术说了算',
        fx: { Lian: 6, NL: 4, ZJ: 4, GX: -5 },
        successRate: 0.7,
        failFx: { GX: -8, ZJ: 1 },
        failText: '方案被「再研究」，工期拖了。',
      },
      {
        label: '用老队伍，但加监测',
        fx: { ZJ: 3, GX: 4, Lian: -4, Risk: 3 },
      },
      {
        label: '上报请领导定',
        fx: { Risk: -1, ZJ: 1 },
      },
    ],
  },
  {
    id: 'ox_js_2',
    kind: 'main',
    title: '责任终身制的阴影',
    text: '你在设计变更单上签字。同事说：「差不多就行。」你想起培训时老师的话：工程质量，终身追责。笔很沉。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['jishu'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '坚持按规范签',
        fx: { Lian: 6, NL: 3, ZJ: 3, GX: -2 },
      },
      {
        label: '补强后再签',
        fx: { Lian: 3, NL: 3, ZJ: 2 },
      },
      {
        label: '签了，心里存侥幸',
        fx: { Lian: -8, Risk: 8, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_js_d1',
    kind: 'daily',
    title: '又被叫去「看一下」',
    text: '泵站、机井、桥板……哪里不对劲，第一反应都是找你。你鞋上的泥比别人厚。',
    weight: 7,
    onlyOnce: true,
    originIds: ['jishu'],
    maxRank: 3,
    choices: [
      {
        label: '去，顺手带学徒',
        fx: { MX: 4, NL: 3, ZJ: 2 },
      },
      {
        label: '电话指导',
        fx: { NL: 2, ZJ: 1 },
      },
    ],
  },
  {
    id: 'ox_js_d2',
    kind: 'daily',
    title: '实验记录本',
    text: '你保留记技术笔记的习惯。本子越来越厚，职务也慢慢变了。有人借去「学习」，还回来时多了几页别人的字。',
    weight: 5,
    onlyOnce: true,
    originIds: ['jishu', 'shiye_tiao'],
    maxRank: 3,
    choices: [
      {
        label: '把本子整理成操作手册',
        fx: { NL: 4, ZJ: 3 },
      },
      {
        label: '继续自己记',
        fx: { NL: 2, Lian: 1 },
      },
    ],
  },

  // ══════════════════ 13. 本乡本土 benxiang ══════════════════
  {
    id: 'ox_bx_1',
    kind: 'main',
    title: '回避，还是不回避',
    text: '你村里的道路硬化项目到了你分管范围。按规定应主动回避。父亲说：「都是乡里乡亲。」组织说：「程序要干净。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['benxiang'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '书面申请回避',
        fx: { Lian: 10, GX: -8, Risk: -5 },
      },
      {
        label: '不回避，但全程公开',
        fx: { Lian: 3, MX: 3, Risk: 3 },
      },
      {
        label: '「灵活」处理，让下面办',
        fx: { Lian: -12, Risk: 10, GX: 6 },
      },
    ],
  },
  {
    id: 'ox_bx_2',
    kind: 'main',
    title: '乡贤理事会',
    text: '村里能人多，意见也多。有人要捐钱修祠堂，有人要修路。你夹在宗族与政策之间，茶喝了一壶又一壶。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['benxiang'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '引导资金进合规项目',
        fx: { MX: 6, Lian: 4, NL: 3, GX: 2 },
      },
      {
        label: '尊重传统，睁只眼',
        fx: { GX: 5, Lian: -5, Risk: 4 },
      },
      {
        label: '按政策一刀切禁止',
        fx: { Lian: 5, GX: -6, MX: -2 },
      },
    ],
  },
  {
    id: 'ox_bx_d1',
    kind: 'daily',
    title: '满街都是熟人',
    text: '赶集日，打招呼打到嗓子哑。有人塞一把青菜，有人托你「问个事」。',
    weight: 7,
    onlyOnce: true,
    originIds: ['benxiang'],
    maxRank: 3,
    choices: [
      {
        label: '收下问候，不收托请',
        fx: { Lian: 4, MX: 3 },
      },
      {
        label: '能帮的按程序帮',
        fx: { MX: 4, Lian: 1, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_bx_d2',
    kind: 'daily',
    title: '发小的工程队',
    text: '发小想接点活。「给谁干不是干？」你想起小时候一起摸鱼。现在你们中间隔了一张办公桌。',
    weight: 7,
    onlyOnce: true,
    originIds: ['benxiang', 'ganbu_jun'],
    maxRank: 3,
    choices: [
      {
        label: '请他走公开招投标',
        fx: { Lian: 6, GX: -4 },
      },
      {
        label: '暗示下面「正常参与」',
        fx: { Lian: -10, Risk: 8, GX: 6 },
      },
    ],
  },

  // ══════════════════ 14. 干部家庭 ganbu_jun ══════════════════
  {
    id: 'ox_gj_1',
    kind: 'main',
    title: '父亲的旧部',
    text: '一位「叔叔」已是县领导，约你吃饭，只问工作不托事。临了说：「你爸当年不容易。有事说话。」你听出两层意思：关照，与监视。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['ganbu_jun'],
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '感谢关照，不提任何请求',
        fx: { GX: 5, Lian: 3 },
        npcFx: [{ id: 'zhuren', favor: 6 }],
      },
      {
        label: '顺势请教为官分寸',
        fx: { NL: 4, GX: 6 },
      },
      {
        label: '刻意疏远，避免标签',
        fx: { Lian: 4, GX: -8 },
      },
    ],
  },
  {
    id: 'ox_gj_2',
    kind: 'main',
    title: '「他爸是谁」',
    text: '公示期有人反映你「靠家里」。组织核查：程序合规。但话已经传开。你明白：合规不等于清白名声，名声要靠一单一单挣。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['ganbu_jun'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '申请更透明的工作分工',
        fx: { Lian: 5, ZJ: 4, GX: -2 },
      },
      {
        label: '用实绩回应',
        fx: { ZJ: 6, NL: 3, MX: 2 },
      },
      {
        label: '找关系压舆论',
        fx: { GX: 4, Lian: -6, Risk: 5 },
      },
    ],
  },
  {
    id: 'ox_gj_d1',
    kind: 'daily',
    title: '家宴的规矩',
    text: '父亲退休后仍有人来家里坐。你泡茶，听他们讲「当年」。你学到的不只是人情，还有边界。',
    weight: 6,
    onlyOnce: true,
    originIds: ['ganbu_jun'],
    maxRank: 3,
    choices: [
      {
        label: '只听，不承诺',
        fx: { Lian: 3, NL: 2, GX: 1 },
      },
      {
        label: '把能办的按程序引导',
        fx: { GX: 3, Lian: 1, NL: 2 },
      },
    ],
  },
  {
    id: 'ox_gj_d2',
    kind: 'daily',
    title: '母亲的叮嘱',
    text: '母亲只说一句：「别学你爸当年累出病，也别学那些不干净的。」你「嗯」了一声，把领带松了半格。',
    weight: 5,
    onlyOnce: true,
    originIds: ['ganbu_jun', 'benxiang'],
    maxRank: 3,
    choices: [
      {
        label: '记在心里',
        fx: { Lian: 2, MX: 1 },
      },
      {
        label: '周末回家吃饭',
        fx: { MX: 2, NL: 1 },
      },
    ],
  },

  // ══════════════════ 15. 外省考入 waisheng ══════════════════
  {
    id: 'ox_ws_1',
    kind: 'main',
    title: '听不懂的会',
    text: '党政联席会，领导突然改用方言讨论「那件事」。你只能看表情猜。散会后马主任用普通话给你「翻译」——翻译里有省略。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['waisheng'],
    maxRank: 3,
    choices: [
      {
        label: '请安排普通话说明或书面纪要',
        fx: { Lian: 3, NL: 2, GX: -2 },
      },
      {
        label: '会后逐个请教',
        fx: { GX: 5, NL: 3 },
      },
      {
        label: '努力学方言',
        fx: { MX: 4, NL: 3, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_ws_2',
    kind: 'main',
    title: '「外来的和尚」',
    text: '你推动的公开招标动了本地一些人的「习惯」。有人说你不懂「县情」。夜里车胎被扎，你没声张，第二天照常开标。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['waisheng'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '坚持程序，不扩大事态',
        fx: { Lian: 7, ZJ: 5, GX: -4, Risk: -2 },
      },
      {
        label: '适度妥协，先稳住',
        fx: { GX: 4, Lian: -4, Risk: 2 },
      },
      {
        label: '报警并向上报告',
        fx: { Lian: 4, Risk: -3, GX: -3 },
      },
    ],
  },
  {
    id: 'ox_ws_d1',
    kind: 'daily',
    title: '过节回不回',
    text: '春运票难抢。领导说「值班优先本地同志」。你还是把票退了。',
    weight: 6,
    onlyOnce: true,
    originIds: ['waisheng'],
    monthMod: [1, 2],
    maxRank: 3,
    choices: [
      {
        label: '留守值班',
        fx: { MX: 2, ZJ: 2, GX: 2 },
      },
      {
        label: '请假回家',
        fx: { MX: 1, ZJ: -1 },
      },
    ],
  },
  {
    id: 'ox_ws_d2',
    kind: 'daily',
    title: '学会了第一句土话',
    text: '你在调解时冒出一句方言，全场先愣后笑。气氛松了半格。',
    weight: 5,
    onlyOnce: true,
    originIds: ['waisheng'],
    maxRank: 3,
    choices: [
      {
        label: '趁热把事调成',
        fx: { MX: 5, NL: 3 },
      },
      {
        label: '自嘲一句，继续讲政策',
        fx: { MX: 3, GX: 2 },
      },
    ],
  },

  // ══════════════════ 16. 西部计划/援建 xibu ══════════════════
  {
    id: 'ox_xb_1',
    kind: 'main',
    title: '更难的地方都待过',
    text: '镇上为一笔小资金扯皮一周。你想起在西部：一口井能救一个组。你没说「你们这算什么」，只是把方案改成可执行的三步。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 50,
    originIds: ['xibu'],
    maxRank: 3,
    choices: [
      {
        label: '用「三步法」推动落地',
        fx: { ZJ: 5, NL: 4, MX: 3 },
      },
      {
        label: '少感慨，多协调',
        fx: { GX: 4, ZJ: 3 },
      },
      {
        label: '忍不住比较，得罪人',
        fx: { GX: -5, MX: -2, NL: 1 },
      },
    ],
  },
  {
    id: 'ox_xb_2',
    kind: 'main',
    title: '援友的电话',
    text: '西部结对的孩子考上大学，托人打电话谢你。信号很差，「谢谢老师」重复了三遍。你站在镇政府院子里，眼睛有点热。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 60,
    originIds: ['xibu', 'cunguan', 'sanfuyi'],
    maxRank: 4,
    choices: [
      {
        label: '寄去一点助学金（自己出）',
        fx: { Lian: 2, MX: 3, NL: 1 },
      },
      {
        label: '联系本地资源长期帮扶',
        fx: { MX: 5, ZJ: 3, GX: 2 },
      },
      {
        label: '把感动收进心里',
        fx: { Lian: 1, MX: 2 },
      },
    ],
  },
  {
    id: 'ox_xb_d1',
    kind: 'daily',
    title: '节水上瘾',
    text: '你还在随手关水龙头。同事笑你「西部后遗症」。你也笑。',
    weight: 5,
    onlyOnce: true,
    originIds: ['xibu'],
    maxRank: 3,
    choices: [
      {
        label: '顺手推动单位节水',
        fx: { ZJ: 2, Lian: 1, MX: 1 },
      },
      {
        label: '自己保持就好',
        fx: { Lian: 1 },
      },
    ],
  },
  {
    id: 'ox_xb_d2',
    kind: 'daily',
    title: '旧照片',
    text: '手机相册推送「三年前的今天」：风沙、黑板、孩子们的眼睛。你关掉手机，去开下一个会。',
    weight: 5,
    onlyOnce: true,
    originIds: ['xibu', 'cunguan'],
    maxRank: 3,
    choices: [
      {
        label: '把照片给同事看看',
        fx: { MX: 2, GX: 2 },
      },
      {
        label: '继续干活',
        fx: { ZJ: 1, NL: 1 },
      },
    ],
  },

  // ─── 公共出身补充日常（保留并略增）────────────────
  {
    id: 'ox_jz_jilv',
    kind: 'npc',
    title: '老部队来电',
    text: '原部队老战友到县里出差，约你吃饭。席间他说起演习、说起编制，又说「地方规矩我们不懂」。你忽然发现，自己已经会很自然地给人递烟、敬酒、说场面话。',
    weight: 8,
    onlyOnce: true,
    originIds: ['jizhuan'],
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '叙旧，但公事公办',
        fx: { Lian: 3, GX: 2, MX: 1 },
      },
      {
        label: '请他帮忙牵线地方关系',
        fx: { GX: 6, Lian: -4, Risk: 3 },
      },
      {
        label: '只吃饭，不谈任何委托',
        fx: { Lian: 4, GX: 1 },
      },
    ],
  },
  {
    id: 'ox_gq_laoban',
    kind: 'npc',
    title: '前同事的饭局',
    text: '老东家的人请你吃饭，说「叙旧不谈事」。散场时塞来一张卡：「给孩子的。」你想起在企业时，大家管这叫「人情往来」。',
    weight: 8,
    onlyOnce: true,
    originIds: ['guoqi_tiao'],
    minRank: 1,
    maxRank: 5,
    choices: [
      {
        label: '当场退回，划清边界',
        fx: { Lian: 10, Risk: -5, GX: -5 },
      },
      {
        label: '收下，告诉自己只是旧情',
        fx: { Lian: -16, Risk: 14, GX: 6 },
      },
      {
        label: '不收，但答应按程序对接业务',
        fx: { Lian: 4, ZJ: 2, GX: 1 },
      },
    ],
  },
  {
    id: 'ox_bx_qinqi',
    kind: 'daily',
    title: '亲戚找上门',
    text: '表叔想在镇上揽点小工程。「都是自家人，又不是不给钱。」母亲也打来电话：「能帮就帮一把。」',
    weight: 8,
    onlyOnce: true,
    originIds: ['benxiang'],
    maxRank: 4,
    choices: [
      {
        label: '明确回避，不插手工程',
        fx: { Lian: 8, GX: -8, MX: 2 },
      },
      {
        label: '介绍正规招投标流程',
        fx: { Lian: 3, NL: 2, GX: -2 },
      },
      {
        label: '暗示下面「关照」',
        fx: { Lian: -14, Risk: 12, GX: 8 },
      },
    ],
  },
]
