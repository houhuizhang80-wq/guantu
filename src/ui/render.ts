import type { GameState, UiTab, DutyKind } from '../types'
import { getEvent, getEventText } from '../data/events'
import { getNpc, npcsVisibleAt } from '../data/npcs'
import { ORIGINS } from '../data/origins'
import { PROVINCES, getProvince, localizePlace, localizePostTitle } from '../data/provinces'
import { getPost, chapterOf, PROMO_LADDER } from '../data/posts'
import { ENDINGS } from '../data/endings'
import { originEpilogue } from '../data/origin_note'
import { originEndingLine } from '../data/origin_ending'
import { getVolume, isMuted } from './audio'
import { catalogCount, loadCatalog } from '../state/catalog'
import { allOriginsCleared, LEGACY_START } from '../data/legacy_start'
import { EVENTS } from '../data/events'
import { ACHIEVEMENTS } from '../data/achievements'
import { loadOriginsDone } from '../state/origins_done'
import { buildHelpSections } from '../data/help'
import { formatFx, prestige, riskLevel, dateLabel, originNetworkLine } from '../state/game'
import { SLOT_COUNT, readSlot, cloudSyncState } from '../state/saves'
import { availablePaths } from '../systems/promotion'
import { goalCurrent, goalDone, goalTargetText } from '../systems/goals'
import { factionName } from '../systems/faction'
import { bondRefs, isBond, PATRON_FAVOR } from '../systems/network'
import { DUTY_META, getDutyItem } from '../data/duties'
import { canStartDuty } from '../systems/duty'
import { CHANGELOG, latestVersion } from '../data/changelog'
import {
  yuqingOf,
  yuqingLevel,
  canHireSecretary,
  WEEK_PLAN_OPTS,
  RESEARCH_TOPICS,
} from '../systems/office'
import {
  canTanxin,
  canStartCampaign,
  canWriteMemoir,
  isMajorChief,
  memoirSummary,
  CAMPAIGNS,
} from '../systems/extra'
import { PROMO_STRATEGIES, stageBlurb, estimatePass } from '../data/promo_strategies'
import { computeScore, scoreLabel } from '../systems/score'
import { stageLabel } from '../systems/jijian'
import { meetsRequire } from '../systems/events'
import {
  AGREEMENT_BODY,
  GUIDE_STEPS,
  authEmail,
  authJoinAt,
  authNickname,
  authUser,
  getLastEmail,
} from '../state/auth'
import { isReleaseOrigin } from '../state/cloud'
import { checkNickname, NICK_MAX, NICK_MIN } from '../data/banned_words'
import { loadSyncedAchievements } from '../state/progress'
import {
  ACTIONS,
  NPC_ACTS,
  canDoAction,
  getAction,
  type ActionId,
  type NpcActId,
} from '../data/actions'

const ATTR_META = [
  { key: 'ZJ' as const, label: '政绩' },
  { key: 'GX' as const, label: '关系' },
  { key: 'Lian' as const, label: '廉洁' },
  { key: 'MX' as const, label: '民心' },
  { key: 'NL' as const, label: '能力' },
]

const KIND_LABEL: Record<string, string> = {
  main: '主线',
  daily: '日常',
  crisis: '危机',
  npc: '人脉',
  calm: '随记',
}

/**
 * 渲染是全量重建（root.innerHTML = ''），任何一次 draw 都会重置滚动位置。
 * 这里按 phase 记录：同一屏内（对局中点选项、行动、切页签）保持滚动位置，
 * 跨屏切换（标题 → 出身 → 对局）才回到顶部。
 */
let lastPhase: string | null = null
let lastScroll = { x: 0, y: 0 }

/**
 * 周计划的未提交选择放在模块级：全量重渲染（draw）后仍能回填下拉框，
 * 不会选到一半被清空。刻意不放进存档 flags —— 未提交的草稿没有持久化价值。
 */
let weekDraft: (string | null)[] = [null, null, null, null]

/** 周计划提交后清空草稿（main.ts 调用） */
export function resetWeekDraft() {
  weekDraft = [null, null, null, null]
}

export function renderApp(root: HTMLElement, s: GameState, handlers: AppHandlers) {
  const keepScroll = lastPhase === s.phase
  if (keepScroll) lastScroll = { x: window.scrollX, y: window.scrollY }
  lastPhase = s.phase
  root.innerHTML = ''
  if (s.phase === 'splash') renderSplash(root, handlers)
  else if (s.phase === 'agreement') renderAgreement(root, s, handlers)
  else if (s.phase === 'auth') renderAuth(root, s, handlers)
  else if (s.phase === 'guide') renderGuide(root, s, handlers)
  else if (s.phase === 'slots') renderSlots(root, handlers)
  else if (s.phase === 'title') renderTitle(root, s, handlers)
  else if (s.phase === 'origin') renderOrigin(root, handlers)
  else if (s.phase === 'province') renderProvince(root, handlers)
  else if (s.phase === 'ending') renderEnding(root, s, handlers)
  else renderPlay(root, s, handlers)
  // 这些弹层从「更多 / 设置」入口都能开，标题页同样有效（此前只在对局内挂载，
  // 导致标题页点「设置 / 制度说明」无响应）
  if (s.showSettings) mountSettings(root, s, handlers)
  if (s.showHelp) mountHelp(root, s, handlers)
  if (s.showTimeline) mountTimeline(root, s, handlers)
  if (s.showCatalog) mountCatalog(root, s, handlers)
  if (s.showFailLog) mountFailLog(root, s, handlers)
  if (keepScroll) window.scrollTo(lastScroll.x, lastScroll.y)
}

export interface AppHandlers {
  onSplashNext: () => void
  onAgree: () => void
  onDisagree: () => void
  /** 切换认证页内部步骤：signin | signin-code | signup | reset | home | nick | passwd */
  onAuthStage: (stage: string) => void
  /** 发送邮箱验证码，步骤由 flags.authStage 决定 */
  onSendCode: (email: string) => void
  onPasswordLogin: (email: string, password: string) => void
  onCodeLogin: (code: string) => void
  onSignupDone: (code: string, nickname: string, password: string) => void
  onResetDone: (code: string, newPassword: string) => void
  onSaveNickname: (nickname: string) => void
  onChangePassword: (oldPassword: string, newPassword: string) => void
  /** 已登录时从账号中心回到游戏 */
  onAuthContinue: () => void
  onAuthSkip: () => void
  onLogout: () => void
  onGuideStep: (delta: number) => void
  onGuideDone: () => void
  onGuideSkip: () => void
  onOpenAgreement: () => void
  onNewGame: () => void
  onContinue: () => void
  onPickOrigin: (id: string) => void
  onPickProvince: (id: string) => void
  onChoose: (index: number) => void
  onAdvanceMonth: () => void
  onSkipMonth: () => void
  onDucha: (choice: 'zicha' | 'yingjian' | 'tuotie') => void
  onTanxin: (npcId: string, style: 'guanxin' | 'tiduan' | 'yala') => void
  onStartCampaign: (id: string) => void
  onCampaignAct: (act: 'qin' | 'fen' | 'ya') => void
  onChild: (choice: 'benfen' | 'guanxi' | 'jiaoyu') => void
  onMemoir: (mode: 'shishi' | 'wenxue' | 'baomi') => void
  onAckDocument: () => void
  onRestart: () => void
  onDoAction: (id: ActionId) => void
  onActionVariant: (actionId: ActionId, variantId: string) => void
  onCancelAction: () => void
  onDismissFeedback: () => void
  onOpenNpc: (id: string) => void
  onCloseNpc: () => void
  onNpcAct: (npcId: string, act: NpcActId) => void
  onDismissMilestone: () => void
  onDismissSummary: () => void
  onDismissAppraisal: () => void
  onOpenAchievements: () => void
  onCloseAchievements: () => void
  onStartPromo: (toId: string) => void
  onAdvancePromo: (strategyId?: string) => void
  onCancelPromo: () => void
  onJijianChoice: (choice: 'peihe' | 'tuotie' | 'zhaoguanxi') => void
  onOpenGuide: () => void
  onOpenAuth: () => void
  onOpenSlots: () => void
  onOpenSettings: () => void
  onCloseSettings: () => void
  onPickSlot: (i: number) => void
  onDeleteSlot: (i: number) => void
  onExportSave: () => void
  onImportSave: (text: string) => void
  onToggleTimeline: () => void
  onFamilyCare: () => void
  onToggleHelp: () => void
  onShareCard: () => void
  onToggleMute: () => void
  onSetVolume: (v: number) => void
  onSetFont: (v: 'std' | 'large' | 'xlarge') => void
  onShowInfo: (title: string, text: string) => void
  onToggleCatalog: () => void
  onAskFavor: (npcId: string, kind: 'risk' | 'promo' | 'info') => void
  onBondLetter: (npcId: string) => void
  onPatronAssist: (npcId: string) => void
  onStartDuty: (kind: DutyKind) => void
  onDutyChoice: (choiceId: string) => void
  onDismissDuty: () => void
  onYuqing: (act: 'huiying' | 'caifang' | 'yazhi' | 'zhengmian') => void
  onHireSecretary: () => void
  onWeekPlan: (slots: (string | null)[]) => void
  onStartResearch: (topicId: string) => void
  onResearchDepth: (depth: 'guohua' | 'dun' | 'shuju') => void
  onRosterTag: (npcId: string, tag: string) => void
  onRecommend: (npcId: string) => void
  onUiTab: (tab: UiTab) => void
  onToggleTheme: () => void
  onVisit: (accept: boolean) => void
  onSetFocus: (id: 'zj' | 'mx' | 'lian' | 'gx' | null) => void
  onResolveBurst: (idx: number) => void
  onProjectChoice: (mode: 'public' | 'quiet') => void
  onJoinFaction: (target: string) => void
  onFactionAct: (kind: 'loyal' | 'low' | 'sabotage') => void
  onResolveVote: (choice: 'yes' | 'no' | 'abstain') => void
  onResolveSecCase: (choice: 'jiege' | 'baoquan' | 'baogao') => void
  onShowFailLog: () => void
  onCatalogStage: (id: string) => void
  onRetiredAct: (kind: 'consult' | 'memoir' | 'settle') => void
  onCatalogOrigin: (id: string) => void
  onCatalogFlavor: (id: string) => void
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/* ── 界面字号（设置面板切换，应用于 <html data-font>） ─────────────── */

export type FontSize = 'std' | 'large' | 'xlarge'
const FONT_KEY = 'guantu_font_v1'

export function getFontSize(): FontSize {
  const v = localStorage.getItem(FONT_KEY)
  return v === 'large' || v === 'xlarge' ? v : 'std'
}

export function applyFontSize(v: FontSize) {
  localStorage.setItem(FONT_KEY, v)
  const html = document.documentElement
  if (v === 'std') delete html.dataset.font
  else html.dataset.font = v
}

const FONT_LABEL: Record<FontSize, string> = { std: '标准', large: '大', xlarge: '特大' }

function nextFontSize(v: FontSize): FontSize {
  return v === 'std' ? 'large' : v === 'large' ? 'xlarge' : 'std'
}

function riskClass(risk: number) {
  if (risk >= 70) return 'is-critical'
  if (risk >= 40) return 'is-warn'
  return 'is-ok'
}

function favorClass(f: number) {
  if (f >= 40) return 'fav-hi'
  if (f <= -10) return 'fav-lo'
  return ''
}

/** 密码强度 0–4，用于注册与改密时的强度条 */
function passLevel(p: string): number {
  if (!p) return 0
  let lv = 0
  if (p.length >= 6) lv++
  if (p.length >= 10) lv++
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) lv++
  if (/[^a-zA-Z0-9]/.test(p)) lv++
  return Math.min(lv, 4)
}

/** 标题页提示语。minRank：仅在该职务层次（rank）及以上出现，避免给基层玩家看中央口径。 */
const TIPS: { text: string; minRank?: number }[] = [
  { text: '廉洁是底线，也是纪检条线的硬门槛。' },
  { text: '任期未满也能提拔，但票决会更难。' },
  { text: '连续点同一选项会累积草率分。' },
  { text: '出身与省份会改变关系网与部分事件。' },
  { text: '托人办事要耗好感，别乱用。' },
  { text: '事件不显示数值影响，拿不准就选稳妥的那条。' },
  { text: '深度公务每月各限一次，全年质量计入年度考核。' },
  { text: '周计划月末结算，不排会吃草率分。' },
  { text: '联络员能盯舆情、加批示质量，副科就能物色。' },
  { text: '项目攻坚跨数月，挂帅前先看本月行动点。' },
  { text: '督查暗访随机到来，提前自查能省很多麻烦。' },
  { text: '名册推荐每年 2 次，优先推给好感 40 以上的人。' },
  { text: '谈心谈话每月 1 次，「点出问题」涨廉洁降风险。' },
  { text: '快进荒政会同时抬草率分、降政绩、抬风险。' },
  { text: '羁绊好感 80 即关键靠山，铺路效果持续 12 个月。', minRank: 6 },
  { text: '县处以后，年龄红线比能力更早卡住晋升。', minRank: 6 },
  { text: '厅局往上，条线对口的履历比全面更重要。', minRank: 12 },
  { text: '省部级以后，届中调整的票决门槛会显著抬高。', minRank: 15 },
  { text: '进入中央后，站队的报复往往等在下一个节点。', minRank: 15 },
  { text: '到龄退休前可以选顾问调研，把余热换成收束加分。', minRank: 15 },
]

function renderSplash(root: HTMLElement, h: AppHandlers) {
  const wrap = el('div', 'screen title-screen splash-screen')
  wrap.innerHTML = `
    <div class="paper title-card splash-card">
      <div class="splash-seal" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="88" height="88">
          <circle cx="60" cy="60" r="56" fill="none" stroke="#c23b2a" stroke-width="3.5"/>
          <circle cx="60" cy="60" r="46" fill="none" stroke="#c23b2a" stroke-width="1"/>
          <path d="M60 34 L68 51 L86 54 L73 66 L77 84 L60 75 L43 84 L47 66 L34 54 L52 51 Z" fill="#c23b2a"/>
        </svg>
      </div>
      <div class="title-kicker">架空生涯模拟 · V1</div>
      <h1 class="splash-title">官途</h1>
      <div class="title-rule"></div>
      <p class="title-sub">从乡镇到中央。<br/>一步一份调令。</p>
      <div class="splash-meta">
        <span>《公务员法》职务层次</span>
        <span>16 出身 · 30 省</span>
        <span>选拔五步程序</span>
      </div>
      <p class="title-note">作品纯属虚构 · 仅供娱乐</p>
      <div class="title-actions">
        <button class="btn btn-primary splash-enter" data-act="enter">进入游戏</button>
      </div>
    </div>
  `
  root.append(wrap)
  wrap.querySelector('[data-act="enter"]')!.addEventListener('click', h.onSplashNext)
}

function renderAgreement(root: HTMLElement, s: GameState, h: AppHandlers) {
  const wrap = el('div', 'screen')
  const card = el('div', 'paper agreement-card')
  card.innerHTML = `
    <div class="paper-tab">须先阅读</div>
    <h2 class="screen-title">用户协议与游戏须知</h2>
    <div class="agreement-body">${AGREEMENT_BODY}</div>
    <label class="agree-check">
      <input type="checkbox" id="agree-box" />
      <span>我已阅读并同意《用户协议与游戏须知》</span>
    </label>
    ${
      s.lastFeedback
        ? `<div class="auth-alert"><span class="auth-alert-icon" aria-hidden="true">!</span><span class="auth-alert-text">${s.lastFeedback.text}</span></div>`
        : ''
    }
    <div class="title-actions">
      <button class="btn btn-primary" data-act="ok" disabled>同意并继续</button>
      <button class="btn" data-act="no">不同意</button>
    </div>
  `
  wrap.append(card)
  root.append(wrap)
  const box = card.querySelector<HTMLInputElement>('#agree-box')!
  const ok = card.querySelector<HTMLButtonElement>('[data-act="ok"]')!
  box.addEventListener('change', () => {
    ok.disabled = !box.checked
  })
  ok.addEventListener('click', h.onAgree)
  card.querySelector('[data-act="no"]')!.addEventListener('click', h.onDisagree)
}

