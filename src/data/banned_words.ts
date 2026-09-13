/**
 * 昵称合规校验。
 *
 * 一条纯函数规则，渲染层（输入即时提示）、交互层（提交前拦截）、状态层（写入
 * 云数据库前兜底）三处共用，避免出现「前端拦了、服务端没拦」两套口径。
 *
 * 覆盖五类问题：
 *   1. 结构问题：长度、纯符号 / 纯数字、过多重复字符、尖括号
 *   2. 联系方式：手机号、邮箱、网址（拉人 / 导流的常见载体）
 *   3. 违规词：辱骂低俗、色情、赌博、诈骗与非法交易、毒品违禁品
 *   4. 冒充官方：官方号 / 管理员 / 客服 / 系统 等身份词
 *   5. 冒用身份：国家机构与领导职务名、公众人物姓名（见 reserved_names.ts）
 */

import { LEADER_ALIAS_RE, OFFICIAL_WORDS, RESERVED_PERSON_NAMES } from './reserved_names'

export interface NickCheck {
  ok: boolean
  /** 不合规时的原因，直接面向玩家的中文说明 */
  reason?: string
}

export const NICK_MIN = 2
export const NICK_MAX = 16

/** 昵称兜底值：邮箱名本身含违规词时使用 */
export const NICK_FALLBACK = '干部'

/** 零宽字符与双向控制符：用于把关键词拆开以绕过匹配 */
const INVISIBLE = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g

