import type { GameState } from '../types'
import { getPost } from '../data/posts'
import { ENDINGS } from '../data/endings'
import { originEndingLine } from '../data/origin_ending'
import { getOrigin } from '../data/origins'
import { getProvince } from '../data/provinces'
import { getNpc, npcsVisibleAt } from '../data/npcs'
import { computeScore } from '../systems/score'

/** 生成成就/终局分享卡 PNG（canvas 导出） */
export function renderShareCard(s: GameState): string {
  const w = 720
  const h = 960
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  if (!g) return ''

  // 底
  g.fillStyle = '#f4efe6'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#a63a2b'
  g.lineWidth = 8
  g.strokeRect(24, 24, w - 48, h - 48)
  g.lineWidth = 2
  g.strokeStyle = '#d9d0bf'
  g.strokeRect(40, 40, w - 80, h - 80)

  g.fillStyle = '#a63a2b'
  g.font = '600 18px "Source Han Sans SC", sans-serif'
  g.textAlign = 'center'
  g.fillText('官 途', w / 2, 100)

  const ending = ENDINGS.find((e) => e.id === s.endingId)
  const post = getPost(s.postId)
  let originName = '出身'
  try {
    originName = getOrigin(s.originId || '').name
  } catch {
    /* ignore */
  }

  g.fillStyle = '#1a1a1a'
  g.font = '700 42px "Source Han Serif SC", serif'
  g.fillText(ending?.title ?? '生涯档案', w / 2, 170)

  g.fillStyle = '#5c6b73'
  g.font = '16px "Source Han Sans SC", sans-serif'
  g.fillText(`${originName} · ${post.level}（${post.levelShort}）`, w / 2, 210)
  g.fillText(`${s.year}.${String(s.month).padStart(2, '0')} · ${s.age} 岁 · 第 ${s.turn} 个月 · 评分 ${computeScore(s)}`, w / 2, 238)

  // 五维
  const attrs: [string, number][] = [
    ['政绩', s.attrs.ZJ],
    ['关系', s.attrs.GX],
    ['廉洁', s.attrs.Lian],
    ['民心', s.attrs.MX],
    ['能力', s.attrs.NL],
  ]
  let y = 300
  g.textAlign = 'left'
  g.font = '15px "Source Han Sans SC", sans-serif'
  for (const [label, val] of attrs) {
    g.fillStyle = '#5c6b73'
    g.fillText(label, 80, y)
    g.fillStyle = '#e2d9c8'
    g.fillRect(140, y - 12, 400, 14)
    g.fillStyle = '#2f6b4f'
    g.fillRect(140, y - 12, (400 * val) / 100, 14)
    g.fillStyle = '#1a1a1a'
    g.fillText(String(val), 560, y)
    y += 36
  }

  g.fillStyle = '#8b1e1e'
  g.fillText(`风险 ${Math.round(s.risk)} · 派系 ${s.faction === 'none' ? '未站队' : s.faction}`, 80, y + 10)

  // 结语
  const line = originEndingLine(s)
  g.fillStyle = '#1a1a1a'
  g.font = '15px "Source Han Serif SC", serif'
  wrapText(g, line || ending?.summary || '', 80, y + 60, w - 160, 28)

  // 关系网缩略
  const rank = post.rank
  const net = s.npcs
    .filter((n) => npcsVisibleAt(rank).some((v) => v.id === n.id) || Math.abs(n.favor) >= 20)
    .sort((a, b) => Math.abs(b.favor) - Math.abs(a.favor))
    .slice(0, 6)
  let ny = y + 60 + 28 * 4
  g.fillStyle = '#5c6b73'
  g.font = '13px "Source Han Sans SC", sans-serif'
  g.fillText('主要关系', 80, ny)
  ny += 20
  for (const ref of net) {
    const def = getNpc(ref.id)
    g.fillStyle = ref.favor >= 30 ? '#2f6b4f' : ref.favor <= -10 ? '#8b1e1e' : '#5c6b73'
    g.fillText(`${def.name}  ${ref.favor > 0 ? '+' : ''}${ref.favor}`, 80, ny)
    ny += 18
  }

  g.fillStyle = '#8a918f'
  g.font = '12px "Source Han Sans SC", sans-serif'
  g.textAlign = 'center'
  g.fillText(
    `${getProvince(s.provinceId).name} · 作品纯属虚构 · 架空生涯模拟`,
    w / 2,
    h - 70,
  )
  g.fillText(new Date().toLocaleDateString('zh-CN'), w / 2, h - 48)

  // 档案编号条
  const code = `GT-${s.year}${String(s.month).padStart(2, '0')}-${post.rank.toString().padStart(2, '0')}-${(s.turn % 9973).toString(36).toUpperCase()}`
  g.fillStyle = '#a63a2b'
  g.font = '600 14px ui-monospace, monospace'
  g.textAlign = 'center'
  g.fillText(code, w / 2, h - 28)
  // 简易条码
  let bx = w / 2 - 80
  g.fillStyle = '#1a1a1a'
  for (let i = 0; i < 32; i++) {
    const bw = (code.charCodeAt(i % code.length) % 3) + 1
    g.fillRect(bx, h - 18, bw, 8)
    bx += bw + 2
  }

  return c.toDataURL('image/png')
}

function wrapText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  let line = ''
  let cy = y
  for (const ch of text) {
    const test = line + ch
    if (g.measureText(test).width > maxW) {
      g.fillText(line, x, cy)
      line = ch
      cy += lineH
      if (cy > y + lineH * 6) break
    } else {
      line = test
    }
  }
  if (line) g.fillText(line, x, cy)
}

export function downloadDataUrl(dataUrl: string, name: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = name
  a.click()
}
