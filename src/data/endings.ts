import type { Ending, GameState } from '../types'
import { getPost } from './posts'
import { availablePaths } from '../systems/promotion'

function rank(s: GameState) {
  return getPost(s.postId).rank
}

/** 正国岗位：仍有更高去向且任期未满 24 个月时，先别收档 */
function canStayClimb(s: GameState): boolean {
  const post = getPost(s.postId)
  const months = (s.flags.monthsInPost as number) ?? 0
  if (post.nextPaths.length > 0 && months < 24) return true
  return availablePaths(s).some((p) => p.ok)
}

/**
 * 中途收档判定：本岗任职满 3 年、且当前确实没有可走的去向时才收档。
 * 避免玩家「只差几个月任期或几年年龄」就被草草判定终局——那种情况交给到龄退休兜底。
 *
 * 另有一层壮年期保护：年龄不到 50、且本岗位本身还有上一级去路时，一律不收档。
 * 属性暂时够不着门槛不等于没路走 —— 玩家可以继续攒政绩与关系，
 * 否则 36 岁的副处会因为「三年没升上去」被直接判定终局（历史缺陷）。
 */
function stuckLong(s: GameState): boolean {
  const months = (s.flags.monthsInPost as number) ?? 0
  if (months < 36) return false
  const post = getPost(s.postId)
  if (s.age < 50 && post.nextPaths.length > 0) return false
  return !canStayClimb(s)
}

/**
 * 全生涯结局：乡镇→县区→市→省→中央。
 * 成功向结局不再在副科「收档」，避免挡住通往中央的路。
 */