/** 全角 → 半角 */
function toHalfWidth(v: string): string {
  return v
    .replace(/[\uff01-\uff5e]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
}

/**
 * 归一化：去不可见字符、全角转半角、统一小写。
 * 保留空格与标点，用于「联系方式」这类需要结构信息的规则。
 */
function normalize(raw: string): string {
  return toHalfWidth(String(raw ?? '').replace(INVISIBLE, '')).toLowerCase()
}

/**
 * 去掉所有分隔符，用于词库匹配 —— 挡住「加 微 信」「傻*逼」这类插符号写法。
 */
function squeeze(v: string): string {
  return v.replace(/[\s._\-*~^|/\\+·・。，,、!！?？:：;；'"“”‘’()（）\[\]{}]/g, '')
}

/**
 * 只去空白与中文标点，保留 `.` `@` `:` `/` 等结构字符。
 * 联系方式与网址靠结构识别，不能把它们的分隔符一起去掉。
 */
function flatten(v: string): string {
  return v.replace(/[\s。，、·・]+/g, '')
}

/** 违规词库。按类别给出不同提示语，便于玩家知道哪里改了。 */
const BLOCKS: { reason: string; words: string[] }[] = [
  {
    reason: '昵称含辱骂或低俗用语',
    words: [
      '傻逼', '煞笔', '沙比', '傻叉', '妈的', '他妈', '操你', '草你', '日你',
      '贱人', '婊子', '杂种', '王八蛋', '混蛋', '脑残', '智障', '弱智',
      '狗东西', '狗杂种', '死全家', '去死吧', '屌丝', '二逼', '装逼',
      'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'bastard',
      'nigger', 'faggot', 'cunt', 'pussy', 'dickhead', 'nmsl',
    ],
  },
  {
    reason: '昵称含色情相关字样',
    words: [
      '色情', '黄片', '黄图', '黄网', '裸聊', '裸照', '裸播', '约炮', '一夜情',
      '招嫖', '卖淫', '援交', '嫖娼', '性服务', '成人视频', '成人网站', '开黄腔',
    ],
  },
  {
    reason: '昵称含赌博相关字样',
    words: [
      '赌博', '博彩', '赌场', '赌球', '赌局', '下注网', '六合彩', '时时彩',
      '百家乐', '老虎机', '开盘口', '代赌', '棋牌室招',
    ],
  },
  {
    reason: '昵称含诈骗或非法交易字样',
    words: [
      '诈骗', '刷单', '洗钱', '套现', '代开发票', '假证', '办证', '代考', '代写论文',
      '黑产', '接码', '养号卖', '高炮贷', '无抵押放款', '私借',
    ],
  },
  {
    reason: '昵称含毒品或违禁品字样',
    words: ['毒品', '冰毒', '大麻', '摇头丸', '迷药', '催情', '枪支', '军火', '炸药', '管制刀具'],
  },
  {
    reason: '昵称含广告导流字样',
    words: [
      '加微信', '微信号', '加qq', '加扣扣', '加群', '扫码', '扫一扫', '点链接',
      '公众号', '代练', '外挂', '出售账号', '低价出售', '优惠券群', '代理加盟',
      '招募代理', '招商合作', '咨询电话', '联系方式',
    ],
  },
  {
    reason: '昵称含冒充官方或客服的字样',
    words: [
      '官方', '管理员', '客服', '版主', '工作人员', '运营团队', '超级用户',
      'admin', 'administrator', 'moderator',
    ],
  },
]

/** 短英文身份词：需按词边界匹配，避免误伤正常英文名 */
const SHORT_LATIN = ['gm', 'root']

const PHONE = /(?:^|\D)1[3-9]\d{9}(?:\D|$)/
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/
const URLISH = /(https?:\/\/|www\.|\bhttp\b|\.(?:com|cn|net|org|top|xyz|club|vip|shop|info)\b)/

/**
 * 校验昵称。返回第一个命中的问题，便于玩家逐条修改。
 *
 * 纯函数，不读外部状态；同一输入必然得到同一结果。
 */
export function checkNickname(raw: string): NickCheck {
  const value = normalize(raw).trim()

  if (!value) return { ok: false, reason: '请填写昵称' }
  // 长度按归一化后的字符数计算，避免用零宽字符凑数
  if (value.length < NICK_MIN) return { ok: false, reason: `昵称至少 ${NICK_MIN} 个字符` }
  if (value.length > NICK_MAX) return { ok: false, reason: `昵称最多 ${NICK_MAX} 个字符` }

  if (/[<>]/.test(value)) return { ok: false, reason: '昵称不能包含尖括号' }
  // 至少要有一个中文字或英文字母，挡掉纯数字、纯符号、纯表情
  if (!/[\u4e00-\u9fa5a-z]/.test(value)) {
    return { ok: false, reason: '昵称不能是纯数字或纯符号' }
  }

  const dense = squeeze(value)
  const flat = flatten(value)

  if (PHONE.test(flat)) return { ok: false, reason: '昵称不能包含手机号' }
  if (EMAIL.test(flat)) return { ok: false, reason: '昵称不能包含邮箱地址' }
  if (URLISH.test(flat)) return { ok: false, reason: '昵称不能包含网址' }
  if (/(.)\1{4,}/.test(dense)) {
    return { ok: false, reason: '昵称不能有连续 5 个以上重复字符' }
  }

  for (const block of BLOCKS) {
    for (const w of block.words) {
      // 词库命中前先各自 squeeze：词条本身可能含空格或标点
      if (dense.includes(squeeze(w))) return { ok: false, reason: block.reason }
    }
  }
  for (const w of SHORT_LATIN) {
    if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(dense)) {
      return { ok: false, reason: '昵称含冒充官方的字样' }
    }
  }

  // 机构名与领导职务：形态规则，任何「姓氏 + 职务」写法都会被拦下
  for (const w of OFFICIAL_WORDS) {
    if (dense.includes(squeeze(w))) {
      return { ok: false, reason: '昵称不得使用国家机构、领导职务或官方身份的称谓' }
    }
  }
  // 领袖代称：如「X 大大」「X 核心」这类写法
  if (LEADER_ALIAS_RE.test(dense)) {
    return { ok: false, reason: '昵称不得使用国家机构、领导职务或官方身份的称谓' }
  }
  // 公众人物姓名（名单可在 reserved_names.ts 追加）
  for (const w of RESERVED_PERSON_NAMES) {
    if (dense.includes(squeeze(w))) {
      return { ok: false, reason: '昵称不得使用公众人物的姓名' }
    }
  }

  return { ok: true }
}

/** 便捷判定：只关心是否合规时使用 */
export function isNicknameOk(raw: string): boolean {
  return checkNickname(raw).ok
}
