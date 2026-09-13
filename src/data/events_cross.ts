import type { GameEvent } from '../types'

/**
 * 出身 × 省份气质 交叉事件
 * 需同时满足 originIds 与 flavors
 */
export const CROSS_EVENTS: GameEvent[] = [
  {
    id: 'x_benxiang_nw',
    kind: 'daily',
    title: '边疆的「自己人」',
    text: '你本乡出身，却在西北边疆任职。老乡说「还是自己人可靠」，当地干部看你像看「外来户」。你在夹缝里找公道。',
    weight: 8,
    originIds: ['benxiang'],
    flavors: ['northwest'],
    minRank: 2,
    maxRank: 8,
    choices: [
      {
        label: '一碗水端平',
        fx: { Lian: 5, MX: 3, GX: -4 },
      },
      {
        label: '照顾同乡',
        fx: { Lian: -8, GX: 6, Risk: 4 },
      },
    ],
  },
  {
    id: 'x_cunguan_sw',
    kind: 'daily',
    title: '山里的老熟人',
    text: '你当村官时帮过的村民，听说你在西南山区任职，翻了两座山来「看看你」。带来一袋核桃，和一封要修桥的联名信。',
    weight: 9,
    originIds: ['cunguan', 'sanfuyi', 'xibu'],
    flavors: ['southwest'],
    maxRank: 6,
    choices: [
      {
        label: '接下信，限期办结',
        fx: { MX: 8, ZJ: 5, NL: 2 },
      },
      {
        label: '收核桃，信走程序',
        fx: { Lian: 2, MX: 3 },
      },
    ],
  },
  {
    id: 'x_guoqi_coast',
    kind: 'daily',
    title: '老东家的沿海布局',
    text: '你国企出身，现在沿海任职。老东家要设区域总部，对接人还是当年一起喝酒的同事。他说「政策弹性」四个字说得很慢。',
    weight: 9,
    originIds: ['guoqi_tiao'],
    flavors: ['coastal'],
    minRank: 4,
    maxRank: 10,
    choices: [
      {
        label: '依法招引，弹性归零',
        fx: { Lian: 6, ZJ: 3, GX: -5 },
      },
      {
        label: '给「合理区间」',
        fx: { ZJ: 4, Lian: -8, Risk: 6, GX: 5 },
      },
    ],
  },
  {
    id: 'x_jizhuan_north',
    kind: 'daily',
    title: '寒潮里的硬命令',
    text: '你军转出身，北方寒潮。供暖企业想拖延检修。你下了死命令：今晚十二点前必须点火。对方说「做不到」，你说「做不到换人」。',
    weight: 8,
    originIds: ['jizhuan'],
    flavors: ['north', 'northeast'],
    minRank: 3,
    maxRank: 10,
    monthMod: [11, 12, 1],
    choices: [
      {
        label: '盯到点火为止',
        fx: { MX: 6, ZJ: 5, NL: 3, GX: -2 },
      },
      {
        label: '给缓冲期',
        fx: { GX: 3, MX: -2 },
      },
    ],
  },
  {
    id: 'x_biguan_central',
    kind: 'daily',
    title: '粮安材料的笔杆子',
    text: '你笔杆子出身，中原粮安大省。省里要一份「有血有肉」的典型材料。你决定不写空话，写一个真实的种粮大户。',
    weight: 7,
    originIds: ['biguan'],
    flavors: ['central'],
    minRank: 2,
    maxRank: 8,
    choices: [
      {
        label: '蹲点采访写真材料',
        fx: { NL: 4, ZJ: 4, MX: 4 },
      },
      {
        label: '按套路编',
        fx: { GX: 2, Lian: -3, NL: 1 },
      },
    ],
  },
  {
    id: 'x_rencai_coast',
    kind: 'daily',
    title: '数字治理试点',
    text: '你人才引进出身，沿海数字强省。省里点名让你牵头「一网通办」。有人说你「书生误国」，有人说你「专业对口」。',
    weight: 8,
    originIds: ['rencai', 'xuandiao_ding', 'guokao'],
    flavors: ['coastal'],
    minRank: 4,
    maxRank: 10,
    choices: [
      {
        label: '先啃硬骨头再推系统',
        fx: { NL: 5, ZJ: 5, MX: 3, GX: -2 },
      },
      {
        label: '重包装轻落地',
        fx: { ZJ: 3, Lian: -4, MX: -2 },
      },
    ],
  },
  {
    id: 'x_waisheng_any',
    kind: 'daily',
    title: '方言墙',
    text: '外省考入，当地方言像加密通话。你做了个小本子记「土话对照表」。同事笑你，又悄悄借去抄。',
    weight: 7,
    originIds: ['waisheng'],
    minRank: 0,
    maxRank: 6,
    choices: [
      {
        label: '把对照表做成工作手册',
        fx: { NL: 3, MX: 4, GX: 2 },
      },
      {
        label: '继续硬听',
        fx: { NL: 1, MX: -1 },
      },
    ],
  },
  {
    id: 'x_shengkao_ne',
    kind: 'daily',
    title: '东北的「人情网」',
    text: '你省考上岸到东北。饭局上有人问「你家谁」。你说「谁也不是」。全场笑了，笑得意味深长。',
    weight: 7,
    originIds: ['shengkao', 'waisheng'],
    flavors: ['northeast'],
    minRank: 0,
    maxRank: 6,
    choices: [
      {
        label: '用办事效率证明自己',
        fx: { ZJ: 4, MX: 4, GX: -1 },
      },
      {
        label: '慢慢融入人情',
        fx: { GX: 5, Lian: -2 },
      },
    ],
  },
]