export const ENDINGS: Ending[] = [
  // ── 翻车 ───────────────────────────────────
  {
    id: 'luoma',
    title: '东窗事发',
    summary:
      '调查组进驻的第三周，你被叫去谈话，再没回来。办公室那盆绿萝没人浇水，叶子黄了一片。修过的路还在，修路的人没走完。',
    priority: 100,
    check: (s) => s.risk >= 90 && s.attrs.Lian <= 25 && s.turn >= 24,
  },
  {
    id: 'kaichu',
    title: '开除公职',
    summary:
      '处分决定书上的每一个字都很重。你交出工作证时，门卫照例抬了抬手——像送任何一个下班的人。',
    priority: 99,
    check: (s) => s.lastPunish != null && s.lastPunish.includes('开除'),
  },
  {
    id: 'diaocha',
    title: '调查中止',
    summary:
      '查了个底朝天，没查出够硬的把柄，但椅子已经换了人坐。调令上写着「另有任用」。档案柜比人还高，茶是凉的。',
    priority: 92,
    check: (s) => s.risk >= 82 && s.attrs.Lian <= 38 && s.turn >= 30 && rank(s) >= 3,
  },
  {
    id: 'diaozou',
    title: '得罪人被调走',
    summary:
      '一纸借调，你被「充实到上级机关」。欢送会上大家说你前途无量，你看见有人在角落发消息。基层的尘土，以后只出现在工作汇报里。',
    priority: 85,
    check: (s) => {
      if (s.turn < 24) return false
      if (rank(s) >= 4) return false
      const boss = s.npcs.find((n) => n.id === 'fushuji')
      const people = s.npcs.find((n) => n.id === 'laobaixing')
      const hated = boss && boss.favor <= -20
      const weakBase = s.attrs.GX < 22 && s.attrs.ZJ < 32
      return Boolean(hated && weakBase && (!people || people.favor < 20))
    },
  },
  {
    id: 'bianyuan',
    title: '被边缘化',
    summary:
      '分工表上你的名字后面多了括号：「协助」。协助谁、协助什么，没人细说。你开始习惯准点下班，习惯茶凉了再续。',
    priority: 80,
    check: (s) => s.turn >= 30 && rank(s) <= 1 && s.attrs.GX < 18 && s.attrs.ZJ < 22 && s.attrs.MX < 25,
  },
  {
    id: 'yuyi',
    title: '舆情翻车',
    summary: '一条短视频、一篇外地号稿件，把十年履历烧成灰。通报里的措辞很克制，你的名字很克制地消失了。',
    priority: 78,
    check: (s) => s.risk >= 75 && s.attrs.MX <= 25 && rank(s) >= 5,
  },

  // ── 成功顶点（正国分岗专属；通用中枢兜底）──
  {
    id: 'zhengguo_zhuxi',
    title: '中枢 · 主席',
    summary:
      '宣誓台上的灯光很静。你想起青石镇门卫室、想起第一次对不上的两个数字、想起每一次选择的代价。国家的名字很大，你的名字很小——小到仍要对每一句承诺负责。',
    priority: 75,
    check: (s) => getPost(s.postId).id === 'guojia_zhuxi' && s.attrs.Lian >= 85 && s.risk < 25,
  },
  {
    id: 'zhengguo_junwei',
    title: '中枢 · 军委',
    summary:
      '命令签发的那一刻，你比任何时候都清楚：枪杆子听党指挥，人要听纪律指挥。从乡镇材料堆走到这里，字字都要对得起帽徽与党徽。',
    priority: 74,
    check: (s) => getPost(s.postId).id === 'junwei_zhuxi' && s.attrs.Lian >= 85 && s.risk < 25,
  },
  {
    id: 'zhengguo_jijian',
    title: '中枢 · 执纪',
    summary:
      '你从乡镇材料堆里走出来，走过信访窗口、走过案卷与谈话室，走进中央。打铁的人，先要是铁。',
    priority: 73,
    check: (s) => getPost(s.postId).id === 'zhongyangjiwei_zheng' && s.attrs.Lian >= 85,
  },
  {
    id: 'zhengguo_zongli',
    title: '中枢 · 总理',
    summary:
      '就职宣誓那天，你想起青石镇门卫室的消毒水味，想起第一次写材料时对不上的两个数字。路很长，但每一步都算数。',
    priority: 72,
    check: (s) => getPost(s.postId).id === 'zongli' && s.attrs.Lian >= 70 && s.risk < 30 && !canStayClimb(s),
  },
  {
    id: 'zhengguo_renda',
    title: '中枢 · 委员长',
    summary:
      '立法与监督的案头，堆着比乡镇台账更厚的材料。你仍习惯把数字核两遍——那是青石镇留下的毛病，也是本钱。',
    priority: 72,
    check: (s) => getPost(s.postId).id === 'renda_zhang' && s.attrs.Lian >= 80 && s.risk < 28 && !canStayClimb(s),
  },
  {
    id: 'zhengguo_zhengxie',
    title: '中枢 · 政协主席',
    summary:
      '协商会场上，你把「多商量」三个字说得比谁都重。从基层一路走来，你知道：不商量的事，往往办不成，也办不好。',
    priority: 72,
    check: (s) => getPost(s.postId).id === 'zhengxie_zhang' && s.attrs.Lian >= 80 && s.risk < 28 && !canStayClimb(s),
  },
  {
    id: 'zhengguo_fuzhuxi',
    title: '中枢 · 副主席',
    summary:
      '副手的位置，是补台不是拆台。你把更多时间用在听汇报、看现场、盯落实——像当年在乡镇蹲点那样。',
    priority: 71,
    check: (s) => getPost(s.postId).id === 'guojia_fuzhuxi' && s.attrs.Lian >= 80 && s.risk < 28 && !canStayClimb(s),
  },
  {
    id: 'zhengguo',
    title: '中枢',
    summary:
      '就职宣誓那天，你想起青石镇门卫室的消毒水味，想起第一次写材料时对不上的两个数字。路很长，但每一步都算数。',
    priority: 70,
    check: (s) => rank(s) >= 19 && s.attrs.Lian >= 70 && s.risk < 30 && !canStayClimb(s),
  },

  // ── 口碑 / 沉底 / 着陆 ─────────────────────
  {
    id: 'koubei',
    title: '群众口碑',
    summary:
      '位子不高。但提起你，有人说「那娃做事公道」。你偶尔会回青石吃碗面，王婶见了还喊你「干部」，声音比当年软。',
    priority: 25,
    check: (s) =>
      s.turn >= 100 &&
      s.attrs.MX >= 78 &&
      rank(s) <= 5 &&
      rank(s) >= 4 &&
      s.age >= 52 &&
      stuckLong(s),
  },
  {
    id: 'koubei_dangwu',
    title: '清流名声',
    summary: '你没站队，也没发财。组织评价「干净、能写、较真」。有人觉得你亏，你自己知道账怎么算。',
    priority: 26,
    check: (s) =>
      s.turn >= 420 &&
      s.attrs.Lian >= 78 &&
      s.attrs.MX >= 60 &&
      rank(s) >= 16 &&
      rank(s) <= 17 &&
      s.faction === 'none' &&
      s.risk < 25 &&
      s.age >= 63 &&
      stuckLong(s),
  },
  {
    id: 'paixi_yingjia',
    title: '船上的人',
    summary: '你绑上了赢的那一边。名单上有你的名字。茶话会上笑声很多，你知道其中有多少是冲着椅子来的。',
    priority: 27,
    check: (s) =>
      (s.faction === 'A' || s.faction === 'B') &&
      s.turn >= 60 &&
      rank(s) >= 8 &&
      s.risk < 55 &&
      s.attrs.GX >= 70,
  },
  {
    id: 'pingan_lao',
    title: '平安着陆',
    summary: '退休茶话会上，评价词是「稳」。你笑了笑，没接话。回家路上，路过曾经的镇政府，门卫换了年轻人。',
    priority: 20,
    check: (s) =>
      s.turn >= 400 &&
      rank(s) >= 16 &&
      s.risk < 40 &&
      s.attrs.Lian >= 55 &&
      s.age >= 65 &&
      stuckLong(s),
  },
  {
    id: 'shiliang_futing',
    title: '厅局里挑担子',
    summary: '你在市里把一摊难事扛了下来。有人说你「能干事」，有人说你「太较真」。窗外江面很宽，你的名字还不常出现在更大的名单上。',
    priority: 35,
    check: (s) =>
      s.turn >= 320 &&
      rank(s) >= 12 &&
      rank(s) < 13 &&
      s.risk < 50 &&
      s.attrs.ZJ >= 70 &&
      s.age >= 52 &&
      stuckLong(s),
  },
  {
    id: 'sheng_li',
    title: '省里的一席',
    summary: '你坐进了省里的会议室。茶杯是统一的，问题是全省的。你想起乡镇食堂那碗飘着油花的菜汤，忽然觉得那汤也不远。',
    priority: 36,
    check: (s) =>
      s.turn >= 380 &&
      rank(s) >= 15 &&
      rank(s) < 17 &&
      s.risk < 45 &&
      s.attrs.Lian >= 60 &&
      s.age >= 63 &&
      stuckLong(s),
  },
  {
    id: 'jiahe',
    title: '家和事兴',
    summary:
      '你没走到最高的那级，但爱人说「这些年你人在家的时间多了」。父母身体尚可，孩子记得你去过的家长会。组织评价：顾家，也顾工作。',
    priority: 28,
    check: (s) =>
      s.turn >= 60 &&
      // 家庭向结局是「后程收档」：壮年期不该因为三年没升上去就把生涯判死
      s.age >= 55 &&
      rank(s) >= 4 &&
      rank(s) <= 10 &&
      !!s.family?.spouse &&
      s.family.spouseMood >= 75 &&
      s.family.parentHealth >= 50 &&
      s.risk < 45 &&
      stuckLong(s),
  },
  {
    id: 'benxiang_liu',
    title: '本乡好名声',
    summary: '你没离开本乡太久，也没把乡亲的事办砸。门卫仍喊你乳名，你回头笑了笑。',
    priority: 29,
    check: (s) =>
      s.flags.originName === '本乡本土' &&
      // 须年过而立仍扎根乡镇且未交流，避免与最低任职年龄赛跑
      s.turn >= 108 &&
      s.age >= 34 &&
      s.attrs.MX >= 65 &&
      rank(s) <= 4 &&
      s.flags.jiaoliu !== true &&
      s.risk < 40,
  },
  {
    id: 'jiafeng',
    title: '家风有亏',
    summary: '家里出了事，组织找你谈话。你说「我确实顾得少」。桌上的台历还停在出差那周。',
    priority: 88,
    check: (s) =>
      s.turn >= 36 &&
      !!s.family &&
      ((s.family.spouse && s.family.spouseMood < 15) || s.family.parentHealth < 18),
  },
  {
    id: 'paixi_fu',
    title: '倾覆的战车',
    summary: '你绑上的那艘船翻了。名单上有你的名字。茶话会没开，谈话室的灯亮到很晚。',
    priority: 90,
    check: (s) =>
      (s.faction === 'A' || s.faction === 'B') &&
      s.risk >= 80 &&
      s.attrs.Lian < 40 &&
      s.turn >= 60,
  },
  {
    id: 'hidden_legacy',
    title: '隐于朝',
    summary:
      '你走过十六种出身、许多个省份。最后你选择在副部级任上「到站」，把位置让给更年轻的人。有人说你可惜，有人说你通透。你只记得青石镇第一次加班的那个夜晚。',
    priority: 62,
    check: (s) =>
      s.flags.originName === '老档案重生' &&
      rank(s) >= 15 &&
      s.turn >= 80 &&
      s.attrs.Lian >= 65 &&
      s.risk < 35 &&
      stuckLong(s),
  },
  {
    id: 'tuixiu',
    title: '到龄退休',
    summary:
      '组织谈话很短：年龄到了，按规定退休。你收拾办公室时，翻出第一次报到的工作证。照片上的人比现在瘦，眼睛比现在亮。门卫仍喊你一声「老领导」。',
    priority: 95,
    check: (s) => {
      const rank = getPost(s.postId).rank
      const ret = rank <= 7 ? 60 : rank <= 11 ? 63 : rank <= 14 ? 65 : rank <= 17 ? 68 : 70
      return s.age >= ret && !s.retiredMode
    },
  },
  {
    id: 'shengya_zanting',
    title: '生涯暂缓',
    summary:
      '组织说「再看看」。你还在原来的岗位上，茶续了一杯又一杯。这一局先停在这里——或许下一次，路会不一样。',
    priority: 2,
    // 50 岁以下不判「停」：与收档类同为壮年期保护，避免 40 岁上下的正科被直接按下暂停键
    check: (s) => s.turn >= 200 && rank(s) <= 5 && s.age >= 50 && s.age < 60,
  },
  {
    id: 'jixu',
    title: '仕途未尽',
    summary: '这一局先停在这里。文件柜锁着，茶还温着。更高的台阶、更长的夜，都还在前面。',
    priority: 1,
    check: (s) => s.turn >= 560,
  },
]

export function resolveEnding(s: GameState): Ending | null {
  const hits = ENDINGS.filter((e) => e.check(s)).sort((a, b) => b.priority - a.priority)
  return hits[0] ?? null
}
