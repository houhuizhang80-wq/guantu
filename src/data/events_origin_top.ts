import type { GameEvent } from '../types'

/** 市/省段出身回响（副厅～副部） */
export const ORIGIN_TOP_EVENTS: GameEvent[] = [
  {
    id: 'ot_xd_zhongyang_tui',
    kind: 'daily',
    title: '选调生座谈会',
    text: '你以「老选调」身份回省座谈。台下都是二十几岁的眼睛。有人说：「领导，选调生还有前途吗？」你把当年第一次报到的门卫大爷讲了。',
    weight: 6,
    originIds: ['xuandiao_pu', 'xuandiao_ding'],
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '讲真话：前途在事上',
        fx: { MX: 4, NL: 3, Lian: 2 },
      },
      {
        label: '只讲正能量',
        fx: { GX: 2, MX: 1 },
      },
    ],
  },
  {
    id: 'ot_cg_xiangtu_zhanwang',
    kind: 'daily',
    title: '乡愁与文件',
    text: '你起草一份乡村振兴文件。写到「留住乡愁」四个字，手停了停——你想起了服务期满那年的雨。',
    weight: 6,
    originIds: ['cunguan', 'sanfuyi', 'xibu'],
    minRank: 12,
    maxRank: 19,
    choices: [
      {
        label: '把乡愁写成可考核的指标',
        fx: { ZJ: 4, NL: 4, MX: 3 },
      },
      {
        label: '保留抒情段落',
        fx: { NL: 1, GX: 1 },
      },
    ],
  },
  {
    id: 'ot_jz_tixi',
    kind: 'daily',
    title: '应急体系改革',
    text: '你军转出身，主持应急体系改革。有人说你「太军事化」。你把预案改成「谁在、谁先到、谁说了算」三句话。',
    weight: 6,
    originIds: ['jizhuan'],
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '三句话写进制度',
        fx: { NL: 4, ZJ: 5, MX: 3, GX: -2 },
      },
      {
        label: '按老办法层层转发',
        fx: { GX: 2, ZJ: 1 },
      },
    ],
  },
  {
    id: 'ot_gq_binggou',
    kind: 'daily',
    title: '国企并购案',
    text: '省里要你把关一桩国企并购。尽调报告很厚，关联方名单你认识一半。有人劝你「别太较真」。',
    weight: 6,
    originIds: ['guoqi_tiao', 'shiye_tiao'],
    minRank: 14,
    maxRank: 18,
    choices: [
      {
        label: '穿透核查关联方',
        fx: { Lian: 6, NL: 4, GX: -4 },
      },
      {
        label: '原则同意、细节再谈',
        fx: { ZJ: 2, Lian: -4, Risk: 3 },
      },
    ],
  },
  {
    id: 'ot_bg_quanguo',
    kind: 'daily',
    title: '全国典型经验',
    text: '你的地方经验要上报全国。你把所有「首创」「率先」删掉，只留做法与数据。有人说你「不会包装」。',
    weight: 5,
    originIds: ['biguan', 'rencai'],
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '去包装留干货',
        fx: { Lian: 4, NL: 3, ZJ: 3 },
      },
      {
        label: '适度包装',
        fx: { GX: 3, Lian: -2, ZJ: 2 },
      },
    ],
  },
  {
    id: 'ot_js_biaozhun',
    kind: 'daily',
    title: '国家标准起草',
    text: '你技术出身，参与起草国标。企业想塞私货。你把每一项指标要求「可检测、可追责」。',
    weight: 5,
    originIds: ['jishu', 'rencai', 'shiye_tiao'],
    minRank: 14,
    maxRank: 19,
    choices: [
      {
        label: '标准面前无特例',
        fx: { Lian: 5, NL: 4, GX: -3 },
      },
      {
        label: '给龙头企业留弹性',
        fx: { GX: 4, Lian: -5, Risk: 4 },
      },
    ],
  },
  {
    id: 'ot_benxiang_guli',
    kind: 'daily',
    title: '回乡祭扫',
    text: '你已是省级领导。清明回乡，乡亲要修路、要低保、要「一个说法」。你没批条子，只记了三本账。',
    weight: 6,
    originIds: ['benxiang', 'ganbu_jun'],
    minRank: 14,
    maxRank: 18,
    choices: [
      {
        label: '按政策分办，不搞特殊',
        fx: { Lian: 6, MX: 3, GX: -3 },
      },
      {
        label: '动用关系帮一把',
        fx: { Lian: -8, GX: 5, Risk: 4 },
      },
    ],
  },
  {
    id: 'ot_waisheng_quanguo',
    kind: 'daily',
    title: '全国干部交流',
    text: '组织问你是否愿意跨省交流任职。你想起刚到外省时的方言墙，和现在能听懂的每一句土话。',
    weight: 5,
    originIds: ['waisheng', 'jizhuan', 'xibu'],
    minRank: 14,
    maxRank: 18,
    choices: [
      {
        label: '服从交流',
        fx: { GX: 3, NL: 2, MX: 2 },
      },
      {
        label: '申请留任',
        fx: { ZJ: 3, GX: -1 },
      },
    ],
  },
]
