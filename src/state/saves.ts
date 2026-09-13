/**
 * 存档：云端为准 + 本机缓存。
 *
 * 登录后每次写入先落本机（同步、秒回），再合并式推送到云；断网时本机照样能玩，
 * 恢复网络后自动补传。读取一律走本机缓存（同步），云端只在登录/切换账号时拉取。
 *
 * owner_id 一律不发送 —— 由 saves 表的 DEFAULT auth.uid() 在服务端填写，
 * RLS 的 WITH CHECK 会拒绝任何伪造归属的写入。
 */
import type { GameState } from '../types'
import { authUser } from './auth'
import { dataErrorText, table } from './cloud'

const LEGACY_KEY = 'guantu_save_v1'
const TABLE = 'saves'
export const SAVE_VER = 2
export const SLOT_COUNT = 6

function clampSlot(i: number): number {
  return Math.max(0, Math.min(SLOT_COUNT - 1, i | 0))
}

function slotKey(i: number) {
  return `guantu_slot_${clampSlot(i)}`
}

function slotAtKey(i: number) {
  return `guantu_slot_at_${clampSlot(i)}`
}

/** 本机该槽位最后一次写入时间（毫秒）；0 表示没有本机存档 */
export function localSlotTime(i: number): number {
  const raw = localStorage.getItem(slotAtKey(i))
  const t = raw ? Number(raw) : 0
  return Number.isFinite(t) ? t : 0
}

export function readSlot(i: number): GameState | null {
  const raw = localStorage.getItem(slotKey(i)) ?? (i === 0 ? localStorage.getItem(LEGACY_KEY) : null)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as GameState
    if (!p?.attrs || !p.postId) return null
    return normalizeSave(p, i)
  } catch {
    return null
  }
}

export function writeSlot(s: GameState) {
  s.saveVer = SAVE_VER
  s.slot = s.slot ?? 0
  localStorage.setItem(slotKey(s.slot), JSON.stringify(s))
  localStorage.setItem(slotAtKey(s.slot), String(Date.now()))
  schedulePush(s)
}

export function clearSlot(i: number) {
  localStorage.removeItem(slotKey(i))
  localStorage.removeItem(slotAtKey(i))
  if (i === 0) localStorage.removeItem(LEGACY_KEY)
  void deleteSlotCloud(i)
}

export function anySlot(): boolean {
  for (let i = 0; i < SLOT_COUNT; i++) if (readSlot(i)) return true
  return false
}

