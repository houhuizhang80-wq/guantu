import './style.css'
import type { AttrFx, GameState } from './types'
import { getEvent } from './data/events'
import { getOrigin } from './data/origins'
import { ENDINGS } from './data/endings'
import {
  applyFxToAttrs,
  applyNpcFx,
  clearSave,
  createNewGame,
  pushLog,
  pushTimeline,
  saveGame,
  clamp,
} from './state/game'
import { readSlot, clearSlot, exportSave, importSave } from './state/saves'
import { familyTick, familyApply } from './systems/family'
import { networkTick, firstTimeHint, pickNetworkNpc, maybeIntroduceNewNpc, syncBonds, maybeBondEvent, writeBondLetter, requestPatron, bondLetterTick } from './systems/network'
import { startDuty, chooseDuty, dismissDuty } from './systems/duty'
import {
  yuqingTick,
  doYuqing,
  hireSecretary,
  secretaryTick,
  setWeekPlan,
  settleWeekPlan,
  startResearch,
  advanceResearch,
  recommendTalent,
  setRosterTag,
  resetRosterYear,
} from './systems/office'
import type { ResearchDepth, YuqingAct } from './systems/office'
import type { DutyKind } from './types'
import { askFavor } from './systems/favors'
import { noteFloat, maybeOrgTalk, networkDrama, resolveVisit, clearFloat } from './systems/floats'
import { applySkipMonthCost } from './systems/engagement'
import {
  campaignTick,
  maybeDucha,
  resolveDucha,
  doTanxin,
  startCampaign,
  advanceCampaign,
  childTick,
  resolveChild,
  writeMemoir,
} from './systems/extra'
import type { CampaignAct, ChildChoice, DuchaChoice, MemoirMode } from './systems/extra'
import { focusBonus, maybeBurst, resolveBurst, factionHeatTick, resolveProjectChoice } from './systems/focus'
import { joinFaction, factionAct, maybeFactionEvent } from './systems/faction'
import { ageTick } from './systems/age'
import { enterRetired, retiredAct, focusEventBias, maybeIntroduce, recordPromoFail } from './systems/retired'
import { resolveVote } from './systems/faction'
import {
  noteChoice,
  noteEventHandled,
  noteAction,
} from './systems/engagement'
import { markEventUsed, meetsRequire, scheduleNextEvent } from './systems/events'
import { playStampSound } from './ui/audio'
import { maybeInvestigation, riskTick } from './systems/risk'
import { advanceJijian } from './systems/jijian'
import { monthlyDrift, startPromo, advancePromo, confirmAppointment, cancelPromo, availablePaths, canStartPromo } from './systems/promotion'
import { checkEnding } from './systems/ending'
import {
  type ActionId,
  type NpcActId,
  canDoAction,
  getAction,
  maxActionsForRank,
  npcAct,
} from './data/actions'
import {
  pickStartableProject,
  startProject,
  tickProjects,
} from './data/projects'
import { checkAchievements } from './data/achievements'
import { runAnnualAppraisal } from './systems/appraisal'
import { getPost } from './data/posts'
import { localizePlace } from './data/provinces'
import { renderApp, applyFontSize, getFontSize, resetWeekDraft, promptSavePassword } from './ui/render'
import { playStamp } from './ui/stamp'
import { initAudioFromStore, playPaperSound, playClickSound, playNotifySound, isMuted, setMuted, setVolume } from './ui/audio'
import { markCatalog, loadCatalog, mergeCatalog } from './state/catalog'
import { loadOriginsDone, mergeOriginsDone } from './state/origins_done'
import { renderShareCard, downloadDataUrl } from './ui/share'
import {
  GUIDE_STEPS,
  authNickname,
  authUser,
  changePassword,
  completePasswordReset,
  ensureProfile,
  guideDone,
  hasAgreed,
  passwordSignIn,
  requestPasswordReset,
  restoreSession,
  sendCode,
  setAgreed,
  setGuideDone,
  setLastEmail,
  signOutUser,
  verifyCode,
  type Challenge,
} from './state/auth'
import { checkNickname } from './data/banned_words'
import {
  bumpCounter,
  emptyCounters,
  generateAnnualGoals,
  goalSignLog,
  settleAnnualGoals,
} from './systems/goals'
import { maybeSecretaryCase, resolveSecCase } from './systems/secretary_case'
import { isReleaseOrigin } from './state/cloud'
import { afterSignIn, beforeSignOut } from './state/cloudsync'
import { schedulePushProgress } from './state/progress'
import { flushCloudPush } from './state/saves'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

let state: GameState = bootTitle()

/** 认证流程中待核验的验证码凭据（一次性，留在内存即可） */
let pendingChallenge: Challenge | null = null

/** 启动流程：协议 → 账号 → 引导 → 标题 */
function initialPhase(): GameState['phase'] {
  if (!hasAgreed()) return 'agreement'
  // 离线运行（file:// 与 localhost）没有云账号可用，直接进引导/标题
  if (!isReleaseOrigin()) return guideDone() ? 'title' : 'guide'
  // 正式站点一律要求登录：存档与账号都在云端，没有免登录游玩入口
  if (!authUser()) return 'auth'
  if (!guideDone()) return 'guide'
  return 'title'
}

state = {
  ...bootTitle(),
  phase: 'splash',
  flags: {
    ...bootTitle().flags,
    guideStep: 0,
  },
}

/**
 * 首屏进入：先恢复云账号登录态（会话存在才可能已登录），再决定落到哪个阶段。
 * 恢复失败一律按未登录处理，不阻塞进入游戏。
 */
async function boot() {
  if (isReleaseOrigin() && !authUser()) {
    try {
      await restoreSession()
    } catch {
      /* 网络异常按未登录处理 */
    }
  }
  state.phase = initialPhase()
  draw()
}

/**
 * 登录 / 注册成功后的统一收尾：同步云端存档与跨局进度，然后把用户送到账号中心
 * 让他看到同步结果。
 *
 * 同步失败不阻塞进入游戏 —— 数据仍在本机，下次登录会再同步一次。
 */