function renderAuth(root: HTMLElement, s: GameState, h: AppHandlers) {
  const wrap = el('div', 'screen')
  const card = el('div', 'paper auth-card')
  wrap.append(card)
  root.append(wrap)

  const esc = (v: unknown) =>
    String(v ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
    )
  const EYE = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.7 5.4 12 5.4 22.5 12 22.5 12 18.3 18.6 12 18.6 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.1"/><path class="auth-eye-slash" d="M3.5 20.5 20.5 3.5"/></svg>`

  /** 邮箱打码：界面上不完整暴露地址 */
  const maskedOf = (v: string) => {
    const e = v.trim()
    const at = e.indexOf('@')
    if (at <= 0) return e
    const name = e.slice(0, at)
    const head = name.slice(0, Math.min(2, name.length))
    return `${head}${'*'.repeat(Math.max(1, name.length - head.length))}${e.slice(at)}`
  }

  function showAuthErr(msg: string) {
    const box = card.querySelector<HTMLElement>('#auth-err')
    const txt = card.querySelector<HTMLElement>('.auth-alert-text')
    if (!box || !txt) return
    txt.textContent = msg
    box.hidden = false
    box.style.animation = 'none'
    void box.offsetWidth
    box.style.animation = ''
  }

  const wireEye = () => {
    card.querySelectorAll<HTMLButtonElement>('.auth-eye').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = card.querySelector<HTMLInputElement>('#' + btn.dataset.eye)
        if (!input) return
        const show = input.type === 'password'
        input.type = show ? 'text' : 'password'
        btn.classList.toggle('on', show)
        const label = show ? '隐藏密码' : '显示密码'
        btn.setAttribute('aria-label', label)
        btn.setAttribute('title', label)
        input.focus()
      })
    })
  }

  const wireGoto = () => {
    card.querySelectorAll<HTMLElement>('[data-goto]').forEach((b) => {
      b.addEventListener('click', () => h.onAuthStage(b.dataset.goto!))
    })
  }

  const alertHtml = (text: string) => `
    <div class="auth-alert" id="auth-err">
      <span class="auth-alert-icon" aria-hidden="true">!</span>
      <span class="auth-alert-text">${esc(text)}</span>
    </div>`

  /* ── 非正式站点：云账号不可用 ──────────────────────── */
  if (!isReleaseOrigin()) {
    card.innerHTML = `
      <div class="paper-tab">本机离线运行</div>
      <h2 class="screen-title">离线可玩</h2>
      <p class="auth-lead">当前环境无法使用云端账号，生涯存档会保存在这台设备的浏览器里。</p>
      <dl class="auth-meta">
        <div><dt>玩家交流</dt><dd><strong>QQ 群 1107570877</strong></dd></div>
        <div><dt>存档位置</dt><dd>仅本机浏览器</dd></div>
        <div><dt>存档槽位</dt><dd>${SLOT_COUNT} 个</dd></div>
        <div><dt>导出备份</dt><dd>AES-GCM 加密 .guantu</dd></div>
      </dl>
      <p class="auth-note">清空浏览器站点数据会丢失本机存档。重要进度请在设置中导出加密备份。欢迎加入 QQ 群交流玩法与反馈问题。</p>
      <div class="auth-actions">
        <button class="btn btn-primary" data-act="offline" type="button">进入游戏（离线）</button>
      </div>
      <div class="auth-foot">
        <button class="btn btn-ghost" data-act="changelog" type="button">更新日志</button>
        <button class="btn btn-ghost" data-act="qq" type="button">玩家交流群</button>
      </div>
    `
    card.querySelector('[data-act="offline"]')?.addEventListener('click', h.onAuthSkip)
    card
      .querySelector('[data-act="changelog"]')
      ?.addEventListener('click', () => mountChangelog(root))
    card.querySelector('[data-act="qq"]')?.addEventListener('click', () => mountQqGroup(root))
    return
  }

  /* ── 已登录：账号中心 ──────────────────────────────── */
  if (authUser()) {
    const nick = authNickname()
    const joined = authJoinAt()
    const d = joined ? new Date(joined) : null
    const joinedText =
      d && !Number.isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : '—'
    const stage = String(s.flags.authStage || 'home')
    const busy = s.flags.authBusy === true
    const busyAttr = busy ? 'disabled' : ''

    let body = ''
    if (stage === 'nick') {
      body = `
        <form class="auth-form" data-role="nick" novalidate>
          <div class="auth-field">
            <label for="nn">新昵称</label>
            <div class="auth-input">
              <input id="nn" maxlength="${NICK_MAX}" value="${esc(nick)}" placeholder="${NICK_MIN}–${NICK_MAX} 个字符" />
            </div>
            <p class="auth-hint">昵称只用于界面展示，数据权限由账号本身决定。不得含违规词、广告、联系方式，也不能冒用官方身份。</p>
          </div>
          <div class="auth-actions">
            <button class="btn btn-primary" data-act="save-nick" type="submit" ${busyAttr}>${busy ? '保存中…' : '保存昵称'}</button>
            <button class="btn btn-ghost" data-goto="home" type="button">返回</button>
          </div>
        </form>`
    } else if (stage === 'passwd') {
      body = `
        <form class="auth-form" data-role="pwd" novalidate>
          <div class="auth-field">
            <label for="op">当前密码</label>
            <div class="auth-input">
              <input id="op" type="password" autocomplete="current-password" placeholder="当前使用的密码" />
              <button class="auth-eye" type="button" data-eye="op" aria-label="显示密码" title="显示密码">${EYE}</button>
            </div>
          </div>
          <div class="auth-field">
            <label for="np">新密码</label>
            <div class="auth-input">
              <input id="np" type="password" autocomplete="new-password" placeholder="至少 6 位" />
              <button class="auth-eye" type="button" data-eye="np" aria-label="显示密码" title="显示密码">${EYE}</button>
            </div>
            <div class="auth-strength" data-lv="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="auth-field">
            <label for="np2">确认新密码</label>
            <div class="auth-input">
              <input id="np2" type="password" autocomplete="new-password" placeholder="再输入一次" />
            </div>
          </div>
          <div class="auth-actions">
            <button class="btn btn-primary" data-act="save-pwd" type="submit" ${busyAttr}>${busy ? '提交中…' : '更新密码'}</button>
            <button class="btn btn-ghost" data-goto="home" type="button">返回</button>
          </div>
        </form>
        <p class="auth-note">忘记当前密码时，请退出登录后在登录页用「忘记密码」，凭邮箱验证码重设。</p>`
    } else {
      body = `
        <div class="auth-actions">
          <button class="btn btn-primary" data-act="next" type="button">继续游戏</button>
          <button class="btn" data-goto="nick" type="button">修改昵称</button>
          <button class="btn" data-goto="passwd" type="button">修改密码</button>
          <button class="btn btn-ghost" data-act="logout" type="button">退出登录</button>
        </div>`
    }

    card.innerHTML = `
      <div class="paper-tab">云账号</div>
      <h2 class="screen-title">账号中心</h2>
      <div class="auth-profile">
        <div class="auth-avatar" aria-hidden="true">${esc(nick.trim().charAt(0) || '官')}</div>
        <div class="auth-profile-main">
          <strong>${esc(nick)}</strong>
          <span class="auth-profile-name">${esc(maskedOf(authEmail()))}</span>
          <span class="auth-badge">云账号</span>
        </div>
      </div>
      <dl class="auth-meta">
        <div><dt>注册时间</dt><dd>${joinedText}</dd></div>
        <div><dt>数据位置</dt><dd>云端 · 本机缓存</dd></div>
        <div><dt>存档槽位</dt><dd>${SLOT_COUNT} 个</dd></div>
        <div><dt>图鉴 / 出身</dt><dd>${catalogCount()} 项 · ${loadOriginsDone().length}/${ORIGINS.length}</dd></div>
      </dl>
      ${body}
      ${s.lastFeedback ? alertHtml(s.lastFeedback.text) : ''}
      <p class="auth-note">账号信息与生涯存档保存在云端服务，换设备用同一邮箱登录即可继续。本机保留一份离线缓存：断网也能玩，恢复网络后自动同步。玩家交流 QQ 群：1107570877。</p>
    `
    wireEye()
    wireGoto()
    card.querySelector('[data-act="next"]')?.addEventListener('click', h.onAuthContinue)
    card.querySelector('[data-act="logout"]')?.addEventListener('click', h.onLogout)
    card.querySelector<HTMLFormElement>('form[data-role="nick"]')?.addEventListener('submit', (e) => {
      e.preventDefault()
      const v = card.querySelector<HTMLInputElement>('#nn')?.value.trim() ?? ''
      const chk = checkNickname(v)
      if (!chk.ok) return showAuthErr(chk.reason || '昵称不合规，请换一个')
      h.onSaveNickname(v)
    })
    const np = card.querySelector<HTMLInputElement>('#np')
    const strength = card.querySelector<HTMLElement>('.auth-strength')
    np?.addEventListener('input', () => {
      if (strength) strength.dataset.lv = String(passLevel(np.value))
    })
    card.querySelector<HTMLFormElement>('form[data-role="pwd"]')?.addEventListener('submit', (e) => {
      e.preventDefault()
      const o = card.querySelector<HTMLInputElement>('#op')?.value ?? ''
      const n = card.querySelector<HTMLInputElement>('#np')?.value ?? ''
      const n2 = card.querySelector<HTMLInputElement>('#np2')?.value ?? ''
      if (!o) return showAuthErr('请输入当前密码')
      if (n.length < 6) return showAuthErr('新密码至少 6 位')
      if (n !== n2) return showAuthErr('两次输入的新密码不一致')
      h.onChangePassword(o, n)
    })
    return
  }

  /* ── 未登录：登录 / 注册 / 重置密码 ────────────────── */
  const rawStage = String(s.flags.authStage || 'signin')
  const stage: 'signin' | 'signin-code' | 'signup' | 'reset' =
    rawStage === 'signup' || rawStage === 'signin-code' || rawStage === 'reset' ? rawStage : 'signin'
  const busy = s.flags.authBusy === true
  const codeSent = s.flags.authCodeSent === true
  const busyAttr = busy ? 'disabled' : ''
  const lastEmail = getLastEmail()
  const sentTo = String(s.flags.authEmail || lastEmail || '')

  const emailField = (id: string) => `
    <div class="auth-field">
      <label for="${id}">邮箱</label>
      <div class="auth-input">
        <input id="${id}" type="email" inputmode="email" autocomplete="email" maxlength="120" value="${esc(lastEmail)}" placeholder="you@example.com" />
      </div>
    </div>`

  const codeField = (id: string) => `
    <div class="auth-field">
      <label for="${id}">邮箱验证码 <span class="auth-opt">已发往 ${esc(maskedOf(sentTo))}</span></label>
      <div class="auth-input">
        <input id="${id}" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="输入邮件中的验证码" />
      </div>
    </div>`

  const passField = (id: string, label: string, ac: string, note?: string) => `
    <div class="auth-field">
      <label for="${id}">${label}</label>
      <div class="auth-input">
        <input id="${id}" type="password" autocomplete="${ac}" placeholder="至少 6 位" />
        <button class="auth-eye" type="button" data-eye="${id}" aria-label="显示密码" title="显示密码">${EYE}</button>
      </div>
      ${note ? `<p class="auth-hint">${esc(note)}</p>` : ''}
    </div>`

  const sendBtn = (act: string) =>
    `<button class="btn btn-primary btn-block" data-act="${act}" type="button" ${busyAttr}>${busy ? '发送中…' : '发送验证码'}</button>`

  const againRow = () =>
    `<div class="auth-switch"><button class="auth-link" data-act="resend" type="button" ${busyAttr}>没收到？重新发送</button></div>`

  let pane = ''
  let title = '登录'
  if (stage === 'signup') {
    title = '注册'
    pane = codeSent
      ? `
        ${codeField('sc')}
        <div class="auth-field">
          <label for="sn">昵称 <span class="auth-opt">展示用</span></label>
          <div class="auth-input"><input id="sn" maxlength="${NICK_MAX}" placeholder="${NICK_MIN}–${NICK_MAX} 个字符，可用中文" /></div>
          <p class="auth-hint">昵称不得含违规词、广告、联系方式，也不能冒用官方身份。</p>
        </div>
        ${passField('sp', '设置密码', 'new-password', '请使用独立密码，不要与其他网站共用')}
        ${passField('sp2', '确认密码', 'new-password')}
        <button class="btn btn-primary btn-block" data-act="signup-done" type="submit" ${busyAttr}>${busy ? '提交中…' : '完成注册'}</button>
        ${againRow()}
      `
      : `
        ${emailField('se')}
        ${sendBtn('send-signup')}
        <p class="auth-hint">注册需要邮箱验证：我们会向这个邮箱发送一封验证码邮件。</p>
      `
  } else if (stage === 'reset') {
    title = '重置密码'
    pane = codeSent
      ? `
        ${codeField('rc')}
        ${passField('rp', '新密码', 'new-password')}
        ${passField('rp2', '确认新密码', 'new-password')}
        <button class="btn btn-primary btn-block" data-act="reset-done" type="submit" ${busyAttr}>${busy ? '提交中…' : '重置并登录'}</button>
        ${againRow()}
      `
      : `
        ${emailField('re')}
        ${sendBtn('send-reset')}
        <p class="auth-hint">重设密码需要邮箱验证。</p>
      `
  } else if (stage === 'signin-code') {
    pane = codeSent
      ? `
        ${codeField('lc')}
        <button class="btn btn-primary btn-block" data-act="code-login" type="submit" ${busyAttr}>${busy ? '登录中…' : '登录'}</button>
        ${againRow()}
        <div class="auth-switch"><button class="auth-link" data-goto="signin" type="button">改用密码登录</button></div>
      `
      : `
        ${emailField('le')}
        ${sendBtn('send-login')}
        <div class="auth-switch"><button class="auth-link" data-goto="signin" type="button">改用密码登录</button></div>
      `
  } else {
    pane = `
      ${emailField('pe')}
      ${passField('pp', '密码', 'current-password')}
      <label class="auth-remember">
        <input type="checkbox" id="prem" ${lastEmail ? 'checked' : ''} />
        <span>记住邮箱</span>
      </label>
      <button class="btn btn-primary btn-block" data-act="pwd-login" type="submit" ${busyAttr}>${busy ? '登录中…' : '登录'}</button>
      <div class="auth-switch">
        <button class="auth-link" data-goto="signin-code" type="button">用邮箱验证码登录</button>
        <button class="auth-link" data-goto="reset" type="button">忘记密码</button>
      </div>
    `
  }

  card.innerHTML = `
    <div class="paper-tab">云账号</div>
    <h2 class="screen-title">${title}</h2>
    <p class="auth-lead">账号与生涯存档保存在云服务，换设备用同一邮箱登录即可继续。</p>
    <div class="auth-seg" data-active="${stage === 'signup' ? 'reg' : 'login'}">
      <span class="auth-seg-thumb" aria-hidden="true"></span>
      <button class="auth-tab ${stage === 'signup' ? '' : 'active'}" data-goto="signin" type="button" aria-selected="${stage === 'signup' ? 'false' : 'true'}">登录</button>
      <button class="auth-tab ${stage === 'signup' ? 'active' : ''}" data-goto="signup" type="button" aria-selected="${stage === 'signup' ? 'true' : 'false'}">注册</button>
    </div>
    <form class="auth-form" data-stage="${stage}" novalidate>${pane}</form>
    ${s.lastFeedback && s.phase === 'auth' ? alertHtml(s.lastFeedback.text) : '<div class="auth-alert" id="auth-err" hidden><span class="auth-alert-icon" aria-hidden="true">!</span><span class="auth-alert-text"></span></div>'}
    <div class="auth-foot">
      <button class="btn btn-ghost" data-act="changelog" type="button">更新日志</button>
      <button class="btn btn-ghost" data-act="qq" type="button">玩家交流群</button>
    </div>
  `
  wireEye()
  wireGoto()

  // 玩家 QQ 群：首次进入登录页自动弹一次（记住不再打扰），页脚常驻入口可随时再开
  card.querySelector('[data-act="changelog"]')?.addEventListener('click', () =>
    mountChangelog(root),
  )
  card.querySelector('[data-act="qq"]')?.addEventListener('click', () => mountQqGroup(root))
  if (!localStorage.getItem('guantu_qqpop_v1')) {
    localStorage.setItem('guantu_qqpop_v1', '1')
    mountQqGroup(root)
  }

  const val = (id: string) => card.querySelector<HTMLInputElement>('#' + id)?.value.trim() ?? ''
  const raw = (id: string) => card.querySelector<HTMLInputElement>('#' + id)?.value ?? ''

  card.querySelector('[data-act="send-login"]')?.addEventListener('click', () => h.onSendCode(val('le')))
  card.querySelector('[data-act="send-signup"]')?.addEventListener('click', () => h.onSendCode(val('se')))
  card.querySelector('[data-act="send-reset"]')?.addEventListener('click', () => h.onSendCode(val('re')))
  card.querySelector('[data-act="resend"]')?.addEventListener('click', () => h.onSendCode(sentTo))

  card.querySelector<HTMLFormElement>('form[data-stage]')?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (stage === 'signup') {
      const nick = val('sn')
      const nickCheck = checkNickname(nick)
      if (!nickCheck.ok) {
        showAuthErr(nickCheck.reason || '昵称不合规，请换一个')
        return
      }
      if (raw('sp') !== raw('sp2')) {
        showAuthErr('两次输入的密码不一致')
        return
      }
      h.onSignupDone(val('sc'), nick, raw('sp'))
      return
    }
    if (stage === 'reset') {
      h.onResetDone(val('rc'), raw('rp'))
      return
    }
    if (stage === 'signin-code') {
      h.onCodeLogin(val('lc'))
      return
    }
    h.onPasswordLogin(val('pe'), raw('pp'))
  })

  const focusId = codeSent
    ? stage === 'signup'
      ? '#sc'
      : stage === 'reset'
        ? '#rc'
        : '#lc'
    : stage === 'signup'
      ? '#se'
      : stage === 'reset'
        ? '#re'
        : stage === 'signin-code'
          ? '#le'
          : lastEmail
            ? '#pp'
            : '#pe'
  card.querySelector<HTMLInputElement>(focusId)?.focus()
}

