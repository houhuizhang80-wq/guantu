export interface NpcDef {
  id: string
  name: string
  role: string
  tags: string[]
  intro: string
  /** 从哪一职级起关系网常驻展示（越高层越少露脸基层旧人） */
  fromRank?: number
  /** 退出展示的职级上限（基层旧人） */
  toRank?: number
}

export const NPCS: NpcDef[] = [
  // ── 乡镇 / 县 ──────────────────────────────────────
  {
    id: 'laoshuji',
    name: '周老书记',
    role: '镇党委书记',
    tags: ['伯乐', '清流'],
    intro: '爱才，也爱干净。讲话不多，句句带刺。',
    toRank: 9,
  },
  {
    id: 'zhuren',
    name: '马主任',
    role: '党政办主任',
    tags: ['墙头草', '消息灵通'],
    intro: '谁在台上帮谁，消息比文件跑得快。',
    toRank: 5,
  },
  {
    id: 'laoban',
    name: '钱老板',
    role: '本地建材商',
    tags: ['诱惑', '白手套'],
    intro: '话很软，口袋很深。从不空手上门。',
    toRank: 11,
  },
  {
    id: 'fushuji',
    name: '李副书记',
    role: '镇党委副书记',
    tags: ['对手', 'A系'],
    intro: '和你争同一张椅子的人。笑得很标准。',
    toRank: 5,
  },
  {
    id: 'jizhu',
    name: '赵纪委',
    role: '县纪委干部',
    tags: ['清流', '风险'],
    intro: '记性极好。聊天像做笔录。',
    toRank: 11,
  },
  {
    id: 'jizhe',
    name: '小陈记者',
    role: '县融媒体记者',
    tags: ['媒体', '双刃'],
    intro: '能把锦旗拍成金杯，也能把金杯拍成铁窗。',
    toRank: 11,
  },
  {
    id: 'laobaixing',
    name: '王婶',
    role: '上访户代表',
    tags: ['群众', '硬骨头'],
    intro: '为了一亩三分地，能堵你三天门。',
    toRank: 11,
  },
  {
    id: 'tongshi',
    name: '小林',
    role: '同批选调生',
    tags: ['同僚', '情报'],
    intro: '一起报到的战友。各怀心事，偶尔互通有无。',
    toRank: 9,
  },
  // ── 市 ─────────────────────────────────────────────
  {
    id: 'mishuzhang',
    name: '吴秘书长',
    role: '市政府秘书长',
    tags: ['枢纽', '会务'],
    intro: '谁的材料什么时候进哪扇门，他比秘书还清楚。',
    fromRank: 12,
    toRank: 14,
  },
  {
    id: 'shizhang_daban',
    name: '顾市长',
    role: '本市市长',
    tags: ['班长', '考核'],
    intro: '讲话快，记数字更快。对「进度」两个字过敏。',
    fromRank: 12,
    toRank: 13,
  },
  {
    id: 'shanghui',
    name: '蒋会长',
    role: '市总商会会长',
    tags: ['资本', '诱惑'],
    intro: '名片烫金，话术比合同还密。他说「交个朋友」，通常不是朋友。',
    fromRank: 12,
    toRank: 17,
  },
  {
    id: 'shijiwei_han',
    name: '韩书记',
    role: '市纪委书记',
    tags: ['监督', '利剑'],
    intro: '笑起来像邻家叔叔，翻开卷宗像换了个人。',
    fromRank: 12,
    toRank: 17,
  },
  {
    id: 'ribao',
    name: '林首席',
    role: '市党报首席记者',
    tags: ['媒体', '放大器'],
    intro: '一篇稿可以成就一个人，也可以毁掉一个人。他知道自己知道。',
    fromRank: 12,
    toRank: 17,
  },
  {
    id: 'shengfagai',
    name: '周处长',
    role: '省发改委处长',
    tags: ['条线', '项目'],
    intro: '处长不大，盘子不小。一杯茶的工夫能决定一个项目生死节奏。',
    fromRank: 12,
    toRank: 19,
  },
  // ── 省 / 中央 ──────────────────────────────────────
  {
    id: 'sheng_mishu',
    name: '陈秘书',
    role: '省委主要领导秘书',
    tags: ['咽喉', '日程'],
    intro: '他不决策，但决定谁能在决策前被听见。',
    fromRank: 15,
    toRank: 19,
  },
  {
    id: 'sheng_tongzhi',
    name: '同僚副省长',
    role: '副省长（分管相邻口子）',
    tags: ['同僚', '竞争'],
    intro: '开会时坐你旁边，碰杯时离你很近，名单上离你也很近。',
    fromRank: 15,
    toRank: 17,
  },
  {
    id: 'jituan',
    name: '董总',
    role: '跨国集团中国区董事长',
    tags: ['链主', '双刃'],
    intro: '飞机比车多，法务比司机多。他要的「政策确定性」，往往最不确定。',
    fromRank: 15,
    toRank: 19,
  },
  {
    id: 'buwei_si',
    name: '司长',
    role: '国家部委某司司长',
    tags: ['部委', '政策'],
    intro: '司里一份便函，能压住地方三份请示。说话永远留半句。',
    fromRank: 18,
    toRank: 19,
  },
]

export function getNpc(id: string): NpcDef {
  const n = NPCS.find((x) => x.id === id)
  if (!n) throw new Error(`unknown npc ${id}`)
  return n
}

/** 按当前职级过滤关系网展示对象 */
export function npcsVisibleAt(rank: number): NpcDef[] {
  return NPCS.filter((n) => {
    if (n.fromRank != null && rank < n.fromRank) return false
    if (n.toRank != null && rank > n.toRank) return false
    return true
  })
}
