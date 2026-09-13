import type { GameState } from '../types'
import { getOrigin } from './origins'
import { getPost } from './posts'

/** 出身 × 终局 的专属结语（比通用 summary 更「你这一条路」） */
export function originEndingLine(s: GameState): string {
  if (!s.originId) return ''
  const oid = s.originId
  if (oid === 'legacy') {
    const rank = getPost(s.postId).rank
    const fail = ['luoma', 'kaichu', 'diaocha'].includes(s.endingId || '')
    if (fail) return '重生一局，仍没能把旧账本写成清白册。'
    if (rank >= 18) return '十六种出身都走过，这一次终于把路走成了自己的名字。'
    return '带着记忆重新报到，路还是那条路，脚印已经不同。'
  }
  const post = getPost(s.postId)
  const rank = post.rank
  const ending = s.endingId || ''
  const fail = ending === 'luoma' || ending === 'kaichu' || ending === 'diaocha'
  const top = rank >= 18

  const map: Record<string, { fail: string; mid: string; high: string }> = {
    xuandiao_pu: {
      fail: '选调表上「扎根基层」四字还在，你的脚已经不在泥里了。',
      mid: '从跟班学习到独当一面，组织部的名单翻过了你的名字——往前是路，往后也是。',
      high: '当年面包车扔在镇门口的年轻人，后来把调令读成了一生最长的句子。',
    },
    xuandiao_ding: {
      fail: '定向光环碎得比乡镇的路灯还快。',
      mid: '名校二字只值第一年，往后全是台账与现场。',
      high: '紧缺专业最后用在了更大的棋盘上；有人仍叫你「书生」，你已不在意。',
    },
    shengkao: {
      fail: '笔试救不了签字时的侥幸。',
      mid: '千军万马上岸只是序章；岸上的桥，你走得很慢，也很实。',
      high: '省考第一的名字很少被提起，被提起的是你在任上办成的事。',
    },
    guokao: {
      fail: '条线的规矩，块块的人情，你两头都没站稳。',
      mid: '垂管与地方的夹缝里，你练出了两套语言、一颗心。',
      high: '从直属机构下沉到中枢，条令与统筹在你这里合了流。',
    },
    cunguan: {
      fail: '村里人信过你，后来信不动了。',
      mid: '服务期满那张证明，比许多奖状都沉。',
      high: '从村部的板凳到主席台，你始终记得谁在台下。',
    },
    sanfuyi: {
      fail: '支农支教的日子是真的，后来的路歪了也是真的。',
      mid: '三支一扶的「扶」字，你用很多年才写完。',
      high: '地头课堂教过别人怎么种地，也教过你怎么做事。',
    },
    jizhuan: {
      fail: '军装换得掉，纪律松了就全完了。',
      mid: '地方的仗打法不同，你重新学会了「和风细雨」里的硬度。',
      high: '令行禁止在会议室里换了形式，没有换魂。',
    },
    rencai: {
      fail: '安家费到账了，心没安下。',
      mid: '人才引进的「进」只是开始，「用」才是长跑。',
      high: '从紧缺专业到一方主政，论文变成了决策记录。',
    },
    shiye_tiao: {
      fail: '编制故事讲到最后，自己成了反面教材。',
      mid: '事业与行政隔着一道门，你跨过去又回头拉了别人一把。',
      high: '两套编制两种活法，你证明能力可以平移，清白不能。',
    },
    guoqi_tiao: {
      fail: '企业的人情账，进了机关就是案卷。',
      mid: '旋转门转了一圈，你学会了两本账分开记。',
      high: '政企之间的门开着，你的账本始终只有公开的那一本。',
    },
    biguan: {
      fail: '笔能写天下，写不圆自己。',
      mid: '材料里的漂亮话越来越少，办成的事越来越多。',
      high: '笔杆子最终写进了履历的正文，而不是脚注。',
    },
    jishu: {
      fail: '规范没护住签字的手。',
      mid: '技术口出来的干部，强在落地，险在只懂落地——你补上了另一半。',
      high: '从试验田到决策会，数据一直站你这边。',
    },
    benxiang: {
      fail: '本乡本土，乡亲看着你上来，也看着你倒下。',
      mid: '回避制度像一道墙，你翻过去之后才懂它是保护。',
      high: '离开青石镇的那天，门卫仍喊你乳名；你回头笑了笑。',
    },
    ganbu_jun: {
      fail: '余荫能遮雨，也能挡住光。',
      mid: '父亲的旧部越来越少，你自己的名字越来越响。',
      high: '家里给的是见识，清白与实绩，都是你自己挣的。',
    },
    waisheng: {
      fail: '外来的和尚，经没念完就下山了。',
      mid: '口音改得再像，也改不掉「依法依规」四个字。',
      high: '他乡作故乡，公道比乡音更像归属。',
    },
    xibu: {
      fail: '更难的地方都待过，最后倒在容易的诱惑前。',
      mid: '服务期的沙尘洗过眼睛，你看人看事更沉。',
      high: '从西部的风沙到中枢的灯火，你把「难」字拆开写完了。',
    },
  }

  const pack = map[oid]
  if (!pack) return ''
  if (fail) return pack.fail
  if (top) return pack.high
  return pack.mid
}

export function endingTitleWithOrigin(s: GameState): string {
  try {
    const o = getOrigin(s.originId || '')
    return `${o.name} · ${getPost(s.postId).levelShort}`
  } catch {
    return getPost(s.postId).levelShort
  }
}

export function endingRankLabel(s: GameState): string {
  return getPost(s.postId).level
}
