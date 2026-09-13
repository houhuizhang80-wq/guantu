import type { GameState } from '../types'
import { clamp, pushLog, pushTimeline } from '../state/game'
import { getPost } from '../data/posts'
import { getNpc, npcsVisibleAt } from '../data/npcs'

/** ── 1. 督查暗访 ─────────────────────── */

const DUCHA_ITEMS = [
  {
    id: 'taizhang',
    title: '台账抽查',
    text: '督查组不打招呼进了办公室，要近三年项目台账与资金拨付凭证。',
  },
  {
    id: 'xianchang',
    title: '现场暗访',
    text: '有人装成群众，在便民窗口和工地转了两小时，相机藏在包里。',
  },
  {
    id: 'minzhong',
    title: '群众访谈',
    text: '随机抽了十几户访谈，问「干部有没有吃拿卡要」「事好不好办」。',
  },
  {
    id: 'anquan',
    title: '安全突击',
    text: '应急口联合检查直插企业车间，要看培训记录与隐患整改闭环。',
  },
]

export function maybeDucha(s: GameState): string | null {
  if (s.duchaDone) return null
  if (s.currentEventId) return null
  if (s.probationLeft > 0) return null
  let p = 0.08 + (s.risk > 40 ? 0.1 : 0) + (s.attrs.Lian < 50 ? 0.06 : 0)
  if (s.duchaLast === 'ok') p *= 0.7
  if (s.duchaLast === 'bad') p *= 1.3
  const rank = getPost(s.postId).rank
  if (rank >= 12) p += 0.04
  if (Math.random() > p) return null
  const item = DUCHA_ITEMS[Math.floor(Math.random() * DUCHA_ITEMS.length)]
  s.flags.duchaId = item.id
  s.duchaDone = true
  s.lastFeedback = {
    title: `督查暗访 · ${item.title}`,
    text: `${item.text}\n\n你决定：`,
  }
  return `${item.title}：${item.text}`
}

export type DuchaChoice = 'zicha' | 'yingjian' | 'tuotie'

export function resolveDucha(s: GameState, choice: DuchaChoice): { ok: boolean; text: string } {
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.actionPoints < 1 && choice !== 'tuotie')
    return { ok: false, text: '行动点不足（迎检/自查需 1 点）。' }
  const rank = getPost(s.postId).rank
  const lian = s.attrs.Lian
  const dutyQ = s.dutyMonthScore ?? 0

  if (choice === 'zicha') {
    s.actionPoints -= 1
    if (lian >= 60 && dutyQ >= 15) {
      s.duchaLast = 'ok'
      s.attrs.ZJ = clamp(s.attrs.ZJ + 3)
      s.attrs.Lian = clamp(s.attrs.Lian + 2)
      s.risk = clamp(s.risk - 3, 0, 100)
      s.dutyYearScore = clamp((s.dutyYearScore ?? 0) + 4, 0, 100)
      return { ok: true, text: '你连夜自查台账，问题清单干净。督查组评价「底数清、材料实」。政绩与廉洁上升。' }
    }
    if (lian >= 45) {
      s.duchaLast = 'warn'
      s.attrs.GX = clamp(s.attrs.GX - 2)
      s.risk = clamp(s.risk + 2, 0, 100)
      return { ok: true, text: '自查发现几处口径不一，你补了说明。督查组记下「个别环节需完善」。' }
    }
    s.duchaLast = 'bad'
    s.risk = clamp(s.risk + 8, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX - 4)
    return { ok: true, text: '台账对不上，解释越描越黑。督查组列了问题清单转办。风险上升。' }
  }

  if (choice === 'yingjian') {
    s.actionPoints -= 1
    const base = lian * 0.4 + dutyQ * 0.4 + (100 - s.risk) * 0.2 + (rank >= 8 ? 5 : 0)
    if (base >= 55) {
      s.duchaLast = 'ok'
      s.attrs.ZJ = clamp(s.attrs.ZJ + 4)
      s.attrs.NL = clamp(s.attrs.NL + 2)
      s.risk = clamp(s.risk - 2, 0, 100)
      return { ok: true, text: '迎检口径统一、现场经得起看。督查组反馈「工作扎实」。' }
    }
    if (base >= 35) {
      s.duchaLast = 'warn'
      s.attrs.GX = clamp(s.attrs.GX - 1)
      s.risk = clamp(s.risk + 3, 0, 100)
      return { ok: true, text: '迎检中规中矩，有两处被追问。你记下要补的短板。' }
    }
    s.duchaLast = 'bad'
    s.risk = clamp(s.risk + 10, 0, 100)
    s.attrs.MX = clamp(s.attrs.MX - 3)
    return { ok: true, text: '现场被问住，材料也缺页。督查通报里有了你的单位。风险大增。' }
  }

  // tuotie
  s.duchaLast = 'bad'
  s.risk = clamp(s.risk + 6, 0, 100)
  s.attrs.GX = clamp(s.attrs.GX - 3)
  s.mashScore = clamp((s.mashScore ?? 0) + 5, 0, 100)
  return { ok: true, text: '你让科室「先应付」。督查组记下态度问题，风声更紧了。' }
}

