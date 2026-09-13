/**
 * WorkBuddy 云服务客户端（全应用唯一实例）。
 *
 * publicConfig 的三个值来自 workbuddy_cloud_service 工具 activate 的返回。
 * 若应用被重建（新的 applicationId / 发布域名），必须重新开通并同步这里的
 * endpoint 与 publishableKey，否则服务端按 Origin 精确匹配会拒绝全部数据面请求。
 */
import {
  createWorkBuddyCloud,
  type CloudError,
  type CloudResult,
} from '@tencent-ai/workbuddy-cloud-sdk'

export const CLOUD_PUBLIC_CONFIG = {
  resourceId: 'wbcs_Oa178394BSnsKKrssqe0W4',
  endpoint: 'https://guantu-career-sim.app.workbuddy.host',
  publishableKey: 'wbpk_tpjoiEKbuRfQjCdrw6bSu9_Jpb1bmcpnsVP407rC4bCRRmfnVec22h8',
} as const

/** 唯一注册了 Origin 与回调的正式发布域名 */
export const RELEASE_HOST = CLOUD_PUBLIC_CONFIG.endpoint.replace(/^https:\/\//, '')

type CloudClient = ReturnType<typeof createWorkBuddyCloud>

let client: CloudClient | null = null

/** 懒初始化：只有真正要用云服务时才建客户端，离线运行不产生任何网络行为。 */
export function cloud(): CloudClient {
  if (!client) {
    client = createWorkBuddyCloud({
      endpoint: CLOUD_PUBLIC_CONFIG.endpoint,
      publishableKey: CLOUD_PUBLIC_CONFIG.publishableKey,
    })
  }
  return client
}

/**
 * 云账号与云存档只在正式发布域名下可用。
 *
 * 官方约束：Auth 仅在应用注册的 HTTPS 发布域名生效，localhost 与 file:// 没有
 * Origin / 回调绑定。离线运行时明确降级为「本机模式」，绝不伪造登录态或会话。
 */
export function isReleaseOrigin(): boolean {
  try {
    const { protocol, hostname } = window.location
    return protocol === 'https:' && hostname === RELEASE_HOST
  } catch {
    return false
  }
}

/** 把 { data, error } 判别联合变成 throw-on-error */
export function unwrap<T>(res: CloudResult<T>): T {
  if (res.error) throw res.error
  return res.data
}

/**
 * 取一张表的查询构造器。
 *
 * SDK 在未传 schema 泛型时会把行类型推成 `never[]`，直接写会让每次写入都报类型错；
 * 引入完整的 Database 生成类型对本项目收益很低（只有三张表、查询形态固定）。
 * 这里把签名放宽，读写安全由服务端 RLS 与 owner_id 约束兜底，不依赖前端类型。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function table(name: 'saves' | 'profiles' | 'progress'): any {
  return (cloud().database as unknown as { from: (t: string) => unknown }).from(name)
}

export function errorKind(e: unknown): string {
  return String((e as Partial<CloudError> | null)?.kind ?? '')
}

/**
 * 账号类错误文案：一律给通用提示，绝不暴露「该邮箱是否已注册」这类信息。
 */
export function authErrorText(e: unknown, fallback = '操作失败，请稍后重试'): string {
  switch (errorKind(e)) {
    case 'network':
      return '网络连接失败，请检查网络后重试。'
    case 'rate-limited':
      return '操作过于频繁，请稍后再试。'
    case 'backend-unavailable':
      return '云服务暂时不可用，请稍后再试。'
    case 'credits-exhausted':
      return '云服务额度已用尽，请联系管理员。'
    case 'unimplemented':
      return '当前环境未开放该功能。'
    default:
      return fallback
  }
}

/** 数据类错误文案：不泄漏原始报文与用户标识。 */
export function dataErrorText(e: unknown): string {
  switch (errorKind(e)) {
    case 'network':
      return '网络不可用，存档暂存本机，恢复后会自动同步。'
    case 'unauthenticated':
      return '登录状态已失效，请重新登录后再同步。'
    case 'permission-denied':
      return '无权访问该数据。'
    case 'credits-exhausted':
      return '云服务额度已用尽，存档暂存本机。'
    case 'backend-unavailable':
      return '云服务暂时不可用，存档暂存本机。'
    case 'rate-limited':
      return '同步过于频繁，稍后会自动重试。'
    default:
      return '云端同步失败，存档已保存在本机。'
  }
}
