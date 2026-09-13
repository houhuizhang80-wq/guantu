import type { GameEvent } from '../types'

/** 高岗位（副处～副部）出身回响事件 */
export const ORIGIN_HIGH_EVENTS: GameEvent[] = [
  {
    id: 'oh_xd_zuzhi_bu',
    kind: 'daily',
    title: '组织部旧档',
    text: '你已是县处级。整理档案时翻到当年选调报名表，照片很青涩。组织部同事说：「您这批，还剩三个在系统里。」',
    weight: 6,
    originIds: ['xuandiao_pu', 'xuandiao_ding'],
    minRank: 8,
    maxRank: 14,
    choices: [
      {
        label: '感慨但继续赶路',
        fx: { NL: 2, ZJ: 2, Lian: 1 },
      },
      {
        label: '关照仍在基层的同批',
        fx: { GX: 4, MX: 2, Lian: 1 },
      },
    ],
  },
  {
    id: 'oh_cg_laocun_gao',
    kind: 'daily',
    title: '原村通高速',
    text: '你当年服务的村要通高速。方案里有一段「尽量少占良田」。你签字前，让人把村里老人请来开了个听证。',
    weight: 6,
    originIds: ['cunguan', 'sanfuyi', 'xibu', 'benxiang'],
    minRank: 8,
    maxRank: 14,
    choices: [
      {
        label: '听证后再定方案',
        fx: { MX: 6, ZJ: 4, NL: 3, GX: -2 },
      },
      {
        label: '按省厅方案直接批',
        fx: { ZJ: 3, MX: -3, GX: 2 },
      },
    ],
  },
  {
    id: 'oh_jz_weiwen',
    kind: 'daily',
    title: '维稳责任状',
    text: '你军转出身，分管领域签维稳责任状。有人问「是不是太军事化」。你说：「先把责任钉死，再谈灵活。」',
    weight: 6,
    originIds: ['jizhuan'],
    minRank: 8,
    maxRank: 14,
    choices: [
      {
        label: '责任到人、预案到点',
        fx: { ZJ: 4, NL: 3, MX: 2, GX: -2 },
      },
      {
        label: '适当放松考核',
        fx: { GX: 3, MX: -1, Risk: 2 },
      },
    ],
  },
  {
    id: 'oh_rc_lunwen',
    kind: 'daily',
    title: '旧论文被翻出',
    text: '有人翻出你读研时的论文，说你「早有主张」。也有人说「纸上谈兵」。你把论文附进一份可执行方案。',
    weight: 5,
    originIds: ['rencai', 'biguan', 'xuandiao_ding'],
    minRank: 8,
    maxRank: 14,
    choices: [
      {
        label: '用落地项目回应',
        fx: { ZJ: 5, NL: 4, MX: 2 },
      },
      {
        label: '不回应',
        fx: { Lian: 1, GX: -1 },
      },
    ],
  },
  {
    id: 'oh_gq_dongshi',
    kind: 'daily',
    title: '董事会里的旧识',
    text: '省属国企董事会名单里有你老东家的人。会后他递来名片：「有空坐坐。」你知道，这张名片连着一整张网。',
    weight: 6,
    originIds: ['guoqi_tiao'],
    minRank: 10,
    maxRank: 16,
    choices: [
      {
        label: '只谈公事',
        fx: { Lian: 4, GX: 1 },
      },
      {
        label: '保持联络',
        fx: { GX: 5, Lian: -4, Risk: 3 },
      },
    ],
  },
  {
    id: 'oh_bg_jianghua',
    kind: 'daily',
    title: '全市讲话稿',
    text: '市委让你把一把关年度讲话。你删掉十二个「进一步」，补了三条可考核指标。有人说你「不懂文风」。',
    weight: 5,
    originIds: ['biguan'],
    minRank: 10,
    maxRank: 16,
    choices: [
      {
        label: '坚持可考核',
        fx: { NL: 3, ZJ: 4, GX: -2 },
      },
      {
        label: '恢复「文风」',
        fx: { GX: 3, NL: -1 },
      },
    ],
  },
  {
    id: 'oh_js_shenji_gao',
    kind: 'crisis',
    title: '质量终身追责函',
    text: '多年前你签过字的工程出了问题。审计函到你案头。你找出当年的检测报告和会议纪要——还好，都在。',
    weight: 6,
    originIds: ['jishu', 'shiye_tiao', 'jizhuan'],
    minRisk: 30,
    minRank: 8,
    maxRank: 16,
    choices: [
      {
        label: '完整提交决策链',
        fx: { Lian: 5, Risk: -5, NL: 2 },
      },
      {
        label: '只交结论不交过程',
        fx: { Lian: -4, Risk: 4 },
      },
    ],
  },
  {
    id: 'oh_ws_diaoren',
    kind: 'daily',
    title: '外省干部交流',
    text: '组织问你是否愿意跨省交流。你想起刚来时听不懂的方言，和现在已经能笑出来的土话。',
    weight: 5,
    originIds: ['waisheng', 'xibu', 'jizhuan'],
    minRank: 10,
    maxRank: 16,
    choices: [
      {
        label: '服从交流',
        fx: { GX: 3, NL: 2, MX: 1 },
        // 标记交流
      },
      {
        label: '申请留任把事做完',
        fx: { ZJ: 3, MX: 2, GX: -1 },
      },
    ],
  },
  {
    id: 'oh_sheng_siliao',
    kind: 'daily',
    title: '省级新政落地',
    text: '你在市里落实省里新政。县区抱怨「上面一句话，下面跑断腿」。你把政策拆成三张清单，自己签了第一张。',
    weight: 6,
    minRank: 12,
    maxRank: 16,
    choices: [
      {
        label: '拆解落地、自己先干',
        fx: { ZJ: 4, NL: 3, MX: 3, GX: -2 },
      },
      {
        label: '原样转发，压给县里',
        fx: { GX: 2, MX: -3, ZJ: 1 },
      },
    ],
  },
  {
    id: 'oh_sheng_jiancha',
    kind: 'crisis',
    title: '省纪委延伸了解',
    text: '省纪委「延伸了解」你分管领域的历史项目。你把当年的会议纪要和签字页全部调出，码得整整齐齐。',
    weight: 0,
    minRisk: 38,
    minRank: 12,
    maxRank: 17,
    choices: [
      {
        label: '完整提交决策链',
        fx: { Lian: 5, Risk: -6 },
        require: { Lian: 52 },
      },
      {
        label: '先摸清范围',
        fx: { Risk: 6, GX: 3, Lian: -4 },
      },
    ],
  },
  {
    id: 'oh_xian_shuji',
    kind: 'daily',
    title: '县常委会上的一句话',
    text: '你出身条线，坐进县委常委会。有人问「你更懂业务还是更懂政治」。你说：「先把事办成。」',
    weight: 5,
    originIds: ['jishu', 'shiye_tiao', 'guokao', 'guoqi_tiao', 'rencai'],
    minRank: 8,
    maxRank: 12,
    choices: [
      {
        label: '业务与政治一起抓',
        fx: { ZJ: 4, NL: 3, GX: 2 },
      },
      {
        label: '专注条线',
        fx: { NL: 3, GX: -2, MX: 1 },
      },
    ],
  },
  {
    id: 'oh_city_shuzhi',
    kind: 'daily',
    title: '市里务虚会',
    text: '你已是市领导。务虚会上有人念稿，有人拍脑袋。你把一张三年前的对比图放在桌上。',
    weight: 6,
    minRank: 12,
    maxRank: 16,
    originIds: ['biguan', 'xuandiao_pu', 'shengkao'],
    choices: [
      {
        label: '用数据说话',
        fx: { ZJ: 4, NL: 3, Lian: 2, GX: -1 },
      },
      {
        label: '少说多听',
        fx: { GX: 3, Lian: 1 },
      },
    ],
  },
  {
    id: 'oh_province_yan',
    kind: 'daily',
    title: '省委全会分组讨论',
    text: '你列席省委全会分组。有人念稿，有人放炮。你发言只讲了三分钟，全是问题与对策。',
    weight: 6,
    minRank: 15,
    maxRank: 18,
    choices: [
      {
        label: '只讲问题与对策',
        fx: { NL: 3, ZJ: 3, GX: -2, Lian: 2 },
      },
      {
        label: '表态为主',
        fx: { GX: 4, NL: 1 },
      },
    ],
  },
  {
    id: 'oh_county_paiban',
    kind: 'daily',
    title: '县班子分工微调',
    text: '县里微调分工。你主动要了信访与安全生产——有人说你傻，你知道这两块最容易出事，也最容易练人。',
    weight: 6,
    minRank: 8,
    maxRank: 11,
    choices: [
      {
        label: '要难事',
        fx: { ZJ: 4, MX: 4, NL: 3, GX: -2 },
      },
      {
        label: '要好听的条线',
        fx: { GX: 4, MX: -2, ZJ: 2 },
      },
    ],
  },
  {
    id: 'oh_city_tour',
    kind: 'daily',
    title: '市里招商会',
    text: '你代表市里致辞。台下有老东家的人，有当年的对头。你只讲法治与产业，一句人情没提。',
    weight: 6,
    minRank: 12,
    maxRank: 16,
    originIds: ['guoqi_tiao', 'shengkao', 'waisheng'],
    choices: [
      {
        label: '只讲规则',
        fx: { Lian: 4, ZJ: 3, GX: -2 },
      },
      {
        label: '多叙旧情',
        fx: { GX: 5, Lian: -4 },
      },
    ],
  },
]