/** ── 2. 谈心谈话 ─────────────────────── */

export function canTanxin(s: GameState): { ok: boolean; reason: string } {
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if ((s.tanxinCd ?? 0) > 0) return { ok: false, reason: `谈心冷却还剩 ${s.tanxinCd} 个月` }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  return { ok: true, reason: '' }
}

export function doTanxin(
  s: GameState,
  npcId: string,
  style: 'guanxin' | 'tiduan' | 'yala',
): { ok: boolean; text: string } {
  const g = canTanxin(s)
  if (!g.ok) return { ok: false, text: g.reason }
  const rank = getPost(s.postId).rank
  const vis = new Set(npcsVisibleAt(rank).map((n) => n.id))
  if (!vis.has(npcId)) return { ok: false, text: '对方不在本阶段交往圈。' }
  const ref = s.npcs.find((n) => n.id === npcId)
  if (!ref) return { ok: false, text: '没有这个人。' }
  const def = getNpc(npcId)
  const name = def?.name ?? npcId
  s.actionPoints -= 1
  s.tanxinCd = 3

  if (style === 'guanxin') {
    ref.favor = clamp(ref.favor + 10, -50, 100)
    s.attrs.GX = clamp(s.attrs.GX + 3)
    s.factionHeat = clamp((s.factionHeat ?? 20) - 4, 0, 100)
    return { ok: true, text: `你和${name}推心置腹聊了家庭与难处。对方眼圈有点红，交情明显深了。` }
  }
  if (style === 'tiduan') {
    if (ref.favor < 20) {
      ref.favor = clamp(ref.favor - 8, -50, 100)
      s.attrs.GX = clamp(s.attrs.GX - 2)
      return { ok: true, text: `你委婉点了${name}的问题。对方脸色不好，谈话草草收场。` }
    }
    ref.favor = clamp(ref.favor - 4, -50, 100)
    s.attrs.Lian = clamp(s.attrs.Lian + 3)
    s.risk = clamp(s.risk - 3, 0, 100)
    s.factionHeat = clamp((s.factionHeat ?? 20) - 2, 0, 100)
    return { ok: true, text: `你和${name}单独谈了苗头性问题。对方记下了，你心里也稳了些。` }
  }
  // yala
  ref.favor = clamp(ref.favor - 12, -50, 100)
  s.attrs.GX = clamp(s.attrs.GX - 4)
  s.risk = clamp(s.risk + 2, 0, 100)
  s.factionHeat = clamp((s.factionHeat ?? 20) + 5, 0, 100)
  return { ok: true, text: `你拍了桌子，把${name}训了一顿。会开完了，梁子也结下了。` }
}

/** ── 3. 项目攻坚战役 ─────────────────── */

export type MajorLine = 'zhao' | 'zhai' | 'sheng'

export interface CampaignDef {
  id: string
  name: string
  steps: number
  /** 有值即为主官专项：仅地方党委 / 政府正职可启动，推进与结算带条线机制 */
  major?: MajorLine
}

/** 地方主官：镇 / 县 / 市 / 省四级党委与政府正职 */
export const MAJOR_POSTS = [
  'zhenzhang',
  'zhenweishuji',
  'xianzhang',
  'xianweishuji',
  'shizhang',
  'shijiwei',
  'shengzhang',
  'shengweishuji',
]