function renderGuide(root: HTMLElement, s: GameState, h: AppHandlers) {
  const idx = (s.flags.guideStep as number) || 0
  const step = GUIDE_STEPS[Math.min(idx, GUIDE_STEPS.length - 1)]
  const wrap = el('div', 'screen')
  const card = el('div', 'paper guide-card')
  card.innerHTML = `
    <div class="paper-tab">新手引导 ${idx + 1}/${GUIDE_STEPS.length}</div>
    <h2 class="screen-title">${step.title}</h2>
    <p class="guide-text">${step.text}</p>
    <div class="guide-dots">
      ${GUIDE_STEPS.map((_, i) => `<i class="${i === idx ? 'on' : i < idx ? 'done' : ''}"></i>`).join('')}
    </div>
    <div class="title-actions">
      ${idx > 0 ? '<button class="btn" data-act="prev">上一步</button>' : ''}
      <button class="btn btn-primary" data-act="next">${idx === GUIDE_STEPS.length - 1 ? '开始游戏' : '下一步'}</button>
      <button class="btn btn-ghost" data-act="skip">跳过引导</button>
    </div>
  `
  wrap.append(card)
  root.append(wrap)
  card.querySelector('[data-act="prev"]')?.addEventListener('click', () => h.onGuideStep(-1))
  card.querySelector('[data-act="next"]')!.addEventListener('click', () => h.onGuideStep(1))
  card.querySelector('[data-act="skip"]')!.addEventListener('click', h.onGuideSkip)
}

function renderSlots(root: HTMLElement, h: AppHandlers) {
  const wrap = el('div', 'screen')
  const card = el('div', 'paper slots-card')
  let html = `
    <div class="paper-tab">生涯存档</div>
    <h2 class="screen-title">选择槽位</h2>
    <p class="muted origin-lead">共 ${SLOT_COUNT} 个槽位，${authUser() ? '已与云账号同步，换设备登录同一邮箱即可继续' : '本机离线运行，存档仅存在这台设备'}。空槽位将开始新生涯。</p>
  `
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s = readSlot(i)
    html += `
      <div class="slot-row">
        <div class="slot-info">
          <strong>槽位 ${i + 1}</strong>
          <span>${s ? `${s.flags?.originName || '—'} · ${s.year}.${String(s.month).padStart(2, '0')} · ${getPost(s.postId).levelShort}` : '空'}</span>
        </div>
        <div class="slot-acts">
          <button class="btn btn-primary" data-slot="${i}">${s ? '继续' : '新开始'}</button>
          ${s ? `<button class="btn btn-ghost" data-del="${i}">删除</button>` : ''}
        </div>
      </div>
    `
  }
  html += `<div class="title-actions"><button class="btn" data-act="back">返回标题</button></div>`
  card.innerHTML = html
  wrap.append(card)
  root.append(wrap)
  card.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach((b) => {
    b.addEventListener('click', () => h.onPickSlot(Number(b.dataset.slot)))
  })
  card.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) => {
    b.addEventListener('click', () => h.onDeleteSlot(Number(b.dataset.del)))
  })
  card.querySelector('[data-act="back"]')!.addEventListener('click', () => {
    h.onCloseSettings()
  })
}

function renderTitle(root: HTMLElement, s: GameState, h: AppHandlers) {
  const nick = authUser() ? authNickname() : '本机离线运行'
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => readSlot(i)).filter(Boolean)
  const latest = slots.sort((a, b) => (b?.turn ?? 0) - (a?.turn ?? 0))[0]
  // 提示语按最近存档所处职务层次筛选 —— 标题页 state 本身停在开局岗位
  const tipRank = latest ? getPost(latest.postId).rank : 0
  const pool = TIPS.filter((t) => !t.minRank || tipRank >= t.minRank)
  const tip = pool[Math.floor(Math.random() * pool.length)].text
  let savePreview = ''
  if (latest) {
    const op = getProvince(latest.provinceId)
    savePreview = `
      <div class="save-preview">
        <strong>最近存档</strong>
        <span>${String(latest.flags?.originName || '—')} · ${op.name} · ${latest.year}.${String(latest.month).padStart(2, '0')}</span>
        <span>${localizePostTitle(getPost(latest.postId).title, latest.provinceId)}</span>
        <span>第 ${latest.turn} 个月 · 风险 ${Math.round(latest.risk)}</span>
      </div>`
  }
  const wrap = el('div', 'screen title-screen')
  wrap.innerHTML = `
    <div class="paper title-card">
      <div class="paper-tab">起点 · ${getProvince(s.provinceId).places.county}${getProvince(s.provinceId).places.town}</div>
      <div class="title-top">
        <span class="title-kicker">从乡镇到中央 · 架空生涯模拟</span>
        <span class="title-user">${nick}</span>
      </div>
      <h1>官途</h1>
      <div class="title-rule"></div>
      <p class="title-sub">从基层办事员起步，一路走到中央最高层。<br/>政绩、关系、廉洁、民心、能力——每一项都要还。</p>
      <div class="title-meta">
        <span>五维经营</span>
        <span>职务层次</span>
        <span>红头调令</span>
        <span>多结局</span>
        <span>事件图鉴 ${catalogCount()}</span>
        <span>出身通关 ${loadOriginsDone().length}/16</span>
      </div>
      ${savePreview}
      <p class="title-tip">今日提示：${tip}</p>
      <p class="title-note">作品纯属虚构 · 职务层次参照《公务员法》 · v0.9</p>
      <div class="title-actions">
        <button class="btn btn-primary" data-act="cont">存档槽位</button>
        <button class="btn" data-act="new">新的生涯</button>
        <button class="btn btn-ghost" data-act="help">制度说明</button>
        <button class="btn btn-ghost" data-act="guide">玩法引导</button>
        <button class="btn btn-ghost" data-act="agree">协议须知</button>
        <button class="btn btn-ghost" data-act="auth">账号</button>
        <button class="btn btn-ghost" data-act="settings">设置</button>
        <button class="btn btn-ghost" data-act="qq">交流群</button>
      </div>
    </div>
  `
  root.append(wrap)
  wrap.querySelector('[data-act="new"]')!.addEventListener('click', h.onNewGame)
  wrap.querySelector('[data-act="cont"]')?.addEventListener('click', h.onOpenSlots)
  wrap.querySelector('[data-act="help"]')!.addEventListener('click', h.onToggleHelp)
  wrap.querySelector('[data-act="guide"]')!.addEventListener('click', h.onOpenGuide)
  wrap.querySelector('[data-act="agree"]')!.addEventListener('click', h.onOpenAgreement)
  wrap.querySelector('[data-act="auth"]')!.addEventListener('click', h.onOpenAuth)
  wrap.querySelector('[data-act="settings"]')!.addEventListener('click', h.onOpenSettings)
  wrap.querySelector('[data-act="qq"]')?.addEventListener('click', () => mountQqGroup(root))
}

function renderOrigin(root: HTMLElement, h: AppHandlers) {
  const wrap = el('div', 'screen')
  const list = el('div', 'paper origin-list origin-grid-wrap')
  list.innerHTML = `
    <div class="paper-tab">干部履历 · 入仕出身</div>
    <h2 class="screen-title">选择出身</h2>
    <p class="muted origin-lead">入仕途径决定初始五维、风险、路径标记，以及<strong>开局关系网</strong>（谁认你、谁盯你、谁躲你）。</p>
  `
  const grid = el('div', 'origin-grid')
  if (allOriginsCleared()) {
    const legacy = el('button', 'origin-card origin-legacy')
    legacy.type = 'button'
    legacy.innerHTML = `
      <div class="origin-tag">${LEGACY_START.tag}</div>
      <div class="origin-name">${LEGACY_START.name}</div>
      <div class="origin-desc">${LEGACY_START.desc}</div>
      <div class="origin-net">效果：开局关系与五维小幅加成</div>
    `
    legacy.addEventListener('click', () => h.onPickOrigin('legacy'))
    grid.append(legacy)
  }
  for (const o of ORIGINS) {
    const card = el('button', 'origin-card')
    card.type = 'button'
    const net = originNetworkLine(o.id)
    card.innerHTML = `
      <div class="origin-tag">${o.tag}</div>
      <div class="origin-name">${o.name}</div>
      <div class="origin-desc">${o.desc}</div>
      <div class="origin-net">关系：${net}</div>
      <div class="origin-fx">${formatFx(o.fx)}</div>
    `
    card.addEventListener('click', () => h.onPickOrigin(o.id))
    grid.append(card)
  }
  list.append(grid)
  wrap.append(list)
  root.append(wrap)
}

function renderProvince(root: HTMLElement, h: AppHandlers) {
  const wrap = el('div', 'screen')
  const list = el('div', 'paper origin-list origin-grid-wrap')
  list.innerHTML = `
    <div class="paper-tab">履历地 · 架空省份</div>
    <h2 class="screen-title">选择省份</h2>
    <p class="muted origin-lead">地名均为架空（谐音/改名）。省份气质会微调初始属性；市·县·镇将替换全文地名。</p>
  `
  const grid = el('div', 'origin-grid')
  for (const p of PROVINCES) {
    const card = el('button', 'origin-card')
    card.type = 'button'
    card.innerHTML = `
      <div class="origin-tag">${p.tag}</div>
      <div class="origin-name">${p.name}</div>
      <div class="origin-desc">${p.intro}</div>
      <div class="origin-net">样例：${p.places.city} · ${p.places.county} · ${p.places.town}</div>
    `
    card.addEventListener('click', () => h.onPickProvince(p.id))
    grid.append(card)
  }
  list.append(grid)
  wrap.append(list)
  root.append(wrap)
}

