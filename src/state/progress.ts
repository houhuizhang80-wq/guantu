/**
 * 跨局累计进度上云：事件图鉴、出身通关、成就合集。
 *
 * 合并策略是并集 —— 跨局数据只增不减，本机与云端各自可能持有对方没有的条目，
 * 取并集不会丢数据。写入一律 upsert，owner_id 由服务端 DEFAULT auth.uid() 填写。
 */
import type { GameState } from '../types'
import { authUser } from './auth'
import { dataErrorText, table } from './cloud'
import { loadCatalog, mergeCatalog } from './catalog'
import { loadOriginsDone, mergeOriginsDone } from './origins_done'
import { readSlot, SLOT_COUNT } from './saves'

const TABLE = 'progress'
/** 本机「成就合集」：当前存档之外，从云端同步回来的历史解锁记录 */
const ACH_KEY = 'guantu_ach_v1'

function asIds(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x)).filter(Boolean)
}

/** 全部槽位 + 云同步下来的成就合集 */
export function loadSyncedAchievements(): string[] {
  const set = new Set<string>()
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s: GameState | null = readSlot(i)
    for (const a of s?.achievements ?? []) set.add(String(a))
  }
  try {
    const raw = localStorage.getItem(ACH_KEY)
    if (raw) for (const a of asIds(JSON.parse(raw))) set.add(a)
  } catch {
    /* ignore */
  }
  return [...set]
}

function mergeAchievements(ids: string[]): number {
  const set = new Set(loadSyncedAchievements())
  let added = 0
  for (const id of ids) {
    if (id && !set.has(id)) {
      set.add(id)
      added++
    }
  }
  if (added) localStorage.setItem(ACH_KEY, JSON.stringify([...set]))
  return added
}

/** 拉取云端跨局进度并与本机并集合并 */
export async function pullProgress(): Promise<{ ok: boolean; error?: string }> {
  if (!authUser()) return { ok: false, error: '未登录' }
  try {
    const res = await table(TABLE)
      .select('catalog, achievements, origins_done')
      .maybeSingle()
    if (res.error) return { ok: false, error: dataErrorText(res.error) }
    const row = res.data as {
      catalog?: unknown
      achievements?: unknown
      origins_done?: unknown
    } | null
    if (!row) return { ok: true }
    mergeCatalog(asIds(row.catalog))
    mergeOriginsDone(asIds(row.origins_done))
    mergeAchievements(asIds(row.achievements))
    return { ok: true }
  } catch (e) {
    return { ok: false, error: dataErrorText(e) }
  }
}

export async function pushProgress(): Promise<{ ok: boolean; error?: string }> {
  const u = authUser()
  if (!u) return { ok: false, error: '未登录' }
  const row = {
    catalog: loadCatalog(),
    achievements: loadSyncedAchievements(),
    origins_done: loadOriginsDone(),
    updated_at: new Date().toISOString(),
  }
  try {
    // 首选 upsert；冲突目标不被接受时退回「先更新、无行则插入」
    const up = await table(TABLE).upsert(row, { onConflict: 'owner_id' })
    if (!up.error) return { ok: true }

    const upd = await table(TABLE).update(row).eq('owner_id', u.id).select('id')
    if (upd.error) return { ok: false, error: dataErrorText(upd.error) }
    if (Array.isArray(upd.data) && upd.data.length > 0) return { ok: true }

    const ins = await table(TABLE).insert(row).select('id')
    if (ins.error) {
      if (ins.error.code === '23505') return { ok: true }
      return { ok: false, error: dataErrorText(ins.error) }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: dataErrorText(e) }
  }
}

/** 节流推送：跨局数据变化频繁（每次结局都会动），不必每次都打网络 */
let pushTimer: ReturnType<typeof setTimeout> | null = null

export function schedulePushProgress() {
  if (!authUser() || pushTimer) return
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushProgress()
  }, 3000)
}