/** 是否地方主要领导（党委 / 政府正职） */
export function isMajorChief(s: GameState): boolean {
  return MAJOR_POSTS.includes(s.postId)
}

export const CAMPAIGNS: CampaignDef[] = [
  { id: 'yuanqu', name: '园区落地攻坚', steps: 4 },
  { id: 'jiaotong', name: '交通动脉会战', steps: 5 },
  { id: 'minsheng', name: '民生实事百日', steps: 3 },
  { id: 'zhaoshang', name: '招商引资大会战', steps: 4 },
  { id: 'ds_zhao', name: '主官专项 · 招大引强', steps: 5, major: 'zhao' },
  { id: 'ds_zhai', name: '主官专项 · 债务化解', steps: 6, major: 'zhai' },
  { id: 'ds_sheng', name: '主官专项 · 生态督察整改', steps: 5, major: 'sheng' },
]

export function canStartCampaign(s: GameState): { ok: boolean; reason: string } {
  if (s.campaign) return { ok: false, reason: '已有攻坚战役在打' }
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  if (getPost(s.postId).rank < 4) return { ok: false, reason: '副科及以上方可挂帅攻坚' }
  return { ok: true, reason: '' }
}

export function startCampaign(s: GameState, id: string): { ok: boolean; text: string } {
  const g = canStartCampaign(s)
  if (!g.ok) return { ok: false, text: g.reason }
  const c = CAMPAIGNS.find((x) => x.id === id)
  if (!c) return { ok: false, text: '无此战役。' }
  if (c.major && !isMajorChief(s)) {
    return { ok: false, text: '主官专项只有地方党委、政府正职可以启动。' }
  }
  s.actionPoints -= 1
  s.campaign = { name: c.name, step: 0, quality: 40, total: c.steps, major: c.major }
  if (c.major === 'zhai') {
    // 化债先得把账摆上台面：启动当月风险抬升，后续靠推进压回
    s.risk = clamp(s.risk + 3, 0, 100)
    pushLog(s, `【攻坚】挂帅：${c.name}（隐性债务台账已上报，风险 +3）`)
    return {
      ok: true,
      text: `你挂帅「${c.name}」。隐性债务台账当月上报，压力先落了地（风险 +3），此后在办期间每月还本付息都会找上门。共 ${c.steps} 个节点。`,
    }
  }
  pushLog(s, `【攻坚】挂帅：${c.name}`)
  return { ok: true, text: `你挂帅「${c.name}」。共 ${c.steps} 个节点，每月可推进或调整策略。` }
}

export type CampaignAct = 'qin' | 'fen' | 'ya'

/** 主官专项在办期间的月度压力（进入下个月时调用） */
export function campaignTick(s: GameState): string | null {
  const c = s.campaign
  if (!c) return null
  if (c.major === 'zhai') {
    s.risk = clamp(s.risk + 1, 0, 100)
    return '债务化解专项在办：本月还本付息如期而至。（风险 +1）'
  }
  return null
}

/** 主官专项：每推进一个节点，条线带来的额外影响与叙述 */
function majorStepFx(
  s: GameState,
  major: MajorLine,
  act: CampaignAct,
): string {
  if (major === 'zhao') {
    if (act === 'qin') {
      s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
      return '你带队上门拜访了三家龙头企业，当场敲定考察日程。'
    }
    if (act === 'fen') {
      s.attrs.GX = clamp(s.attrs.GX + 1)
      return '招商分局分片驻点，项目库又添了几个有效线索。'
    }
    s.risk = clamp(s.risk + 2, 0, 100)
    s.mashScore = clamp((s.mashScore ?? 0) + 2, 0, 100)
    return '签约数字按「压茬」翻了一倍，班子里有人小声问数字怎么来的。（风险 +2）'
  }
  if (major === 'zhai') {
    if (act === 'fen') {
      s.risk = clamp(s.risk - 2, 0, 100)
      return '和债权人谈成两笔展期，平台公司的现金流缓了一口气。（风险 −2）'
    }
    if (act === 'ya') {
      s.risk = clamp(s.risk + 3, 0, 100)
      s.attrs.Lian = clamp(s.attrs.Lian - 2)
      return '借新还旧把到期顶了过去，窟窿还在，手续费又厚了一层。（风险 +3）'
    }
    s.attrs.NL = clamp(s.attrs.NL + 1)
    return '你逐笔核了融资成本，砍掉了两笔高息非标。'
  }
  // sheng
  if (act === 'qin') {
    s.attrs.Lian = clamp(s.attrs.Lian + 1)
    s.attrs.MX = clamp(s.attrs.MX + 1)
    return '你去了关停的化工园区，看了复绿现场，也看了安置车间。'
  }
  if (act === 'fen') {
    s.attrs.NL = clamp(s.attrs.NL + 1)
    return '整改清单分解到镇，销号一个、公开一个。'
  }
  s.risk = clamp(s.risk + 3, 0, 100)
  s.attrs.MX = clamp(s.attrs.MX - 2)
  return '表面复垦连夜铺了绿网，卫星图骗得了一时。（风险 +3）'
}

