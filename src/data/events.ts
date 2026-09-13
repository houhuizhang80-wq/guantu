import type { EventChoice, GameEvent } from '../types'
import { COUNTY_EVENTS } from './events_county'
import { CITY_EVENTS } from './events_city'
import { UPPER_EVENTS } from './events_upper'
import { UPPER_NPC_EVENTS } from './events_npc_upper'
import { ORIGIN_EVENTS } from './events_origin'
import { ORIGIN_COUNTY_EVENTS } from './events_origin_county'
import { FACTION_EVENTS } from './events_faction'
import { HIGH_DAILY_EVENTS } from './events_high_daily'
import { ADVERSITY_EVENTS } from './events_adversity'
import { HIGH_DAILY_EVENTS2 } from './events_high2'
import { FAMILY_EVENTS } from './events_family'
import { FLAVOR_EVENTS } from './events_flavor'
import { CROSS_EVENTS } from './events_cross'
import { ORIGIN_HIGH_EVENTS } from './events_origin_high'
import { CENTRAL_DAILY_EVENTS } from './events_central'
import { ORIGIN_TOP_EVENTS } from './events_origin_top'
import { EXPAND_EVENTS } from './events_expand'
import { FAMILY_CAREER_EVENTS, ORIGIN_MORE_EVENTS } from './events_more'
import { MORE_EVENTS2 } from './events_more2'
import { MEETING_EVENTS } from './events_meeting'

/**
 * 乡镇篇完整剧本（云河县 · 青石镇）
 * 目标：约 3–4 年（36–48 月）从办事员走到副镇长，或折戟。
 * 主线按 id 顺序推进；日常/人脉/危机按权重与风险穿插。
 */
