/**
 * 账号体系：WorkBuddy 云服务 Auth（邮箱 + 密码 / 邮箱验证码）。
 *
 * 官方一期能力边界：仅邮箱 OTP 与邮箱 + 密码；不支持用户名登录、匿名登录、
 * 手机登录。协议同意与引导完成是纯本机偏好，仍存 localStorage。
 */
import type { CloudUser, PasswordResetChallenge } from '@tencent-ai/workbuddy-cloud-sdk'
import { checkNickname, NICK_FALLBACK, NICK_MAX } from '../data/banned_words'
import { authErrorText, cloud, table } from './cloud'

const AGREED_KEY = 'guantu_agreed_v1'
const GUIDE_KEY = 'guantu_guide_done_v1'
const LAST_EMAIL_KEY = 'guantu_last_email_v1'

export function hasAgreed(): boolean {
  return localStorage.getItem(AGREED_KEY) === '1'
}

export function setAgreed() {
  localStorage.setItem(AGREED_KEY, '1')
}

export function guideDone(): boolean {
  return localStorage.getItem(GUIDE_KEY) === '1'
}

export function setGuideDone() {
  localStorage.setItem(GUIDE_KEY, '1')
}

export function getLastEmail(): string {
  return localStorage.getItem(LAST_EMAIL_KEY) ?? ''
}

export function setLastEmail(email: string) {
  const v = email.trim()
  if (v) localStorage.setItem(LAST_EMAIL_KEY, v)
}

export function clearLastEmail() {
  localStorage.removeItem(LAST_EMAIL_KEY)
}

/* ── 会话镜像 ──────────────────────────────────────────────────────────
 * 渲染是同步的，这里缓存一份展示用的用户信息。会话的唯一真源在 SDK 自己
 * 维护的存储里（每次读取都重读），这里只做镜像，不参与任何鉴权判断。
 * ─────────────────────────────────────────────────────────────────── */

let user: CloudUser | null = null
let nickname = ''
let joinAt = 0
let restored = false

export function authUser(): CloudUser | null {
  return user
}

export function authEmail(): string {
  return user?.email ?? ''
}

export function authJoinAt(): number {
  return joinAt
}

export function sessionRestored(): boolean {
  return restored
}

/** 邮箱打码展示，界面上不完整暴露地址 */
export function maskedEmail(): string {
  const e = authEmail()
  const at = e.indexOf('@')
  if (at <= 0) return e || '—'
  const name = e.slice(0, at)
  const head = name.slice(0, Math.min(2, name.length))
  return `${head}${'*'.repeat(Math.max(1, name.length - head.length))}${e.slice(at)}`
}

/**
 * 缺省昵称取自邮箱前缀。邮箱名本身可能含违规词（如广告词、辱骂词），
 * 这里过一遍校验，不合规就退回中性默认值。
 */
function defaultNickname(): string {
  const local = authEmail().split('@')[0] ?? ''
  const cand = local.slice(0, NICK_MAX)
  return cand && checkNickname(cand).ok ? cand : NICK_FALLBACK
}

export function authNickname(): string {
  return nickname || defaultNickname()
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

export type Outcome = { ok: true } | { ok: false; error: string }

export interface Challenge {
  verificationId: string
  isExistingUser: boolean
}

/* ── 档案读写 ─────────────────────────────────────────────────────── */

async function loadProfile(): Promise<void> {
  if (!user) return
  try {
    const res = await table('profiles').select('nickname, created_at').maybeSingle()
    if (res.error) return
    const row = res.data as { nickname?: string | null; created_at?: string | null } | null
    // 历史数据可能是在加违禁字校验之前写进去的：读出来先过一遍，不合规就按未设置处理
    if (row?.nickname) {
      const saved = String(row.nickname)
      nickname = checkNickname(saved).ok ? saved : ''
    }
    const t = row?.created_at ? Date.parse(String(row.created_at)) : NaN
    if (!Number.isNaN(t)) joinAt = t
  } catch {
    /* 离线或表不可用时退回默认昵称，不阻塞进入游戏 */
  }
}

/**
 * 补建 / 更新账号档案。昵称只是展示名，权限一律由 owner_id 决定，
 * 客户端不发送 owner_id —— 由 DEFAULT auth.uid() 在服务端填写。
 *
 * 昵称先过违禁字校验：界面上已经拦过一次，这里是写库前的最后一道，
 * 防止有人绕过表单直接把请求发上来。不合规一律退回默认昵称。
 */
export async function ensureProfile(nick?: string): Promise<void> {
  if (!user) return
  const raw = (nick ?? nickname).trim().slice(0, NICK_MAX)
  const want = raw && checkNickname(raw).ok ? raw : defaultNickname()
  nickname = want
  try {
    await table('profiles').upsert(
      { nickname: want, updated_at: new Date().toISOString() },
      { onConflict: 'owner_id' },
    )
    await loadProfile()
  } catch {
    /* 档案写失败不阻塞游玩 */
  }
}

/* ── 会话 ─────────────────────────────────────────────────────────── */

async function acceptSession(u: CloudUser, nick?: string): Promise<void> {
  user = u
  nickname = ''
  joinAt = 0
  await loadProfile()
  await ensureProfile(nick)
}

/** 冷启动恢复登录态。只在正式发布域名下尝试，其余情况直接判定未登录。 */
export async function restoreSession(): Promise<CloudUser | null> {
  try {
    // 恢复会话最多等 8 秒：云服务偶发变慢时不能把首屏卡在启动页，超时按未登录处理
    const res = (await Promise.race([
      cloud().auth.getSession(),
      new Promise((resolve) => window.setTimeout(() => resolve({ error: true }), 8000)),
    ])) as { error?: unknown; data?: { user?: CloudUser | null } }
    user = res?.error ? null : (res?.data?.user ?? null)
  } catch {
    user = null
  }
  restored = true
  if (user) {
    await loadProfile()
    // 昵称为空说明库里没有、或存的是不合规的历史值 —— 顺手修一次
    if (!nickname) await ensureProfile()
  }
  return user
}

export async function signOutUser(): Promise<void> {
  try {
    await cloud().auth.signOut()
  } catch {
    /* 断网也必须能登出：本地状态无条件清 */
  }
  user = null
  nickname = ''
  joinAt = 0
  resetChallenge = null
}

/* ── 登录 / 注册 ──────────────────────────────────────────────────── */

export async function passwordSignIn(
  email: string,
  password: string,
): Promise<Outcome> {
  const addr = email.trim()
  if (!isEmail(addr)) return { ok: false, error: '请输入有效的邮箱地址' }
  if (!password) return { ok: false, error: '请输入密码' }
  try {
    const res = await cloud().auth.signInWithPassword({ email: addr, password })
    if (res.error) return { ok: false, error: authErrorText(res.error, '邮箱或密码不正确') }
    await acceptSession(res.data.user)
    setLastEmail(addr)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: authErrorText(e, '登录失败，请稍后重试') }
  }
}

