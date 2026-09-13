import type { AttrFx, Project } from '../types'
import type { GameState } from '../types'
import { getPost } from './posts'

export interface ProjectDef {
  id: string
  name: string
  flavor: string
  /** 需要几次「推进」才完成（约） */
  steps: number
  doneFx: AttrFx
  minRank?: number
  maxRank?: number
  /** 从哪类行动更容易启动 */
  fromAction?: string
}

export const PROJECT_DEFS: ProjectDef[] = [
  {
    id: 'tai',
    name: '完善工作台账',
    flavor: '把散落的进度、问题、责任人收成一本账。',
    steps: 2,
    doneFx: { NL: 3, ZJ: 2 },
    fromAction: 'xiezuo',
  },
  {
    id: 'xiaqu',
    name: '包联一个后进村',
    flavor: '定点帮扶，每月至少下去一次。',
    steps: 3,
    doneFx: { MX: 8, ZJ: 4 },
    fromAction: 'xiachen',
  },
  {
    id: 'xinfang',
    name: '化解一件信访积案',
    flavor: '卷宗很厚，双方都还活着。',
    steps: 3,
    doneFx: { MX: 6, ZJ: 5, NL: 2 },
    minRank: 1,
    fromAction: 'xiachen',
  },
  {
    id: 'duiwai',
    name: '建立对口部门联络图',
    flavor: '谁管什么、谁好说话，画成一张图。',
    steps: 2,
    doneFx: { GX: 6, NL: 2 },
    fromAction: 'yingchou',
  },
  {
    id: 'anquan',
    name: '安全生产大排查',
    flavor: '不查不知道，一查吓一跳。',
    steps: 3,
    doneFx: { Risk: -8, ZJ: 4, Lian: 2 },
    minRank: 2,
    fromAction: 'zicha',
  },
  {
    id: 'xiangmu',
    name: '推进一个重点项目',
    flavor: '立项、征迁、资金、工期，每一环都可能卡住。',
    steps: 4,
    doneFx: { ZJ: 10, GX: 3, Risk: 3 },
    minRank: 3,
    fromAction: 'paotiao',
  },
  {
    id: 'minsheng',
    name: '办好十件民生实事',
    flavor: '清单制、销号制。群众的眼睛是雪亮的。',
    steps: 4,
    doneFx: { MX: 10, ZJ: 6 },
    minRank: 4,
    fromAction: 'xiachen',
  },
  {
    id: 'duiwai2',
    name: '引进一家链主企业',
    flavor: '尽调比情调重要。',
    steps: 4,
    doneFx: { ZJ: 12, Lian: -3, Risk: 5 },
    minRank: 7,
    fromAction: 'paotiao',
  },
  {
    id: 'zhili',
    name: '县域治理数字化试点',
    flavor: '数据多跑路，基层少跑腿——也少背锅。',
    steps: 3,
    doneFx: { NL: 6, ZJ: 5, MX: 3 },
    minRank: 8,
    fromAction: 'xuexi',
  },
  {
    id: 'kaifang',
    name: '对外开放通道建设',
    flavor: '从内陆县到节点城市，路要一公里一公里抠。',
    steps: 4,
    doneFx: { ZJ: 14, GX: 5, NL: 4 },
    minRank: 12,
    fromAction: 'paotiao',
  },
]

export function pickStartableProject(s: GameState, actionId: string): ProjectDef | null {
  const rank = getPost(s.postId).rank
  const active = new Set(s.projects.map((p) => p.id))
  const pool = PROJECT_DEFS.filter((d) => {
    if (active.has(d.id)) return false
    if (d.fromAction && d.fromAction !== actionId) return false
    if (d.minRank != null && rank < d.minRank) return false
    if (d.maxRank != null && rank > d.maxRank) return false
    return true
  })
  if (pool.length === 0) return null
  // 优先匹配当前行动来源
  const preferred = pool.filter((d) => d.fromAction === actionId)
  const list = preferred.length ? preferred : pool
  return list[Math.floor(Math.random() * list.length)]
}

export function startProject(def: ProjectDef): Project {
  return {
    id: def.id,
    name: def.name,
    progress: 8 + Math.floor(Math.random() * 10),
    tick: Math.max(4, Math.round(100 / def.steps / 2)),
    doneFx: def.doneFx,
    flavor: def.flavor,
  }
}

export function tickProjects(
  s: GameState,
  applyFx: (fx: AttrFx) => void,
): { updates: string[]; completed: string[] } {
  const updates: string[] = []
  const completed: string[] = []
  const keep: Project[] = []
  for (const p of s.projects) {
    const before = p.progress
    p.progress = Math.min(100, p.progress + p.tick + Math.floor(Math.random() * 4))
    if (p.progress >= 100) {
      completed.push(p.name)
      applyFx(p.doneFx)
      updates.push(`「${p.name}」办结。`)
    } else if (p.progress - before >= 6) {
      updates.push(`「${p.name}」推进至 ${p.progress}%。`)
    }
    if (p.progress < 100) keep.push(p)
  }
  s.projects = keep
  return { updates, completed }
}