export function normalizeSave(p: GameState, slot: number): GameState {
  const s = { ...p }
  s.slot = slot
  s.saveVer = s.saveVer ?? SAVE_VER
  // 旧档提示标记
  if (!s.provinceId) s.flags = { ...(s.flags || {}), migratedLegacySave: true }
  if (s.recentEvents == null) s.recentEvents = []
  if (s.eventHits == null) s.eventHits = {}
  if (s.projects == null) s.projects = []
  if (s.paths == null) s.paths = ['difang']
  if (s.achievements == null) s.achievements = []
  if (s.milestones == null) s.milestones = []
  if (s.jijian === undefined) s.jijian = null
  if (s.punishLeft == null) s.punishLeft = 0
  if (s.probationLeft == null) s.probationLeft = 0
  if (s.family == null)
    s.family = { spouse: false, spouseMood: 60, childAge: 0, parentHealth: 80 }
  if (s.factionRep == null) s.factionRep = { A: 20, B: 20, local: 30 }
  if (s.timeline == null) s.timeline = []
  if (s.eventsHandledThisPost == null) s.eventsHandledThisPost = 0
  if (s.choiceHistory == null) s.choiceHistory = []
  if (s.mashScore == null) s.mashScore = 0
  if (s.ffUsedThisYear == null) s.ffUsedThisYear = 0
  if (s.lastActionKey === undefined) s.lastActionKey = null
  if (s.uiTab == null) s.uiTab = 'duty'
  if (s.favorCooldown == null) s.favorCooldown = 0
  if (s.badAppraisalStreak == null) s.badAppraisalStreak = 0
  if (s.factionHeat == null) s.factionHeat = 20
  if (s.factionCd == null) s.factionCd = 0
  if (s.bondNpcIds == null) s.bondNpcIds = []
  if (s.bondLetterCd == null) s.bondLetterCd = 0
  if (s.dutyDone == null) s.dutyDone = []
  if (s.dutyRun === undefined) s.dutyRun = null
  if (s.dutyYearScore == null) s.dutyYearScore = 0
  if (s.dutyMonthScore == null) s.dutyMonthScore = 0
  if (s.yuqingHeat == null) s.yuqingHeat = 12
  if (s.yuqingActed == null) s.yuqingActed = false
  if (s.secretary === undefined) s.secretary = null
  if (s.weekPlan == null) s.weekPlan = [null, null, null, null]
  if (s.weekPlanned == null) s.weekPlanned = false
  if (s.research === undefined) s.research = null
  if (s.researchDone == null) s.researchDone = []
  if (s.rosterTags == null) s.rosterTags = {}
  if (s.rosterUsed == null) s.rosterUsed = 0
  if (s.duchaDone == null) s.duchaDone = false
  if (s.duchaLast === undefined) s.duchaLast = null
  if (s.tanxinCd == null) s.tanxinCd = 0
  if (s.campaign === undefined) s.campaign = null
  if (s.policy === undefined) s.policy = null
  if (s.factionTask === undefined) s.factionTask = null
  if (s.pendingFactionTask === undefined) s.pendingFactionTask = null
  if (s.factionTaskDone == null) s.factionTaskDone = []
  if (s.childPath == null) s.childPath = 'none'
  if (s.memoirPages == null) s.memoirPages = 0
  if (s.life == null) s.life = 1
  if (s.inherit == null) s.inherit = []
  if (s.pendingBurst === undefined) s.pendingBurst = null
  if (s.pendingProjectChoice === undefined) s.pendingProjectChoice = null
  if (s.pendingVisit === undefined) s.pendingVisit = null
  if (s.pendingVote === undefined) s.pendingVote = null
  if (s.retiredMode === undefined) s.retiredMode = false
  if (s.promoFailLog == null) s.promoFailLog = []
  if (s.catalogStage === undefined) s.catalogStage = 'all'
  if (s.provinceId == null) s.provinceId = 'qiantang'
  if (s.pendingOriginId === undefined) s.pendingOriginId = undefined
  if (s.flags == null) s.flags = {}
  // 年度目标责任书：旧档没有这两个字段，补默认值
  if (s.annualGoals === undefined) s.annualGoals = null
  if (s.annualGoalResult === undefined) s.annualGoalResult = null
  if (s.yearCounters == null) s.yearCounters = { year: s.year, events: 0, duties: 0, projects: 0 }
  // 秘书腐败分支
  if (s.pendingSecCase === undefined) s.pendingSecCase = null
  if (s.secShielded === undefined) s.secShielded = false
  return s
}

export function slotLabel(s: GameState | null, i: number): string {
  if (!s) return `槽位 ${i + 1} · 空`
  const origin = String(s.flags?.originName || '未知出身')
  const post = s.postId
  return `槽位 ${i + 1} · ${origin} · ${s.year}.${String(s.month).padStart(2, '0')} · ${post}`
}

/* ── 云端同步 ─────────────────────────────────────────────────────── */

type SaveRow = {
  slot: number
  label: string
  payload: GameState
  ver: number
  saved_at: string
}

function rowOf(s: GameState): SaveRow {
  const slot = s.slot ?? 0
  const origin = String(s.flags?.originName || '未知出身')
  return {
    slot,
    label: `${origin} · ${s.year}.${String(s.month).padStart(2, '0')} · 第 ${s.turn} 月`,
    payload: s,
    ver: SAVE_VER,
    saved_at: new Date().toISOString(),
  }
}

const pending = new Map<number, GameState>()
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * 云端同步状态，供顶栏「自动存档」标识展示：
 * ok 正常 / pending 待推送 / error 有存档未同步成功 / offline 未登录或离线。
 */
export type SyncState = 'ok' | 'pending' | 'error' | 'offline'
let syncState: SyncState = 'ok'

export function cloudSyncState(): SyncState {
  return authUser() ? syncState : 'offline'
}

function schedulePush(s: GameState) {
  if (!authUser()) return
  const slot = Math.max(0, Math.min(SLOT_COUNT - 1, s.slot ?? 0))
  pending.set(slot, { ...s, slot })
  syncState = 'pending'
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    void flushCloudPush()
  }, 2000)
}

/** 立即把待推送的槽位写上去（切换页面 / 登出 / 关键节点前调用） */
export async function flushCloudPush(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!authUser() || pending.size === 0) return
  const items = [...pending.values()]
  pending.clear()
  let allOk = true
  for (const s of items) {
    const r = await pushSlotCloud(s)
    if (!r.ok) allOk = false
  }
  syncState = allOk ? 'ok' : 'error'
}