const TOWNSHIP_EVENTS: GameEvent[] = [
  // ══════════════════ 主线 ══════════════════
  {
    id: 'main_baodao',
    kind: 'main',
    title: '报到第一天',
    text: '面包车把人扔在青石镇政府门口就走了。门卫室的大爷上下打量你：「新来的？」楼道里飘着消毒水和茶叶味。马主任把你领到党政办，桌上压着一张分工表，你的名字排在最后，后面括号里写着「跟班学习」。',
    textByOrigin: {
      xuandiao_pu:
        '长途大巴转了三趟，你拎着行李站在青石镇政府门口。门卫室的大爷上下打量你：「新来的选调生？」楼道里飘着消毒水和茶叶味。马主任把你领到党政办，分工表上你的名字排在最后，括号里写着「跟班学习」。组织部的电话只说了一句：先在乡镇墩苗。',
      xuandiao_ding:
        '县里派车把你送到镇政府。门卫已经听说「上面选调来的」。马主任亲自领路，茶比别人浓半分。分工表上你排在中间——定向选调，起点好看，议论也跟着好看。',
      shengkao:
        '公示结束，你拿着录用通知来报到。门卫扫了一眼：「省考进来的？」语气平常，像在核对名单。马主任把你领到最靠门的办公桌：「先熟悉台账。」笔试第一，在这里只值一句「哦」。',
      guokao:
        '你从垂管系统下沉锻炼，介绍信上盖着上级机关的章。门卫多看了两眼：「上面下来的？」马主任客气里带着分寸——条线的人，用得着，也别处得浅。',
      cunguan:
        '服务期满考核优秀，你转任公务员到镇上报到。门卫认识你：「不是以前在村里那个大学生吗？」楼道里有人点头：「脚上有泥的那个。」马主任笑：「熟门熟路。」',
      sanfuyi:
        '三支一扶期满考录，你从支农岗位走进机关楼。介绍信折了角。门卫念了念单位：「哦，以前来过。」马主任把你领进党政办：「村里那摊子，你还熟。」',
      jizhuan:
        '军装换成了夹克，档案从部队转到地方。门卫看了安置介绍信：「军转的？」你腰板仍直。马主任领你进屋：「地方规矩多，慢慢来。」令行禁止你会，会场与酒场，要重学。',
      rencai:
        '人才引进见面会开完，你直接到镇上报到。门卫念学历时顿了一下：「硕士？」马主任把你领到办公桌，桌上摊着惠农台账：「先把专业用在实处。」',
      shiye_tiao:
        '一纸调任，你从事业单位走进镇政府。门卫分不清编制，只认公章。马主任说：「业务口来的，以后多担待。」事业与行政，隔的不只是一个编制。',
      guoqi_tiao:
        '从国企调任进体制，名片换成了工作证。门卫客气：「企业来的领导？」你笑了笑。马主任泡茶：「经营那一套，地方也用得上——就是账，要两头都会看。」',
      biguan:
        '你从县委办文字岗轮岗到青石镇。门卫认识你：「哟，笔杆子下来了？」楼道里有人低声说「材料写得好的那位」。分工表上写着「文字综合」，没有「跟班」——但你知道，材料好不等于椅子稳。',
      jishu:
        '组织把你从县农业局技术岗调到青石镇。门卫看着介绍信念：「搞技术的？」马主任把你领到还没录完的惠农台账前：「协助农业与项目。」从试验田到会场，路比想象长。',
      benxiang:
        '考回本镇上班。门卫是你远房叔：「回来就好好干，别叫人戳脊梁。」楼道里全是熟面孔，茶还没喝，问候已到第三拨。马主任笑：「自己人，更要避嫌。」',
      ganbu_jun:
        '你父亲的老战友把你送到镇政府门口，说了句「别给老头丢人」就走了。门卫一见就笑：「是老张家的吧？」马主任几乎是小跑出来的。分工表上你不在最后，括号里仍写着「跟班学习」——嘴上不说，纸上要写。',
      waisheng:
        '跨省考录，火车转汽车，你站在完全陌生的镇政府门口。口音要慢半拍才懂。门卫：「外地考来的？」马主任把你领进屋：「人生地不熟，反倒干净。」',
      xibu:
        '服务期满安置进机关。你行李箱上还贴着支边的标签。门卫多问了一句：「西边回来的？」马主任给你倒水：「见过难处的人，稳。」',
    },
    weight: 0,
    onlyOnce: true,
    storyOrder: 1,
    minRank: 0,
    maxRank: 0,
    choices: [
      {
        label: '主动问有什么活可以搭手',
        hint: '留下勤快的印象',
        fx: { GX: 4, NL: 3, MX: 2 },
        npcFx: [{ id: 'zhuren', favor: 8 }],
      },
      {
        label: '先熟悉制度和台账',
        hint: '稳，存在感低',
        fx: { NL: 5, Lian: 2 },
      },
      {
        label: '去跟周书记报个到',
        hint: '胆子大，可能碰壁',
        fx: { GX: 3 },
        npcFx: [{ id: 'laoshuji', favor: 6 }],
        successRate: 0.7,
        failFx: { GX: -3 },
        failText: '书记在开会，秘书让你「先安心熟悉环境」。',
      },
    ],
  },
  {
    id: 'main_cailiao',
    kind: 'main',
    title: '紧急材料',
    text: '晚上十点，党政办灯还亮着。周书记要一份明天县里汇报的材料，点名让你执笔。马主任在一旁使眼色：口径要「稳」。你翻着各口上报的数字，有两处明显对不上。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 2,
    minRank: 0,
    maxRank: 2,
    choices: [
      {
        label: '实事求是，把困难和数据矛盾写清楚',
        hint: '上头未必爱听',
        fx: { ZJ: 7, MX: 5, GX: -5, NL: 4 },
        npcFx: [{ id: 'laoshuji', favor: 12 }],
        successRate: 0.72,
        failFx: { ZJ: -2, GX: -7 },
        failText: '书记看完只说了句「再斟酌」。材料压了一周，县里催了两次。',
      },
      {
        label: '突出亮点，困难一笔带过',
        hint: '短期好看',
        fx: { ZJ: 4, GX: 7, Lian: -4 },
        npcFx: [{ id: 'zhuren', favor: 10 }],
      },
      {
        label: '按马主任给的旧模板改一版',
        hint: '省事，容易被看出敷衍',
        fx: { NL: 1, GX: 2, ZJ: 1 },
        successRate: 0.6,
        failFx: { GX: -4, NL: -1 },
        failText: '书记把材料摔在桌上：「去年的壳子，今年的内容？」',
      },
    ],
  },
  {
    id: 'main_qianqian',
    kind: 'main',
    title: '拆迁协调会',
    text: '镇上修路要占王婶家半亩地。协调会上两边拍桌子，王婶把协议拍得啪啪响。领导把茶杯往你面前一推：「你年轻，你去说。」会议室突然很安静，所有人都在看你。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 3,
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '挨家挨户谈，按政策把补偿说透',
        hint: '慢，但站得住',
        fx: { MX: 12, ZJ: 7, NL: 5, GX: -2 },
        npcFx: [{ id: 'laobaixing', favor: 22 }],
        successRate: 0.7,
        failFx: { MX: 3, ZJ: -2, Risk: 5 },
        failText: '谈了半个月，进度还是落后。县里点了名，会上没人替你说话。',
      },
      {
        label: '让钱老板的施工队「先干起来」',
        hint: '快，有隐患',
        fx: { ZJ: 6, GX: 5, Lian: -14, Risk: 14 },
        npcFx: [
          { id: 'laoban', favor: 18 },
          { id: 'laobaixing', favor: -25 },
        ],
      },
      {
        label: '申请上级介入，自己只做记录',
        hint: '风险转移',
        fx: { Risk: -2, GX: -4, ZJ: -3, MX: -2 },
      },
    ],
  },
  {
    id: 'main_fangxun',
    kind: 'main',
    title: '暴雨橙色预警',
    text: '连下三天。夜里两点，应急喇叭把人从床上拽起来。低洼片区的排水沟堵了，有人不肯转移，说「淹过三回了，哪回真出事」。对讲机里县里在问：青石镇情况怎么样？',
    weight: 0,
    onlyOnce: true,
    storyOrder: 4,
    monthMod: [6, 7, 8],
    minRank: 0,
    maxRank: 4,
    choices: [
      {
        label: '带队上堤，逐户敲门转移',
        hint: '累，有实效',
        fx: { MX: 14, ZJ: 10, NL: 5 },
        npcFx: [{ id: 'laobaixing', favor: 15 }],
        successRate: 0.78,
        failFx: { MX: 4, ZJ: 2, Risk: 6 },
        failText: '有一户进水了，幸无伤亡。县里通报「处置及时但仍有疏漏」。',
      },
      {
        label: '坐镇指挥部，电话调度各村',
        hint: '稳妥，显得远',
        fx: { ZJ: 4, NL: 3, MX: 3 },
      },
      {
        label: '先拍几张照片上报「高度重视」',
        hint: '形式主义味道很冲',
        fx: { GX: 3, Lian: -5, MX: -6 },
        successRate: 0.55,
        failFx: { MX: -10, Risk: 8 },
        failText: '照片被本地号转发，配文是「领导视察式防汛」。',
      },
    ],
  },
  {
    id: 'main_zhaoshang',
    kind: 'main',
    title: '「重点招商」项目',
    text: '县里下了招商任务。钱老板介绍来一个「新能源配套园」，材料精美，承诺投资额后面的零多得像打印错误。李副书记很积极，说这是青石镇翻身的机会。周书记让你把把关。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 5,
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '核验资质与资金来源，发现疑点就叫停',
        hint: '得罪人，护住镇里',
        fx: { NL: 6, Lian: 10, ZJ: 4, GX: -10 },
        npcFx: [
          { id: 'laoban', favor: -20 },
          { id: 'fushuji', favor: -15 },
          { id: 'laoshuji', favor: 15 },
          { id: 'jizhu', favor: 8 },
        ],
        successRate: 0.75,
        failFx: { GX: -12, ZJ: -3 },
        failText: '你提出的疑点被压下：「年轻人不要阻碍发展。」项目仍上会。',
      },
      {
        label: '力推项目落地，先把指标做上去',
        hint: '政绩漂亮，雷可能在后面',
        fx: { ZJ: 12, GX: 8, Lian: -12, Risk: 12 },
        npcFx: [
          { id: 'laoban', favor: 15 },
          { id: 'fushuji', favor: 12 },
        ],
      },
      {
        label: '不表态，把球踢回县里',
        hint: '自保',
        fx: { GX: -2, Risk: -2, NL: 1 },
      },
    ],
  },
  {
    id: 'main_banzi',
    kind: 'main',
    title: '班子会前夜',
    text: '县里要来考察班子。马主任神秘兮兮地告诉你：李副书记最近常往县里跑。同批的小林发来微信：「听说你在材料里提了招商项目的问题？有人不高兴。」桌上放着一份「个人有关事项报告表」，空着。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 6,
    minRank: 2,
    maxRank: 4,
    choices: [
      {
        label: '如实填写，不站队，只谈工作',
        hint: '干净，可能两头不讨好',
        fx: { Lian: 8, GX: -4, NL: 2 },
        npcFx: [{ id: 'laoshuji', favor: 10 }],
      },
      {
        label: '向李副书记表个态，站他那边',
        hint: '关系上来了，风险也上来了',
        fx: { GX: 14, Lian: -8, Risk: 8, ZJ: 3 },
        faction: 'A',
        npcFx: [
          { id: 'fushuji', favor: 18 },
          { id: 'laoshuji', favor: -12 },
        ],
      },
      {
        label: '找周书记交底，说明自己只认事实',
        hint: '需要书记还信你',
        fx: { GX: 6, Lian: 4, Risk: -3 },
        require: { npc: [{ id: 'laoshuji', min: 25 }] },
        npcFx: [{ id: 'laoshuji', favor: 12 }],
      },
    ],
  },
  {
    id: 'main_kaohe',
    kind: 'main',
    title: '年度考核',
    text: '十二月。表格摊在桌上，自评栏空着。隔壁办公室已经有人开始「走动」。马主任路过门口，顿了顿：「今年名额紧，材料要经得起看。」',
    weight: 0,
    onlyOnce: true,
    storyOrder: 7,
    monthMod: [11, 12, 1],
    minRank: 0,
    maxRank: 4,
    choices: [
      {
        label: '如实填报，附上完整工作台账',
        fx: { Lian: 5, NL: 3 },
        successRate: 0.85,
        failFx: { GX: -5 },
        failText: '台账很厚，印象分很薄。领导说「再提炼提炼」。',
      },
      {
        label: '找马主任帮忙润色措辞',
        fx: { GX: 7, Lian: -5 },
        npcFx: [{ id: 'zhuren', favor: 12 }],
      },
      {
        label: '带着材料当面跟周书记汇报一次',
        hint: '伯乐路线',
        fx: { GX: 8, ZJ: 3 },
        require: { npc: [{ id: 'laoshuji', min: 30 }] },
        npcFx: [{ id: 'laoshuji', favor: 10 }],
      },
    ],
  },
  {
    id: 'main_fuke_tuijian',
    kind: 'main',
    title: '副科推荐谈话',
    text: '组织部来人，单独约谈。问题很标准：怎么看待青石镇这三年？怎么评价班子？有没有需要向组织说明的情况？窗外有人探头探脑。你知道，这间会议室的门隔音很好，但墙不一定。',
    weight: 0,
    onlyOnce: true,
    storyOrder: 8,
    minRank: 2,
    maxRank: 3,
    choices: [
      {
        label: '客观谈工作，不评价他人是非',
        hint: '稳妥',
        fx: { NL: 3, GX: 4, Lian: 3 },
        successRate: 0.8,
        failFx: { GX: -3 },
        failText: '谈话记录写你「观点鲜明」——有人解读成站队。',
      },
      {
        label: '突出自己的项目和数字',
        fx: { ZJ: 5, GX: 2 },
      },
      {
        label: '坦诚说明招商项目上的分歧',
        hint: '有风骨，也有代价',
        fx: { Lian: 6, GX: -6, MX: 4 },
        require: { afterEvent: 'main_zhaoshang' },
        npcFx: [{ id: 'jizhu', favor: 5 }],
      },
    ],
  },

  // ══════════════════ 日常 ══════════════════
  {
    id: 'daily_jiaban',
    kind: 'daily',
    title: '又一个加班夜',
    text: '食堂只剩馒头和一锅飘着油花的菜汤。打印机卡纸。你在改第三稿「阶段性进展汇报」，窗外是镇政府院子里唯一一盏还亮着的路灯。',
    weight: 10,
    minRank: 0,
    maxRank: 4,
    choices: [
      {
        label: '熬完，自己校对到末页',
        fx: { NL: 3, ZJ: 2, MX: 1 },
      },
      {
        label: '交给小林，自己先走',
        fx: { GX: -2, NL: 1 },
        npcFx: [{ id: 'tongshi', favor: -6 }],
      },
      {
        label: '把问题列清楚，请示后再改',
        hint: '少背锅',
        fx: { NL: 2, GX: 2, ZJ: 1 },
        npcFx: [{ id: 'zhuren', favor: 4 }],
      },
    ],
  },
  {
    id: 'daily_yanchi',
    kind: 'daily',
    title: '饭局',
    text: '马主任拉你去陪酒。主位空着，据说半小时后到。钱老板已经把单买了，还笑着说「不差这一顿」。包间里烟雾缭绕，像某种仪式的前奏。',
    weight: 9,
    maxRank: 4,
    choices: [
      {
        label: '去，但只喝茶',
        fx: { GX: 4, Lian: 2 },
      },
      {
        label: '去，该敬的酒都敬到位',
        fx: { GX: 9, Lian: -5 },
        npcFx: [{ id: 'laoban', favor: 10 }],
      },
      {
        label: '找个理由不去',
        fx: { GX: -7, Lian: 4, NL: 1 },
        npcFx: [{ id: 'zhuren', favor: -5 }],
      },
    ],
  },
  {
    id: 'daily_xinfang',
    kind: 'daily',
    title: '信访窗口',
    text: '王婶又来了，材料用塑料袋包着，边角都磨毛了。她说：「干部，我就信你。」后面还排着三个人，都盯着你看。',
    weight: 9,
    maxRank: 4,
    choices: [
      {
        label: '接下材料，当场约定办结时限',
        fx: { MX: 7, ZJ: 2 },
        npcFx: [{ id: 'laobaixing', favor: 12 }],
        successRate: 0.78,
        failFx: { MX: -5, Risk: 5 },
        failText: '时限到了，事情卡在隔壁科室。王婶在门口又等了你一上午。',
      },
      {
        label: '按流程登记，让她等通知',
        fx: { MX: -2, GX: 1, Lian: 1 },
      },
      {
        label: '帮她把材料理顺，教她走正规渠道',
        fx: { MX: 5, NL: 3, Lian: 2 },
        npcFx: [{ id: 'laobaixing', favor: 8 }],
      },
    ],
  },
  {
    id: 'daily_gaojian',
    kind: 'daily',
    title: '材料被改了三处',
    text: '你发现昨天交的稿，两个关键数字被「优化」了，一处「暂未完成」改成了「稳步推进」。没人认领这次修改。文件流转单上签了一串名字，看不清是谁动的笔。',
    weight: 8,
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '当面问清楚，要求改回',
        fx: { Lian: 6, GX: -6, NL: 2 },
        npcFx: [{ id: 'zhuren', favor: -8 }],
      },
      {
        label: '记在心里，不声张',
        fx: { Lian: -4, GX: 2, Risk: 4 },
      },
      {
        label: '留好底稿，只对周书记说明',
        fx: { Lian: 5, GX: 4, Risk: -2 },
        require: { npc: [{ id: 'laoshuji', min: 20 }] },
        npcFx: [{ id: 'laoshuji', favor: 10 }],
      },
    ],
  },
  {
    id: 'daily_peixun',
    kind: 'daily',
    title: '外出培训名额',
    text: '省里有个基层治理封闭培训，一周。通知写着「择优推荐」。去的人履历好看，但家里事堆着，镇上一摊活也走不开。',
    weight: 7,
    maxRank: 3,
    choices: [
      {
        label: '争取名额去学',
        fx: { NL: 8, ZJ: 3, MX: -1 },
      },
      {
        label: '让给更需要的人',
        fx: { GX: 6, NL: 1 },
        npcFx: [{ id: 'tongshi', favor: 14 }],
      },
      {
        label: '申请线上旁听，活照干',
        fx: { NL: 4, ZJ: 2, MX: 2 },
      },
    ],
  },
  {
    id: 'daily_juzhang',
    kind: 'daily',
    title: '同批小林先动了',
    text: '朋友圈已经有人点赞。小林请你吃饭，席间说：「其实你也差一点。」筷子在酸菜鱼里搅了两圈，谁都没再提那个「一点」是什么。',
    weight: 8,
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '真心祝贺，打听门道',
        fx: { GX: 4, NL: 3 },
        npcFx: [{ id: 'tongshi', favor: 12 }],
      },
      {
        label: '祝贺，然后埋头干自己的',
        fx: { ZJ: 5, NL: 2, GX: -1 },
      },
      {
        label: '心里发堵，找人喝酒吐槽',
        fx: { GX: 2, MX: -2, NL: -1, Lian: -2 },
      },
    ],
  },
  {
    id: 'daily_canguan',
    kind: 'daily',
    title: '上级来观摩',
    text: '县里要来看「美丽乡村示范点」。路线是提前踩好的，连路边堆放的农具都有人管。马主任叮嘱：「别出岔子，也别多话。」',
    weight: 8,
    maxRank: 4,
    choices: [
      {
        label: '按脚本走，保证场面',
        fx: { ZJ: 4, GX: 3 },
      },
      {
        label: '主动介绍真实进度和短板',
        fx: { NL: 3, MX: 4, GX: -4 },
        successRate: 0.7,
        failFx: { GX: -8, ZJ: -2 },
        failText: '领导脸上的笑淡了。观摩提前结束。',
      },
      {
        label: '把准备时间用来解决一处真问题',
        hint: '观摩未必看见',
        fx: { MX: 6, ZJ: 2, NL: 2 },
      },
    ],
  },
  {
    id: 'daily_chezi',
    kind: 'daily',
    title: '公车私用的「顺路」',
    text: '司机说顺路捎你去县城，又说顺路接一下他亲戚。车已经开出镇政府大院。后视镜里，门卫抬了抬手。',
    weight: 6,
    maxRank: 4,
    choices: [
      {
        label: '让司机送完亲戚就回，自己记一笔',
        fx: { Lian: 2, GX: 1 },
      },
      {
        label: '明确制止，按规定用车',
        fx: { Lian: 5, GX: -3 },
        npcFx: [{ id: 'zhuren', favor: -3 }],
      },
      {
        label: '装没看见',
        fx: { Lian: -6, Risk: 5, GX: 2 },
      },
    ],
  },
  {
    id: 'daily_yelian',
    kind: 'daily',
    title: '夜里的电话',
    text: '十一点半，手机响了。钱老板说「没事没事，就是问候一下」，然后说起他外甥在镇上开的砂石场，最近「手续有点不顺」。',
    weight: 7,
    maxRank: 4,
    choices: [
      {
        label: '公事公办，让他走窗口',
        fx: { Lian: 6, GX: -4 },
        npcFx: [{ id: 'laoban', favor: -10 }],
      },
      {
        label: '答应「问问情况」',
        hint: '人情债最贵',
        fx: { GX: 5, Lian: -10, Risk: 8 },
        npcFx: [{ id: 'laoban', favor: 14 }],
      },
      {
        label: '不接，第二天短信回复「按制度办」',
        fx: { Lian: 4, GX: -2, Risk: -2 },
      },
    ],
  },
  {
    id: 'daily_cunweihui',
    kind: 'daily',
    title: '村两委扯皮',
    text: '两个村的干部在会议室互相甩锅，起因是一条共用灌溉渠。烟灰缸满了，茶也淡了，事情还在原地打转。',
    weight: 8,
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '现场踏勘，拿出分段维护方案',
        fx: { NL: 5, ZJ: 5, MX: 5 },
        successRate: 0.72,
        failFx: { ZJ: 1, MX: 1 },
        failText: '方案被两边各挑了三个毛病，暂时搁置。',
      },
      {
        label: '各打五十大板，限期整改',
        fx: { ZJ: 2, GX: 2, MX: -1 },
      },
      {
        label: '上报县里，等上面定调',
        fx: { Risk: -1, ZJ: -1, GX: 1 },
      },
    ],
  },
  {
    id: 'daily_laoren',
    kind: 'daily',
    title: '敬老院的灯',
    text: '例行检查敬老院。有间宿舍的灯坏了两个月，报修单压在抽屉里。院长笑着说「马上安排」，你记得上回他也是这么说的。',
    weight: 6,
    maxRank: 3,
    choices: [
      {
        label: '盯着当天修好再走',
        fx: { MX: 6, ZJ: 3, NL: 2 },
      },
      {
        label: '写进检查通报，要求举一反三',
        fx: { MX: 3, ZJ: 2, GX: -2 },
      },
      {
        label: '算了，别为难基层',
        fx: { GX: 3, MX: -4 },
      },
    ],
  },
  {
    id: 'daily_xiaobao',
    kind: 'daily',
    title: '本地号的「新闻」',
    text: '小陈记者发来链接：一篇写青石镇「干部作风扎实」的稿，配图是你在田埂上的侧脸。评论区有人问：是不是摆拍？',
    weight: 6,
    minRank: 1,
    choices: [
      {
        label: '请他改成更克制的表述',
        fx: { Lian: 3, GX: 2, MX: 1 },
        npcFx: [{ id: 'jizhe', favor: 5 }],
      },
      {
        label: '转发并感谢，借势宣传',
        fx: { GX: 4, ZJ: 2, MX: 2 },
        npcFx: [{ id: 'jizhe', favor: 10 }],
      },
      {
        label: '不回应，冷处理',
        fx: { Lian: 1, MX: -1 },
      },
    ],
  },
  {
    id: 'daily_jiating',
    kind: 'daily',
    title: '家里的电话',
    text: '母亲问你「什么时候能调回县里」。你说快了。挂了电话才发现，这句「快了」你已经说了两年。',
    weight: 5,
    maxRank: 3,
    choices: [
      {
        label: '实话实说，让他们别等',
        fx: { MX: 2, NL: 1, GX: -1 },
      },
      {
        label: '继续说「快了」',
        fx: { GX: 1 },
      },
      {
        label: '请两天假回去看看',
        fx: { MX: 3, NL: -1, ZJ: -1 },
      },
    ],
  },
  {
    id: 'daily_taolun',
    kind: 'daily',
    title: '民主生活会',
    text: '批评与自我批评。大家的「缺点」都很安全：理论学习不够系统、工作作风有时急躁。轮到你了。',
    weight: 5,
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '说安全的缺点',
        fx: { GX: 2 },
      },
      {
        label: '点出真问题（自己的）',
        fx: { Lian: 4, NL: 3, GX: -2 },
      },
      {
        label: '点出真问题（工作层面的）',
        hint: '可能有人记账',
        fx: { Lian: 3, MX: 3, GX: -5 },
        successRate: 0.65,
        failFx: { GX: -8, Risk: 3 },
        failText: '会后有人提醒你：「话不要说太满。」',
      },
    ],
  },

  // ══════════════════ 人脉 ══════════════════
  {
    id: 'npc_qiuqing',
    kind: 'npc',
    title: '老书记的面',
    text: '周老书记请你去家里吃面。没外人，老伴在厨房剁蒜。他说：「你材料写得好，但光会写不够。镇上要的是能扛事的人。」面很烫，他吹了吹，又补一句：「也别学那些油的。」',
    weight: 0,
    onlyOnce: true,
    maxRank: 3,
    choices: [
      {
        label: '认真听，请他点一点路',
        fx: { NL: 6, GX: 5 },
        npcFx: [{ id: 'laoshuji', favor: 18 }],
      },
      {
        label: '多谈自己的难处',
        fx: { GX: 2, MX: -1 },
        npcFx: [{ id: 'laoshuji', favor: 6 }],
      },
    ],
  },
  {
    id: 'npc_shangren',
    kind: 'npc',
    title: '「不麻烦你办事」',
    text: '钱老板约茶，反复强调不求办事，只交朋友。茶是好茶，杯是薄胎。临走他从后备箱拿出一盒「土特产」：「给弟妹尝尝。」盒子沉得不正常。',
    weight: 0,
    maxRank: 4,
    choices: [
      {
        label: '拒收，保持距离',
        fx: { Lian: 9, GX: -3 },
        npcFx: [{ id: 'laoban', favor: -10 }],
      },
      {
        label: '收下，记在人情账上',
        hint: '危险的开始',
        fx: { Lian: -16, Risk: 14, GX: 6 },
        npcFx: [{ id: 'laoban', favor: 18 }],
      },
      {
        label: '不收，但答应帮介绍正规办事窗口',
        fx: { Lian: 4, NL: 3, GX: 1 },
        npcFx: [{ id: 'laoban', favor: 5 }],
      },
    ],
  },
  {
    id: 'npc_duizhang',
    kind: 'npc',
    title: '李副书记的「关心」',
    text: '李副书记在楼道拦住你，递了根烟（你不抽，他也不恼）。「听说县里在看青石镇的班子？年轻人，别站太明显，也别谁都不得罪——那样谁也不把你当自己人。」',
    weight: 7,
    minRank: 1,
    maxRank: 4,
    choices: [
      {
        label: '笑笑，说自己只懂干活',
        fx: { GX: -2, NL: 1, Lian: 2 },
      },
      {
        label: '顺着话头「表个态」',
        fx: { GX: 10, Lian: -5, Risk: 5 },
        faction: 'A',
        npcFx: [{ id: 'fushuji', favor: 15 }],
      },
      {
        label: '回头就告诉周老书记',
        fx: { GX: 5, Risk: -2, Lian: 2 },
        npcFx: [
          { id: 'laoshuji', favor: 8 },
          { id: 'fushuji', favor: -12 },
        ],
      },
    ],
  },
  {
    id: 'npc_tongshi_jiu',
    kind: 'npc',
    title: '小林的酒后真言',
    text: '小林喝多了，拉着你说：「咱们这批，有关系的已经借调县里了。你我这种，就得拿命干出成绩——或者，学会低头。」他打了个酒嗝，眼神忽然清醒：「刚才那句，你当我没说。」',
    weight: 6,
    minRank: 0,
    maxRank: 3,
    choices: [
      {
        label: '陪他喝完，送他回去',
        fx: { GX: 5, MX: 2 },
        npcFx: [{ id: 'tongshi', favor: 15 }],
      },
      {
        label: '问他「低头」具体指什么',
        fx: { NL: 3, GX: 2 },
        npcFx: [{ id: 'tongshi', favor: 8 }],
      },
      {
        label: '转移话题，别惹事',
        fx: { Lian: 2, GX: -1 },
      },
    ],
  },
  {
    id: 'npc_jizhe_yaoqing',
    kind: 'npc',
    title: '记者的「选题」',
    text: '小陈想做一期「基层干部的一天」，点名跟拍你。他说：「你要是干净的，这是机会；你要是有事，这是灾难。」他笑了笑，像在陈述天气。',
    weight: 5,
    minRank: 1,
    choices: [
      {
        label: '答应，全程公开',
        hint: '需要真干净',
        fx: { MX: 6, ZJ: 3, Lian: 2 },
        require: { Lian: 55 },
        npcFx: [{ id: 'jizhe', favor: 12 }],
        successRate: 0.85,
        failFx: { MX: -3, Risk: 6 },
        failText: '有群众当面反映了你没处理完的问题，镜头都在。',
      },
      {
        label: '婉拒，说明还有工作要推进',
        fx: { GX: 1, NL: 1 },
        npcFx: [{ id: 'jizhe', favor: -3 }],
      },
      {
        label: '请他先「通通稿子口径」',
        fx: { GX: 3, Lian: -6, Risk: 4 },
        npcFx: [{ id: 'jizhe', favor: 8 }],
      },
    ],
  },
  {
    id: 'npc_jizhu_yue',
    kind: 'npc',
    title: '纪委的「了解情况」',
    text: '赵纪委约你「随便聊聊」。茶很烫，他翻着本子：「有群众反映，修路那阵子补偿款发放不规范。你当时经手了协调？」他的笔尖停在半空。',
    weight: 0,
    minRisk: 40,
    minRank: 0,
    choices: [
      {
        label: '有啥说啥，配合核对',
        fx: { Risk: -12, Lian: 5 },
        require: { Lian: 42 },
        npcFx: [{ id: 'jizhu', favor: 12 }],
      },
      {
        label: '打太极，能拖则拖',
        fx: { Risk: 10, GX: 2, Lian: -4 },
        npcFx: [{ id: 'jizhu', favor: -8 }],
      },
      {
        label: '先打电话找关系摸底',
        hint: '可能坐实「对抗审查」印象',
        fx: { GX: 5, Risk: 6, Lian: -8 },
        require: { GX: 48 },
        npcFx: [{ id: 'jizhu', favor: -12 }],
      },
    ],
  },

  // ══════════════════ 危机 ══════════════════
  {
    id: 'crisis_li',
    kind: 'crisis',
    title: '礼盒',
    text: '钱老板让人捎来一个「茶叶礼盒」，说是老家新茶。盒子沉得不正常，角落贴着一张没写字的便签。',
    weight: 0,
    minRisk: 22,
    maxRank: 4,
    choices: [
      {
        label: '当场退回，说明纪律',
        fx: { Lian: 10, Risk: -8, GX: -4 },
        npcFx: [{ id: 'laoban', favor: -14 }],
      },
      {
        label: '上交组织，书面说明',
        fx: { Lian: 12, Risk: -12, GX: 3 },
        npcFx: [{ id: 'jizhu', favor: 10 }],
      },
      {
        label: '收下，以后找机会还人情',
        fx: { Lian: -18, Risk: 18, GX: 4 },
        npcFx: [{ id: 'laoban', favor: 20 }],
      },
    ],
  },
  {
    id: 'crisis_meiti',
    kind: 'crisis',
    title: '短视频火了',
    text: '一段「干部与群众对峙」的视频在本地号传播。角度对你不利——画面里你正抬手解释，被截成了「指指点点」。小陈记者打来电话：「要不要给你一个澄清的机会？」',
    weight: 0,
    minRisk: 32,
    choices: [
      {
        label: '如实说明过程，不甩锅',
        fx: { MX: 5, Risk: -7, GX: -2 },
        npcFx: [{ id: 'jizhe', favor: 6 }],
        successRate: 0.68,
        failFx: { Risk: 9, MX: -7 },
        failText: '澄清被二次剪辑，舆情反而升温。县里让你「先稳一稳」。',
      },
      {
        label: '让宣传口「沟通」平台下架',
        fx: { Risk: -2, GX: 5, Lian: -6 },
      },
      {
        label: '先不回应，等热度过去',
        fx: { Risk: 6, MX: -4 },
      },
    ],
  },
  {
    id: 'crisis_zhiliang',
    kind: 'crisis',
    title: '工程质量问题',
    text: '有人匿名寄来照片：新修路段的混凝土有裂缝。施工方是钱老板介绍的队伍。县里质监站要来人。',
    weight: 0,
    minRisk: 28,
    minRank: 1,
    choices: [
      {
        label: '立即停工复检，公开结果',
        fx: { ZJ: 3, Lian: 6, MX: 6, GX: -8, Risk: -5 },
        npcFx: [
          { id: 'laoban', favor: -18 },
          { id: 'laobaixing', favor: 12 },
        ],
      },
      {
        label: '先压一压，等质监「走过场」',
        fx: { Risk: 14, Lian: -12, GX: 5 },
        npcFx: [{ id: 'laoban', favor: 12 }],
      },
      {
        label: '把责任推给施工队，自己只签字',
        fx: { Risk: 6, Lian: -5, GX: -2 },
      },
    ],
  },
  {
    id: 'crisis_jingshi',
    kind: 'crisis',
    title: '作风问题举报',
    text: '一封没有署名的信出现在县纪委收发室，反映你「与管理服务对象交往过密」。马主任偷偷告诉你这件事时，手心是汗。',
    weight: 0,
    minRisk: 50,
    choices: [
      {
        label: '主动找赵纪委说明交往边界',
        fx: { Risk: -10, Lian: 6, GX: -2 },
        require: { Lian: 45 },
        npcFx: [{ id: 'jizhu', favor: 8 }],
      },
      {
        label: '找关系打听「谁写的」',
        fx: { Risk: 8, GX: 4, Lian: -8 },
      },
      {
        label: '当没发生，正常上班',
        fx: { Risk: 5, NL: -1 },
      },
    ],
  },

  // ══════════════════ 温和 / 调节 ══════════════════
  {
    id: 'calm_kaoyan',
    kind: 'calm',
    title: '难得清静',
    text: '周末没会。你把宿舍收拾了一遍，翻出报到时的工作证。照片里的人比现在瘦，眼睛比现在亮。',
    weight: 6,
    choices: [
      {
        label: '读完一直想读的那本书',
        fx: { NL: 4 },
      },
      {
        label: '给家里打了个长电话',
        fx: { MX: 2, NL: 1 },
      },
      {
        label: '把下周计划列成清单',
        fx: { ZJ: 3, NL: 2 },
      },
    ],
  },
  {
    id: 'calm_zhangqi',
    kind: 'calm',
    title: '锦旗',
    text: '王婶他们送来一面锦旗，红得刺眼。办公室让你合影，你有点不好意思。快门响的时候，你下意识把锦旗往旁边挪了半寸。',
    weight: 5,
    onlyOnce: true,
    minRank: 1,
    choices: [
      {
        label: '合影，挂到会议室',
        fx: { MX: 7, ZJ: 3, GX: 3 },
      },
      {
        label: '收下，不张扬',
        fx: { MX: 5, Lian: 3, GX: -1 },
      },
    ],
  },
  {
    id: 'calm_jishi',
    kind: 'calm',
    title: '赶集日',
    text: '逢五逢十的集。你被安排去维持秩序。卖糖葫芦的大爷认出你：「上回渠的事，多亏你跑。」硬塞了两串，不要钱。',
    weight: 5,
    maxRank: 3,
    choices: [
      {
        label: '付钱，再聊两句近况',
        fx: { MX: 5, Lian: 2 },
        npcFx: [{ id: 'laobaixing', favor: 6 }],
      },
      {
        label: '笑着收下，回头让办公室结账',
        fx: { MX: 3, GX: 1 },
      },
      {
        label: '婉拒，继续巡查',
        fx: { Lian: 3, MX: 1 },
      },
    ],
  },
]