/** 主官专项收官：按条线与质量给差异化的结算 */
function majorFinishFx(s: GameState, major: MajorLine, q: number): string | null {
  if (major === 'zhao') {
    if (q >= 70) {
      s.attrs.ZJ = clamp(s.attrs.ZJ + 3)
      s.attrs.GX = clamp(s.attrs.GX + 2)
      return '签约项目落地率成了全市样板，兄弟市来取经。'
    }
    if (q < 40) {
      s.risk = clamp(s.risk + 5, 0, 100)
      return '审计抽了三家「签约企业」，注册时间都在签约前一个月。（风险 +5）'
    }
    return null
  }
  if (major === 'zhai') {
    if (q >= 60) {
      s.risk = clamp(s.risk - 8, 0, 100)
      s.attrs.Lian = clamp(s.attrs.Lian + 2)
      return '债务率降回警戒线以内，财政重建了预算硬约束。'
    }
    if (q < 40) {
      s.risk = clamp(s.risk + 6, 0, 100)
      return '化债变成了拆东墙补西墙，窟窿还在，利息更重了。（风险 +6）'
    }
    return null
  }
  // sheng
  if (s.attrs.Lian >= 62 && q >= 55) {
    s.attrs.MX = clamp(s.attrs.MX + 4)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    return '督察组对整改清单逐项销号，通报里点了你的名字——是表扬。'
  }
  s.risk = clamp(s.risk + 6, 0, 100)
  return '督察组回访认定「表面整改」，通报直送省里。（风险 +6）'
}

export function advanceCampaign(
  s: GameState,
  act: CampaignAct,
): { ok: boolean; text: string; finished?: boolean } {
  const c = s.campaign
  if (!c) return { ok: false, text: '没有在打的战役。' }
  if (s.currentEventId) return { ok: false, text: '请先处置本月事件。' }
  if (s.actionPoints < 1) return { ok: false, text: '行动点不足。' }
  s.actionPoints -= 1
  c.step += 1
  if (act === 'qin') {
    c.quality = clamp(c.quality + 12, 0, 100)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 2)
    s.attrs.MX = clamp(s.attrs.MX + 1)
  } else if (act === 'fen') {
    c.quality = clamp(c.quality + 6, 0, 100)
    s.attrs.GX = clamp(s.attrs.GX + 2)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 1)
  } else {
    c.quality = clamp(c.quality - 8, 0, 100)
    s.attrs.ZJ = clamp(s.attrs.ZJ + 3)
    s.attrs.MX = clamp(s.attrs.MX - 3)
    s.risk = clamp(s.risk + 3, 0, 100)
    s.mashScore = clamp((s.mashScore ?? 0) + 3, 0, 100)
  }

  let note = ''
  if (c.major) note = majorStepFx(s, c.major, act)

  if (c.step < c.total) {
    return {
      ok: true,
      text: `「${c.name}」推进至 ${c.step}/${c.total} 节点（质量 ${Math.round(c.quality)}）。${note}`,
    }
  }
  const q = c.quality
  const name = c.name
  const majorNote = c.major ? majorFinishFx(s, c.major, q) : null
  s.campaign = null
  s.attrs.ZJ = clamp(s.attrs.ZJ + (q >= 70 ? 6 : 2))
  s.attrs.NL = clamp(s.attrs.NL + (q >= 70 ? 3 : 1))
  s.dutyYearScore = clamp((s.dutyYearScore ?? 0) + Math.round(q / 10), 0, 100)
  pushLog(s, `【攻坚】「${name}」收官，质量 ${Math.round(q)}。`)
  return {
    ok: true,
    finished: true,
    text:
      (q >= 75
        ? `「${name}」打成了标杆，上级点名表扬。`
        : q >= 50
          ? `「${name}」基本落地，有亮点也有尾巴。`
          : `「${name}」虎头蛇尾，群众有议论。`) + (majorNote ? `\n${majorNote}` : ''),
  }
}

