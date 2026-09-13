import { getPost } from '../src/data/posts'

function neighbors(id: string): string[] {
  return getPost(id).nextPaths.map((p) => p.to)
}
const reach = new Set<string>(['banshiyuan'])
const q = ['banshiyuan']
while (q.length) {
  const cur = q.shift()!
  for (const n of neighbors(cur)) if (!reach.has(n)) {
    reach.add(n)
    q.push(n)
  }
}
const ids = [
  'xiantuanwei','shi_tuanwei_fu','shi_tuanwei_zheng','sheng_tuanwei_fu','sheng_tuanwei_zheng',
  'shi_zonggong_fu','shi_zonggong_zheng',
  'shi_shirenda_fu','shi_shizhengxie_fu','shengrenda_fu','shengzhengxie_fu',
  'yangqi_fu','yangqi_zheng','yangqi_dong','guoqi_zong','guoqi_dong',
  'sheng_tuanwei_fu','xianjiwei_fu','zhengfa_zhang','zhongyangjiwei_zheng',
]
for (const id of ids) {
  console.log(id.padEnd(22), reach.has(id) ? 'OK' : 'MISSING', getPost(id).title)
}
// who points to guoqi_zong
for (const p of [...reach].map(getPost)) {
  for (const x of p.nextPaths) {
    if (x.to === 'guoqi_zong') console.log('edge', p.id, '->', x.to)
  }
}
// who points to sheng_tuanwei
for (const p of [...reach].map(getPost)) {
  for (const x of p.nextPaths) {
    if (x.to.startsWith('sheng_tuan') || x.to.startsWith('shi_tuan')) console.log('edge', p.id, '->', x.to)
  }
}
