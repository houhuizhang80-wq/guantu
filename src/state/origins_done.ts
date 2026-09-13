/** 跨局记录：已通过（到达结局）的出身 */
const KEY = 'guantu_origins_done_v1'

export function loadOriginsDone(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as string[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function markOriginDone(originId: string | null | undefined) {
  if (!originId) return
  const list = loadOriginsDone()
  if (!list.includes(originId)) {
    list.push(originId)
    localStorage.setItem(KEY, JSON.stringify(list))
  }
}

export function originsDoneCount() {
  return loadOriginsDone().length
}

/** 清空本机记录（登出/切换账号时用，云端数据不受影响） */
export function clearOriginsDone(): void {
  localStorage.removeItem(KEY)
}

/** 并集合并（云端拉取时用） */
export function mergeOriginsDone(ids: string[]): number {
  const list = loadOriginsDone()
  const set = new Set(list)
  let added = 0
  for (const id of ids) {
    if (id && !set.has(id)) {
      set.add(id)
      added++
    }
  }
  if (added) localStorage.setItem(KEY, JSON.stringify([...set]))
  return added
}