async function finishSignIn(nickname?: string) {
  pendingChallenge = null
  state.flags.authBusy = true
  state.flags.authCodeSent = false
  state.lastFeedback = { title: '正在同步', text: '正在从云端读取你的存档…' }
  draw()

  const report = await afterSignIn()
  if (nickname) await ensureProfile(nickname)

  state.flags.authBusy = false
  state.flags.authStage = 'home'
  const parts: string[] = []
  if (report.pulled) parts.push(`取回 ${report.pulled} 个云端存档`)
  if (report.pushed) parts.push(`上传 ${report.pushed} 个本机存档`)
  const detail = parts.length ? `（${parts.join('，')}）` : ''
  state.lastFeedback = report.ok
    ? { title: '已登录', text: `${authNickname()}，欢迎回来${detail}。` }
    : { title: '已登录，云端同步未完成', text: report.error || '稍后会自动重试同步。' }
  state.phase = 'auth'
  draw()
}

// 页面隐藏 / 关闭前，尽力把待推送的存档刷上去
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flushCloudPush()
})

function bootTitle(): GameState {
  return {
    phase: 'title',
    year: 2012,
    month: 7,
    turn: 0,
    originId: null,
    provinceId: null,
    pendingOriginId: undefined,
    postId: 'banshiyuan',
    age: 24,
    attrs: { ZJ: 15, GX: 15, Lian: 70, MX: 20, NL: 20 },
    risk: 5,
    faction: 'none',
    npcs: [],
    usedEvents: [],
    recentEvents: [],
    flags: {},
    log: [],
    currentEventId: null,
    pendingDocument: null,
    endingId: null,
    failStreak: 0,
    actionPoints: 0,
    maxActionPoints: 2,
    openNpcId: null,
    pendingActionId: null,
    lastFeedback: null,
    projects: [],
    lastMonthSummary: null,
    milestones: [],
    achievements: [],
    lastAppraisal: null,
    promo: null,
    probationLeft: 0,
    paths: ['difang'],
    jijian: null,
    punishLeft: 0,
    lastPunish: null,
    slot: 0,
    saveVer: 2,
    family: { spouse: false, spouseMood: 60, childAge: 0, parentHealth: 80 },
    factionRep: { A: 20, B: 20, local: 30 },
    timeline: [],
    eventsHandledThisPost: 0,
    choiceHistory: [],
    mashScore: 0,
    ffUsedThisYear: 0,
    lastActionKey: null,
    uiTab: 'duty',
    favorCooldown: 0,
    badAppraisalStreak: 0,
    focus: null,
    pendingBurst: null,
    pendingProjectChoice: null,
    factionHeat: 20,
    factionCd: 0,
    bondNpcIds: [],
    bondLetterCd: 0,
    dutyDone: [],
    dutyRun: null,
    dutyYearScore: 0,
    dutyMonthScore: 0,
    yuqingHeat: 12,
    yuqingActed: false,
    secretary: null,
    weekPlan: [null, null, null, null],
    weekPlanned: false,
    research: null,
    researchDone: [],
    rosterTags: {},
    rosterUsed: 0,
    duchaDone: false,
    duchaLast: null,
    tanxinCd: 0,
    campaign: null,
    childPath: 'none',
    memoirPages: 0,
    life: 1,
    inherit: [],
  }
}

function dateYMD() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function refreshActionCap() {
  const cap = maxActionsForRank(getPost(state.postId).rank)
  state.maxActionPoints = cap
  if (state.actionPoints > cap) state.actionPoints = cap
}

function startMonthActions() {
  refreshActionCap()
  state.actionPoints = state.maxActionPoints
}

