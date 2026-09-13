import type { AttrFx, GameState } from '../types'
import { getPost } from './posts'
import { npcsVisibleAt } from './npcs'

export type ActionId =
  | 'xiachen'
  | 'xiezuo'
  | 'yingchou'
  | 'zicha'
  | 'xuexi'
  | 'paotiao'
  | 'jiating'

export interface ActionVariant {
  id: string
  label: string
  hint?: string
  fx: AttrFx
  npcFx?: { id: string; favor: number }[]
  successRate?: number
  failText?: string
  failFx?: AttrFx
  result: string
}

export interface ActionDef {
  id: ActionId
  name: string
  desc: string
  cost: number
  requireMinRank?: number
  requireMaxRank?: number
  /** 进入行动后的子抉择 */
  variants: ActionVariant[]
}

export const ACTIONS: ActionDef[] = [
  {
    id: 'xiachen',
    name: '下沉一线',
    desc: '进村入企。听真话，还是走过场，差别很大。',
    cost: 1,
    variants: [
      {
        id: 'dun',
        label: '蹲点调研，当天不走',
        hint: '慢，能听到硬话',
        fx: { MX: 6, ZJ: 3, NL: 3 },
        successRate: 0.8,
        failFx: { MX: 2, NL: 1 },
        failText: '村里临时有事，调研打了个折。',
        result: '你在田埂上蹲到天黑。裤脚全是泥，问题清单多了三行，有一行被你画了星号。',
      },
      {
        id: 'kaihui',
        label: '开座谈会，收集意见',
        hint: '场面可控，真话有限',
        fx: { MX: 3, ZJ: 2, GX: 1 },
        result: '会议室坐了十四个人，茶续了三轮。有用的话在散会后的走廊里才出来一半。',
      },
      {
        id: 'anjian',
        label: '暗访一两个点',
        hint: '真实，容易得罪人',
        fx: { MX: 5, NL: 4, GX: -3, Risk: 2 },
        successRate: 0.7,
        failFx: { GX: -6, Risk: 4 },
        failText: '有人认出你了。消息比你回机关还快。',
        result: '你装作办事群众走了两趟。台账和现场，对不上的地方比想象多。',
      },
    ],
  },
  {
    id: 'xiezuo',
    name: '闭门写材料',
    desc: '把想法变成能上会、能落地的文字。',
    cost: 1,
    variants: [
      {
        id: 'yingling',
        label: '写领导讲话/汇报',
        hint: '讨喜，能力涨得快',
        fx: { NL: 5, GX: 3, ZJ: 2 },
        result: '把「高度重视」换成具体动作，把成绩写进数据里。打印机卡纸，你修好了它。',
      },
      {
        id: 'fang',
        label: '起草可执行方案',
        hint: '扎实，短期未必被看见',
        fx: { NL: 4, ZJ: 4 },
        result: '措施、时限、责任人，一张表列完。你不确定会上会不会有人细看。',
      },
      {
        id: 'jianyi',
        label: '写内参/问题专报',
        hint: '有风骨，也有风险',
        fx: { NL: 3, Lian: 3, GX: -4, Risk: 3 },
        successRate: 0.65,
        failFx: { GX: -8, Risk: 6 },
        failText: '专报被退回「再斟酌」。有人说你不懂规矩。',
        result: '你把不敢在会上讲的话，写进了专报。笔尖停了很久。',
      },
    ],
  },
  {
    id: 'yingchou',
    name: '对外联络',
    desc: '饭局、茶叙、跑部门——关系是跑出来的。',
    cost: 1,
    variants: [
      {
        id: 'fan',
        label: '参加饭局',
        hint: '关系升温，廉洁降温',
        fx: { GX: 6, Lian: -3 },
        result: '席间有人讲段子，有人讲项目。你记住的是座次，和谁替谁挡了酒。',
      },
      {
        id: 'cha',
        label: '一对一茶叙',
        hint: '慢热，较干净',
        fx: { GX: 4, Lian: 1, NL: 1 },
        result: '茶很贵，话很绕。核心信息在散场后的电梯里说了半句。',
      },
      {
        id: 'bumen',
        label: '正式走访对口部门',
        hint: '公对公，稳妥',
        fx: { GX: 3, ZJ: 2, NL: 2 },
        result: '你带着问题清单去，带着答复时限回。至少文件上是这么写的。',
      },
    ],
  },
  {
    id: 'zicha',
    name: '自查自纠',
    desc: '把风险点排一遍。瞒，还是补，自己选。',
    cost: 1,
    variants: [
      {
        id: 'qingdan',
        label: '列风险清单自查',
        hint: '基础防守',
        fx: { Risk: -6, Lian: 2 },
        result: '把签字页重新翻了一遍。有两处，你决定补个说明。',
      },
      {
        id: 'shangbao',
        label: '主动向组织说明问题',
        hint: '伤，但能刮骨',
        fx: { Risk: -12, Lian: 5, GX: -2 },
        result: '说明材料交上去的那一刻，心里轻了一截，也空了一截。',
      },
      {
        id: 'guanxi',
        label: '找人打听风声',
        hint: '小聪明，大风险',
        fx: { Risk: 4, GX: 3, Lian: -5 },
        successRate: 0.6,
        failFx: { Risk: 10, Lian: -8 },
        failText: '打听的动作本身，被人记下了。',
        result: '你「随便问了问」。对方笑了笑，没说有事，也没说没事。',
      },
    ],
  },
  {
    id: 'xuexi',
    name: '进修充电',
    desc: '政策、案例、夜校——能力是攒出来的。',
    cost: 1,
    variants: [
      {
        id: 'zhengce',
        label: '精读上级政策文件',
        hint: '吃透口径',
        fx: { NL: 5, GX: 1 },
        result: '把政策翻译成基层能执行的动作清单。窗外已经黑了。',
      },
      {
        id: 'anli',
        label: '研究失败案例',
        hint: '长记性',
        fx: { NL: 6, Lian: 1 },
        result: '三个失败案例，你各写了一条「如果是我」。夜校的灯很白。',
      },
      {
        id: 'xueyou',
        label: '约同学/前辈请教',
        hint: '学+人情',
        fx: { NL: 3, GX: 4 },
        result: '对方没讲大道理，只讲了自己栽过的坑。你记了满满两页。',
      },
    ],
  },
  {
    id: 'paotiao',
    name: '向上争取',
    desc: '跑资金、要政策、汇报亮点（有风险）。',
    cost: 1,
    requireMinRank: 2,
    variants: [
      {
        id: 'cai',
        label: '跑专项资金',
        hint: '政绩来得快，也招眼',
        fx: { ZJ: 6, GX: 3, Risk: 4, Lian: -2 },
        successRate: 0.7,
        failFx: { ZJ: 1, Risk: 5 },
        failText: '盘子比想象紧。你只带回一句「再研究」。',
        result: '省城的走廊很长。你把「困难」翻译成「政策语言」，又把批文翻译回县里的方言。',
      },
      {
        id: 'hui',
        label: '争取现场会/试点',
        hint: '露脸，也担责',
        fx: { ZJ: 5, GX: 4, MX: 2, Risk: 3 },
        result: '试点牌子挂上了。你知道牌子背后是考核表。',
      },
      {
        id: 'huibao',
        label: '专题汇报亮点工作',
        hint: '刷存在感',
        fx: { GX: 5, ZJ: 3, Lian: -1 },
        result: '十五分钟，你讲了两个数、一个故事。领导记住了哪两个，你不确定。',
      },
    ],
  },
  {
    id: 'jiating',
    name: '顾一顾家里',
    desc: '人不是机器。家稳，心才稳。',
    cost: 1,
    variants: [
      {
        id: 'fan',
        label: '回家吃顿饭',
        hint: '回血',
        fx: { MX: 2, NL: 1, GX: 1, ZJ: -1 },
        result: '热饭下肚，孩子讲学校的事，比任何文件都好听。',
      },
      {
        id: 'ti',
        label: '陪家人看病/办事',
        hint: '耽误一点工作',
        fx: { MX: 3, GX: 1, ZJ: -2 },
        result: '走廊的灯很白。你握了握对方的手，说了句「没事，有我」。',
      },
      {
        id: 'dianhua',
        label: '只打个长电话',
        hint: '省时间，聊胜于无',
        fx: { MX: 1 },
        result: '信号一般，话很多。挂断后办公室又安静下来。',
      },
    ],
  },
]