function renderPlay(root: HTMLElement, s: GameState, h: AppHandlers) {
  const post = getPost(s.postId)
  const postTitle = localizePostTitle(post.title, s.provinceId)
  const prov = getProvince(s.provinceId)
  const L = (t: string) => localizePlace(t, s.provinceId)
  const shell = el('div', 'shell')

  // 存档是全自动的，顶栏这个标识只在异常时才需要玩家注意
  const sync = cloudSyncState()
  const syncNote =
    sync === 'offline'
      ? '离线运行'
      : sync === 'pending'
        ? '存档中…'
        : sync === 'error'
          ? '待同步'
          : '自动存档'
  const syncTitle =
    sync === 'error'
      ? '有存档还没同步到云端，恢复网络后会自动补传'
      : sync === 'offline'
        ? '本机离线运行：存档只写在这台设备'
        : '每次操作后存档已自动写入云账号'
  const syncCls = sync === 'error' ? ' is-warn' : ''

  // ── 顶栏：身份条 ──────────────────────────────
  const header = el('header', 'topbar')
  header.innerHTML = `
    <div class="top-brand">
      <span class="brand">官途</span>
      <span class="chip chip-chapter">${chapterOf(s.postId)} · ${prov.short}</span>
    </div>
    <div class="top-identity">
      <div class="top-date">${dateLabel(s)}</div>
      <div class="top-post" title="${post.level}">${postTitle}</div>
      <div class="top-level">${post.levelShort} · ${post.level}${post.level === '股级（内设）' ? ' · 内设负责人' : ''} · <strong>${s.age} 岁</strong></div>
    </div>
    <div class="top-stats">
      <div class="top-stat ${riskClass(s.risk)}">
        <span class="top-stat-label">风险</span>
        <span class="top-stat-val">${Math.round(s.risk)}</span>
        <span class="top-stat-sub">${riskLevel(s.risk)}</span>
      </div>
      <div class="top-stat">
        <span class="top-stat-label">威望</span>
        <span class="top-stat-val">${prestige(s)}</span>
      </div>
      <div class="top-stat${s.actionPoints > 0 ? ' is-ok' : ''}">
        <span class="top-stat-label">行动点</span>
        <span class="top-stat-val">${s.actionPoints}/${s.maxActionPoints}</span>
        <span class="top-stat-sub">${s.actionPoints > 0 ? '可安排' : '已用完'}</span>
      </div>
    </div>
    <div class="top-actions">
      <span class="top-save-note${syncCls}" title="${syncTitle}">${syncNote}</span>
      <button class="btn btn-ghost" data-act="ach">成就 ${s.achievements?.length ?? 0}</button>
      <button class="btn btn-ghost" data-act="restart">重开</button>
    </div>
  `
  shell.append(header)

  // ── 主布局 ────────────────────────────────────
  const layout = el('div', 'layout')

  // 家属（独立页签面板）
  const familyPanel = el('aside', 'panel side-panel panel-family')
  if (s.family) {
    const f = s.family
    familyPanel.append(panelHead('家事', '后勤保障'))
    familyPanel.innerHTML += `
      <div class="fam-line">${f.spouse ? `配偶心情 <b>${Math.round(f.spouseMood)}</b>` : '未成家'}</div>
      <div class="fam-line">${f.childAge > 0 ? `子女 ${f.childAge < 1 ? '未满月' : Math.floor(f.childAge) + ' 岁'}` : '暂无子女'}</div>
      <div class="fam-line">父母健康 <b>${Math.round(f.parentHealth)}</b></div>
      <button class="btn btn-primary fam-btn" data-fam="1" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>顾家（1 行动点）</button>
    `
    familyPanel.querySelector('[data-fam]')?.addEventListener('click', h.onFamilyCare)
    // 子女升学就业
    if (s.childPath && s.childPath !== 'none' && s.childPath !== 'done') {
      const stage =
        s.childPath === 'zhongkao' ? '中考' : s.childPath === 'gaokao' ? '高考' : '就业'
      const childBox = el('div', 'fam-box')
      childBox.append(panelHead('子女节点', stage))
      childBox.innerHTML += `
        <div class="faction-acts">
          <button class="btn btn-ghost" data-child="benfen" ${s.currentEventId ? 'disabled' : ''}>凭本事</button>
          <button class="btn btn-ghost" data-child="guanxi" ${s.currentEventId ? 'disabled' : ''}>托关系</button>
          <button class="btn btn-ghost" data-child="jiaoyu" ${s.currentEventId ? 'disabled' : ''}>讲道理</button>
        </div>
        <p class="muted" style="font-size:11px;margin-top:4px">凭本事涨廉洁；托关系伤廉抬险；讲道理缓和家风。</p>
      `
      childBox.querySelectorAll<HTMLButtonElement>('[data-child]').forEach((btn) => {
        btn.addEventListener('click', () =>
          h.onChild(btn.dataset.child as 'benfen' | 'guanxi' | 'jiaoyu'),
        )
      })
      familyPanel.append(childBox)
    }
    familyPanel.innerHTML += `<p class="muted" style="font-size:12px;margin-top:10px">长期高风险、快进荒政会伤家庭。家属事件会在事务页出现。</p>`
  }

  // 派系（独立页签面板）
  const fr = s.factionRep || { A: 20, B: 20, local: 30 }
  const facBox = el('aside', 'panel side-panel panel-faction')
  facBox.append(panelHead('派系', s.faction === 'none' ? '未站队' : factionName(s.faction)))
  facBox.innerHTML += `
    <div class="fam-line">A 系 <b>${Math.round(fr.A ?? 0)}</b></div>
    <div class="fam-line">B 系 <b>${Math.round(fr.B ?? 0)}</b></div>
    <div class="fam-line">地方系 <b>${Math.round(fr.local ?? 0)}</b></div>
    <div class="fam-line">角力热度 <b>${Math.round(s.factionHeat ?? 0)}</b></div>
    ${s.factionCd > 0 ? `<div class="fam-line" style="color:var(--danger)">动作冷却 ${s.factionCd} 个月</div>` : ''}
    <div class="faction-acts">
      <button class="btn btn-ghost" data-fa="joinA" ${s.faction === 'A' || s.factionCd > 0 ? 'disabled' : ''}>靠拢 A</button>
      <button class="btn btn-ghost" data-fa="joinB" ${s.faction === 'B' || s.factionCd > 0 ? 'disabled' : ''}>靠拢 B</button>
      <button class="btn btn-ghost" data-fa="joinL" ${s.faction === 'local' || s.factionCd > 0 ? 'disabled' : ''}>靠拢地方</button>
      <button class="btn btn-ghost" data-fa="none" ${s.faction === 'none' || s.factionCd > 0 ? 'disabled' : ''}>脱离派系</button>
      <button class="btn btn-ghost" data-fa="loyal" ${s.faction === 'none' || s.factionCd > 0 ? 'disabled' : ''}>表忠心</button>
      <button class="btn btn-ghost" data-fa="low" ${s.faction === 'none' || s.factionCd > 0 ? 'disabled' : ''}>低调</button>
      <button class="btn btn-ghost" data-fa="sabotage" ${s.faction === 'none' || s.factionCd > 0 ? 'disabled' : ''}>拆对家台</button>
    </div>
    <p class="muted" style="font-size:11px;margin-top:6px">站队/转投有冷却与报复；拆台必遭反击；声望过低会被边缘化。会议角力里的表决也会影响声望。</p>
  `
  facBox.querySelectorAll<HTMLButtonElement>('[data-fa]').forEach((btn) => {
    const k = btn.dataset.fa
    btn.addEventListener('click', () => {
      if (k === 'joinA') h.onJoinFaction('A')
      else if (k === 'joinB') h.onJoinFaction('B')
      else if (k === 'joinL') h.onJoinFaction('local')
      else if (k === 'none') h.onJoinFaction('none')
      else if (k === 'loyal') h.onFactionAct('loyal')
      else if (k === 'low') h.onFactionAct('low')
      else if (k === 'sabotage') h.onFactionAct('sabotage')
    })
  })

  // 经营台：台账 + 舆情 + 周计划 + 调研 + 秘书
  const projBox = el('aside', 'panel side-panel panel-proj')
  projBox.append(panelHead('经营台', '在办台账 · 舆情 · 周计划 · 调研'))

  // 台账
  const projSec = el('div')
  const projN = s.projects?.length ?? 0
  const projCap = (getPost(s.postId).rank ?? 0) >= 6 ? 4 : 3
  projSec.innerHTML = `<div class="fam-line"><b>在办台账</b> ${projN}/${projCap}</div>`
  if (projN === 0) {
    projSec.append(
      el(
        'p',
        'muted proj-empty',
        '暂无在办台账。本月「下沉 / 写材料 / 跑项目」等行动有机会立项，办结后计入政绩与年度考核。',
      ),
    )
  } else {
    for (const p of s.projects) {
      const row = el('div', 'proj-row')
      row.innerHTML = `
        <div class="proj-name">${p.name}</div>
        <div class="bar proj-bar"><i style="width:${p.progress}%"></i></div>
        <div class="proj-pct">${p.progress}%</div>
      `
      projSec.append(row)
    }
  }
  projBox.append(projSec)

  // 年度目标责任书：1 月签订、12 月结算，进度实时可见
  const goalBox = el('div', 'fam-box')
  const ag = s.annualGoals
  if (ag && ag.year === s.year) {
    goalBox.append(panelHead(`年度目标 ${ag.year}`, '责任书'))
    for (const g of ag.items) {
      const cur = goalCurrent(s, g)
      const done = goalDone(s, g)
      const row = el('div', 'goal-row' + (done ? ' done' : ''))
      row.innerHTML = `
        <span class="goal-name">${done ? '✓ ' : ''}${g.label}</span>
        <span class="goal-val">${cur}<i class="goal-sep">/</i>${goalTargetText(g)}</span>
      `
      goalBox.append(row)
    }
    goalBox.innerHTML += `<p class="muted" style="font-size:11px;margin:6px 0 0">12 月过完对照结算：全部达成有奖，全部落空抬风险。</p>`
  } else {
    goalBox.append(panelHead('年度目标', '待签订'))
    const last = s.annualGoalResult
    const lastLine = last
      ? `<p class="muted" style="font-size:11px;margin:0 0 4px">${last.year} 年度达成 ${last.done}/${last.total}${last.allDone ? ' · 全部完成' : ''}。</p>`
      : ''
    goalBox.innerHTML += `${lastLine}<p class="muted" style="font-size:12px;margin:0">每年 1 月与上级签订 2–3 项年度指标，12 月对照结算。指标值按签订当时的表现锁定。</p>`
  }
  projBox.append(goalBox)

  // 舆情
  const yq = yuqingOf(s)
  const yqBox = el('div', 'fam-box')
  yqBox.append(panelHead('舆情监测', yuqingLevel(yq)))
  yqBox.innerHTML += `
    <div class="fam-line">热度 <b>${yq}</b> / 100</div>
    <div class="bar"><i style="width:${yq}%;background:linear-gradient(90deg,#2f6b4f,#a67c2b,#8b1e1e)"></i></div>
    <div class="faction-acts">
      <button class="btn btn-ghost" data-yq="huiying" ${s.yuqingActed || s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>口径回应</button>
      <button class="btn btn-ghost" data-yq="caifang" ${s.yuqingActed || s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>开放采访</button>
      <button class="btn btn-ghost" data-yq="yazhi" ${s.yuqingActed || s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>协调降温</button>
      <button class="btn btn-ghost" data-yq="zhengmian" ${s.yuqingActed || s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>正面宣传</button>
    </div>
    <p class="muted" style="font-size:11px;margin-top:4px">高温会抬风险；开放采访有翻车风险；协调降温伤廉洁。</p>
  `
  yqBox.querySelectorAll<HTMLButtonElement>('[data-yq]').forEach((btn) => {
    btn.addEventListener('click', () => h.onYuqing(btn.dataset.yq as 'huiying' | 'caifang' | 'yazhi' | 'zhengmian'))
  })
  projBox.append(yqBox)

  // 周计划
  const wp = el('div', 'fam-box')
  wp.append(panelHead('周计划', s.weekPlanned ? '已排' : '待排'))
  if (s.weekPlanned) {
    const names = (s.weekPlan ?? [])
      .map((id) => WEEK_PLAN_OPTS.find((o) => o.id === id)?.label || '—')
      .join(' · ')
    wp.innerHTML += `<div class="fam-line">${names}</div>`
  } else {
    const blocked = !!s.currentEventId
    wp.innerHTML += `<p class="muted" style="font-size:12px;margin:0 0 6px">${
      blocked
        ? '本月还有事件未处置——请先在「事务」页选完做法，再回来排周计划。'
        : '排出四周侧重（至少选 2 周），月末有加成；不排会吃草率分。'
    }</p>`
    const slotSel = el('div')
    slotSel.style.cssText = 'display:flex;flex-direction:column;gap:4px'
    // 未提交的选择放在模块级草稿：全量重渲染后仍能回填，不会选到一半被清空
    const picks: (string | null)[] = [0, 1, 2, 3].map((i) => weekDraft[i] ?? null)
    const wbtn = el('button', 'btn btn-primary')
    const refreshBtn = () => {
      const filled = picks.filter(Boolean).length
      wbtn.disabled = blocked || filled < 2
      wbtn.textContent = blocked
        ? '先处置本月事件'
        : filled < 2
          ? `确认周计划（已选 ${filled}/至少 2）`
          : `确认周计划（已选 ${filled}/4）`
    }
    for (let i = 0; i < 4; i++) {
      const sel = document.createElement('select')
      sel.className = 'week-sel'
      sel.innerHTML =
        `<option value="">第 ${i + 1} 周 · 待定</option>` +
        WEEK_PLAN_OPTS.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')
      sel.value = picks[i] ?? ''
      sel.addEventListener('change', () => {
        picks[i] = sel.value || null
        weekDraft = [...picks]
        refreshBtn()
      })
      slotSel.append(sel)
    }
    wbtn.textContent = '确认周计划'
    refreshBtn()
    wbtn.addEventListener('click', () => h.onWeekPlan([...picks]))
    wp.append(slotSel, wbtn)
  }
  projBox.append(wp)

  // 调研
  const rs = el('div', 'fam-box')
  rs.append(panelHead('调研报告', s.research ? '在研' : '库'))
  if (s.research) {
    rs.innerHTML += `
      <div class="fam-line"><b>${s.research.topic}</b></div>
      <div class="bar"><i style="width:${s.research.progress}%"></i></div>
      <div class="fam-line">进度 ${s.research.progress}% · 质量 ${Math.round(s.research.quality)} · 第 ${s.research.months} 月</div>
      <div class="faction-acts">
        <button class="btn btn-ghost" data-rs="guohua" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>走马观花</button>
        <button class="btn btn-ghost" data-rs="dun" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>蹲点深研</button>
        <button class="btn btn-ghost" data-rs="shuju" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>数据建模</button>
      </div>
    `
    rs.querySelectorAll<HTMLButtonElement>('[data-rs]').forEach((btn) => {
      btn.addEventListener('click', () => h.onResearchDepth(btn.dataset.rs as 'guohua' | 'dun' | 'shuju'))
    })
  } else {
    const list = s.researchDone ?? []
    rs.innerHTML += `<p class="muted" style="font-size:12px;margin:0 0 6px">已完成 ${list.length} 篇。立项后每月投入，约 3 个月结题，质量进考核。</p>`
    for (const t of RESEARCH_TOPICS) {
      const b = el('button', 'btn btn-ghost btn-block')
      b.textContent = t.name
      b.disabled = !!s.currentEventId || s.actionPoints < 1
      b.addEventListener('click', () => h.onStartResearch(t.id))
      rs.append(b)
    }
    for (const d of list.slice(-3).reverse()) {
      const line = el('div', 'muted')
      line.style.cssText = 'font-size:11px;margin-top:4px'
      line.textContent = `《${d.topic}》质量 ${Math.round(d.quality)} · ${d.year}`
      rs.append(line)
    }
  }
  projBox.append(rs)

  // 秘书
  const sec = el('div', 'fam-box')
  sec.append(panelHead('联络员', s.secretary?.hired ? s.secretary.name : '未配备'))
  if (s.secretary?.hired) {
    sec.innerHTML += `
      <div class="fam-line">熟练度 <b>${Math.round(s.secretary.skill)}</b></div>
      <p class="muted" style="font-size:11px;margin:4px 0 0">协助盯舆情、代拆写信冷却；批示质量小幅加成。</p>
    `
  } else {
    const gate = canHireSecretary(s)
    sec.innerHTML += `<p class="muted" style="font-size:12px;margin:0 0 6px">副科及以上、关系 35+ 可物色联络员（1 行动点）。</p>`
    const hb = el('button', 'btn btn-primary')
    hb.textContent = gate.ok ? '物色联络员' : gate.reason
    hb.disabled = !gate.ok
    hb.addEventListener('click', h.onHireSecretary)
    sec.append(hb)
  }
  projBox.append(sec)

  // 督查暗访
  const dc = el('div', 'fam-box')
  dc.append(panelHead('督查暗访', s.duchaDone ? '本月已处理' : '随机'))
  if (s.duchaDone) {
    dc.innerHTML += `<p class="muted" style="font-size:12px;margin:0">本月督查已应对。下月再看风声。</p>`
  } else {
    dc.innerHTML += `
      <p class="muted" style="font-size:12px;margin:0 0 6px">上级可能不打招呼。可提前自查台账（1 行动点），或等来了再迎检。</p>
      <div class="faction-acts">
        <button class="btn btn-ghost" data-dc="zicha" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>提前自查</button>
        <button class="btn btn-ghost" data-dc="yingjian" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>准备迎检</button>
        <button class="btn btn-ghost" data-dc="tuotie" ${s.currentEventId ? 'disabled' : ''}>先应付</button>
      </div>
    `
    dc.querySelectorAll<HTMLButtonElement>('[data-dc]').forEach((btn) => {
      btn.addEventListener('click', () =>
        h.onDucha(btn.dataset.dc as 'zicha' | 'yingjian' | 'tuotie'),
      )
    })
  }
  projBox.append(dc)

  // 项目攻坚
  const cp = el('div', 'fam-box')
  cp.append(panelHead('项目攻坚', s.campaign ? `${s.campaign.step}/${s.campaign.total}` : '可挂帅'))
  if (s.campaign) {
    cp.innerHTML += `
      <div class="fam-line"><b>${s.campaign.name}</b> · 质量 ${Math.round(s.campaign.quality)}</div>
      <div class="bar"><i style="width:${Math.round((s.campaign.step / s.campaign.total) * 100)}%"></i></div>
      <div class="faction-acts">
        <button class="btn btn-ghost" data-cp="qin" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>亲赴一线</button>
        <button class="btn btn-ghost" data-cp="fen" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>分工包干</button>
        <button class="btn btn-ghost" data-cp="ya" ${s.currentEventId || s.actionPoints < 1 ? 'disabled' : ''}>压茬推进</button>
      </div>
    `
    cp.querySelectorAll<HTMLButtonElement>('[data-cp]').forEach((btn) => {
      btn.addEventListener('click', () =>
        h.onCampaignAct(btn.dataset.cp as 'qin' | 'fen' | 'ya'),
      )
    })
  } else {
    const gateC = canStartCampaign(s)
    const chief = isMajorChief(s)
    cp.innerHTML += `<p class="muted" style="font-size:12px;margin:0 0 6px">${gateC.ok ? '带「主官专项」的只有地方党委、政府正职可挂帅。' : gateC.reason}</p>`
    for (const c of CAMPAIGNS) {
      const majorLocked = !!c.major && !chief
      const b = el('button', 'btn btn-ghost btn-block' + (majorLocked ? ' choice-locked' : ''))
      b.textContent = majorLocked ? `${c.name}（需地方主官）` : c.name
      b.disabled = !gateC.ok || majorLocked
      b.addEventListener('click', () => h.onStartCampaign(c.id))
      cp.append(b)
    }
  }
  projBox.append(cp)

  // 回忆录
  const mm = el('div', 'fam-box')
  mm.append(panelHead('回忆录', memoirSummary(s)))
  const gateM = canWriteMemoir(s)
  mm.innerHTML += `
    <div class="faction-acts">
      <button class="btn btn-ghost" data-mm="shishi" ${!gateM.ok ? 'disabled' : ''}>写实事</button>
      <button class="btn btn-ghost" data-mm="wenxue" ${!gateM.ok ? 'disabled' : ''}>写故事</button>
      <button class="btn btn-ghost" data-mm="baomi" ${!gateM.ok ? 'disabled' : ''}>只写公开</button>
    </div>
    <p class="muted" style="font-size:11px;margin-top:4px">在岗也可写。退休后页数可进终局加分。</p>
  `
  mm.querySelectorAll<HTMLButtonElement>('[data-mm]').forEach((btn) => {
    btn.addEventListener('click', () =>
      h.onMemoir(btn.dataset.mm as 'shishi' | 'wenxue' | 'baomi'),
    )
  })
  projBox.append(mm)

  // 谈心谈话
  const tx = el('div', 'fam-box')
  tx.append(panelHead('谈心谈话', (s.tanxinCd ?? 0) > 0 ? `冷却 ${s.tanxinCd} 月` : '可进行'))
  const gateT = canTanxin(s)
  tx.innerHTML += `
    <p class="muted" style="font-size:12px;margin:0 0 6px">${gateT.ok ? '在关系页点开人物后可选谈心方式。' : gateT.reason}</p>
  `
  projBox.append(tx)

  const dutyLine = el('p', 'muted')
  dutyLine.style.cssText = 'font-size:12px;margin-top:10px'
  const lifeNote = (s.life ?? 1) > 1 ? ` · 第 ${s.life} 世` : ''
  dutyLine.textContent = `本月公务质量 ${Math.round(s.dutyMonthScore ?? 0)} · 本年累计 ${Math.round(s.dutyYearScore ?? 0)} · 推荐 ${s.rosterUsed ?? 0}/2${lifeNote}`
  projBox.append(dutyLine)

  // 左：档案（精简）
  const left = el('aside', 'panel attrs-panel panel-file')
  left.append(panelHead('干部档案', '五维考核'))
  const attrBox = el('div', 'attr-list')
  const floatMap = new Map((s.floatFx || []).map((f) => [f.key, f.delta]))
  for (const meta of ATTR_META) {
    const val = s.attrs[meta.key]
    const fl = floatMap.get(meta.label)
    const row = el('div', 'attr-row')
    row.innerHTML = `
      <span class="attr-label">${meta.label}${fl != null ? `<i class="row-fx ${fl > 0 ? 'up' : 'down'}">${fl > 0 ? '+' : ''}${fl}</i>` : ''}</span>
      <div class="bar" aria-label="${meta.label} ${val}"><i style="width:${val}%"></i></div>
      <span class="attr-val">${val}</span>
    `
    attrBox.append(row)
  }
  left.append(attrBox)

  const riskBlock = el('div', 'risk-block')
  const r = Math.round(s.risk)
  riskBlock.innerHTML = `
    <div class="risk-head">
      <span>风险敞口</span>
      <strong class="${riskClass(s.risk)}">${r} · ${riskLevel(s.risk)}</strong>
    </div>
    <div class="risk-track ${riskClass(s.risk)}"><i style="width:${r}%"></i></div>
    <div class="risk-marks"><span>0</span><span>40</span><span>70</span><span>100</span></div>
  `
  left.append(riskBlock)

  // 台账/周计划速览：主界面也能看见，避免「经营台」页签里找不到
  const opsHint = el('div', 'fam-box ops-hint')
  const projCount = s.projects?.length ?? 0
  const weekState = s.weekPlanned
    ? '已排'
    : s.currentEventId
      ? '待排（先处置事件）'
      : '待排'
  opsHint.append(panelHead('经营速览', '台账 · 周计划'))
  opsHint.innerHTML += `
    <div class="fam-line">在办台账 <b>${projCount}</b>/3${
      projCount > 0
        ? ' · ' + (s.projects || []).map((p) => p.name).join(' / ')
        : ' · 暂无（行动有机会立项）'
    }</div>
    <div class="fam-line">周计划 <b>${weekState}</b></div>
    <p class="muted" style="font-size:11px;margin:4px 0 0">点底部「经营台」查看详情并排计划。</p>
  `
  left.append(opsHint)

  // 纪检监察
  if (s.jijian) {
    const jj = el('div', 'jijian-box')
    jj.append(panelHead('纪检监察', stageLabel(s.jijian.stage)))
    jj.innerHTML += `
      <div class="jijian-tip">线索：${s.jijian.tip}</div>
      <div class="jijian-steps">${s.jijian.steps.map((x) => `<span>${x}</span>`).join('→')}</div>
      <p class="jijian-sev">问题严重程度 <strong>${s.jijian.severity}</strong>${s.jijian.cooperated ? ' · 已配合' : ''}</p>
      <div class="jijian-acts">
        <button class="btn btn-primary" data-jj="peihe">${s.jijian.stage === 'chuhe' || s.jijian.stage === 'lian' || s.jijian.stage === 'shenli' ? '如实配合、认错悔错' : '如实配合说明'}</button>
        <button class="btn" data-jj="tuotie">能拖则拖 / 回避</button>
        <button class="btn btn-ghost" data-jj="zhaoguanxi">找人打听（危险）</button>
      </div>
    `
    left.append(jj)
    jj.querySelectorAll<HTMLButtonElement>('[data-jj]').forEach((btn) => {
      btn.addEventListener('click', () =>
        h.onJijianChoice(btn.dataset.jj as 'peihe' | 'tuotie' | 'zhaoguanxi'),
      )
    })
  } else if (s.punishLeft > 0) {
    const pb = el('div', 'jijian-box warn')
    pb.append(panelHead('处分影响期', s.lastPunish ?? ''))
    pb.innerHTML += `<p class="jijian-tip">影响期还剩 <strong>${s.punishLeft}</strong> 个月，期内不得晋升。</p>`
    left.append(pb)
  }

  // 晋升 / 选拔（真实程序）
  const paths = availablePaths(s)
  const ladder = el('div', 'ladder')
  ladder.append(panelHead('职务与职级', '选拔任用'))
  const curRank = post.rank
  const rungHtml = PROMO_LADDER.map((rung) => {
    const rungPost = getPost(rung.postId)
    const st =
      rungPost.rank < curRank ? 'done' : Math.abs(rungPost.rank - curRank) < 0.6 ? 'now' : 'todo'
    return `<li class="rung ${st}" title="${rung.levelNote}">
      <span class="rung-dot"></span>
      <span class="rung-text">
        <span class="rung-short">${rung.short}</span>
        <span class="rung-note">${rung.levelNote}</span>
      </span>
    </li>`
  }).join('')

  const months = (s.flags.monthsInPost as number) ?? 0
  const termYears = (months / 12).toFixed(1)
  let promoHtml = ''
  if (s.probationLeft > 0) {
    promoHtml = `<p class="promo-wait">任职试用期还剩 <strong>${s.probationLeft}</strong> 个月，期内一般不调整职务。</p>`
  } else if (s.promo && s.promo.stage !== 'idle' && s.promo.stage !== 'renmian') {
    const promoStageLabel: Record<string, string> = {
      minzhu: '民主推荐',
      kaocha: '组织考察',
      gongshi: '任前公示',
      piaojue: '会议票决',
      renmian: '研究任免',
    }
    const strategies = PROMO_STRATEGIES[s.promo.stage] || []
    const blurb = stageBlurb(s.promo.stage)
    const rate = estimatePass(s, s.promo.stage)
    promoHtml = `
      <div class="promo-flow">
        <strong>选拔进行中：${s.promo.pathLabel}</strong>
        <div class="promo-stages">
          ${['minzhu', 'kaocha', 'gongshi', 'piaojue', 'renmian']
            .map((st) => {
              const done = s.promo!.passed.includes(st)
              const now = s.promo!.stage === st
              return `<span class="promo-step${done ? ' done' : ''}${now ? ' now' : ''}">${promoStageLabel[st]}</span>`
            })
            .join('<span class="promo-arrow">→</span>')}
        </div>
        <p class="promo-blurb">${blurb} <strong class="promo-rate">本步估算通过率 ≈ ${rate}%</strong>（策略可加减）</p>
        <div class="promo-strats">
          ${strategies
            .map(
              (st) =>
                `<button class="path-btn" data-strat="${st.id}"><strong>${st.label}</strong><span>${st.hint}</span></button>`,
            )
            .join('')}
        </div>
        <div class="promo-actions">
          <button class="btn btn-ghost" data-promo-cancel>暂缓退出选拔</button>
        </div>
      </div>`
  } else {
    const open = paths.filter((p) => p.ok)
    const locked = paths.filter((p) => !p.ok)
    const allLockedHint =
      open.length === 0 && locked.length > 0
        ? `<p class="promo-wait">条件尚未满足——点开下方锁住的去向可看具体原因（常见：本岗任职月数、经手事件件数、年龄、草率分）。考核「优秀」会小幅助力，但不能跳过任职年限与实绩门槛。</p>`
        : ''
    promoHtml = `<div class="path-list">
      ${open
        .map(
          (p) =>
            `<button class="path-btn" data-path="${p.path.to}"><strong>${p.path.label}</strong><span>${L(getPost(p.path.to).title)}</span></button>`,
        )
        .join('')}
      ${allLockedHint}
      ${locked
        .slice(0, 6)
        .map(
          (p) =>
            `<div class="path-btn locked"><strong>${p.path.label}</strong><span>${p.reason}</span></div>`,
        )
        .join('')}
    </div>`
  }

  ladder.innerHTML += `
    <ol class="rung-list">${rungHtml}</ol>
    <p class="ladder-law">领导职务序列 + 职务与职级并行。股级为基层内设。选拔：推荐→考察→公示→任免，领导职务试用期一年。</p>
    <div class="promo-box">
      <div class="chapter-line">本岗 ${months} 个月（约 ${termYears} 年） · 年龄 ${s.age} · 经手事件 ${s.eventsHandledThisPost ?? 0} 件${(s.mashScore ?? 0) >= 40 ? ' · 草率分偏高' : ''}${s.lastAppraisal?.grade === '优秀' ? ' · 上年考核优秀' : ''}</div>
      ${promoHtml}
    </div>
  `
  left.append(ladder)

  ladder.querySelectorAll<HTMLButtonElement>('[data-path]').forEach((btn) => {
    btn.addEventListener('click', () => h.onStartPromo(btn.dataset.path!))
  })
  ladder.querySelectorAll<HTMLButtonElement>('[data-strat]').forEach((btn) => {
    btn.addEventListener('click', () => h.onAdvancePromo(btn.dataset.strat))
  })
  ladder.querySelector('[data-promo-cancel]')?.addEventListener('click', h.onCancelPromo)

  // 中：事件
  const center = el('section', 'panel event-panel')
  const knownCatalog = loadCatalog()
  if (s.currentEventId) {
    const ev = getEvent(s.currentEventId)
    const kind = KIND_LABEL[ev.kind] ?? '日常'
    const hits = s.eventHits?.[ev.id] ?? 1
    const seen = knownCatalog.includes(ev.id)
    const newTag = !seen ? `<span class="tag tag-calm">图鉴新条目</span>` : ''
    center.innerHTML = `
      <div class="event-head">
        <span class="tag tag-${ev.kind}">${kind}</span>
        ${newTag}
        <span class="event-no">${prov.places.town}纪要 · ${String(s.turn + 1).padStart(3, '0')}</span>
        <span class="muted">${dateLabel(s)}</span>
      </div>
      <div class="event-paper">
        <h2 class="event-title">${L(ev.title)}</h2>
        <p class="event-text">${L(getEventText(ev, s.originId, hits))}</p>
      </div>
    `
    const choices = el('div', 'choices')
    ev.choices.forEach((c, i) => {
      const ok = meetsRequire(s, c.require)
      const btn = el('button', 'choice' + (ok ? '' : ' choice-locked'))
      btn.type = 'button'
      btn.disabled = !ok
      btn.innerHTML = `
        <span class="choice-index">${String.fromCharCode(65 + i)}</span>
        <span class="choice-body">
          <span class="choice-label">${c.label}</span>
          ${c.hint ? `<span class="choice-hint">${c.hint}</span>` : ''}
          ${!ok ? `<span class="choice-lock">条件不足</span>` : ''}
        </span>
      `
      btn.addEventListener('click', () => h.onChoose(i))
      choices.append(btn)
    })
    center.append(choices)
  } else {
    center.innerHTML = `
      <div class="event-head">
        <span class="tag">本月窗口</span>
        <span class="ap-chip">行动点 ${s.actionPoints}/${s.maxActionPoints}</span>
        <span class="muted">${dateLabel(s)}</span>
      </div>
      <div class="event-paper idle">
        <h2 class="event-title">事件已处置 · 可主动安排</h2>
        <p class="event-text">点行动卡会先让你<strong>选怎么做</strong>；点右侧人物可单独走动。安排完再进下个月。</p>
      </div>
    `
    if (s.lastFeedback) {
      const fb = el('div', 'feedback-card')
      fb.innerHTML = `
        <div class="feedback-head">
          <strong>${s.lastFeedback.title}</strong>
          <button class="btn btn-ghost" data-act="fb-ok">知道了</button>
        </div>
        <p>${s.lastFeedback.text}</p>
      `
      center.append(fb)
      fb.querySelector('[data-act="fb-ok"]')!.addEventListener('click', h.onDismissFeedback)
    }
    const actionWrap = el('div', 'action-grid')
    // 深度公务
    const dutyWrap = el('div', 'duty-board')
    dutyWrap.append(panelHead('深度公务', '本月可办'))
    const dutyGrid = el('div', 'action-grid')
    for (const d of DUTY_META) {
      const gate = canStartDuty(s, d.kind)
      const done = (s.dutyDone ?? []).includes(d.kind)
      const btn = el('button', 'action-card' + (gate.ok ? '' : ' choice-locked'))
      btn.type = 'button'
      btn.disabled = !gate.ok
      btn.innerHTML = `
        <div class="action-name">${d.name}<span class="action-cost">${d.cost}点${done ? ' · 本月已办' : ''}</span></div>
        <div class="action-desc">${d.desc}${!gate.ok ? ` · ${gate.reason}` : ''}</div>
      `
      btn.addEventListener('click', () => h.onStartDuty(d.kind))
      dutyGrid.append(btn)
    }
    dutyWrap.append(dutyGrid)
    center.append(dutyWrap)

    for (const a of ACTIONS) {
      const gate = canDoAction(s, a)
      const btn = el('button', 'action-card' + (gate.ok ? '' : ' choice-locked'))
      btn.type = 'button'
      btn.disabled = !gate.ok
      btn.innerHTML = `
        <div class="action-name">${a.name}<span class="action-cost">${a.cost}点 · ${a.variants.length}种做法</span></div>
        <div class="action-desc">${a.desc}</div>
      `
      btn.addEventListener('click', () => h.onDoAction(a.id))
      actionWrap.append(btn)
    }
    center.append(actionWrap)

    const nextRow = el('div')
    nextRow.style.cssText = 'display:flex;gap:8px;margin-top:8px'
    const nextBtn = el('button', 'btn btn-primary', '进入下个月 →')
    nextBtn.style.flex = '1'
    nextBtn.addEventListener('click', h.onAdvanceMonth)
    const skipBtn = el('button', 'btn btn-ghost', '快进荒政')
    skipBtn.title = '跳过本月安排，有荒政代价（草率分↑、政绩↓、风险↑）'
    skipBtn.addEventListener('click', h.onSkipMonth)
    nextRow.append(nextBtn, skipBtn)
    center.append(nextRow)
    const focusBox = el('div', 'focus-box')
    focusBox.innerHTML = `
      <div class="focus-label">本月焦点</div>
      <div class="focus-opts">
        <button class="focus-opt${s.focus === 'zj' ? ' on' : ''}" data-f="zj">主攻政绩</button>
        <button class="focus-opt${s.focus === 'mx' ? ' on' : ''}" data-f="mx">主攻民生</button>
        <button class="focus-opt${s.focus === 'lian' ? ' on' : ''}" data-f="lian">主攻廉洁</button>
        <button class="focus-opt${s.focus === 'gx' ? ' on' : ''}" data-f="gx">主攻关系</button>
      </div>
      <p class="muted" style="margin:4px 0 0;font-size:11px">焦点会影响行动收益，每月可换。</p>
    `
    center.append(focusBox)
    focusBox.querySelectorAll<HTMLButtonElement>('[data-f]').forEach((btn) => {
      btn.addEventListener('click', () =>
        h.onSetFocus(btn.dataset.f as 'zj' | 'mx' | 'lian' | 'gx'),
      )
    })
    const ff = el('div', 'ff-row')
    ff.innerHTML = `
      <button class="btn btn-ghost" data-tl="1">履历</button>
      <button class="btn btn-ghost" data-help="1">制度说明</button>
      <button class="btn btn-ghost" data-set="1">设置</button>
    `
    center.append(ff)
    ff.querySelector('[data-tl]')!.addEventListener('click', h.onToggleTimeline)
    ff.querySelector('[data-help]')!.addEventListener('click', h.onToggleHelp)
    ff.querySelector('[data-set]')!.addEventListener('click', h.onOpenSettings)
  }

  // 右上：关系网
  const right = el('aside', 'panel side-panel panel-net')
  right.append(panelHead('关系网', '图 / 列表'))
  const visible = npcsVisibleAt(post.rank)
  const visibleIds = new Set(visible.map((n) => n.id))
  const rows = [
    ...s.npcs.filter((r) => visibleIds.has(r.id)),
  ]
  const bonds = bondRefs(s).filter((r) => !visibleIds.has(r.id))

  const graphBox = el('div', 'npc-graph')
  graphBox.innerHTML = buildRelationSvg(s, rows)
  right.append(graphBox)
  graphBox.querySelectorAll<SVGElement>('[data-npc]').forEach((node) => {
    node.addEventListener('click', () => h.onOpenNpc(node.getAttribute('data-npc')!))
    node.style.cursor = 'pointer'
  })

  const npcList = el('div', 'npc-list')
  for (const ref of rows) {
    const def = getNpc(ref.id)
    const rosterTag = s.rosterTags?.[ref.id] || ''
    const row = el('button', 'npc-row npc-row-btn')
    row.type = 'button'
    row.innerHTML = `
      <div class="npc-main">
        <div class="npc-name">${def.name}${rosterTag ? ` <i style="font-style:normal;opacity:.75">${rosterTag}</i>` : ''}</div>
        <div class="npc-role">${def.role}</div>
        <div class="npc-tags">${def.tags.map((t) => `<i>${t}</i>`).join('')}</div>
      </div>
      <div class="npc-fav ${favorClass(ref.favor)}">${ref.favor > 0 ? '+' : ''}${ref.favor}</div>
    `
    row.addEventListener('click', () => h.onOpenNpc(ref.id))
    npcList.append(row)
  }
  // 名册推荐
  if (rows.some((r) => r.favor >= 40) && (s.rosterUsed ?? 0) < 2 && !s.currentEventId && s.actionPoints > 0) {
    const recBox = el('div', 'faction-acts')
    recBox.style.margin = '4px 0 8px'
    const recHead = el('div', 'muted')
    recHead.style.cssText = 'font-size:11px;margin-bottom:4px'
    recHead.textContent = `名册推荐 ${s.rosterUsed ?? 0}/2（好感≥40）`
    recBox.append(recHead)
    for (const ref of rows.filter((r) => r.favor >= 40).slice(0, 3)) {
      const b = el('button', 'btn btn-ghost')
      b.textContent = `推荐 ${getNpc(ref.id).name}`
      b.addEventListener('click', () => h.onRecommend(ref.id))
      recBox.append(b)
    }
    npcList.append(recBox)
  }
  if (rows.length === 0 && bonds.length === 0) {
    npcList.append(el('div', 'muted', '本阶段关系网尚未打开。'))
  }
  right.append(npcList)

  if (bonds.length > 0) {
    const bondBox = el('div', 'npc-list')
    const head = el('div', 'muted')
    head.style.cssText = 'margin:8px 0 4px;font-size:12px'
    head.textContent = `跨阶段羁绊 ${bonds.length}（旧交仍通音讯）`
    bondBox.append(head)
    for (const ref of bonds) {
      const def = getNpc(ref.id)
      const row = el('button', 'npc-row npc-row-btn npc-row-dim')
      row.type = 'button'
      row.innerHTML = `
        <div class="npc-main">
          <div class="npc-name">${def.name} <i style="font-style:normal;opacity:.75">羁绊</i></div>
          <div class="npc-role">${def.role}</div>
        </div>
        <div class="npc-fav ${favorClass(ref.favor)}">${ref.favor > 0 ? '+' : ''}${ref.favor}</div>
      `
      row.addEventListener('click', () => h.onOpenNpc(ref.id))
      bondBox.append(row)
    }
    right.append(bondBox)
  }

  // 关系名册：可见 + 羁绊 + 任免履历摘要
  if (rows.length > 0 || bonds.length > 0 || (s.timeline?.length ?? 0) > 0) {
    const roster = el('div', 'npc-list')
    const rh = el('div', 'muted')
    rh.style.cssText = 'margin:8px 0 4px;font-size:12px'
    rh.textContent = `交往圈 ${rows.length} · 羁绊 ${bonds.length} · 履历节点 ${(s.timeline?.length ?? 0)}`
    roster.append(rh)
    const lastPosts = (s.timeline ?? [])
      .filter((t) => t.kind === 'promote')
      .slice(-4)
      .reverse()
    for (const t of lastPosts) {
      const line = el('div', 'muted')
      line.style.cssText = 'font-size:11px;padding:2px 0'
      line.textContent = `履历 · ${t.text}`
      roster.append(line)
    }
    right.append(roster)
  }

  // 更多：消息 + 快捷工具
  const more = el('aside', 'panel side-panel panel-more')
  more.append(panelHead('更多', ''))
  const tools = el('div', 'more-tools')
  tools.innerHTML = `
    <button class="btn btn-block" data-tool="ach">成就 ${s.achievements?.length ?? 0}</button>
    <button class="btn btn-block" data-tool="tl">履历</button>
    <button class="btn btn-block" data-tool="catalog">图鉴 ${catalogCount()}</button>
    <button class="btn btn-block" data-tool="faillog">选拔复盘</button>
    <button class="btn btn-block" data-tool="help">制度说明</button>
    <button class="btn btn-block" data-tool="set">设置</button>
    <button class="btn btn-ghost btn-block" data-tool="restart">重开生涯</button>
  `
  more.append(tools)
  tools.querySelector('[data-tool="ach"]')!.addEventListener('click', h.onOpenAchievements)
  tools.querySelector('[data-tool="tl"]')!.addEventListener('click', h.onToggleTimeline)
  tools.querySelector('[data-tool="catalog"]')!.addEventListener('click', h.onToggleCatalog)
  tools.querySelector('[data-tool="faillog"]')!.addEventListener('click', h.onShowFailLog)
  tools.querySelector('[data-tool="help"]')!.addEventListener('click', h.onToggleHelp)
  tools.querySelector('[data-tool="set"]')!.addEventListener('click', h.onOpenSettings)
  tools.querySelector('[data-tool="restart"]')!.addEventListener('click', h.onRestart)

  more.append(panelHead('消息流', '近期'))
  const log = el('div', 'log')
  for (const line of s.log.slice(0, 14)) {
    log.append(el('div', 'log-line', line))
  }
  more.append(log)

  left.classList.add('panel-file')
  center.classList.add('panel-duty')
  right.classList.add('panel-net')

  const tab = s.uiTab ?? 'duty'
  layout.dataset.tab = tab
  layout.append(left, center, right, familyPanel, facBox, projBox, more)
  shell.append(layout)

  // 底部菜单（8 页签）
  const nav = el('nav', 'bottom-nav')
  const tabs: { id: UiTab; label: string; icon: string }[] = [
    { id: 'duty', label: '事务', icon: '事' },
    { id: 'file', label: '档案', icon: '档' },
    { id: 'net', label: '关系', icon: '关' },
    { id: 'favor', label: '托人', icon: '托' },
    { id: 'faction', label: '派系', icon: '派' },
    { id: 'family', label: '家事', icon: '家' },
    { id: 'proj', label: '经营台', icon: '营' },
    { id: 'more', label: '更多', icon: '更' },
  ]
  nav.innerHTML = tabs
    .map(
      (t) =>
        `<button class="nav-item${tab === t.id ? ' on' : ''}" data-nav="${t.id}"><span class="nav-icon">${t.icon}</span><span>${t.label}</span></button>`,
    )
    .join('')
  // 属性名用 data-nav：layout 容器上已有同值 data-tab（CSS 布局选择器用），
  // 若按钮也叫 data-tab，querySelector('[data-tab]') 会先命中 layout，点击测试全落空
  nav.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => h.onUiTab(btn.dataset.nav as UiTab))
  })
  shell.append(nav)

  // 托人办事面板
  if (tab === 'favor') {
    const fav = el('aside', 'panel panel-favor')
    fav.append(panelHead('托人办事', '耗好感'))
    const flist = el('div', 'npc-list')
    for (const ref of rows) {
      const def = getNpc(ref.id)
      const row = el('div', 'npc-row')
      row.innerHTML = `
        <div class="npc-main">
          <div class="npc-name">${def.name} <span class="muted">(${ref.favor})</span></div>
          <div class="npc-role">${def.role}</div>
        </div>
        <div class="fav-btns">
          <button class="btn btn-ghost" data-fav="info" data-nid="${ref.id}" ${ref.favor < 15 ? 'disabled' : ''}>打听</button>
          <button class="btn btn-ghost" data-fav="risk" data-nid="${ref.id}" ${ref.favor < 25 ? 'disabled' : ''}>过问</button>
          <button class="btn btn-ghost" data-fav="promo" data-nid="${ref.id}" ${ref.favor < 35 ? 'disabled' : ''}>说话</button>
        </div>
      `
      flist.append(row)
    }
    fav.append(flist)
    layout.append(fav)
    fav.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((btn) => {
      btn.addEventListener('click', () =>
        h.onAskFavor(btn.dataset.nid!, btn.dataset.fav as 'info' | 'risk' | 'promo'),
      )
    })
  }

  // 移动端底部摘要条（在导航之上）
  const mobileBar = el('div', 'mobile-bar')
  mobileBar.innerHTML = `
    <span>${dateLabel(s)}</span>
    <span class="mobile-post">${post.levelShort}</span>
    <span class="${riskClass(s.risk)}">风险 ${r}</span>
    <span>行动 ${s.actionPoints}/${s.maxActionPoints}</span>
  `
  shell.append(mobileBar)

  root.append(shell)

  header.querySelector('[data-act="restart"]')!.addEventListener('click', h.onRestart)
  header.querySelector('[data-act="ach"]')!.addEventListener('click', h.onOpenAchievements)

  if (s.pendingDocument) mountDocument(root, s, h)
  if (s.dutyRun) mountDutyModal(root, s, h)
  if (s.openNpcId) mountNpcModal(root, s, h)
  if (s.pendingActionId) mountActionModal(root, s, h)
  if (s.lastAppraisal) mountAppraisal(root, s, h)
  else if (s.milestones && s.milestones.length > 0) mountMilestone(root, s, h)
  else if (s.lastMonthSummary) mountMonthSummary(root, s, h)
  if (s.flags.showAch) mountAchievements(root, s, h)
  if (s.pendingVisit) mountVisit(root, s, h)
  if (s.pendingBurst) mountBurst(root, s, h)
  if (s.pendingProjectChoice) mountProjectChoice(root, s, h)
  if (s.pendingVote) mountVote(root, s, h)
  if (s.retiredMode && s.phase === 'play') mountRetired(root, s, h)
  if (s.pendingSecCase) mountSecCase(root, s, h)
}