function draw() {
  renderApp(app!, state, {
    onSplashNext: () => {
      void boot()
    },
    onAgree: () => {
      setAgreed()
      state.lastFeedback = null
      state.phase = initialPhase()
      draw()
    },
    onDisagree: () => {
      state.lastFeedback = {
        title: '需要同意协议',
        text: '请阅读并勾选同意《用户协议与游戏须知》后继续。',
      }
      draw()
    },
    onAuthStage: (stage) => {
      state.flags.authStage = stage
      state.flags.authCodeSent = false
      state.flags.authBusy = false
      state.lastFeedback = null
      // 换步骤时作废上一步的验证码凭据，避免串用
      if (stage !== 'home' && stage !== 'nick' && stage !== 'passwd') {
        pendingChallenge = null
        state.flags.authEmail = ''
      }
      draw()
    },
    onSendCode: async (email) => {
      const stage = String(state.flags.authStage || 'signin')
      if (!email) {
        state.lastFeedback = { title: '需要邮箱', text: '请先填写邮箱地址。' }
        draw()
        return
      }
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()

      // 重置密码走独立的发码通道：换到的是改密凭据，不是登录会话
      if (stage === 'reset') {
        const rr = await requestPasswordReset(email)
        state.flags.authBusy = false
        if (!rr.ok) {
          state.lastFeedback = { title: '发送失败', text: rr.error }
          draw()
          return
        }
        pendingChallenge = null
        state.flags.authEmail = email.trim()
        state.flags.authCodeSent = true
        setLastEmail(email)
        state.lastFeedback = {
          title: '验证码已发送',
          text: `验证码已发往 ${email.trim()}，请查收（也看一下垃圾邮件）。`,
        }
        draw()
        return
      }

      const r = await sendCode(email)
      state.flags.authBusy = false
      if (!r.ok) {
        state.lastFeedback = { title: '发送失败', text: r.error }
        draw()
        return
      }
      pendingChallenge = r.challenge
      state.flags.authEmail = email.trim()
      state.flags.authCodeSent = true
      setLastEmail(email)
      if (stage === 'signup' && r.challenge.isExistingUser) {
        // 该邮箱已可直接登录：改走登录流程，文案不透露账号是否存在
        state.flags.authStage = 'signin-code'
        state.lastFeedback = {
          title: '验证码已发送',
          text: `请查收 ${email.trim()} 的邮件，输入验证码完成登录。`,
        }
      } else {
        state.lastFeedback = {
          title: '验证码已发送',
          text: `验证码已发往 ${email.trim()}，请查收（也看一下垃圾邮件）。`,
        }
      }
      draw()
    },
    onPasswordLogin: async (email, password) => {
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()
      const r = await passwordSignIn(email, password)
      state.flags.authBusy = false
      if (!r.ok) {
        state.lastFeedback = { title: '登录失败', text: r.error }
        draw()
        return
      }
      await finishSignIn()
    },
    onCodeLogin: async (code) => {
      const email = String(state.flags.authEmail || '')
      if (!pendingChallenge) {
        state.flags.authCodeSent = false
        state.lastFeedback = { title: '验证码已失效', text: '请重新获取验证码。' }
        draw()
        return
      }
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()
      const r = await verifyCode({
        email,
        verificationId: pendingChallenge.verificationId,
        isExistingUser: pendingChallenge.isExistingUser,
        code,
      })
      state.flags.authBusy = false
      if (!r.ok) {
        state.lastFeedback = { title: '登录失败', text: r.error }
        draw()
        return
      }
      await finishSignIn()
    },
    onSignupDone: async (code, nickname, password) => {
      const email = String(state.flags.authEmail || '')
      if (!pendingChallenge) {
        state.flags.authCodeSent = false
        state.lastFeedback = { title: '验证码已失效', text: '请重新获取验证码。' }
        draw()
        return
      }
      if (nickname.trim().length < 2) {
        state.lastFeedback = { title: '昵称太短', text: '昵称至少 2 个字符。' }
        draw()
        return
      }
      const nickCheck = checkNickname(nickname)
      if (!nickCheck.ok) {
        state.lastFeedback = { title: '昵称不合规', text: nickCheck.reason || '请换一个昵称。' }
        draw()
        return
      }
      if (password.length < 6) {
        state.lastFeedback = { title: '密码太短', text: '密码至少 6 位。' }
        draw()
        return
      }
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()
      const r = await verifyCode({
        email,
        verificationId: pendingChallenge.verificationId,
        isExistingUser: pendingChallenge.isExistingUser,
        code,
        password,
      })
      state.flags.authBusy = false
      if (!r.ok) {
        state.lastFeedback = { title: '注册失败', text: r.error }
        draw()
        return
      }
      await finishSignIn(nickname.trim())
    },
    onResetDone: async (code, newPassword) => {
      if (newPassword.length < 6) {
        state.lastFeedback = { title: '密码太短', text: '新密码至少 6 位。' }
        draw()
        return
      }
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()
      const r = await completePasswordReset(code, newPassword)
      state.flags.authBusy = false
      if (!r.ok) {
        state.lastFeedback = { title: '重置失败', text: r.error }
        draw()
        return
      }
      await finishSignIn()
    },
    onSaveNickname: async (nickname) => {
      const nickCheck = checkNickname(nickname)
      if (!nickCheck.ok) {
        state.flags.authStage = 'nick'
        state.lastFeedback = { title: '昵称不合规', text: nickCheck.reason || '请换一个昵称。' }
        draw()
        return
      }
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()
      await ensureProfile(nickname)
      state.flags.authBusy = false
      state.flags.authStage = 'home'
      state.lastFeedback = { title: '已保存', text: `昵称已更新为「${nickname}」。` }
      draw()
    },
    onChangePassword: async (oldPassword, newPassword) => {
      state.flags.authBusy = true
      state.lastFeedback = null
      draw()
      const r = await changePassword(oldPassword, newPassword)
      state.flags.authBusy = false
      state.flags.authStage = 'home'
      state.lastFeedback = r.ok
        ? { title: '密码已更新', text: '下次登录请使用新密码。' }
        : { title: '修改失败', text: r.error }
      draw()
    },
    onAuthContinue: () => {
      state.lastFeedback = null
      state.flags.authStage = 'home'
      state.phase = initialPhase()
      if (state.phase === 'auth') state.phase = guideDone() ? 'title' : 'guide'
      draw()
    },
    onAuthSkip: () => {
      // 仅用于「本机离线运行」提示页（file:// 或本地地址）：不创建任何账号身份，
      // 也不写任何登录标记。正式站点不会走到这里 —— 未登录一律停在登录页。
      state.lastFeedback = null
      state.flags.authStage = 'signin'
      state.phase = guideDone() ? 'title' : 'guide'
      draw()
    },
    onLogout: async () => {
      await beforeSignOut()
      await signOutUser()
      pendingChallenge = null
      state.flags.authStage = 'signin'
      state.flags.authCodeSent = false
      state.flags.authBusy = false
      state.flags.authEmail = ''
      state.lastFeedback = {
        title: '已退出登录',
        text: '本机已清除这个账号的离线缓存，云端存档不受影响。',
      }
      state.phase = 'auth'
      draw()
    },
    onGuideStep: (delta) => {
      const cur = (state.flags.guideStep as number) || 0
      const next = cur + delta
      if (next >= GUIDE_STEPS.length) {
        setGuideDone()
        state.phase = 'title'
        draw()
        return
      }
      state.flags.guideStep = Math.max(0, next)
      draw()
    },
    onGuideDone: () => {
      setGuideDone()
      state.phase = 'title'
      draw()
    },
    onGuideSkip: () => {
      setGuideDone()
      state.phase = 'title'
      draw()
    },
    onOpenAgreement: () => {
      state.phase = 'agreement'
      draw()
    },
    onOpenGuide: () => {
      state.flags.guideStep = 0
      state.phase = 'guide'
      draw()
    },
    onOpenAuth: () => {
      state.phase = 'auth'
      draw()
    },
    onOpenSlots: () => {
      state.phase = 'slots'
      draw()
    },
    onOpenSettings: () => {
      state.phase = state.phase === 'play' ? 'play' : 'title'
      state.showSettings = true
      draw()
    },
    onCloseSettings: () => {
      state.showSettings = false
      state.showTimeline = false
      state.showHelp = false
      state.showCatalog = false
      if (state.phase === 'slots' || state.phase === 'settings') state.phase = 'title'
      draw()
    },
    onPickSlot: (i) => {
      const loaded = readSlot(i)
      if (!loaded) {
        state.slotPick = i
        const ownerId = authUser()?.id ?? ''
        const ownerNick = authNickname()
        state = {
          ...bootTitle(),
          phase: 'origin',
          slot: i,
          flags: { authUser: ownerId, authNick: ownerNick, guideStep: 0 },
        }
        draw()
        return
      }
      state = loaded
      refreshActionCap()
      if (state.phase === 'play' && !state.currentEventId && !state.pendingDocument) {
        pullEvent()
      }
      draw()
    },
    onDeleteSlot: (i) => {
      if (!confirm(`删除槽位 ${i + 1} 的存档？此操作不可恢复。`)) return
      clearSlot(i)
      draw()
    },
    onExportSave: () => {
      promptSavePassword({
        title: '设置导出密码',
        confirmMode: true,
        onSubmit: async (password) => {
          const base =
            state.phase === 'play' || state.phase === 'document'
              ? state
              : (readSlot(state.slot ?? 0) ?? state)
          try {
            const enc = await exportSave(base, password, {
              catalog: loadCatalog(),
              originsDone: loadOriginsDone(),
              promoFails: state.promoFailLog || [],
              exportedAt: new Date().toISOString(),
            })
            const blob = new Blob([enc], { type: 'application/octet-stream' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `官途存档-${dateYMD()}-${loadCatalog().length}鉴.guantu`
            a.click()
            URL.revokeObjectURL(a.href)
            state.lastFeedback = {
              title: '已加密导出',
              text: `存档已用 AES-GCM 导出（非明文）。当前图鉴 ${loadCatalog().length} 项、出身通关 ${loadOriginsDone().length}/16。请牢记导出密码，丢失无法解开。`,
            }
          } catch (e) {
            state.lastFeedback = {
              title: '导出失败',
              text: e instanceof Error ? e.message : '导出失败，请重试。',
            }
          }
          draw()
        },
      })
    },
    onImportSave: (text) => {
      const slot = state.slotPick ?? state.slot ?? 0
      if (!text || !text.trim()) {
        state.lastFeedback = { title: '导入失败', text: '文件为空或无法读取。' }
        draw()
        return
      }
      const runImport = (password?: string) => {
        void importSave(text, slot, password).then((r) => {
          if (r.needPassword) {
            promptSavePassword({
              title: '输入解密密码',
              onSubmit: (p) => runImport(p),
              onCancel: () => {
                state.lastFeedback = { title: '已取消导入', text: '未写入任何存档。' }
                draw()
              },
            })
            return
          }
          if (!r.ok) {
            state.lastFeedback = {
              title: '导入失败',
              text: r.error || '无法解析存档。请确认是官途导出的 .guantu 或旧版备份。',
            }
            draw()
            return
          }
          if (r.progress) {
            if (r.progress.catalog?.length) mergeCatalog(r.progress.catalog)
            if (r.progress.originsDone?.length) mergeOriginsDone(r.progress.originsDone)
          }
          state = r.state!
          state.phase = 'play'
          if (!state.currentEventId) pullEvent()
          draw()
        })
      }
      runImport()
    },
    onToggleTimeline: () => {
      state.showTimeline = !state.showTimeline
      draw()
    },
    onFamilyCare: () => {
      if (state.currentEventId) return
      if (state.actionPoints < 1) {
        state.lastFeedback = { title: '行动点不足', text: '顾家需要 1 点行动。' }
        draw()
        return
      }
      state.actionPoints -= 1
      familyApply(state, { mood: 12, parent: 6 })
      state.attrs.MX = clamp(state.attrs.MX + 2)
      state.attrs.NL = clamp(state.attrs.NL + 1)
      state.attrs.ZJ = clamp(state.attrs.ZJ - 1)
      pushLog(state, '【家属】你回家吃了顿热饭，陪父母说了会话。')
      state.lastFeedback = { title: '顾家', text: '家里的气氛缓了一些。父母精神也好些。' }
      saveGame(state)
      draw()
    },
    onToggleHelp: () => {
      state.showHelp = !state.showHelp
      draw()
    },
    onUiTab: (tab) => {
      state.uiTab = tab
      draw()
    },
    onToggleTheme: () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = state.theme || 'light'
      draw()
    },
    onCatalogOrigin: (id) => {
      state.catalogOrigin = id
      draw()
    },
    onCatalogFlavor: (id) => {
      state.catalogFlavor = id
      draw()
    },
    onCatalogStage: (id) => {
      state.catalogStage = id
      draw()
    },
    onShareCard: () => {
      try {
        const url = renderShareCard(state)
        if (url) downloadDataUrl(url, `官途分享卡-${state.endingId || '生涯'}.png`)
        else state.lastFeedback = { title: '分享卡', text: '生成失败，请重试。' }
      } catch {
        state.lastFeedback = { title: '分享卡', text: '当前环境不支持导出图片。' }
      }
      draw()
    },
    onToggleMute: () => {
      setMuted(!isMuted())
      draw()
    },
    onSetVolume: (v) => {
      setVolume(v)
    },
    onSetFont: (v) => {
      applyFontSize(v)
      draw()
    },
    onRetiredAct: (kind) => {
      const r = retiredAct(state, kind)
      state.lastFeedback = { title: '退休余热', text: r.text }
      if (r.end) {
        state.endingId = 'tuixiu'
        state.phase = 'ending'
      }
      saveGame(state)
      draw()
    },
    onResolveVote: (choice) => {
      const r = resolveVote(state, choice)
      state.lastFeedback = { title: '会议表决', text: r }
      saveGame(state)
      draw()
    },
    onResolveSecCase: (choice) => {
      const r = resolveSecCase(state, choice)
      state.lastFeedback = { title: '身边人出事', text: r.text }
      saveGame(state)
      draw()
    },
    onShowFailLog: () => {
      state.showFailLog = !state.showFailLog
      draw()
    },
    onShowInfo: (title, text) => {
      state.lastFeedback = { title, text }
      draw()
    },
    onToggleCatalog: () => {
      state.showCatalog = !state.showCatalog
      state.showSettings = false
      draw()
    },
    onAskFavor: (npcId, kind) => {
      if (state.currentEventId) {
        state.lastFeedback = { title: '还不能托人', text: '请先处置本月事件。' }
        draw()
        return
      }
      const r = askFavor(state, npcId, kind)
      state.lastFeedback = { title: '托人办事', text: r.text }
      saveGame(state)
      draw()
    },
    onBondLetter: (npcId) => {
      if (state.currentEventId) {
        state.lastFeedback = { title: '还不能写信', text: '请先处置本月事件。' }
        draw()
        return
      }
      const r = writeBondLetter(state, npcId)
      state.lastFeedback = { title: '羁绊写信', text: r.text }
      if (r.ok) pushLog(state, `【羁绊】${r.text}`)
      saveGame(state)
      draw()
    },
    onPatronAssist: (npcId) => {
      if (state.currentEventId) {
        state.lastFeedback = { title: '还不能请托', text: '请先处置本月事件。' }
        draw()
        return
      }
      const r = requestPatron(state, npcId)
      state.lastFeedback = { title: '请靠山铺路', text: r.text }
      saveGame(state)
      draw()
    },
    onStartDuty: (kind: DutyKind) => {
      if (state.currentEventId) {
        state.lastFeedback = { title: '还不能办差', text: '请先处置本月事件。' }
        draw()
        return
      }
      startDuty(state, kind)
      saveGame(state)
      draw()
    },
    onDutyChoice: (choiceId: string) => {
      const r = chooseDuty(state, choiceId)
      if (r.finished) {
        state.lastFeedback = { title: '公务办结', text: r.text }
        bumpCounter(state, 'duties')
      }
      saveGame(state)
      draw()
    },
    onDismissDuty: () => {
      dismissDuty(state)
      saveGame(state)
      draw()
    },
    onYuqing: (act: YuqingAct) => {
      const r = doYuqing(state, act)
      state.lastFeedback = { title: '舆情应对', text: r.text }
      if (r.ok) pushLog(state, `【舆情】${r.text}`)
      saveGame(state)
      draw()
    },
    onHireSecretary: () => {
      const r = hireSecretary(state)
      state.lastFeedback = { title: '物色联络员', text: r.text }
      saveGame(state)
      draw()
    },
    onWeekPlan: (slots: (string | null)[]) => {
      const r = setWeekPlan(state, slots)
      // 失败时保留草稿，避免「选完一点就被清空」
      if (r.ok) resetWeekDraft()
      state.lastFeedback = { title: '周计划', text: r.text }
      saveGame(state)
      draw()
    },
    onStartResearch: (topicId: string) => {
      const r = startResearch(state, topicId)
      state.lastFeedback = { title: '调研立项', text: r.text }
      saveGame(state)
      draw()
    },
    onResearchDepth: (depth: ResearchDepth) => {
      const r = advanceResearch(state, depth)
      state.lastFeedback = { title: '调研推进', text: r.text }
      saveGame(state)
      draw()
    },
    onRosterTag: (npcId: string, tag: string) => {
      setRosterTag(state, npcId, tag)
      saveGame(state)
      draw()
    },
    onRecommend: (npcId: string) => {
      const r = recommendTalent(state, npcId)
      state.lastFeedback = { title: '推荐用人', text: r.text }
      if (r.ok) pushLog(state, r.text)
      saveGame(state)
      draw()
    },
    onVisit: (accept) => {
      const r = resolveVisit(state, accept)
      focusBonus(state, 'visit')
      state.lastFeedback = { title: '关系往来', text: r.text }
      saveGame(state)
      draw()
    },
    onSetFocus: (id) => {
      state.focus = id
      saveGame(state)
      draw()
    },
    onResolveBurst: (idx) => {
      const r = resolveBurst(state, idx === 0 ? 0 : 1)
      state.lastFeedback = { title: '突发事务', text: r }
      pushLog(state, `【突发】${r}`)
      saveGame(state)
      draw()
    },
    onProjectChoice: (mode) => {
      const r = resolveProjectChoice(state, mode)
      state.lastFeedback = { title: '项目收尾', text: r }
      pushLog(state, `【台账】${r}`)
      saveGame(state)
      draw()
    },
    onJoinFaction: (target) => {
      const r = joinFaction(state, target as 'A' | 'B' | 'local' | 'none')
      state.lastFeedback = { title: '派系站队', text: r.text }
      saveGame(state)
      draw()
    },
    onFactionAct: (kind) => {
      const r = factionAct(state, kind)
      state.lastFeedback = { title: '派系动作', text: r.text }
      saveGame(state)
      draw()
    },
    onNewGame: () => {
      const ownerId = authUser()?.id ?? ''
      const ownerNick = authNickname()
      const slot = state.slot ?? state.slotPick ?? 0
      state = {
        ...bootTitle(),
        phase: 'origin',
        slot,
        flags: { authUser: ownerId, authNick: ownerNick, guideStep: 0 },
      }
      draw()
    },
    onContinue: () => {
      state.phase = 'slots'
      draw()
    },
    onPickOrigin: (id) => {
      const slot = state.slot ?? 0
      state.pendingOriginId = id
      state.slot = slot
      state.phase = 'province'
      draw()
    },
    onPickProvince: (pid) => {
      const originId = String(state.pendingOriginId || 'xuandiao_pu')
      const slot = state.slot ?? 0
      const ownerId = authUser()?.id ?? ''
      const ownerNick = authNickname()
      state = createNewGame(originId, pid)
      state.slot = slot
      state.flags.authUser = ownerId
      state.flags.authNick = ownerNick
      state.pendingOriginId = undefined
      pushLog(state, `出身确认：${getOrigin(originId).name}`)
      startMonthActions()
      pullEvent()
      saveGame(state)
      draw()
    },
    onChoose: (index) => {
      playClickSound()
      resolveChoice(index)
    },
    onAdvanceMonth: () => {
      advanceMonth()
      const opened = maybeInvestigation(state)
      if (opened && state.jijian) {
        firstTimeHint(
          state,
          'jijian',
          '纪检监察介入',
          '线索已进入程序。左栏可选：如实配合 / 拖延 / 找人打听。配合通常更有利。',
        )
      }
      if (checkEnding(state)) {
        saveGame(state)
        draw()
        return
      }
      startMonthActions()
      pullEvent()
      saveGame(state)
      draw()
    },
    onSkipMonth: () => {
      if (state.currentEventId) {
        state.lastFeedback = { title: '还不能快进', text: '请先处置本月事件。' }
        draw()
        return
      }
      if (state.dutyRun && !state.dutyRun.done) {
        state.lastFeedback = { title: '还不能快进', text: '请先办完当前公务。' }
        draw()
        return
      }
      applySkipMonthCost(state)
      state.ffUsedThisYear = (state.ffUsedThisYear ?? 0) + 1
      advanceMonth()
      if (checkEnding(state)) {
        saveGame(state)
        draw()
        return
      }
      startMonthActions()
      pullEvent()
      saveGame(state)
      draw()
    },
    onDucha: (choice: DuchaChoice) => {
      const r = resolveDucha(state, choice)
      state.lastFeedback = { title: '督查暗访', text: r.text }
      if (r.ok) pushLog(state, `【督查】${r.text}`)
      saveGame(state)
      draw()
    },
    onTanxin: (npcId: string, style: 'guanxin' | 'tiduan' | 'yala') => {
      const r = doTanxin(state, npcId, style)
      state.lastFeedback = { title: '谈心谈话', text: r.text }
      if (r.ok) pushLog(state, `【谈心】${r.text}`)
      saveGame(state)
      draw()
    },
    onStartCampaign: (id: string) => {
      const r = startCampaign(state, id)
      state.lastFeedback = { title: '项目攻坚', text: r.text }
      saveGame(state)
      draw()
    },
    onCampaignAct: (act: CampaignAct) => {
      const r = advanceCampaign(state, act)
      state.lastFeedback = { title: '攻坚推进', text: r.text }
      saveGame(state)
      draw()
    },
    onChild: (choice: ChildChoice) => {
      const r = resolveChild(state, choice)
      state.lastFeedback = { title: '子女升学就业', text: r.text }
      if (r.ok) pushLog(state, `【家事】${r.text}`)
      saveGame(state)
      draw()
    },
    onMemoir: (mode: MemoirMode) => {
      const r = writeMemoir(state, mode)
      state.lastFeedback = { title: '写回忆录', text: r.text }
      saveGame(state)
      draw()
    },
    onAckDocument: () => {
      // 任免通知：确认到任
      if (state.promo && state.promo.stage === 'renmian') {
        confirmAppointment(state)
        const post = getPost(state.postId)
        state.milestones = [
          `履新：${localizePlace(post.title, state.provinceId)}`,
          `职务层次：${post.level}`,
          state.probationLeft > 0 ? `任职试用期 ${state.probationLeft} 个月` : '正式任职',
        ]
        pushTimeline(state, 'promote', `任 ${post.title}（${post.level}）`)
        const introNpc = maybeIntroduceNewNpc(state)
        if (introNpc) pushLog(state, `【关系】${introNpc}`)
        const achA = checkAchievements(state)
        for (const name of achA) pushLog(state, `【成就】解锁「${name}」`)
      }
      state.pendingDocument = null
      state.phase = 'play'
      saveGame(state)
      draw()
    },
    onStartPromo: (toId) => {
      const list = availablePaths(state)
      const hit = list.find((p) => p.path.to === toId && p.ok)
      if (!hit) {
        const locked = list.find((p) => p.path.to === toId)
        state.lastFeedback = {
          title: '暂不能启动选拔',
          text: locked?.reason || '该去向当前不可用，请查看职务与职级页的锁定原因。',
        }
        draw()
        return
      }
      const doc = startPromo(state, hit.path)
      if (!doc) {
        state.lastFeedback = {
          title: '暂不能启动选拔',
          text: canStartPromo(state).reason || hit.reason || '程序条件未满足。',
        }
        draw()
        return
      }
      firstTimeHint(
        state,
        'promo',
        '选拔程序',
        '推荐 → 考察 → 公示 → 票决 → 任免。每一步都要选策略，乱选会失败。',
      )
      state.pendingDocument = doc
      state.phase = 'document'
      saveGame(state)
      draw()
    },
    onAdvancePromo: (strategyId?: string) => {
      const r = advancePromo(state, strategyId)
      if (r.failed) {
        recordPromoFail(state, r.failed)
        state.lastFeedback = {
          title: '选拔未通过',
          text: `${r.failed}\n复盘：提高相关五维或降低风险；换策略；减少草率分。失败记录可在设置导出备份。`,
        }
        state.flags.lastPromoFail = r.failed
        saveGame(state)
        draw()
        return
      }
      if (r.doc) {
        state.pendingDocument = r.doc
        state.phase = 'document'
        saveGame(state)
        draw()
        return
      }
      draw()
    },
    onCancelPromo: () => {
      cancelPromo(state)
      saveGame(state)
      draw()
    },
    onJijianChoice: (choice) => {
      const r = advanceJijian(state, choice)
      state.lastFeedback = { title: '纪检监察', text: r.text }
      pushLog(state, `【纪检监察】${r.text}`)
      if (r.ending) {
        // 开除公职 → 翻车结局
        state.risk = 95
        state.attrs.Lian = Math.min(state.attrs.Lian, 15)
      }
      if (checkEnding(state)) {
        saveGame(state)
        draw()
        return
      }
      saveGame(state)
      draw()
    },
    onDismissMilestone: () => {
      state.milestones = []
      draw()
    },
    onDismissSummary: () => {
      state.lastMonthSummary = null
      draw()
    },
    onDismissAppraisal: () => {
      state.lastAppraisal = null
      draw()
    },
    onOpenAchievements: () => {
      state.flags.showAch = !state.flags.showAch
      draw()
    },
    onCloseAchievements: () => {
      state.flags.showAch = false
      draw()
    },
    onRestart: () => {
      clearSave()
      state = bootTitle()
      draw()
    },
    onDoAction: (id) => {
      if (!(state.flags.hint_action as boolean)) {
        firstTimeHint(
          state,
          'action',
          '主动行动',
          '点行动卡会先选「怎么做」。连续点同一选项会积累草率分。',
        )
      }
      openAction(id)
    },
    onActionVariant: (actionId, variantId) => resolveActionVariant(actionId, variantId),
    onCancelAction: () => {
      state.pendingActionId = null
      draw()
    },
    onDismissFeedback: () => {
      state.lastFeedback = null
      draw()
    },
    onOpenNpc: (id) => {
      state.openNpcId = id
      draw()
    },
    onCloseNpc: () => {
      state.openNpcId = null
      draw()
    },
    onNpcAct: (npcId, act) => doNpcAct(npcId, act),
  })

  const doc = app!.querySelector('.doc-overlay')
  if (doc) {
    playStamp(doc as HTMLElement)
    playStampSound()
  }
}

function pullEvent() {
  const ev = scheduleNextEvent(state)
  state.currentEventId = ev?.id ?? null
  if (!ev) pushLog(state, '本月无事。')
}

function resolveChoice(index: number) {
  if (!state.currentEventId) return
  const ev = getEvent(state.currentEventId)
  const choice = ev.choices[index]
  if (!choice || !meetsRequire(state, choice.require)) return

  noteChoice(state, index)

  let fx: AttrFx = { ...choice.fx }
  let resultNote = ''

  // 草率分过高：成功率惩罚，拒绝「闭眼点」
  const mash = state.mashScore ?? 0
  const rate0 = choice.successRate ?? 1
  const rate = mash >= 50 ? Math.max(0.3, rate0 - 0.15) : rate0
  if (rate < 1) {
    const bonus = state.failStreak >= 2 ? 0.25 : 0
    if (Math.random() > rate + bonus) {
      fx = { ...choice.fx, ...(choice.failFx ?? {}) }
      resultNote = choice.failText ?? '事情没办利索。'
      if (mash >= 50) resultNote += '（组织认为决策草率）'
      state.failStreak += 1
    } else {
      state.failStreak = 0
    }
  }

  applyFxToAttrs(state.attrs, fx)
  if (typeof fx.Risk === 'number') state.risk = clamp(state.risk + fx.Risk, 0, 100)
  noteFloat(state, fx, fx.Risk)
  applyNpcFx(state.npcs, choice.npcFx)
  if (choice.faction && choice.faction !== 'none') {
    state.faction = choice.faction
    if (!state.factionRep) state.factionRep = { A: 20, B: 20, local: 30 }
    const key = choice.faction
    state.factionRep[key] = Math.min(100, (state.factionRep[key] ?? 20) + 8)
    // 对立派系略降
    if (key === 'A') state.factionRep.B = Math.max(0, (state.factionRep.B ?? 20) - 3)
    if (key === 'B') state.factionRep.A = Math.max(0, (state.factionRep.A ?? 20) - 3)
    if (key === 'local') {
      state.factionRep.A = Math.max(0, (state.factionRep.A ?? 20) - 1)
      state.factionRep.B = Math.max(0, (state.factionRep.B ?? 20) - 1)
    }
  }

  const parts = [`【事件】${ev.title}：${choice.label}`]
  if (resultNote) parts.push(resultNote)
  pushLog(state, parts.join(' · '))

  markEventUsed(state, ev)
  noteEventHandled(state)
  markCatalog(ev.id)
  bumpCounter(state, 'events')
  schedulePushProgress()
  state.currentEventId = null
  playPaperSound()
  focusBonus(state, 'action')
  maybeBurst(state)

  // 事件处置完，本月仍可主动行动；点「进入下个月」才推时间
  if (state.actionPoints <= 0) startMonthActions()
  refreshActionCap()
  const ach0 = checkAchievements(state)
  for (const name of ach0) pushLog(state, `【成就】解锁「${name}」`)
  saveGame(state)
  draw()
}

function openAction(id: ActionId) {
  if (state.currentEventId) {
    state.lastFeedback = { title: '还不能行动', text: '请先处置本月事件。' }
    draw()
    return
  }
  const a = getAction(id)
  const gate = canDoAction(state, a)
  if (!gate.ok) {
    state.lastFeedback = { title: '无法行动', text: gate.reason }
    draw()
    return
  }
  state.pendingActionId = id
  state.lastFeedback = null
  draw()
}

function resolveActionVariant(actionId: ActionId, variantId: string) {
  const a = getAction(actionId)
  const v = a.variants.find((x) => x.id === variantId)
  if (!v || !canDoAction(state, a).ok) return

  const actNote = noteAction(state, `${actionId}/${variantId}`)

  state.actionPoints -= a.cost
  let fx: AttrFx = { ...v.fx }
  let note = v.result

  if (actNote.decay) {
    // 连续同一行动：效果减半，拒绝无脑刷
    for (const k of Object.keys(fx) as (keyof typeof fx)[]) {
      const val = fx[k]
      if (typeof val === 'number') fx[k] = Math.trunc(val * 0.5)
    }
    note = `${note}（连续重复同类行动，效果减半）`
  }

  const rate = v.successRate ?? 1
  if (rate < 1 && Math.random() > rate) {
    fx = { ...v.fx, ...(v.failFx ?? {}) }
    note = v.failText ?? v.result
  }

  applyFxToAttrs(state.attrs, fx)
  if (typeof fx.Risk === 'number') state.risk = clamp(state.risk + fx.Risk, 0, 100)
  noteFloat(state, fx, fx.Risk)
  focusBonus(state, 'action')
  applyNpcFx(state.npcs, v.npcFx)

  // 有机会把行动转成在办台账（县处中局更易立项，给等晋升阶段可推进的目标）
  let extra = ''
  const rankNow = getPost(state.postId).rank
  const projCap = rankNow >= 6 ? 4 : 3
  const startP = rankNow >= 6 && rankNow <= 14 ? 0.5 : 0.35
  if (state.projects.length < projCap && Math.random() < startP) {
    const def = pickStartableProject(state, actionId)
    if (def) {
      state.projects.push(startProject(def))
      extra = ` 立项：「${def.name}」。`
    }
  } else if (state.projects.length > 0 && Math.random() < 0.45) {
    const p = state.projects[Math.floor(Math.random() * state.projects.length)]
    p.progress = Math.min(100, p.progress + 12 + Math.floor(Math.random() * 8))
    extra = ` 「${p.name}」推进至 ${p.progress}%。`
    if (p.progress >= 100) {
      applyFxToAttrs(state.attrs, p.doneFx)
      if (typeof p.doneFx.Risk === 'number')
        state.risk = clamp(state.risk + p.doneFx.Risk, 0, 100)
      extra = ` 「${p.name}」办结。`
      state.pendingProjectChoice = { id: p.id, name: p.name }
      state.projects = state.projects.filter((x) => x.id !== p.id)
      bumpCounter(state, 'projects')
    }
  }

  state.pendingActionId = null
  state.lastFeedback = {
    title: `${a.name} · ${v.label}`,
    text: `${note}${extra}`,
  }
  pushLog(state, `【行动】${a.name}/${v.label}：${note}${extra}`)
  saveGame(state)
  draw()
}

function doNpcAct(npcId: string, act: NpcActId) {
  if (state.currentEventId) {
    state.lastFeedback = { title: '还不能行动', text: '请先处置本月事件。' }
    draw()
    return
  }
  const result = npcAct(state, npcId, act)
  pushLog(state, `【人脉】${result.text}`)
  state.lastFeedback = { title: '人脉往来', text: result.text }
  saveGame(state)
  draw()
}

function advanceMonth() {
  state.turn += 1
  state.month += 1
  state.lastFeedback = null
  state.pendingActionId = null
  state.openNpcId = null
  clearFloat(state)
  if (state.month > 12) {
    state.month = 1
    state.year += 1
    state.ffUsedThisYear = 0
    resetRosterYear(state)
    // 新一年：年度目标计数器归零
    state.yearCounters = emptyCounters(state.year)
  }
  state.flags.monthsInPost = ((state.flags.monthsInPost as number) ?? 0) + 1
  // 新月重置本月公务
  state.dutyDone = []
  state.dutyRun = null
  state.dutyMonthScore = 0
  settleWeekPlan(state)
  state.weekPlan = [null, null, null, null]
  state.weekPlanned = false
  monthlyDrift(state)
  riskTick(state)
  familyTick(state)
  networkTick(state)
  yuqingTick(state)
  secretaryTick(state)
  const bondSync = syncBonds(state)
  if (bondSync) pushLog(state, bondSync)
  bondLetterTick(state)
  if (state.tanxinCd && state.tanxinCd > 0) state.tanxinCd -= 1
  state.duchaDone = false
  const duchaMsg = maybeDucha(state)
  if (duchaMsg) pushLog(state, `【督查】${duchaMsg}`)
  // 联络员熟练度高后可能出事：触发秘书腐败分支（弹窗处置）
  maybeSecretaryCase(state)
  const childMsg = childTick(state)
  if (childMsg) pushLog(state, `【家事】${childMsg}`)
  const bondEv = maybeBondEvent(state)
  if (bondEv) pushLog(state, bondEv)
  factionHeatTick(state)
  ageTick(state)
  enterRetired(state)
  if (state.factionCd > 0) state.factionCd -= 1
  if (state.introCd && state.introCd > 0) state.introCd -= 1
  const intro = maybeIntroduce(state)
  if (intro) pushLog(state, intro)
  const bias = focusEventBias(state)
  if (bias) pushLog(state, bias)
  const fe = maybeFactionEvent(state)
  if (fe) pushLog(state, fe)
  if (state.favorCooldown > 0) state.favorCooldown -= 1
  if (state.factionHeat > 50 && (state.focus === 'gx' || Math.random() < 0.15)) {
    state.risk = clamp(state.risk + 1, 0, 100)
  }
  const pick = pickNetworkNpc(state)
  const drama = pick ? networkDrama(state, pick.id, pick.favor) : null
  if (drama) pushLog(state, drama)

  // 主官专项在办期间的月度压力（如债务化解的还本付息）
  const campTick = campaignTick(state)
  if (campTick) pushLog(state, `【攻坚】${campTick}`)

  const projectFx = (fx: AttrFx) => {
    applyFxToAttrs(state.attrs, fx)
    if (typeof fx.Risk === 'number') state.risk = clamp(state.risk + fx.Risk, 0, 100)
  }
  const proj = tickProjects(state, projectFx)

  const lines: string[] = [
    `五维：政 ${state.attrs.ZJ} · 关 ${state.attrs.GX} · 廉 ${state.attrs.Lian} · 民 ${state.attrs.MX} · 能 ${state.attrs.NL}`,
    `风险 ${Math.round(state.risk)} · 本岗第 ${state.flags.monthsInPost ?? 0} 个月`,
  ]

  // 1 月：先结算上一年责任书（奖惩要先落进属性，年度考核才反映得出结果），再签订新年责任书
  let goalLine = ''
  if (state.month === 1 && state.turn > 1) {
    const settled = settleAnnualGoals(state)
    if (settled) {
      if (settled.fx.ZJ) state.attrs.ZJ = clamp(state.attrs.ZJ + settled.fx.ZJ)
      if (settled.fx.MX) state.attrs.MX = clamp(state.attrs.MX + settled.fx.MX)
      if (settled.fx.NL) state.attrs.NL = clamp(state.attrs.NL + settled.fx.NL)
      if (settled.fx.Risk) state.risk = clamp(state.risk + settled.fx.Risk, 0, 100)
      state.annualGoalResult = {
        year: settled.year,
        done: settled.done,
        total: settled.total,
        allDone: settled.allDone,
      }
      pushLog(state, `【目标】${settled.text}`)
      goalLine = settled.text
    }
    const fresh = generateAnnualGoals(state)
    state.annualGoals = fresh
    pushLog(state, goalSignLog(fresh))
  }

  // 12 月结束 → 年度考核
  if (state.month === 1 && state.turn > 1) {
    playNotifySound()
    const appraisal = runAnnualAppraisal(state)
    state.lastAppraisal = appraisal
    if (appraisal.grade === '不称职' || appraisal.grade === '基本称职') {
      state.badAppraisalStreak = (state.badAppraisalStreak ?? 0) + 1
    } else {
      state.badAppraisalStreak = 0
    }
    maybeOrgTalk(state)
    pushTimeline(state, 'appraisal', `年度考核：${appraisal.grade}（${appraisal.score}）`)
    lines.push(`年度考核：${appraisal.grade}（${appraisal.score} 分）`)
    pushLog(
      state,
      `【考核】${appraisal.year} 年度：${appraisal.grade} · ${appraisal.score} 分`,
    )
    if (goalLine) lines.push(goalLine)
  } else if (state.turn % 12 === 0) {
    lines.push('年度考核季。')
  }

  state.lastMonthSummary = {
    year: state.year,
    month: state.month,
    lines,
    projectUpdates: proj.updates,
  }
  for (const u of proj.updates) pushLog(state, `【台账】${u}`)

  const ach = checkAchievements(state)
  for (const name of ach) pushLog(state, `【成就】解锁「${name}」`)
}

initAudioFromStore()
applyFontSize(getFontSize())
document.documentElement.dataset.theme = 'light'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).__guantu = {
  get state() {
    return state
  },
  /** 调试 / 自动化测试用：按当前 state 重绘 */
  draw() {
    draw()
  },
  endings: ENDINGS.map((e) => e.id),
}

draw()