export function maxActionsForRank(rank: number) {
  if (rank <= 2) return 2
  if (rank <= 5) return 3
  if (rank <= 11) return 4
  return 5
}

export function getAction(id: ActionId): ActionDef {
  const a = ACTIONS.find((x) => x.id === id)
  if (!a) throw new Error(`unknown action ${id}`)
  return a
}

export function canDoAction(s: GameState, a: ActionDef): { ok: boolean; reason: string } {
  if (s.actionPoints < a.cost) return { ok: false, reason: '行动点不足' }
  const rank = getPost(s.postId).rank
  if (a.requireMinRank != null && rank < a.requireMinRank)
    return { ok: false, reason: '职级不够' }
  if (a.requireMaxRank != null && rank > a.requireMaxRank)
    return { ok: false, reason: '已过该阶段' }
  return { ok: true, reason: '' }
}

// ── NPC 互动 ─────────────────────────────────────────

export type NpcActId = 'baifang' | 'tanxin' | 'qiuqiu' | 'jujue' | 'songli'

export interface NpcActDef {
  id: NpcActId
  name: string
  desc: string
  cost: number
}

export const NPC_ACTS: NpcActDef[] = [
  { id: 'baifang', name: '拜访', desc: '走动走动，好感缓慢上升', cost: 1 },
  { id: 'tanxin', name: '谈心/请教', desc: '掏心窝子，能力与关系，有失败风险', cost: 1 },
  { id: 'qiuqiu', name: '请你帮个忙', desc: '消耗人情换支持', cost: 1 },
  { id: 'songli', name: '表示表示', desc: '好感大涨，廉洁与风险受损', cost: 1 },
  { id: 'jujue', name: '明确拒绝不合理请托', desc: '廉洁+，对方可能翻脸', cost: 1 },
]

