/** 事件图鉴：已触发过的事件 id */
const KEY = 'guantu_catalog_v1'

export function loadCatalog(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as string[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function markCatalog(eventId: string) {
  const list = loadCatalog()
  if (list.includes(eventId)) return
  list.push(eventId)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function catalogCount() {
  return loadCatalog().length
}

/** 清空本机图鉴镜像（登出/切换账号时用，云端数据不受影响） */
export function clearCatalog(): void {
  localStorage.removeItem(KEY)
}

/** 并集合并（云端拉取时用）。跨局图鉴只增不减，取并集不会丢条目。 */
export function mergeCatalog(ids: string[]): number {
  const list = loadCatalog()
  const set = new Set(list)
  let added = 0
  for (const id of ids) {
    if (id && !set.has(id)) {
      set.add(id)
      added++
    }
  }
  if (added) {
    try {
      localStorage.setItem(KEY, JSON.stringify([...set]))
    } catch {
      /* ignore */
    }
  }
  return added
}