function mountSecCase(root: HTMLElement, s: GameState, h: AppHandlers) {
  const name = s.pendingSecCase!.name
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog" aria-label="身边人出事">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">身边人出事</div>
          <div class="npc-modal-role">联络员 · ${name}</div>
        </div>
      </div>
      <p class="npc-modal-intro">有人实名举报${name}在项目审批中「帮老板递材料、收了感谢费」，举报材料已经同时递到了纪委和检察院。他深夜到你家楼下等了你四十分钟。</p>
      <div class="npc-acts">
        <button class="npc-act" data-sc="jiege">
          <strong>切割：如实报告，配合调查</strong>
          <span>廉洁与风险改善 · 身边人被带走 · 关系受损</span>
        </button>
        <button class="npc-act" data-sc="baoquan">
          <strong>保全：打招呼摆平</strong>
          <span>秘书留任 · 廉洁大损 · 风险大增 · 留下把柄（纪检立案时加重）</span>
        </button>
        <button class="npc-act" data-sc="baogao">
          <strong>报告并调离：态度优先</strong>
          <span>组织肯定 · 小幅风险 · 需重新物色联络员</span>
        </button>
      </div>
    </div>
  `
  root.append(overlay)
  overlay.querySelectorAll<HTMLButtonElement>('[data-sc]').forEach((btn) => {
    btn.addEventListener('click', () =>
      h.onResolveSecCase(btn.dataset.sc as 'jiege' | 'baoquan' | 'baogao'),
    )
  })
}

function mountVote(root: HTMLElement, s: GameState, h: AppHandlers) {
  const v = s.pendingVote!
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">${v.title}</div>
          <div class="npc-modal-role">派系角力</div>
        </div>
      </div>
      <p class="npc-modal-intro">${v.text}</p>
      <div class="npc-acts">
        <button class="btn btn-primary" data-v="yes">赞成</button>
        <button class="btn" data-v="no">反对</button>
        <button class="btn btn-ghost" data-v="abstain">弃权</button>
      </div>
    </div>
  `
  root.append(overlay)
  overlay.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((btn) => {
    btn.addEventListener('click', () =>
      h.onResolveVote(btn.dataset.v as 'yes' | 'no' | 'abstain'),
    )
  })
}