export function visibleNpcIds(rank: number): string[] {
  return npcsVisibleAt(rank).map((n) => n.id)
}

export function npcAct(
  s: GameState,
  npcId: string,
  act: NpcActId,
): { ok: boolean; text: string } {
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref) return { ok: false, text: '没有这个人。' }
  const def = npcsVisibleAt(getPost(s.postId).rank).find((n) => n.id === npcId)
  if (!def) return { ok: false, text: '这个阶段不太方便接触。' }

  s.actionPoints -= 1

  if (act === 'baifang') {
    ref.favor = Math.min(100, ref.favor + 6 + Math.floor(Math.random() * 5))
    s.attrs.GX = clampAdd(s.attrs.GX, 2)
    return { ok: true, text: `你去看了${def.name}。茶是热的，话是慢的。好感上升。` }
  }
  if (act === 'tanxin') {
    if (Math.random() < 0.25) {
      ref.favor = Math.max(-50, ref.favor - 4)
      return {
        ok: true,
        text: `${def.name}今天话很少。你觉出场合不对，提前告辞。好感略降。`,
      }
    }
    ref.favor = Math.min(100, ref.favor + 8)
    s.attrs.NL = clampAdd(s.attrs.NL, 3)
    s.attrs.GX = clampAdd(s.attrs.GX, 2)
    return { ok: true, text: `和${def.name}聊到深处，你记下三条可用的经验。` }
  }
  if (act === 'qiuqiu') {
    if (ref.favor < 20) {
      ref.favor = Math.max(-50, ref.favor - 3)
      return { ok: true, text: `${def.name}打了个哈哈。人情不够，事情难办。` }
    }
    ref.favor = Math.max(-50, ref.favor - 12)
    s.attrs.ZJ = clampAdd(s.attrs.ZJ, 5)
    s.attrs.GX = clampAdd(s.attrs.GX, 2)
    s.risk = clampRisk(s.risk + 3)
    return { ok: true, text: `${def.name}帮你顶了一次。人情消耗，政绩到账。` }
  }
  if (act === 'songli') {
    ref.favor = Math.min(100, ref.favor + 14)
    s.attrs.Lian = clampAdd(s.attrs.Lian, -6)
    s.risk = clampRisk(s.risk + 6)
    return { ok: true, text: `你「表示」了一下。${def.name}收下了。心里那杆秤，又偏了一点。` }
  }
  s.attrs.Lian = clampAdd(s.attrs.Lian, 4)
  s.risk = clampRisk(s.risk - 4)
  if (ref.favor < 10) {
    ref.favor = Math.max(-50, ref.favor - 10)
    return {
      ok: true,
      text: `你拒绝了${def.name}的请托。对方笑了笑，笑意没到眼睛。`,
    }
  }
  ref.favor = Math.max(-50, ref.favor - 4)
  return {
    ok: true,
    text: `你把边界说清楚。${def.name}点头：「懂了。」空气轻了一点。`,
  }
}

function clampAdd(v: number, d: number) {
  return Math.max(0, Math.min(100, v + d))
}

function clampRisk(v: number) {
  return Math.max(0, Math.min(100, v))
}