/**
 * 主线选项补到 5 个：
 * 原有 3 → 追加「请示定夺」「另辟路径」；已有 4 → 再补 1 条。
 * 按职级窗口微调文案与数值，保持可玩取舍。
 */
function expandMainChoices(e: GameEvent): GameEvent {
  if (e.kind !== 'main') return e
  if (e.choices.length >= 5) return e
  const maxR = e.maxRank ?? 99
  const high = maxR >= 12
  const mid = maxR >= 6 && maxR < 12
  const extra: EventChoice[] = []

  if (e.choices.length <= 3) {
    extra.push(
      high
        ? {
            label: '会前请示主要领导定夺，自己备好两套预案',
            hint: '程序稳，显成熟',
            fx: { GX: 5, NL: 3, ZJ: 2 },
            successRate: 0.82,
            failFx: { GX: -2 },
            failText: '领导说「你们先议」，球又踢了回来。',
          }
        : mid
          ? {
              label: '先向分管领导通气，再定口径',
              hint: '稳妥，略慢',
              fx: { GX: 4, NL: 2, ZJ: 1 },
              successRate: 0.8,
              failFx: { GX: -3 },
              failText: '领导在市里开会，事情悬着。',
            }
          : {
              label: '先请示马主任把关，再往下推',
              hint: '借力，欠人情',
              fx: { GX: 3, NL: 2 },
              successRate: 0.78,
              failFx: { GX: -4 },
              failText: '马主任说「按原则办」，等于没说。',
            },
    )
    extra.push(
      high
        ? {
            label: '另辟路径：联合条线与社会力量一起解',
            hint: '格局大，协调难',
            fx: { ZJ: 5, MX: 3, NL: 4, GX: -2 },
            successRate: 0.68,
            failFx: { ZJ: -2, GX: -5, Risk: 4 },
            failText: '几方扯皮，问题还在原地，锅已经分好了。',
          }
        : {
            label: '另辟路径：从源头找替代方案',
            hint: '巧，风险自担',
            fx: { NL: 4, MX: 2, ZJ: 3, GX: -3 },
            successRate: 0.65,
            failFx: { ZJ: -3, Risk: 5 },
            failText: '方案听起来聪明，落地时全卡在手续上。',
          },
    )
    // 原本仅 2 选时再补一条折中
    if (e.choices.length === 2) {
      extra.push({
        label: '折中推进：先试点再推开',
        hint: '慢热，阻力小',
        fx: { ZJ: 2, MX: 2, NL: 1, GX: 1 },
        successRate: 0.72,
        failFx: { ZJ: -1 },
        failText: '试点选点失误，推广搁浅。',
      })
    }
  } else if (e.choices.length === 4) {
    extra.push(
      high
        ? {
            label: '两套方案上会比选，把责任写进纪要',
            hint: '规范，可追溯',
            fx: { Lian: 3, NL: 3, ZJ: 2 },
            successRate: 0.75,
            failFx: { GX: -2 },
            failText: '会上各说各话，纪要难产。',
          }
        : {
            label: '先把风险清单列全，再择一推进',
            hint: '稳一点',
            fx: { Lian: 2, NL: 2, MX: 1 },
            successRate: 0.78,
            failFx: {},
            failText: '清单列完，时间已经过去一半。',
          },
    )
  }

  while (e.choices.length + extra.length > 5) extra.pop()
  if (extra.length === 0) return e
  return { ...e, choices: [...e.choices, ...extra] }
}

