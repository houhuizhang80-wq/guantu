import type { GameState } from '../types'
import { getOrigin } from './origins'
import { getPost } from './posts'

/** 终局时按出身 + 成绩写一段「盖棺」点评 */
export function originEpilogue(s: GameState): string {
  if (!s.originId) return ''
  let name = '这位干部'
  let tag = ''
  try {
    const o = getOrigin(s.originId)
    name = o.name
    tag = o.tag
  } catch {
    /* ignore */
  }
  const post = getPost(s.postId)
  const lian = s.attrs.Lian
  const mx = s.attrs.MX
  const zj = s.attrs.ZJ
  const lines: string[] = []

  lines.push(`出身：${name}${tag ? `（${tag}）` : ''}。`)

  switch (s.originId) {
    case 'xuandiao_pu':
    case 'xuandiao_ding':
      if (post.rank >= 12) lines.push('当年一起「墩苗」的人里，走得最稳的往往不是最急的。')
      else if (lian < 40) lines.push('选调的起点在组织部，终点却在自己手里。')
      else lines.push('组织部的名单很长，真正被记住的是任上做成的事。')
      break
    case 'shengkao':
    case 'guokao':
      lines.push('千军万马上岸只是序章；岸上还有很长的桥。')
      break
    case 'cunguan':
    case 'sanfuyi':
    case 'xibu':
      if (mx >= 60) lines.push('脚上的泥没白沾——群众记得谁真正下过村。')
      else lines.push('从项目期到编制内，身份变了，蹲下去的姿势最好别变。')
      break
    case 'jizhuan':
      lines.push('军装可以脱，纪律不能松；地方的仗，打法不同。')
      break
    case 'rencai':
      lines.push('学历是入场券，不是通行证；机关认的是办成事。')
      break
    case 'shiye_tiao':
    case 'jishu':
      lines.push('业务口出来的干部，强在能落地，险在只懂落地。')
      break
    case 'guoqi_tiao':
      if (lian < 50) lines.push('企业的人情账，进了机关就是风险账。')
      else lines.push('政企之间的门可以开，账本必须两套。')
      break
    case 'biguan':
      lines.push('笔杆子能写天下事，难写自己的名。')
      break
    case 'benxiang':
      lines.push('本乡本土，乡亲看着你上来，也看着你别歪。')
      break
    case 'ganbu_jun':
      if (lian < 50) lines.push('父辈的余荫能遮雨，也能挡住阳光。')
      else lines.push('家里给的是见识，干净要自己挣。')
      break
    case 'waisheng':
      lines.push('外来的和尚难念经，念通了，往往更公道。')
      break
    case 'legacy':
      lines.push('十六种出身都走过，档案袋比谁都厚；这一次，名字写在封面上。')
      break
    default:
      lines.push('路是自己一步一步走出来的。')
  }

  if (zj >= 80 && lian >= 70) lines.push('实绩与清白都有，组织与群众都认。')
  else if (zj >= 70 && lian < 45) lines.push('实绩不小，清白簿却越来越薄。')
  else if (mx >= 70 && post.rank <= 5) lines.push('位子未必高，口碑立住了。')

  return lines.join('')
}