function mountFailLog(root: HTMLElement, s: GameState, h: AppHandlers) {
  const overlay = el('div', 'npc-overlay show')
  const items = (s.promoFailLog || [])
    .map((t) => `<li>${t}</li>`)
    .join('') || '<li class="muted">暂无失败记录</li>'
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">选拔复盘</div>
          <div class="npc-modal-role">最近失败记录</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <ul class="tl-list">${items}</ul>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onShowFailLog)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onShowFailLog)
}

function mountRetired(root: HTMLElement, _s: GameState, h: AppHandlers) {
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">退休余热</div>
          <div class="npc-modal-role">到龄退休，可选顾问或收束</div>
        </div>
      </div>
      <p class="npc-modal-intro">组织谈话：按规定退休。你可继续发挥余热，或正式收束生涯。</p>
      <div class="npc-acts">
        <button class="btn btn-primary" data-r="consult">顾问调研</button>
        <button class="btn" data-r="memoir">整理回忆</button>
        <button class="btn" data-r="settle">收束生涯</button>
      </div>
    </div>
  `
  root.append(overlay)
  overlay.querySelectorAll<HTMLButtonElement>('[data-r]').forEach((btn) => {
    btn.addEventListener('click', () =>
      h.onRetiredAct(btn.dataset.r as 'consult' | 'memoir' | 'settle'),
    )
  })
}

function mountBurst(root: HTMLElement, s: GameState, h: AppHandlers) {
  const b = s.pendingBurst!
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">突发事务</div>
          <div class="npc-modal-role">${b.title}</div>
        </div>
      </div>
      <p class="npc-modal-intro">${b.text}</p>
      <div class="npc-acts">
        <button class="btn btn-primary" data-b="0">亲自处理</button>
        <button class="btn" data-b="1">让下面去办 / 先摸底</button>
      </div>
    </div>
  `
  root.append(overlay)
  overlay.querySelectorAll<HTMLButtonElement>('[data-b]').forEach((btn) => {
    btn.addEventListener('click', () => h.onResolveBurst(Number(btn.dataset.b)))
  })
}

function mountProjectChoice(root: HTMLElement, s: GameState, h: AppHandlers) {
  const p = s.pendingProjectChoice!
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">项目收尾</div>
          <div class="npc-modal-role">${p.name}</div>
        </div>
      </div>
      <p class="npc-modal-intro">办结了。如何总结？</p>
      <div class="npc-acts">
        <button class="btn btn-primary" data-p="public">高调总结、对外宣传</button>
        <button class="btn" data-p="quiet">低调收尾、功归集体</button>
      </div>
    </div>
  `
  root.append(overlay)
  overlay.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((btn) => {
    btn.addEventListener('click', () =>
      h.onProjectChoice(btn.dataset.p === 'public' ? 'public' : 'quiet'),
    )
  })
}

function mountVisit(root: HTMLElement, s: GameState, h: AppHandlers) {
  const v = s.pendingVisit!
  const def = getNpc(v.npcId)
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">友人来访</div>
          <div class="npc-modal-role">${def.name} · 好感 ${v.favor}</div>
        </div>
      </div>
      <p class="npc-modal-intro">${def.name}托人带话，想约你坐坐。推掉应酬还是婉拒？</p>
      <div class="npc-acts">
        <button class="btn btn-primary" data-v="1">赴约</button>
        <button class="btn" data-v="0">婉拒</button>
      </div>
    </div>
  `
  root.append(overlay)
  overlay.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((btn) => {
    btn.addEventListener('click', () => h.onVisit(btn.dataset.v === '1'))
  })
}

function mountCatalog(root: HTMLElement, _s: GameState, h: AppHandlers) {
  const done = new Set(loadCatalog())
  const overlay = el('div', 'npc-overlay show')
  const originFilter = _s.catalogOrigin || 'all'
  const flavorFilter = _s.catalogFlavor || 'all'
  const stageFilter = _s.catalogStage || 'all'
  const matchOrigin = (ev: (typeof EVENTS)[number]) => {
    if (originFilter !== 'all') {
      if (!ev.originIds || ev.originIds.length === 0) return true
      if (!ev.originIds.includes(originFilter)) return false
    }
    if (flavorFilter !== 'all') {
      if (!ev.flavors || ev.flavors.length === 0) return true
      if (!ev.flavors.includes(flavorFilter)) return false
    }
    if (stageFilter !== 'all') {
      // 用 minRank 近似章节
      const mn = ev.minRank ?? 0
      if (stageFilter === '乡镇' && mn >= 6) return false
      if (stageFilter === '县区' && (mn < 6 || mn >= 12)) return false
      if (stageFilter === '市级' && (mn < 12 || mn >= 15)) return false
      if (stageFilter === '省部' && mn < 15) return false
    }
    return true
  }
  const pool = EVENTS.filter(matchOrigin)
  const byKind = {
    main: pool.filter((e) => e.kind === 'main'),
    daily: pool.filter((e) => e.kind === 'daily' || e.kind === 'calm'),
    crisis: pool.filter((e) => e.kind === 'crisis'),
    npc: pool.filter((e) => e.kind === 'npc'),
  }
  const renderList = (filter: string) => {
    const list =
      filter === 'all'
        ? pool
        : filter === 'main'
          ? byKind.main
          : filter === 'daily'
            ? byKind.daily
            : filter === 'crisis'
              ? byKind.crisis
              : filter === 'npc'
                ? byKind.npc
                : pool
    return list
      .map((ev) => {
        const got = done.has(ev.id)
        const kind = ev.kind
        return `<div class="ach-row${got ? ' got' : ''}" data-kind="${kind}">
        <strong>${ev.title}</strong>
        <span>${got ? '已触发' : '未触发'} · 【${kind}】· ${ev.originIds ? '出身限定' : ev.flavors ? '省份限定' : '通用'}</span>
      </div>`
      })
      .join('')
  }
  overlay.innerHTML = `
    <div class="npc-modal help-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">事件图鉴</div>
          <div class="npc-modal-role">已触发 ${done.size} / ${EVENTS.length}（跨局累计）</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <div class="promo-stages" id="cat-filter">
        <button class="promo-step now" data-f="all">全部</button>
        <button class="promo-step" data-f="main">主线</button>
        <button class="promo-step" data-f="daily">日常</button>
        <button class="promo-step" data-f="crisis">危机</button>
        <button class="promo-step" data-f="npc">人脉</button>
      </div>
      <div class="promo-stages" id="cat-origin">
        <button class="promo-step${originFilter === 'all' ? ' now' : ''}" data-o="all">全部出身</button>
        ${ORIGINS.map((o) => `<button class="promo-step${originFilter === o.id ? ' now' : ''}" data-o="${o.id}">${o.name}</button>`).join('')}
      </div>
      <div class="promo-stages" id="cat-flavor">
        <button class="promo-step${flavorFilter === 'all' ? ' now' : ''}" data-fl="all">全部省份气质</button>
        ${['coastal', 'north', 'northeast', 'central', 'southwest', 'northwest'].map((f) => `<button class="promo-step${flavorFilter === f ? ' now' : ''}" data-fl="${f}">${f}</button>`).join('')}
      </div>
      <div class="promo-stages" id="cat-stage">
        <button class="promo-step${stageFilter === 'all' ? ' now' : ''}" data-st="all">全部章节</button>
        <button class="promo-step${stageFilter === '乡镇' ? ' now' : ''}" data-st="乡镇">乡镇</button>
        <button class="promo-step${stageFilter === '县区' ? ' now' : ''}" data-st="县区">县区</button>
        <button class="promo-step${stageFilter === '市级' ? ' now' : ''}" data-st="市级">市级</button>
        <button class="promo-step${stageFilter === '省部' ? ' now' : ''}" data-st="省部">省部</button>
      </div>
      <div class="ach-list" id="cat-list">${renderList('all')}</div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onToggleCatalog)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onToggleCatalog)
  overlay.querySelectorAll<HTMLButtonElement>('[data-o]').forEach((btn) => {
    btn.addEventListener('click', () => h.onCatalogOrigin(btn.dataset.o || 'all'))
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-fl]').forEach((btn) => {
    btn.addEventListener('click', () => h.onCatalogFlavor(btn.dataset.fl || 'all'))
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-st]').forEach((btn) => {
    btn.addEventListener('click', () => h.onCatalogStage(btn.dataset.st || 'all'))
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-f]').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.promo-step').forEach((b) => b.classList.remove('now'))
      btn.classList.add('now')
      const list = overlay.querySelector('#cat-list')
      if (list) list.innerHTML = renderList(btn.dataset.f || 'all')
    })
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) h.onToggleCatalog()
  })
}

function mountHelp(root: HTMLElement, s: GameState, h: AppHandlers) {
  const sections = buildHelpSections(s)
  const overlay = el('div', 'npc-overlay show')
  const nav = sections
    .map((sec, i) => `<button class="help-nav-btn" data-hs="${i}">${sec.title}</button>`)
    .join('')
  const body = sections
    .map((sec, i) => `<h4 id="help-s${i}">${sec.title}</h4><p>${sec.body}</p>`)
    .join('')
  overlay.innerHTML = `
    <div class="npc-modal help-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">制度说明</div>
          <div class="npc-modal-role">玩法化压缩 · 非正式政策解读</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <div class="help-layout">
        <nav class="help-nav" aria-label="目录">${nav}</nav>
        <div class="help-body">${body}</div>
      </div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onToggleHelp)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onToggleHelp)
  overlay.querySelectorAll<HTMLButtonElement>('[data-hs]').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay
        .querySelector('#help-s' + btn.dataset.hs)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) h.onToggleHelp()
  })
}