export async function pushSlotCloud(s: GameState): Promise<{ ok: boolean; error?: string }> {
  if (!authUser()) return { ok: false, error: '未登录' }
  const row = rowOf(s)
  try {
    // 首选 upsert；若冲突目标不被接受，退回「先更新、无行则插入」
    const up = await table(TABLE).upsert(row, { onConflict: 'owner_id,slot' })
    if (!up.error) return { ok: true }

    const upd = await table(TABLE).update(row).eq('slot', row.slot).select('id')
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

export async function deleteSlotCloud(slot: number): Promise<void> {
  if (!authUser()) return
  try {
    await table(TABLE).delete().eq('slot', slot)
  } catch {
    /* 删除失败下次同步会覆盖，不打断界面 */
  }
}

/**
 * 拉取云端存档并与本机合并。
 *
 * 合并规则按时间戳：本机比云端新（断网期间玩过）就保留本机并把它推上去，
 * 否则以云端为准。绝不用「云端覆盖本机」这种单向策略吞掉离线进度。
 */
export async function pullSlotsFromCloud(): Promise<{
  ok: boolean
  error?: string
  pulled: number
  pushed: number
}> {
  if (!authUser()) return { ok: false, error: '未登录', pulled: 0, pushed: 0 }
  try {
    const res = await table(TABLE).select('slot, label, payload, saved_at')
    if (res.error) return { ok: false, error: dataErrorText(res.error), pulled: 0, pushed: 0 }
    const rows = (res.data ?? []) as unknown as { slot: number; payload: unknown; saved_at?: string }[]

    let pulled = 0
    let pushed = 0
    const seen = new Set<number>()

    for (const r of rows) {
      const slot = Math.max(0, Math.min(SLOT_COUNT - 1, Number(r.slot) || 0))
      const remote = r.payload as GameState | null
      if (!remote?.attrs || !remote.postId) continue
      seen.add(slot)
      const cloudAt = r.saved_at ? Date.parse(String(r.saved_at)) : 0
      const localAt = localSlotTime(slot)
      const local = readSlot(slot)

      if (local && localAt > cloudAt) {
        // 本机更新（多为断网期间玩过）：保留本机并补传
        const up = await pushSlotCloud(local)
        if (up.ok) pushed++
        continue
      }
      const n = normalizeSave(remote, slot)
      localStorage.setItem(slotKey(slot), JSON.stringify(n))
      localStorage.setItem(slotAtKey(slot), String(cloudAt || Date.now()))
      pulled++
    }

    // 云端没有、本机有的槽位：首次登录迁移，补传上去
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (seen.has(i)) continue
      const local = readSlot(i)
      if (!local) continue
      const up = await pushSlotCloud(local)
      if (up.ok) pushed++
    }

    syncState = 'ok'
    return { ok: true, pulled, pushed }
  } catch (e) {
    return { ok: false, error: dataErrorText(e), pulled: 0, pushed: 0 }
  }
}

/** 该账号云端一条存档都没有（用于判断是否需要迁移提示） */
export async function cloudSlotCount(): Promise<number> {
  if (!authUser()) return 0
  try {
    const res = await table(TABLE).select('slot', { count: 'exact', head: true })
    if (res.error) return 0
    return typeof res.count === 'number' ? res.count : 0
  } catch {
    return 0
  }
}

/** 只统计本机有档的槽位数量 */
export function localSlotCount(): number {
  let n = 0
  for (let i = 0; i < SLOT_COUNT; i++) if (readSlot(i)) n++
  return n
}

/**
 * 清空本机存档镜像。
 * 登出或换账号时调用 —— 云端数据不受影响，但绝不能把上一个账号的存档
 * 留在本机（同设备换账号会互相看到，甚至被误传到新账号名下）。
 */
export function purgeSlots(): void {
  for (let i = 0; i < SLOT_COUNT; i++) {
    localStorage.removeItem(slotKey(i))
    localStorage.removeItem(slotAtKey(i))
  }
  localStorage.removeItem(LEGACY_KEY)
  pending.clear()
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

/* ── 导出 / 导入（AES-GCM 加密，非明文） ─────────────────────────── */

export type ExportProgress = {
  catalog: string[]
  originsDone: string[]
  promoFails: unknown[]
  exportedAt: string
}

export type ImportResult = {
  ok: boolean
  error?: string
  needPassword?: boolean
  state?: GameState
  progress?: ExportProgress
}

const EXPORT_MAGIC = 'GUANTU2:'
const PBKDF2_ITERS = 180_000
const SALT_LEN = 16
const IV_LEN = 12

function toB64(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin)
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Web Crypto 要求独立 ArrayBuffer，避免 SharedArrayBuffer 类型干扰 */
function asBuf(u8: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u8.byteLength)
  new Uint8Array(out).set(u8)
  return out
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asBuf(salt), iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** 导出：整包 AES-GCM 加密。文件不是明文 JSON，需密码才能解开。 */
export async function exportSave(
  s: GameState,
  password: string,
  progress?: Partial<ExportProgress>,
): Promise<string> {
  if (!password || password.length < 4) {
    throw new Error('导出密码至少 4 位')
  }
  const payload = {
    k: 2,
    save: s,
    progress: {
      catalog: progress?.catalog ?? [],
      originsDone: progress?.originsDone ?? [],
      promoFails: progress?.promoFails ?? [],
      exportedAt: progress?.exportedAt ?? new Date().toISOString(),
    },
  }
  const plain = new TextEncoder().encode(JSON.stringify(payload))
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveAesKey(password, salt)
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: asBuf(iv) }, key, asBuf(plain)),
  )
  const packed = new Uint8Array(salt.length + iv.length + cipher.length)
  packed.set(salt, 0)
  packed.set(iv, salt.length)
  packed.set(cipher, salt.length + iv.length)
  return EXPORT_MAGIC + toB64(packed)
}