/** ── 4. 子女升学 / 就业 ─────────────── */

export function childTick(s: GameState): string | null {
  const f = s.family
  if (!f || f.childAge <= 0) return null
  if (s.childPath === 'done') return null
  const age = Math.floor(f.childAge)
  // 中考 15，高考 18，就业 22
  if (age >= 15 && (s.childPath === 'none' || !s.childPath)) {
    s.childPath = 'zhongkao'
    return '孩子要中考了。家里问你要不要「想办法」进重点班。'
  }
  if (age >= 18 && s.childPath === 'zhongkao') {
    s.childPath = 'gaokao'
    return '孩子高考在即。有人暗示可以「操作」志愿。'
  }
  if (age >= 22 && s.childPath === 'gaokao') {
    s.childPath = 'jiuye'
    return '孩子毕业找工作。亲戚托你「安排一下」。'
  }
  return null
}

export type ChildChoice = 'benfen' | 'guanxi' | 'jiaoyu'

export function resolveChild(
  s: GameState,
  choice: ChildChoice,
): { ok: boolean; text: string } {
  const path = s.childPath
  if (!path || path === 'none' || path === 'done')
    return { ok: false, text: '暂时没有子女升学就业节点。' }
  if (choice === 'benfen') {
    s.attrs.Lian = clamp(s.attrs.Lian + 3)
    s.risk = clamp(s.risk - 2, 0, 100)
    if (s.family) s.family.spouseMood = clamp(s.family.spouseMood - 4)
    if (path === 'jiuye') {
      s.childPath = 'done'
      return { ok: true, text: '孩子自己投简历、自己面试。过程辛苦，你没插手。廉洁加分，家里有点怨气。' }
    }
    s.attrs.MX = clamp(s.attrs.MX + 1)
    return { ok: true, text: '你让孩子凭本事考。成绩中上，家里虽有抱怨，你心里踏实。' }
  }
  if (choice === 'guanxi') {
    s.attrs.GX = clamp(s.attrs.GX + 2)
    s.attrs.Lian = clamp(s.attrs.Lian - 6)
    s.risk = clamp(s.risk + 6, 0, 100)
    if (s.family) s.family.spouseMood = clamp(s.family.spouseMood + 8)
    if (path === 'jiuye') s.childPath = 'done'
    return { ok: true, text: '你托人「关照」了一下。事办成了，人情账上又多一笔，风险也在累积。' }
  }
  // jiaoyu：讲道理 + 给资源但不违纪
  s.attrs.NL = clamp(s.attrs.NL + 1)
  s.attrs.Lian = clamp(s.attrs.Lian + 1)
  if (s.family) s.family.spouseMood = clamp(s.family.spouseMood + 2)
  if (path === 'jiuye') s.childPath = 'done'
  return { ok: true, text: '你花时间陪孩子定方向、找公开信息，不碰红线。家里气氛缓和了一些。' }
}

/** ── 5. 回忆录 / 口述史 ─────────────── */

export function canWriteMemoir(s: GameState): { ok: boolean; reason: string } {
  if (s.currentEventId) return { ok: false, reason: '请先处置本月事件' }
  if (s.actionPoints < 1) return { ok: false, reason: '行动点不足' }
  if ((s.memoirPages ?? 0) >= 80) return { ok: false, reason: '回忆录已足够厚' }
  return { ok: true, reason: '' }
}

export type MemoirMode = 'shishi' | 'wenxue' | 'baomi'