/** 发验证码。返回的 isExistingUser 决定验码后走登录还是注册。 */
export async function sendCode(
  email: string,
): Promise<{ ok: true; challenge: Challenge } | { ok: false; error: string }> {
  const addr = email.trim()
  if (!isEmail(addr)) return { ok: false, error: '请输入有效的邮箱地址' }
  try {
    const res = await cloud().auth.sendOtp({ email: addr })
    if (res.error) return { ok: false, error: authErrorText(res.error, '验证码发送失败，请稍后重试') }
    return {
      ok: true,
      challenge: {
        verificationId: res.data.verificationId,
        isExistingUser: res.data.isExistingUser,
      },
    }
  } catch (e) {
    return { ok: false, error: authErrorText(e, '验证码发送失败，请稍后重试') }
  }
}

/**
 * 验证码核验。注册路径把 password 一并带上；已存在用户由上游忽略该字段。
 * 刻意不做「先试登录失败再试注册」的兜底 —— 那会把「密码错」掩盖成一次莫名注册。
 */
export async function verifyCode(params: {
  email: string
  verificationId: string
  isExistingUser: boolean
  code: string
  password?: string
}): Promise<Outcome> {
  const code = params.code.trim()
  if (!code) return { ok: false, error: '请输入验证码' }
  const addr = params.email.trim()
  try {
    const res = await cloud().auth.verifyOtp({
      verificationId: params.verificationId,
      token: code,
      email: addr,
      isExistingUser: params.isExistingUser,
      password: params.isExistingUser ? undefined : params.password,
    })
    if (res.error) return { ok: false, error: authErrorText(res.error, '验证码不正确或已过期') }
    await acceptSession(res.data.user, params.isExistingUser ? undefined : params.password)
    setLastEmail(addr)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: authErrorText(e, '验证失败，请稍后重试') }
  }
}

/* ── 密码 ─────────────────────────────────────────────────────────── */

let resetChallenge: PasswordResetChallenge | null = null

export async function requestPasswordReset(
  email: string,
): Promise<Outcome> {
  const addr = email.trim()
  if (!isEmail(addr)) return { ok: false, error: '请输入有效的邮箱地址' }
  try {
    const res = await cloud().auth.resetPasswordForEmail(addr)
    if (res.error) return { ok: false, error: authErrorText(res.error, '验证码发送失败，请稍后重试') }
    resetChallenge = res.data
    return { ok: true }
  } catch (e) {
    return { ok: false, error: authErrorText(e, '验证码发送失败，请稍后重试') }
  }
}

