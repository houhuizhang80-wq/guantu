import type { Origin } from '../types'

/**
 * 入仕出身（贴近现实常见途径，架空压缩）
 * fx：初始五维与风险修正（数值已压缩，避免出身间登顶差距过大）
 * paths：开局路径标记（组织/纪检/技术等后续可微调门槛）
 */
export const ORIGINS: Origin[] = [
  {
    id: 'xuandiao_pu',
    name: '普通选调生',
    tag: '省委组织部选调',
    desc: '应届考入选调，到乡镇锻炼。组织在看，路要自己走。',
    fx: { NL: 6, GX: -3, Lian: 7, MX: 3, ZJ: 3, Risk: -1 },
    paths: ['difang'],
  },
  {
    id: 'xuandiao_ding',
    name: '定向选调',
    tag: '名校定向 / 急需专业',
    desc: '目标高校或紧缺专业选调，起点略高，议论也多。',
    fx: { NL: 8, GX: 2, Lian: 5, ZJ: 4, MX: 1, Risk: 0 },
    paths: ['difang'],
  },
  {
    id: 'shengkao',
    name: '省考公务员',
    tag: '统一考试录用',
    desc: '千军万马过独木桥。笔面双第一进的乡镇，简历很干净。',
    fx: { NL: 5, GX: -4, Lian: 8, MX: 3, ZJ: 2 },
    paths: ['difang'],
  },
  {
    id: 'guokao',
    name: '国考进垂管',
    tag: '中央国家机关省级以下直属机构',
    desc: '国考上岸后下沉锻炼或挂职。条线清楚，地方人头生。',
    fx: { NL: 6, GX: -2, Lian: 7, ZJ: 2, MX: 2 },
    paths: ['tiaoxian', 'buwei'],
  },
  {
    id: 'cunguan',
    name: '大学生村官',
    tag: '服务期满转任',
    desc: '在村里干满服务期，考核优秀转公务员。脚上有泥。',
    fx: { MX: 8, ZJ: 3, NL: 4, GX: 2, Lian: 5 },
    paths: ['difang'],
  },
  {
    id: 'sanfuyi',
    name: '三支一扶',
    tag: '支农支教支医扶贫',
    desc: '基层项目服务期满考录。吃过苦，知道政策落在哪一环。',
    fx: { MX: 7, NL: 4, Lian: 6, ZJ: 2, GX: -1 },
    paths: ['difang'],
  },
  {
    id: 'jizhuan',
    name: '军转干部',
    tag: '军队转业安置',
    desc: '部队到地方。令行禁止，地方规则要重新学。',
    fx: { NL: 5, MX: 4, Lian: 7, GX: -3, ZJ: 3, Risk: -1 },
    paths: ['zhengfa'],
  },
  {
    id: 'rencai',
    name: '人才引进',
    tag: '硕士/博士或急需紧缺',
    desc: '县市人才引进进体制。专业强，机关生态陌生。',
    fx: { NL: 8, ZJ: 2, GX: -3, Lian: 4, MX: 2 },
    paths: ['tiaoxian'],
  },
  {
    id: 'shiye_tiao',
    name: '事业单位调任',
    tag: '事业编转公务员',
    desc: '从学校、医院或科研院所调任。业务熟，编制故事一言难尽。',
    fx: { NL: 6, MX: 2, GX: 2, Lian: 4, ZJ: 2 },
    paths: ['tiaoxian'],
  },
  {
    id: 'guoqi_tiao',
    name: '国企调任',
    tag: '国有企业交流',
    desc: '从省属或市县国企调入。懂经营，也懂「人情账」。',
    fx: { NL: 6, GX: 6, Lian: -3, ZJ: 4, Risk: 2 },
    paths: ['guoqi', 'tiaoxian'],
  },
  {
    id: 'biguan',
    name: '机关笔杆子',
    tag: '文字综合岗成长',
    desc: '在县委办/组织部写材料熬出来的。领导讲话离不开你。',
    fx: { NL: 7, ZJ: 5, GX: 3, Lian: 2, MX: -1 },
    paths: ['dangwu', 'zuZhi'],
  },
  {
    id: 'jishu',
    name: '业务技术口',
    tag: '农业/水利/卫健等专业岗',
    desc: '从县局技术岗轮岗到乡镇。会干活，不太会说话。',
    fx: { NL: 8, MX: 4, ZJ: 2, GX: -4, Lian: 3 },
    paths: ['tiaoxian'],
  },
  {
    id: 'benxiang',
    name: '本乡本土',
    tag: '土生土长考回本镇',
    desc: '就是本地人。乡亲认你，也盯着你。回避规则会卡你。',
    fx: { MX: 7, GX: 4, Lian: 2, NL: 3, ZJ: 2, Risk: 2 },
    paths: ['difang'],
  },
  {
    id: 'ganbu_jun',
    name: '干部家庭',
    tag: '父辈曾在体制内',
    desc: '耳濡目染，路熟，眼睛也多。干净与人情，都要自己掂量。',
    fx: { GX: 8, NL: 3, ZJ: 3, Lian: -4, Risk: 3 },
    paths: ['difang', 'dangwu'],
  },
  {
    id: 'waisheng',
    name: '外省考入',
    tag: '跨省考录 / 交流',
    desc: '人生地不熟，反倒少些人情包袱。适应成本高。',
    fx: { GX: -5, Lian: 6, NL: 4, MX: 2, ZJ: 2, Risk: -1 },
    paths: ['difang'],
  },
  {
    id: 'xibu',
    name: '西部计划/援建',
    tag: '服务项目期满安置',
    desc: '支边援建回来进体制。见过更难的场面，心比较沉。',
    fx: { MX: 6, NL: 5, Lian: 6, ZJ: 2, GX: -2 },
    paths: ['difang'],
  },
]

/** 隐藏开局：全 16 种出身通关后解锁（不在 ORIGINS 列表内） */
export const LEGACY_ORIGIN: Origin = {
  id: 'legacy',
  name: '老档案重生',
  tag: '隐藏 · 全出身通关',
  desc: '你已走过十六种入仕路径。这一次，带着记忆与一点点「组织印象」重新报到。',
  fx: { ZJ: 8, GX: 8, NL: 6, Lian: 5, MX: 5, Risk: 0 },
  paths: ['difang'],
}

export function getOrigin(id: string): Origin {
  if (id === 'legacy') return LEGACY_ORIGIN
  const o = ORIGINS.find((x) => x.id === id)
  if (!o) throw new Error(`unknown origin ${id}`)
  return o
}

/** 安全取出身：未知/空 id 回落第一种，不抛错（UI/分享用） */
export function getOriginSafe(id: string | null | undefined): Origin {
  if (!id) return ORIGINS[0]
  try {
    return getOrigin(id)
  } catch {
    return ORIGINS[0]
  }
}