export function writeMemoir(
  s: GameState,
  mode: MemoirMode,
): { ok: boolean; text: string } {
  const g = canWriteMemoir(s)
  if (!g.ok) return { ok: false, text: g.reason }
  s.actionPoints -= 1
  const pages = s.memoirPages ?? 0
  if (mode === 'shishi') {
    s.memoirPages = pages + 12
    s.attrs.Lian = clamp(s.attrs.Lian + 1)
    s.attrs.NL = clamp(s.attrs.NL + 1)
    s.risk = clamp(s.risk + 1, 0, 100)
    return { ok: true, text: '你按时间线写实事，不回避也不渲染。页数增加，心里更清楚。' }
  }
  if (mode === 'wenxue') {
    s.memoirPages = pages + 8
    s.attrs.MX = clamp(s.attrs.MX + 2)
    return { ok: true, text: '你写了几段带烟火气的故事。读起来生动，分量略轻。' }
  }
  s.memoirPages = pages + 6
  s.risk = clamp(s.risk - 2, 0, 100)
  return { ok: true, text: '你只写可公开的部分，敏感处一笔带过。稳妥，页数涨得慢。' }
}

export function memoirSummary(s: GameState): string {
  const p = s.memoirPages ?? 0
  if (p >= 60) return `${p} 页 · 可成册`
  if (p >= 30) return `${p} 页 · 初稿`
  if (p > 0) return `${p} 页 · 片段`
  return '尚未动笔'
}

/** ── 6. 多周目继承 ───────────────────── */

export const LEGACY_KEY = 'guantu_legacy'

export interface LegacyBundle {
  lives: number
  lastOrigin: string
  lastLevel: string
  lastRank: number
  inherit: string[]
  bonusAttrs: Partial<Record<'ZJ' | 'GX' | 'Lian' | 'MX' | 'NL', number>>
}

export function loadLegacy(): LegacyBundle | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LegacyBundle
  } catch {
    return null
  }
}

export function saveLegacyFromGame(s: GameState) {
  const prev = loadLegacy()
  const lives = (prev?.lives ?? 0) + 1
  const inherit: string[] = []
  // 门生：名册好感≥60 的可见旧人
  for (const ref of s.npcs) {
    if (ref.favor >= 60) inherit.push(ref.id)
  }
  // 羁绊也算
  for (const id of s.bondNpcIds ?? []) {
    if (!inherit.includes(id)) inherit.push(id)
  }
  const rank = getPost(s.postId).rank
  const bonus: LegacyBundle['bonusAttrs'] = {}
  // 余荫：按最高职级给少量五维（很克制）
  if (rank >= 18) {
    bonus.ZJ = 3
    bonus.NL = 3
    bonus.GX = 2
  } else if (rank >= 15) {
    bonus.ZJ = 2
    bonus.NL = 2
  } else if (rank >= 12) {
    bonus.NL = 1
    bonus.ZJ = 1
  }
  // 门生每 3 人 +1 关系
  const gxFromMentees = Math.min(4, Math.floor(inherit.length / 3))
  if (gxFromMentees > 0) bonus.GX = (bonus.GX ?? 0) + gxFromMentees

  const bundle: LegacyBundle = {
    lives,
    lastOrigin: s.originId || '',
    lastLevel: getPost(s.postId).level,
    lastRank: rank,
    inherit: inherit.slice(0, 8),
    bonusAttrs: bonus,
  }
  localStorage.setItem(LEGACY_KEY, JSON.stringify(bundle))
  return bundle
}

export function applyLegacy(s: GameState): string | null {
  const b = loadLegacy()
  if (!b || b.lives <= 1) return null
  s.life = b.lives
  s.inherit = b.inherit
  for (const k of ['ZJ', 'GX', 'Lian', 'MX', 'NL'] as const) {
    const v = b.bonusAttrs[k]
    if (v) s.attrs[k] = clamp(s.attrs[k] + v)
  }
  // 门生：若关系网有同 id，开局好感抬升
  for (const id of b.inherit) {
    const ref = s.npcs.find((n) => n.id === id)
    if (ref) ref.favor = clamp(ref.favor + 15, -50, 100)
  }
  pushTimeline(s, 'other', `第 ${b.lives} 世开局，继承余荫`)
  const parts = Object.entries(b.bonusAttrs)
    .map(([k, v]) => `${k}+${v}`)
    .join(' ')
  return `第 ${b.lives} 世：继承上一世余荫${parts ? `（${parts}）` : ''}，门生 ${b.inherit.length} 人开局好感提升。`
}
