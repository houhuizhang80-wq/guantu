import type { GameState } from '../types'
import { getPost } from './posts'
import { ORIGINS } from './origins'
import { loadOriginsDone } from '../state/origins_done'

export interface AchievementDef {
  id: string
  name: string
  desc: string
  check: (s: GameState) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_month',
    name: '满月',
    desc: '完整走过一个月',
    check: (s) => s.turn >= 1,
  },
  {
    id: 'fuke',
    name: '乡科级副职',
    desc: '首次担任副科级领导职务',
    check: (s) => getPost(s.postId).rank >= 4,
  },
  {
    id: 'zhengke',
    name: '一镇之长',
    desc: '升任乡科级正职',
    check: (s) => getPost(s.postId).rank >= 6,
  },
  {
    id: 'xianchu',
    name: '县处级',
    desc: '进入县处级',
    check: (s) => getPost(s.postId).rank >= 8,
  },
  {
    id: 'tingju',
    name: '厅局级',
    desc: '进入厅局级',
    check: (s) => getPost(s.postId).rank >= 12,
  },
  {
    id: 'shengbu',
    name: '省部级',
    desc: '进入省部级',
    check: (s) => getPost(s.postId).rank >= 15,
  },
  {
    id: 'guojia',
    name: '国家级',
    desc: '进入国家级',
    check: (s) => getPost(s.postId).rank >= 18,
  },
  {
    id: 'qinglian',
    name: '清白账',
    desc: '廉洁保持 85 以上且风险低于 20',
    check: (s) => s.attrs.Lian >= 85 && s.risk < 20,
  },
  {
    id: 'minxin',
    name: '口碑',
    desc: '民心达到 80',
    check: (s) => s.attrs.MX >= 80,
  },
  {
    id: 'nengli',
    name: '笔杆子与实干',
    desc: '能力达到 80',
    check: (s) => s.attrs.NL >= 80,
  },
  {
    id: 'xiangmu_wang',
    name: '项目大户',
    desc: '同时在办 3 项台账',
    check: (s) => s.projects.length >= 3,
  },
  {
    id: 'youxiu',
    name: '年度优秀',
    desc: '获得一次年度考核「优秀」',
    check: (s) => s.flags.appraisalExcellent === true,
  },
  {
    id: 'jijian_yishi',
    name: '打铁的人',
    desc: '调入纪检监察或巡视条线',
    check: (s) =>
      getPost(s.postId).title.includes('纪委') ||
      getPost(s.postId).title.includes('监委') ||
      getPost(s.postId).title.includes('巡视') ||
      s.paths.includes('jijian'),
  },
  {
    id: 'jijian_ding',
    name: '正国·纪检',
    desc: '经纪检条线出任中央纪委书记',
    check: (s) => getPost(s.postId).id === 'zhongyangjiwei_zheng',
  },
  {
    id: 'zhuxi_ding',
    name: '正国·主席',
    desc: '出任国家主席',
    check: (s) => getPost(s.postId).id === 'guojia_zhuxi',
  },
  {
    id: 'junwei_ding',
    name: '正国·军委',
    desc: '出任中央军委主席',
    check: (s) => getPost(s.postId).id === 'junwei_zhuxi',
  },
  {
    id: 'zuzhi_xian',
    name: '管干部的干部',
    desc: '进入组织系统',
    check: (s) =>
      getPost(s.postId).title.includes('组织') || s.paths.includes('zuZhi'),
  },
  {
    id: 'zhengfa_xian',
    name: '刀把子',
    desc: '进入政法公安条线',
    check: (s) =>
      getPost(s.postId).title.includes('政法') ||
      getPost(s.postId).title.includes('公安') ||
      s.paths.includes('zhengfa'),
  },
  {
    id: 'jiancha_xian',
    name: '公诉人',
    desc: '进入检察条线',
    check: (s) => getPost(s.postId).title.includes('检察') || s.paths.includes('jiancha'),
  },
  {
    id: 'fayuan_xian',
    name: '法槌',
    desc: '进入法院条线',
    check: (s) => getPost(s.postId).title.includes('法院'),
  },
  {
    id: 'sifa_xian',
    name: '法治践行者',
    desc: '进入司法行政条线',
    check: (s) => getPost(s.postId).title.includes('司法'),
  },
  {
    id: 'shenji_xian',
    name: '经济卫士',
    desc: '进入审计条线',
    check: (s) => getPost(s.postId).title.includes('审计'),
  },
  {
    id: 'tongzhan_xian',
    name: '同心圆',
    desc: '进入统战条线',
    check: (s) => getPost(s.postId).title.includes('统战'),
  },
  {
    id: 'fazhan_xian',
    name: '规划者',
    desc: '进入发改/财政条线',
    check: (s) =>
      getPost(s.postId).title.includes('发改') ||
      getPost(s.postId).title.includes('财政') ||
      getPost(s.postId).title.includes('发展和改革'),
  },
  {
    id: 'chui_xian',
    name: '垂管一员',
    desc: '进入税务/海关/市场监管等垂管条线',
    check: (s) =>
      getPost(s.postId).title.includes('税务') ||
      getPost(s.postId).title.includes('海关') ||
      getPost(s.postId).title.includes('市场监管') ||
      getPost(s.postId).title.includes('市场监督'),
  },
  {
    id: 'xinbu_zuo',
    name: '左膀右臂',
    desc: '指定心腹且信任达到 70',
    check: (s) => !!s.confidant && s.confidant.trust >= 70,
  },
  {
    id: 'menxia',
    name: '桃李',
    desc: '收满 3 位门生',
    check: (s) => (s.proteges?.length ?? 0) >= 3,
  },
  {
    id: 'buwei_jing',
    name: '进京',
    desc: '进入国务院部委或中央机关',
    check: (s) =>
      getPost(s.postId).stage === '中央' ||
      getPost(s.postId).title.includes('国务院') ||
      getPost(s.postId).title.includes('部委') ||
      s.paths.includes('buwei'),
  },
  {
    id: 'guoqi_zhuan',
    name: '旋转门',
    desc: '政企交流，进入省属国企',
    check: (s) => s.paths.includes('guoqi') || getPost(s.postId).title.includes('国企'),
  },
  {
    id: 'yangqi_jing',
    name: '央企席位',
    desc: '交流进入中央企业',
    check: (s) =>
      s.paths.includes('yangqi') ||
      getPost(s.postId).title.includes('央企') ||
      getPost(s.postId).title.includes('中央企业'),
  },
  {
    id: 'quntuan_xian',
    name: '青年头',
    desc: '担任团县委书记或市级群团领导',
    check: (s) =>
      s.paths.includes('quntuan') ||
      getPost(s.postId).title.includes('团委') ||
      getPost(s.postId).title.includes('总工会'),
  },
  {
    id: 'renda_zhengxie',
    name: '议政席',
    desc: '进入人大或政协序列',
    check: (s) =>
      s.paths.includes('renda') ||
      getPost(s.postId).title.includes('人大') ||
      getPost(s.postId).title.includes('政协'),
  },
  {
    id: 'jia',
    name: '家和',
    desc: '配偶心情达到 85',
    check: (s) => !!s.family?.spouse && s.family.spouseMood >= 85,
  },
  {
    id: 'shinian',
    name: '十年',
    desc: '在同一岗位干满 120 个月（极端情况）',
    check: (s) => (s.flags.monthsInPost as number) >= 120,
  },
  {
    id: 'baodao',
    name: '报到',
    desc: '完成出身选择并进入第一月',
    check: (s) => s.turn >= 0 && s.originId != null && s.currentEventId != null,
  },
  {
    id: 'zhanyi',
    name: '站上队',
    desc: '明确加入某一派系',
    check: (s) => s.faction === 'A' || s.faction === 'B' || s.faction === 'local',
  },
  {
    id: 'paixi_gao',
    name: '自己人',
    desc: '任一派系声望达到 60',
    check: (s) => {
      const r = s.factionRep
      return !!r && (r.A >= 60 || r.B >= 60 || r.local >= 60)
    },
  },
  {
    id: 'chushen_half',
    name: '半部仕途图',
    desc: '用 8 种不同出身走到结局',
    check: () => loadOriginsDone().length >= 8,
  },
  {
    id: 'chushen_all',
    name: '全出身通关',
    desc: `用全部 ${ORIGINS.length} 种出身各走到结局`,
    check: () => loadOriginsDone().length >= ORIGINS.length,
  },
]

export function checkAchievements(s: GameState): string[] {
  const unlocked: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue
    if (a.check(s)) {
      s.achievements.push(a.id)
      unlocked.push(a.name)
    }
  }
  return unlocked
}

export function getAchievement(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