/** 导入：支持 GUANTU2（AES-GCM）、GUANTU1（旧 XOR）与旧版明文 JSON。 */
export async function importSave(
  raw: string,
  slot: number,
  password?: string,
): Promise<ImportResult> {
  const text = raw.trim()
  try {
    let json = ''
    let progress: ExportProgress | undefined

    if (text.startsWith(EXPORT_MAGIC)) {
      if (!password) return { ok: false, needPassword: true, error: '请输入解密密码' }
      const packed = fromB64(text.slice(EXPORT_MAGIC.length))
      if (packed.length < SALT_LEN + IV_LEN + 16) {
        return { ok: false, error: '存档已损坏或不完整' }
      }
      const salt = packed.subarray(0, SALT_LEN)
      const iv = packed.subarray(SALT_LEN, SALT_LEN + IV_LEN)
      const cipher = packed.subarray(SALT_LEN + IV_LEN)
      let plainBuf: ArrayBuffer
      try {
        const key = await deriveAesKey(password, salt)
        plainBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: asBuf(iv) },
          key,
          asBuf(cipher),
        )
      } catch {
        return { ok: false, error: '密码错误或存档已被修改' }
      }
      const body = JSON.parse(new TextDecoder().decode(plainBuf)) as {
        save?: GameState
        progress?: ExportProgress
      }
      if (!body?.save?.attrs || !body.save.postId) {
        return { ok: false, error: '存档格式不正确' }
      }
      json = JSON.stringify(body.save)
      if (body.progress) progress = body.progress
    } else if (text.startsWith('GUANTU1:')) {
      // 兼容旧版 XOR 混淆
      json = xorBase64Decode(text.slice('GUANTU1:'.length))
      if (!json) return { ok: false, error: '存档校验失败或已损坏' }
    } else if (text.startsWith('{')) {
      // 兼容旧版明文 JSON（仅历史备份）
      json = text
    } else {
      return { ok: false, error: '不是有效的官途存档' }
    }

    const p = JSON.parse(json) as GameState
    if (!p?.attrs || !p.postId) return { ok: false, error: '存档格式不正确' }
    const s = normalizeSave(p, slot)
    writeSlot(s)
    return { ok: true, state: s, progress }
  } catch {
    return { ok: false, error: '无法解析存档（文件可能被修改）' }
  }
}

/** 旧版轻量混淆：XOR + Base64（仅用于读入历史备份） */
const XOR_KEY = '官途-青云-2012-选调-墩苗'

function xorEncode(str: string, key: string): string {
  let out = ''
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    out += String.fromCharCode(code)
  }
  return out
}

function b64Decode(b64: string): string {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function xorBase64Decode(payload: string): string {
  try {
    const mixed = b64Decode(payload)
    return xorEncode(mixed, XOR_KEY)
  } catch {
    return ''
  }
}