function mountTimeline(root: HTMLElement, s: GameState, h: AppHandlers) {
  const overlay = el('div', 'npc-overlay show')
  const items = (s.timeline || [])
    .slice(0, 40)
    .map(
      (t) =>
        `<li><span class="tl-date">${t.year}.${String(t.month).padStart(2, '0')}</span>${t.text}</li>`,
    )
    .join('')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">履历</div>
          <div class="npc-modal-role">时间线（最近 40 条）</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <ul class="tl-list">${items || '<li class="muted">暂无记录</li>'}</ul>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onToggleTimeline)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onToggleTimeline)
}

function mountSettings(root: HTMLElement, s: GameState, h: AppHandlers) {
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">设置</div>
          <div class="npc-modal-role">${authUser() ? '云账号存档' : '本机离线存档'} · 槽位 ${(s.slot ?? 0) + 1}</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <div class="set-list">
        <button class="btn btn-block" data-act="font">界面字号：${FONT_LABEL[getFontSize()]}（点击切换）</button>
        <button class="btn btn-block" data-act="changelog">更新日志（${latestVersion()}）</button>
        <button class="btn btn-block" data-act="mute">${isMuted() ? '开启音效' : '关闭音效'}</button>
        <label class="set-import">音效音量 <span id="vol-val">${Math.round(getVolume() * 100)}%</span>
          <input type="range" id="vol-range" min="0" max="100" value="${Math.round(getVolume() * 100)}" />
        </label>
        <button class="btn btn-block" data-act="catalog">事件图鉴 ${catalogCount()}/${EVENTS.length}</button>
        <button class="btn btn-block" data-act="theme">切换深浅主题</button>
        <button class="btn btn-block" data-act="export">导出加密存档（.guantu）</button>
        <label class="set-import">导入备份到当前槽位（.guantu / 旧版）
          <input type="file" accept=".guantu,.json,application/json,text/plain" id="imp-file" />
        </label>
        <button class="btn btn-block" data-act="qq">玩家交流群（QQ 1107570877）</button>
        <button class="btn btn-block" data-act="tl">查看履历</button>
        <button class="btn btn-ghost btn-block" data-act="title">回到标题</button>
      </div>
      <p class="muted" style="margin-top:10px;font-size:12px">存档在你每次操作后自动写入${authUser() ? '云账号' : '这台设备的浏览器'}，不需要手动保存。局域网或断网时会暂存本机，恢复后自动补传。导出为 AES-GCM 加密备份（非明文），导入时需输入导出密码；旧版明文 / 旧混淆文件仍可导入。</p>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onCloseSettings)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onCloseSettings)
  overlay.querySelector('[data-act="font"]')?.addEventListener('click', () =>
    h.onSetFont(nextFontSize(getFontSize())),
  )
  overlay.querySelector('[data-act="changelog"]')?.addEventListener('click', () =>
    mountChangelog(root),
  )
  overlay.querySelector('[data-act="export"]')!.addEventListener('click', h.onExportSave)
  overlay.querySelector('[data-act="qq"]')?.addEventListener('click', () => mountQqGroup(root))
  overlay.querySelector('[data-act="mute"]')?.addEventListener('click', h.onToggleMute)
  overlay.querySelector('[data-act="catalog"]')?.addEventListener('click', h.onToggleCatalog)
  overlay.querySelector('[data-act="theme"]')?.addEventListener('click', h.onToggleTheme)
  overlay.querySelector<HTMLInputElement>('#vol-range')?.addEventListener('input', (e) => {
    const val = Number((e.target as HTMLInputElement).value) / 100
    h.onSetVolume(val)
    const label = overlay.querySelector('#vol-val')
    if (label) label.textContent = `${Math.round(val * 100)}%`
  })
  overlay.querySelector('[data-act="tl"]')!.addEventListener('click', () => {
    h.onCloseSettings()
    h.onToggleTimeline()
  })
  overlay.querySelector('[data-act="title"]')!.addEventListener('click', h.onCloseSettings)
  overlay.querySelector<HTMLInputElement>('#imp-file')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      h.onImportSave(String(reader.result || ''))
      ;(e.target as HTMLInputElement).value = ''
    }
    reader.readAsText(file)
  })
}

/** 导出/导入加密存档时的密码弹层 */
export function promptSavePassword(opts: {
  title: string
  confirmMode?: boolean
  onSubmit: (password: string) => void
  onCancel?: () => void
}): void {
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog" aria-modal="true">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">${opts.title}</div>
          <div class="npc-modal-role">AES-GCM 加密，文件不是明文</div>
        </div>
        <button class="btn btn-primary" type="button" data-act="close">取消</button>
      </div>
      <div class="set-list">
        <label class="set-import">密码（至少 4 位）
          <input type="password" id="spw1" autocomplete="new-password" maxlength="64" placeholder="导出/导入都需要这串密码" />
        </label>
        ${opts.confirmMode ? `
        <label class="set-import">再输入一次
          <input type="password" id="spw2" autocomplete="new-password" maxlength="64" />
        </label>` : ''}
        <p class="muted" style="font-size:12px;margin:0">请自行牢记密码。密码丢失将无法解开该备份；旧版明文文件仍可导入。</p>
        <button class="btn btn-primary btn-block" type="button" data-act="ok">确定</button>
      </div>
    </div>
  `
  document.body.append(overlay)
  const close = () => {
    overlay.remove()
    opts.onCancel?.()
  }
  const p1 = overlay.querySelector<HTMLInputElement>('#spw1')!
  const p2 = overlay.querySelector<HTMLInputElement>('#spw2')
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', close)
  overlay.querySelector('[data-act="ok"]')!.addEventListener('click', () => {
    const a = p1.value.trim()
    if (a.length < 4) {
      p1.focus()
      p1.setCustomValidity('至少 4 位')
      p1.reportValidity()
      return
    }
    if (opts.confirmMode && p2 && a !== p2.value.trim()) {
      p2.focus()
      p2.setCustomValidity('两次密码不一致')
      p2.reportValidity()
      return
    }
    overlay.remove()
    opts.onSubmit(a)
  })
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      document.removeEventListener('keydown', onKey)
      close()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      overlay.querySelector<HTMLButtonElement>('[data-act="ok"]')?.click()
    }
  }
  document.addEventListener('keydown', onKey)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.removeEventListener('keydown', onKey)
      close()
    }
  })
  p1.focus()
}

function mountAppraisal(root: HTMLElement, s: GameState, h: AppHandlers) {
  const ap = s.lastAppraisal!
  const gradeClass =
    ap.grade === '优秀' ? 'grade-a' : ap.grade === '称职' ? 'grade-b' : ap.grade === '基本称职' ? 'grade-c' : 'grade-d'
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="doc appraisal-card" role="dialog">
      <div class="doc-header">
        <div class="doc-org">年度考核</div>
        <div class="doc-title">${ap.year}</div>
      </div>
      <div class="doc-body">
        <div class="appraisal-grade ${gradeClass}">${ap.grade}</div>
        <p class="appraisal-score">综合得分 <strong>${ap.score}</strong></p>
        <p>${ap.note}</p>
        <p class="muted">风险变动 ${ap.riskDelta >= 0 ? '+' : ''}${ap.riskDelta}</p>
      </div>
      <div class="doc-actions">
        <button class="btn" data-focus="zj">侧重政绩</button>
        <button class="btn" data-focus="mx">侧重民生</button>
        <button class="btn" data-focus="lian">侧重廉洁</button>
        <button class="btn btn-primary" data-act="ok">签收</button>
      </div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onDismissAppraisal)
  requestAnimationFrame(() => overlay.classList.add('show'))
  overlay.querySelector('[data-act="ok"]')!.addEventListener('click', h.onDismissAppraisal)
  overlay.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      s.flags.appraisalFocus = btn.dataset.focus || 'zj'
      h.onDismissAppraisal()
    })
  })
}

function mountAchievements(root: HTMLElement, s: GameState, h: AppHandlers) {
  // 当前存档的解锁记录 + 云同步回来的历史解锁合集
  const unlocked = new Set<string>([...(s.achievements ?? []), ...loadSyncedAchievements()])
  const doneOrigins = loadOriginsDone()
  const items = ACHIEVEMENTS.map((a) => {
    const got = unlocked.has(a.id)
    return `<div class="ach-row${got ? ' got' : ''}">
      <strong>${a.name}</strong>
      <span>${got ? '已解锁 · ' + a.desc : a.desc}</span>
    </div>`
  }).join('')
  const originLine = `出身通关 ${doneOrigins.length}/${ORIGINS.length}`
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal ach-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">生涯成就</div>
          <div class="npc-modal-role">已解锁 ${unlocked.size} / ${ACHIEVEMENTS.length} · ${originLine}</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
        <button class="btn" data-act="share">分享卡</button>
      </div>
      <div class="ach-list">${items}</div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onCloseAchievements)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onCloseAchievements)
  overlay.querySelector('[data-act="share"]')?.addEventListener('click', h.onShareCard)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) h.onCloseAchievements()
  })
}

function mountMilestone(root: HTMLElement, s: GameState, h: AppHandlers) {
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="doc milestone-card" role="dialog">
      <div class="doc-header">
        <div class="doc-org">组织人事</div>
        <div class="doc-title">履新</div>
      </div>
      <div class="doc-body">${s.milestones.map((m) => `<p>${m}</p>`).join('')}</div>
      <div class="doc-actions">
        <button class="btn btn-primary" data-act="ok">知道了</button>
      </div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onDismissMilestone)
  requestAnimationFrame(() => overlay.classList.add('show'))
  overlay.querySelector('[data-act="ok"]')!.addEventListener('click', h.onDismissMilestone)
}

function mountMonthSummary(root: HTMLElement, s: GameState, h: AppHandlers) {
  const sum = s.lastMonthSummary!
  const overlay = el('div', 'npc-overlay show summary-overlay')
  const proj =
    sum.projectUpdates.length > 0
      ? `<ul class="summary-list">${sum.projectUpdates.map((u) => `<li>${u}</li>`).join('')}</ul>`
      : `<p class="muted">台账无明显进展。</p>`
  overlay.innerHTML = `
    <div class="npc-modal summary-modal" role="dialog">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">月度小结</div>
          <div class="npc-modal-role">${sum.year}.${String(sum.month).padStart(2, '0')}</div>
        </div>
        <button class="btn btn-primary" data-act="ok">继续</button>
      </div>
      <ul class="summary-list">
        ${sum.lines.map((l) => `<li>${l}</li>`).join('')}
      </ul>
      ${proj}
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onDismissSummary)
  overlay.querySelector('[data-act="ok"]')!.addEventListener('click', h.onDismissSummary)
}

function mountActionModal(root: HTMLElement, s: GameState, h: AppHandlers) {
  const a = getAction(s.pendingActionId as ActionId)
  const overlay = el('div', 'npc-overlay show')
  const vars = a.variants
    .map((v) => {
      return `<button class="choice action-variant" data-var="${v.id}">
        <span class="choice-index">·</span>
        <span class="choice-body">
          <span class="choice-label">${v.label}</span>
          ${v.hint ? `<span class="choice-hint">${v.hint}</span>` : ''}
        </span>
      </button>`
    })
    .join('')
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog" aria-label="${a.name}">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">${a.name}</div>
          <div class="npc-modal-role">消耗 ${a.cost} 行动点 · 剩 ${s.actionPoints}/${s.maxActionPoints}</div>
        </div>
        <button class="btn btn-ghost" data-act="cancel">取消</button>
      </div>
      <p class="npc-modal-intro">${a.desc}</p>
      <div class="npc-acts action-variants">${vars}</div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onCancelAction)
  overlay.querySelector('[data-act="cancel"]')!.addEventListener('click', h.onCancelAction)
  overlay.querySelectorAll<HTMLButtonElement>('[data-var]').forEach((btn) => {
    btn.addEventListener('click', () => h.onActionVariant(a.id, btn.dataset.var!))
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) h.onCancelAction()
  })
}

function mountDutyModal(root: HTMLElement, s: GameState, h: AppHandlers) {
  const run = s.dutyRun!
  const item = getDutyItem(run.itemId)
  const meta = DUTY_META.find((d) => d.kind === run.kind)
  const overlay = el('div', 'npc-overlay show')
  if (run.done || !item) {
    overlay.innerHTML = `
      <div class="npc-modal" role="dialog" aria-label="公务办结">
        <div class="npc-modal-head">
          <div>
            <div class="npc-modal-name">${meta?.name ?? '公务'} · 办结</div>
            <div class="npc-modal-role">本月质量 ${Math.round(run.score)}</div>
          </div>
        </div>
        <p class="npc-modal-intro">${run.resultText || '办完了。'}</p>
        <div class="npc-acts">
          <button class="npc-act" data-duty="close"><strong>收文</strong><span>回到对局</span></button>
        </div>
      </div>
    `
  } else {
    const pishiLeft = run.kind === 'pishi' ? run.queue.length + 1 : 0
    const progress =
      run.kind === 'pishi'
        ? `来文 ${4 - pishiLeft + 1}/4`
        : item.stepLabel || `第 ${run.step + 1} 轮`
    overlay.innerHTML = `
      <div class="npc-modal" role="dialog" aria-label="${item.title}">
        <div class="npc-modal-head">
          <div>
            <div class="npc-modal-name">${meta?.name ?? '公务'} · ${progress}</div>
            <div class="npc-modal-role">质量走势 ${Math.round(run.score)} · 行动点 ${s.actionPoints}</div>
          </div>
        </div>
        <p class="npc-modal-intro"><strong>${item.title}</strong><br/>${item.text}</p>
        <div class="npc-acts">
          ${item.choices
            .map(
              (c) => `
            <button class="npc-act" data-duty-choice="${c.id}">
              <strong>${c.label}</strong>
              <span>${c.hint || ''}</span>
            </button>`,
            )
            .join('')}
        </div>
      </div>
    `
  }
  root.append(overlay)
  if (run.done) wireModal(overlay, h.onDismissDuty)
  overlay.querySelector('[data-duty="close"]')?.addEventListener('click', h.onDismissDuty)
  overlay.querySelectorAll<HTMLButtonElement>('[data-duty-choice]').forEach((btn) => {
    btn.addEventListener('click', () => h.onDutyChoice(btn.dataset.dutyChoice!))
  })
}

