import type { GameEvent } from '../types'

/** 家属职业线长事件链 */
export const FAMILY_CAREER_EVENTS: GameEvent[] = [
  {
    id: 'fam_spouse_job',
    kind: 'daily',
    title: '爱人的新工作',
    text: '爱人拿到一份心仪 offer，但要常出差。你想起自己已经很久没在家吃晚饭了。',
    weight: 7,
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '支持爱人去',
        fx: { MX: 3, GX: 1, NL: 1 },
      },
      {
        label: '劝爱人再考虑',
        fx: { MX: -2, GX: 1 },
      },
      {
        label: '自己调整工作节奏',
        fx: { MX: 4, ZJ: -1 },
      },
    ],
  },
  {
    id: 'fam_child_school',
    kind: 'daily',
    title: '孩子的学校',
    text: '孩子要升初中。有「名校」名额，也有离家近的普通学校。你想起自己当年怎么考上来的。',
    weight: 7,
    minRank: 6,
    maxRank: 14,
    choices: [
      {
        label: '按学区正常入学',
        fx: { Lian: 3, MX: 2 },
      },
      {
        label: '托关系「择校」',
        fx: { Lian: -8, Risk: 5, GX: 3 },
      },
    ],
  },
  {
    id: 'fam_parent_ill',
    kind: 'crisis',
    title: '父母住院',
    text: '父亲突发心梗。医院说要排队。有人说「打个招呼就能住单间」。你站在走廊里，手里捏着手机。',
    weight: 9,
    minRank: 4,
    maxRank: 16,
    choices: [
      {
        label: '按规矩排队，自己请假陪护',
        fx: { Lian: 4, MX: 2, ZJ: -2, NL: 1 },
      },
      {
        label: '请朋友帮忙安排',
        fx: { Lian: -6, GX: 3, Risk: 3 },
      },
      {
        label: '找医院领导「了解情况」',
        fx: { Lian: -10, Risk: 8, GX: 4 },
      },
    ],
  },
  {
    id: 'fam_child_grad',
    kind: 'calm',
    title: '孩子毕业典礼',
    text: '你难得准时到场。孩子在台上发言，说「谢谢爸爸妈妈」。你鼓掌，手有点重。',
    weight: 5,
    minRank: 8,
    maxRank: 16,
    choices: [
      {
        label: '认真听完全场',
        fx: { MX: 4, NL: 1 },
      },
      {
        label: '拍完照就走',
        fx: { ZJ: 1, MX: -1 },
      },
    ],
  },
  {
    id: 'fam_spouse_career',
    kind: 'daily',
    title: '爱人的晋升',
    text: '爱人升了职，比你还忙。有人说「女强男更强」。你笑了笑，心里有点复杂。',
    weight: 5,
    minRank: 10,
    maxRank: 16,
    choices: [
      {
        label: '真心祝贺',
        fx: { MX: 3, GX: 2 },
      },
      {
        label: '心里不平衡',
        fx: { MX: -2, GX: -1 },
      },
    ],
  },
]

/** 高岗出身事件补全 */
export const ORIGIN_MORE_EVENTS: GameEvent[] = [
  {
    id: 'ox_more_xd',
    kind: 'daily',
    title: '选调生座谈会（再）',
    text: '你已是厅局级。回母校座谈，台下问「选调生还有前途吗」。你讲了第一次报到的门卫大爷。',
    weight: 6,
    originIds: ['xuandiao_pu', 'xuandiao_ding'],
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '讲真话',
        fx: { MX: 3, NL: 2, Lian: 1 },
      },
      {
        label: '只讲正能量',
        fx: { GX: 2 },
      },
    ],
  },
  {
    id: 'ox_more_cg',
    kind: 'daily',
    title: '原服务村通高速',
    text: '你当年服务的村要通高速。方案里有一段「尽量少占良田」。你签字前，让人把村里老人请来开了个听证。',
    weight: 6,
    originIds: ['cunguan', 'sanfuyi', 'xibu', 'benxiang'],
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '听证后再定方案',
        fx: { MX: 5, ZJ: 4, NL: 3, GX: -2 },
      },
      {
        label: '按省厅方案直接批',
        fx: { ZJ: 3, MX: -3, GX: 2 },
      },
    ],
  },
  {
    id: 'ox_more_jz',
    kind: 'daily',
    title: '维稳责任状',
    text: '你军转出身，分管领域签维稳责任状。有人问「是不是太军事化」。你说：「先把责任钉死，再谈灵活。」',
    weight: 6,
    originIds: ['jizhuan'],
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '责任到人、预案到点',
        fx: { ZJ: 4, NL: 3, MX: 2, GX: -2 },
      },
      {
        label: '适当放松考核',
        fx: { GX: 3, MX: -1, Risk: 2 },
      },
    ],
  },
  {
    id: 'ox_more_gq',
    kind: 'daily',
    title: '董事会里的旧识',
    text: '省属国企董事会名单里有你老东家的人。会后他递来名片：「有空坐坐。」你知道，这张名片连着一整张网。',
    weight: 6,
    originIds: ['guoqi_tiao', 'shiye_tiao'],
    minRank: 14,
    maxRank: 18,
    choices: [
      {
        label: '只谈公事',
        fx: { Lian: 4, GX: 1 },
      },
      {
        label: '保持联络',
        fx: { GX: 5, Lian: -4, Risk: 3 },
      },
    ],
  },
  {
    id: 'ox_more_bg',
    kind: 'daily',
    title: '全市讲话稿',
    text: '市委让你把一把关年度讲话。你删掉十二个「进一步」，补了三条可考核指标。有人说你「不懂文风」。',
    weight: 5,
    originIds: ['biguan', 'rencai'],
    minRank: 12,
    maxRank: 18,
    choices: [
      {
        label: '坚持可考核',
        fx: { NL: 3, ZJ: 4, GX: -2 },
      },
      {
        label: '恢复「文风」',
        fx: { GX: 3, NL: -1 },
      },
    ],
  },
  {
    id: 'ox_more_js',
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
    id: 'ox_more_bx',
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
    id: 'ox_more_ws',
    kind: 'daily',
    title: '全国干部交流',
    text: '组织问你是否愿意跨省交流任职。你想起刚到外省时的方言墙，和现在能听懂的每一句土话。',
    weight: 5,
    originIds: ['waisheng', 'xibu', 'jizhuan'],
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