/** 全生涯合并事件池 */
export const EVENTS: GameEvent[] = [
  ...TOWNSHIP_EVENTS,
  ...COUNTY_EVENTS,
  ...CITY_EVENTS,
  ...UPPER_EVENTS,
  ...UPPER_NPC_EVENTS,
  ...ORIGIN_EVENTS,
  ...ORIGIN_COUNTY_EVENTS,
  ...FACTION_EVENTS,
  ...HIGH_DAILY_EVENTS,
  ...ADVERSITY_EVENTS,
  ...HIGH_DAILY_EVENTS2,
  ...FAMILY_EVENTS,
  ...FLAVOR_EVENTS,
  ...CROSS_EVENTS,
  ...ORIGIN_HIGH_EVENTS,
  ...CENTRAL_DAILY_EVENTS,
  ...ORIGIN_TOP_EVENTS,
  ...EXPAND_EVENTS,
  ...FAMILY_CAREER_EVENTS,
  ...ORIGIN_MORE_EVENTS,
  ...MORE_EVENTS2,
  ...MEETING_EVENTS,
].map(expandMainChoices)

export function getEvent(id: string): GameEvent {
  const e = EVENTS.find((x) => x.id === id)
  if (!e) throw new Error(`unknown event ${id}`)
  return e
}

/** 取事件正文（支持按出身覆盖） */
export function getEventText(ev: GameEvent, originId?: string | null): string {
  if (originId && ev.textByOrigin) {
    const t = ev.textByOrigin[originId as keyof typeof ev.textByOrigin]
    if (t) return t
  }
  return ev.text
}

export const TOWNSHIP_EVENT_COUNT = TOWNSHIP_EVENTS.length
export const ALL_EVENT_COUNT = EVENTS.length