function mountNpcModal(root: HTMLElement, s: GameState, h: AppHandlers) {
  const id = s.openNpcId!
  const def = getNpc(id)
  const ref = s.npcs.find((n) => n.id === id)
  const favor = ref?.favor ?? 0
  const rank = getPost(s.postId).rank
  const visIds = new Set(npcsVisibleAt(rank).map((n) => n.id))
  const bonded = isBond(s, id) && !visIds.has(id)
  const letterCd = s.bondLetterCd ?? 0
  const patronReady = bonded && favor >= PATRON_FAVOR && !s.flags.patronAssist
  const overlay = el('div', 'npc-overlay show')
  const acts = bonded
    ? `
      <p class="muted" style="margin:0 0 8px">已不在本阶段交往圈。可写信维系，或请关键靠山铺路。</p>
      <button class="npc-act${letterCd > 0 || !!s.currentEventId ? ' choice-locked' : ''}" data-bond="letter" ${letterCd > 0 || !!s.currentEventId ? 'disabled' : ''}>
        <strong>写信维系</strong><span>${letterCd > 0 ? `冷却还剩 ${letterCd} 个月` : '不耗行动点 · 好感上升 · 冷却 3 个月'}</span>
      </button>
      <button class="npc-act${!patronReady ? ' choice-locked' : ''}" data-bond="patron" ${!patronReady ? 'disabled' : ''}>
        <strong>请靠山铺路</strong><span>${s.flags.patronAssist ? '助力已在生效' : favor < PATRON_FAVOR ? `好感需≥${PATRON_FAVOR}（现 ${favor}）` : '耗好感 25 · 12 个月内放宽门槛与票决'}</span>
      </button>
    `
    : NPC_ACTS.map((act) => {
        const locked = s.actionPoints < act.cost || !!s.currentEventId
        return `<button class="npc-act${locked ? ' choice-locked' : ''}" data-npc-act="${act.id}" ${locked ? 'disabled' : ''}>
          <strong>${act.name}</strong><span>${act.desc}</span>
        </button>`
      }).join('')
  const bondLabel = bonded ? (favor >= PATRON_FAVOR ? ' · 关键靠山' : ' · 羁绊') : ''
  overlay.innerHTML = `
    <div class="npc-modal" role="dialog" aria-label="${def.name}">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">${def.name}${bondLabel}</div>
          <div class="npc-modal-role">${def.role}</div>
        </div>
        <button class="btn btn-ghost" data-act="close">关闭</button>
      </div>
      <div class="npc-modal-tags">${def.tags.map((t) => `<i>${t}</i>`).join('')}</div>
      <p class="npc-modal-intro">${def.intro}</p>
      <div class="npc-modal-fav">好感 <strong class="${favorClass(favor)}">${favor > 0 ? '+' : ''}${favor}</strong>
        <span class="muted"> · 行动点 ${s.actionPoints}/${s.maxActionPoints}</span>
      </div>
      <div class="npc-acts">${acts}</div>
      <div class="npc-modal-fav" style="margin-top:10px">谈心谈话（月限 1 次）</div>
      <div class="npc-acts" style="margin-bottom:8px">
        <button class="npc-act" data-tx="guanxin" ${(s.tanxinCd ?? 0) > 0 || s.currentEventId || s.actionPoints < 1 ? 'disabled class="npc-act choice-locked"' : ''}>
          <strong>关心困难</strong><span>涨好感与关系，降派系热度</span>
        </button>
        <button class="npc-act" data-tx="tiduan" ${(s.tanxinCd ?? 0) > 0 || s.currentEventId || s.actionPoints < 1 ? 'disabled class="npc-act choice-locked"' : ''}>
          <strong>点出问题</strong><span>涨廉洁降风险，好感略降</span>
        </button>
        <button class="npc-act" data-tx="yala" ${(s.tanxinCd ?? 0) > 0 || s.currentEventId || s.actionPoints < 1 ? 'disabled class="npc-act choice-locked"' : ''}>
          <strong>拍桌施压</strong><span>热度升，交情降</span>
        </button>
      </div>
      <div class="npc-modal-fav" style="margin-top:10px">名册标注</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${['伯乐', '对手', '清流', '风险', '同僚', '商人']
          .map((t) => `<button class="btn btn-ghost" data-roster-tag="${t}">${t}</button>`)
          .join('')}
      </div>
      <div class="npc-modal-fav" style="margin-top:10px">托人办事（耗好感）</div>
      <div class="npc-acts">
        <button class="npc-act" data-favor="info" ${favor < 15 ? 'disabled class="npc-act choice-locked"' : ''}>
          <strong>打听风声</strong><span>好感≥15 · 耗8 · 风险−4</span>
        </button>
        <button class="npc-act" data-favor="risk" ${favor < 25 ? 'disabled class="npc-act choice-locked"' : ''}>
          <strong>请托过问</strong><span>好感≥25 · 耗15 · 风险−12</span>
        </button>
        <button class="npc-act" data-favor="promo" ${favor < 35 ? 'disabled class="npc-act choice-locked"' : ''}>
          <strong>程序上说句话</strong><span>好感≥35 · 耗20 · 票决助力</span>
        </button>
      </div>
    </div>
  `
  root.append(overlay)
  wireModal(overlay, h.onCloseNpc)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', h.onCloseNpc)
  overlay.querySelectorAll<HTMLButtonElement>('[data-npc-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.npcAct as NpcActId
      h.onNpcAct(id, act)
    })
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-bond]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.bond === 'letter') h.onBondLetter(id)
      else h.onPatronAssist(id)
    })
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-roster-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      h.onRosterTag(id, btn.dataset.rosterTag || '')
    })
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      h.onTanxin(id, btn.dataset.tx as 'guanxin' | 'tiduan' | 'yala')
    })
  })
  overlay.querySelectorAll<HTMLButtonElement>('[data-favor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      h.onAskFavor(id, btn.dataset.favor as 'risk' | 'promo' | 'info')
    })
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) h.onCloseNpc()
  })
}

function buildRelationSvg(
  _s: GameState,
  rows: { id: string; favor: number }[],
): string {
  // 6 人以内单环；再多拆成内外双环，避免节点挤成一团
  const dual = rows.length > 6
  const w = dual ? 264 : 240
  const h = dual ? 232 : 200
  const cx = w / 2
  const cy = h / 2
  const parts: string[] = []
  parts.push(
    `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">`,
  )
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="22" fill="#a63a2b" />`,
  )
  parts.push(
    `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#fff" font-size="10" font-family="sans-serif">我</text>`,
  )

  const ring = (refs: { id: string; favor: number }[], rad: number, offset: number) => {
    const n = Math.max(1, refs.length)
    refs.forEach((ref, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2 + offset
      const x = cx + Math.cos(ang) * rad
      const y = cy + Math.sin(ang) * rad
      const fav = ref.favor
      const color = fav >= 30 ? '#2f6b4f' : fav <= -10 ? '#8b1e1e' : '#5c6b73'
      const r = 10 + Math.min(6, Math.abs(fav) / 12)
      parts.push(
        `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="${fav >= 30 ? 2.5 : 1.5}" opacity="0.85" />`,
      )
      parts.push(
        `<circle data-npc="${ref.id}" cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.92"><title>${getNpc(ref.id).name} ${fav > 0 ? '+' : ''}${fav}</title></circle>`,
      )
      const short = getNpc(ref.id).name.slice(0, 2)
      parts.push(
        `<text x="${x}" y="${y + 3}" text-anchor="middle" fill="#fff" font-size="9" font-family="sans-serif" pointer-events="none">${short}</text>`,
      )
    })
  }

  if (dual) {
    const innerCount = Math.ceil(rows.length / 2)
    ring(rows.slice(0, innerCount), 58, 0)
    ring(rows.slice(innerCount), 96, Math.PI / innerCount)
  } else {
    ring(rows, 72, 0)
  }

  parts.push('</svg>')
  parts.push(
    `<p class="muted graph-legend">线粗/色=好感 · 绿=亲近 红=疏远 · 点节点可互动</p>`,
  )
  return parts.join('')
}

function panelHead(title: string, sub?: string) {
  const h = el('div', 'panel-head')
  h.innerHTML = `<h3>${title}</h3>${sub ? `<span>${sub}</span>` : ''}`
  return h
}

/* ── 更新日志弹窗 ─────────────────────────────────── */

function mountChangelog(root: HTMLElement) {
  const overlay = el('div', 'npc-overlay show')
  const body = CHANGELOG.map(
    (e) => `
      <section class="cl-entry">
        <div class="cl-head">
          <span class="cl-ver">${e.ver}</span>
          <span class="cl-date">${e.date}</span>
        </div>
        <ul class="cl-list">
          ${e.items
            .map(
              (it) =>
                `<li><span class="cl-kind cl-${kindClass(it.kind)}">${it.kind}</span><span class="cl-text">${it.text}</span></li>`,
            )
            .join('')}
        </ul>
      </section>
    `,
  ).join('')
  overlay.innerHTML = `
    <div class="npc-modal cl-modal" role="dialog" aria-label="更新日志">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">更新日志</div>
          <div class="npc-modal-role">当前版本 ${latestVersion()}</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <div class="cl-body">${body}</div>
      <p class="muted cl-note">本作为架空虚构作品，人物、机构、事件均为虚构，制度设定为玩法化压缩，与现实无关。</p>
    </div>
  `
  root.append(overlay)
  const close = () => overlay.remove()
  wireModal(overlay, close)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', close)
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) close()
  })
}

function kindClass(kind: string) {
  if (kind === '新增') return 'add'
  if (kind === '修复') return 'fix'
  return 'polish'
}

/* ── 玩家 QQ 群弹窗 ─────────────────────────────────── */

const QQ_GROUP = '1107570877'

function mountQqGroup(root: HTMLElement) {
  const overlay = el('div', 'npc-overlay show')
  overlay.innerHTML = `
    <div class="npc-modal qq-modal" role="dialog" aria-label="玩家交流群">
      <div class="npc-modal-head">
        <div>
          <div class="npc-modal-name">玩家交流群</div>
          <div class="npc-modal-role">反馈问题 · 交流玩法 · 找同僚</div>
        </div>
        <button class="btn btn-primary" data-act="close">关闭</button>
      </div>
      <div class="qq-body">
        <p class="qq-lead">官途玩家交流群（QQ）</p>
        <div class="qq-number" title="点击复制">${QQ_GROUP}</div>
        <button class="btn btn-primary btn-block" data-act="copy" type="button">复制群号</button>
        <p class="muted qq-note">打开 QQ → 加群 / 找群 → 粘贴群号申请加入。版本更新与玩法说明会同步在群里。</p>
      </div>
    </div>
  `
  root.append(overlay)
  const close = () => overlay.remove()
  wireModal(overlay, close)
  overlay.querySelector('[data-act="close"]')!.addEventListener('click', close)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
  const copyBtn = overlay.querySelector<HTMLButtonElement>('[data-act="copy"]')!
  const done = () => {
    copyBtn.textContent = '已复制，去 QQ 粘贴'
    window.setTimeout(() => {
      copyBtn.textContent = '复制群号'
    }, 1800)
  }
  copyBtn.addEventListener('click', () => {
    const write = navigator.clipboard?.writeText(QQ_GROUP)
    if (write) {
      write.then(done).catch(() => copyViaTextarea(done))
    } else {
      copyViaTextarea(done)
    }
  })
}

/** 剪贴板 API 不可用时的降级（旧浏览器 / 非安全上下文） */
function copyViaTextarea(done: () => void) {
  const ta = document.createElement('textarea')
  ta.value = QQ_GROUP
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.append(ta)
  ta.select()
  try {
    document.execCommand('copy')
    done()
  } catch {
    const btn = document.querySelector<HTMLButtonElement>('[data-act="copy"]')
    if (btn) btn.textContent = '复制失败，请手动记下群号'
  }
  ta.remove()
}

/**
 * 弹层通用交互：Esc 关闭、打开即聚焦首个可交互元素、Tab 焦点圈定。
 *
 * 渲染是全量重建，弹层关闭必然伴随一次重建、节点离开文档树，因此监听器
 * 用 isConnected 自清理，不需要显式 unmount。
 *
 * 只用于「有退出路径」的弹层；强制决策（表决、签收、来访）不接，避免 Esc
 * 把流程卡在中间态。
 */
function wireModal(overlay: HTMLElement, onClose: () => void) {
  overlay.tabIndex = -1
  const focusables = (): HTMLElement[] =>
    Array.from(
      overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
  const first = focusables()[0]
  if (first) first.focus()
  else overlay.focus()

  const onKey = (e: KeyboardEvent) => {
    if (!overlay.isConnected) {
      document.removeEventListener('keydown', onKey)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const list = focusables()
    if (list.length === 0) return
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && (active === list[0] || !overlay.contains(active))) {
      e.preventDefault()
      list[list.length - 1].focus()
    } else if (!e.shiftKey && (active === list[list.length - 1] || !overlay.contains(active))) {
      e.preventDefault()
      list[0].focus()
    }
  }
  document.addEventListener('keydown', onKey)
}

function mountDocument(root: HTMLElement, s: GameState, h: AppHandlers) {
  const doc = s.pendingDocument!
  const overlay = el('div', 'doc-overlay')
  const body = localizePlace(doc.body, s.provinceId).replace(/\n/g, '<br>')
  overlay.innerHTML = `
    <div class="doc" role="dialog" aria-label="${doc.title}">
      <div class="doc-header">
        <div class="doc-org">${localizePlace(doc.sealText, s.provinceId)}</div>
        <div class="doc-title">${doc.title}</div>
      </div>
      <div class="doc-body">${body}</div>
      <div class="doc-seal" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="100%" height="100%">
          <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(194,59,42,0.9)" stroke-width="5"/>
          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(194,59,42,0.75)" stroke-width="1.5"/>
          <path d="M60 36 L67 52 L84 54 L71.5 65 L75 82 L60 73 L45 82 L48.5 65 L36 54 L53 52 Z" fill="rgba(194,59,42,0.9)"/>
          <path id="sealArcDoc" d="M20,60 a40,40 0 1,1 80,0" fill="none"/>
          <text fill="rgba(194,59,42,0.95)" font-size="13" font-family="serif" letter-spacing="3">
            <textPath href="#sealArcDoc" startOffset="50%" text-anchor="middle">${doc.sealText}</textPath>
          </text>
          <text x="60" y="100" text-anchor="middle" fill="rgba(194,59,42,0.9)" font-size="11" font-family="serif">人事专用</text>
        </svg>
      </div>
      <div class="doc-actions">
        <button class="btn btn-primary" data-act="ack">签收</button>
      </div>
    </div>
  `
  root.append(overlay)
  requestAnimationFrame(() => overlay.classList.add('show'))
  overlay.querySelector('[data-act="ack"]')!.addEventListener('click', h.onAckDocument)
}

function renderEnding(root: HTMLElement, s: GameState, h: AppHandlers) {
  const ending = ENDINGS.find((e) => e.id === s.endingId)
  const post = getPost(s.postId)
  const L = (t: string) => localizePlace(t, s.provinceId)
  const wrap = el('div', 'screen ending-screen')
  wrap.innerHTML = `
    <div class="paper ending-card">
      <div class="paper-tab">终局档案</div>
      <div class="title-kicker">${chapterOf(s.postId)}</div>
      <h1>${ending?.title ?? '落幕'}</h1>
      <div class="title-rule"></div>
      <p class="ending-summary">${L(ending?.summary ?? '')}</p>
      <p class="ending-origin">${L(originEpilogue(s))}</p>
      <p class="ending-origin">${L(originEndingLine(s))}</p>
      <div class="ending-stats">
        <div><span>岗位</span><strong>${localizePostTitle(post.title, s.provinceId)}</strong></div>
        <div><span>职务层次</span><strong>${post.level}（${post.levelShort}）</strong></div>
        <div><span>出身</span><strong>${String(s.flags.originName || '—')}</strong></div>
        <div><span>省份</span><strong>${getProvince(s.provinceId).name}</strong></div>
        <div><span>年龄</span><strong>${s.age} 岁</strong></div>
        <div><span>时间</span><strong>${s.year}.${String(s.month).padStart(2, '0')}</strong></div>
        <div><span>五维</span><strong>政 ${s.attrs.ZJ} · 关 ${s.attrs.GX} · 廉 ${s.attrs.Lian} · 民 ${s.attrs.MX} · 能 ${s.attrs.NL}</strong></div>
        <div><span>风险</span><strong class="${riskClass(s.risk)}">${Math.round(s.risk)} · ${riskLevel(s.risk)}</strong></div>
        <div><span>本局评分</span><strong>${computeScore(s)}（${scoreLabel(computeScore(s))}）</strong></div>
      </div>
      <p class="title-note">架空模拟 · 地名人名虚构 · 仅供娱乐</p>
      <div class="title-actions">
        <button class="btn btn-primary" data-act="again">再走一遭</button>
        <button class="btn" data-act="share">生成分享卡</button>
      </div>
    </div>
  `
  root.append(wrap)
  wrap.querySelector('[data-act="again"]')!.addEventListener('click', h.onRestart)
  wrap.querySelector('[data-act="share"]')!.addEventListener('click', h.onShareCard)
}