export async function completePasswordReset(
  code: string,
  newPassword: string,
): Promise<Outcome> {
  if (!resetChallenge) return { ok: false, error: '请先获取验证码' }
  if (!code.trim()) return { ok: false, error: '请输入验证码' }
  if (newPassword.length < 6) return { ok: false, error: '密码至少 6 位' }
  try {
    const res = await resetChallenge.updateUser({ nonce: code.trim(), password: newPassword })
    if (res.error) return { ok: false, error: authErrorText(res.error, '验证码不正确或已过期') }
    resetChallenge = null
    await acceptSession(res.data.user)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: authErrorText(e, '重置失败，请稍后重试') }
  }
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<Outcome> {
  if (!user) return { ok: false, error: '请先登录' }
  if (!oldPassword) return { ok: false, error: '请输入当前密码' }
  if (newPassword.length < 6) return { ok: false, error: '新密码至少 6 位' }
  try {
    const res = await cloud().auth.resetPasswordForOld({ oldPassword, newPassword })
    if (res.error) return { ok: false, error: authErrorText(res.error, '当前密码不正确') }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: authErrorText(e, '修改失败，请稍后重试') }
  }
}

export const AGREEMENT_TITLE = '用户协议与游戏须知'

export const AGREEMENT_BODY = `
<p><strong>一、性质说明</strong></p>
<p>《官途》是一款<strong>架空虚构</strong>的生涯模拟游戏。地名、人名、机构情节均为创作，不与现实人物、单位或事件一一对应，仅供娱乐与机制体验。</p>
<p><strong>二、制度呈现</strong></p>
<p>游戏中的职务层次、选拔程序、纪检监察等设定，参考公开的法律法规与制度框架做了<strong>玩法化压缩与简化</strong>，不能替代正式的政策解读或专业咨询。</p>
<p><strong>三、健康游戏</strong></p>
<p>请合理安排时间，适度游戏。建议未成年人在监护人指导下使用；本作含职场压力与廉政风险等主题，建议 18 岁以上玩家体验。</p>
<p><strong>四、账号与数据</strong></p>
<p>账号使用<strong>邮箱注册与登录</strong>，账号信息与生涯存档保存在<strong>云端服务</strong>，可在不同设备上登录同一账号继续游玩。本机浏览器仅保留登录凭据与一份离线缓存，用于断网时继续游玩与加快读取速度。请使用独立密码，不要与其他网站共用。玩家交流 QQ 群：<strong>1107570877</strong>。</p>
<p><strong>五、行为规范</strong></p>
<p>不得利用本作传播违法违规内容；不得对他人进行人身攻击。请勿尝试读取或修改他人的账号数据。<strong>昵称</strong>不得包含辱骂低俗、色情、赌博、诈骗、违禁品等内容，不得包含广告、联系方式或其他导流信息，不得冒用官方、管理员、客服等身份。违规昵称将被系统自动替换，屡次违规的账号可能被限制使用。</p>
<p><strong>六、知识产权</strong></p>
<p>本作原创文案、界面与规则受保护。欢迎个人学习与非商业分享；商业使用须获授权。</p>
<p><strong>七、免责</strong></p>
<p>在法律允许范围内，因使用本作产生的直接或间接损失，开发者不承担责任。继续使用即视为已阅读并同意本协议。</p>
`

export const GUIDE_STEPS: { title: string; text: string }[] = [
  {
    title: '你是谁',
    text: '从乡镇办事员起步，在政绩、关系、廉洁、民心、能力与风险之间取舍，目标可至中央最高层。职务层次参照《公务员法》，选拔走推荐→考察→公示→票决→任免。',
  },
  {
    title: '每月怎么过',
    text: '先处置本月事件（选做法）；再用行动点主动安排（下沉、写材料、联络、自查、跑项目、顾家等，每种还有子选项）；可点开右侧人物单独走动；底栏有「托人」办事页签；最后「进入下个月」。',
  },
  {
    title: '升迁与分支',
    text: '左栏「职务与职级」可启动选拔。路线包括地方主官、职级并行、纪检巡视、组织、宣传、政法公安、厅局→部委、国企交流。任期未满或处分影响期内不能提拔。',
  },
  {
    title: '红线与纪委',
    text: '风险过高会引来线索：谈话函询→初核→立案→处分。配合与不配合结果不同；严重者撤职开除。廉洁是纪检条线的硬门槛。',
  },
  {
    title: '选拔与通过率',
    text: '选拔每一步会显示「估算通过率」。策略不同加减不同；草率分高会拉低通过率。失败可复盘后重来。',
  },
  {
    title: '托人办事',
    text: '底栏「托人」可打听风声、请托过问、程序上说话，都要耗好感并进入冷却。高好感友人可能主动来访，可赴约或婉拒。',
  },
  {
    title: '存档与账号',
    text: '存档自动进行，不需要手动保存：每一次处置事件、行动、进入下个月之后都会立刻写入。本作有 6 个存档槽位。在正式云端账号下，图鉴、成就、出身通关等跨局记录也一并同步，换设备登录同一邮箱即可继续。离线运行时存档只写本机浏览器。设置中可导出 AES-GCM 加密备份。玩家交流 QQ 群：1107570877。',
  },
  {
    title: '新系统速览',
    text: '经营台：政策试点、课题列席、迎检自查。派系：交办与对家报复。关系页：指定心腹、收门生并交办。选拔票决前可会前沟通。图鉴收集给开局加成。家事页可定家庭侧重。各条线岗位不够条件时会提示原因，点开按钮就能看。',
  },
]
