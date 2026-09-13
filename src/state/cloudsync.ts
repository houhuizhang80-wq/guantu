/**
 * 登录后的数据同步编排：账号档案 → 存档槽位 → 跨局进度。
 *
 * 单独成模块，是为了让 auth / saves / progress 三者互不引用，避免循环依赖。
 * 另外负责「本机数据归属」——同一台设备换账号时，必须先清掉上一个账号的本机
 * 镜像，否则会出现两个账号互相看到存档、甚至把 A 的存档传到 B 名下的问题。
 */
import { authUser, ensureProfile } from './auth'
import { clearCatalog } from './catalog'
import { clearOriginsDone } from './origins_done'
import { pullProgress } from './progress'
import { flushCloudPush, purgeSlots, pullSlotsFromCloud } from './saves'

/** 本机镜像当前归属的账号 id；空串表示本机数据尚无归属（未登录试玩产生的） */
const OWNER_KEY = 'guantu_local_owner_v1'

export interface SyncReport {
  ok: boolean
  /** 从云端取回的槽位数 */
  pulled: number
  /** 补传到云端的槽位数（含首次登录时的本机旧档迁移） */
  pushed: number
  error?: string
}

function localOwner(): string {
  return localStorage.getItem(OWNER_KEY) ?? ''
}

function setLocalOwner(id: string) {
  if (id) localStorage.setItem(OWNER_KEY, id)
  else localStorage.removeItem(OWNER_KEY)
}

/** 清掉本机镜像：云端仍是真源，登出后重新登录会重新拉取 */
export function purgeLocalMirror(): void {
  purgeSlots()
  clearCatalog()
  clearOriginsDone()
  localStorage.removeItem('guantu_ach_v1')
  setLocalOwner('')
}

/** 登录成功后调用：拉取该账号的云端数据并与本机合并 */
export async function afterSignIn(): Promise<SyncReport> {
  const me = authUser()
  if (!me) return { ok: false, pulled: 0, pushed: 0, error: '未登录' }

  // 本机镜像属于另一个账号 → 先清空，绝不跨账号搬运
  const prev = localOwner()
  if (prev && prev !== me.id) purgeLocalMirror()
  setLocalOwner(me.id)

  await ensureProfile()
  const slots = await pullSlotsFromCloud()
  const prog = await pullProgress()
  return {
    ok: slots.ok && prog.ok,
    pulled: slots.pulled,
    pushed: slots.pushed,
    error: slots.error ?? prog.error,
  }
}

/**
 * 登出：先把待推送的槽位刷上去，再清本机镜像。
 * 断网时推送会失败，此时云端保留的是上一次同步的版本 —— 这是刻意的取舍：
 * 宁可少几个月的进度，也不能把存档留在本机让下一个登录的人看到。
 */
export async function beforeSignOut(): Promise<void> {
  await flushCloudPush()
  purgeLocalMirror()
}
