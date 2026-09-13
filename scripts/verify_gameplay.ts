/**
 * 周计划 / 台账 / 导出导入 / 6 槽位 快速回归（Node 需 mock localStorage）
 */

// Node 环境 mock
const store = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v))
  },
  removeItem: (k: string) => {
    store.delete(k)
  },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size
  },
}

const { createNewGame } = await import('../src/state/game')
const { setWeekPlan } = await import('../src/systems/office')
const { SLOT_COUNT, exportSave, importSave, clearSlot } = await import('../src/state/saves')
const { availablePaths } = await import('../src/systems/promotion')
const { getPost } = await import('../src/data/posts')

function ok(name: string, cond: boolean, extra?: unknown) {
  console.log(cond ? 'PASS' : 'FAIL', name, extra ?? '')
  if (!cond) process.exitCode = 1
}

async function main() {
  const s0 = createNewGame('kaosheng', 'beilu')
  s0.postId = 'fuxianzhang'
  s0.age = 36
  s0.flags.monthsInPost = 48
  s0.attrs.ZJ = 62
  const paths = availablePaths(s0)
  ok('paths length > 0', paths.length > 0, paths.length)
  ok('path has path.to', paths.every((p) => typeof p.path?.to === 'string' && p.path.to.length > 0))
  ok('path has ok flag', paths.every((p) => typeof p.ok === 'boolean'))
  console.log(
    'sample',
    paths.slice(0, 3).map((p) => `${p.path.label || p.path.to}=${p.ok ? 'ok' : 'no'}`),
  )

  const s1 = createNewGame('kaosheng', 'beilu')
  s1.currentEventId = 'dummy_event'
  const r1 = setWeekPlan(s1, ['zj', 'mx', null, null])
  ok('week plan blocked by event', !r1.ok && r1.text.includes('事件'))
  ok('weekPlanned stays false', s1.weekPlanned === false)

  s1.currentEventId = null
  const r2 = setWeekPlan(s1, ['zj', null, null, null])
  ok('week plan needs >=2 weeks', !r2.ok)

  const r3 = setWeekPlan(s1, ['zj', 'mx', null, 'lian'])
  ok('week plan ok with 2+', r3.ok && s1.weekPlanned === true)
  const r4 = setWeekPlan(s1, ['nl', 'gx', null, null])
  ok('cannot replan same month', !r4.ok)

  ok('SLOT_COUNT is 6', SLOT_COUNT === 6)

  const s2 = createNewGame('kaosheng', 'beilu')
  s2.slot = 5
  s2.postId = 'banshiyuan'
  const enc = await exportSave(s2, 'pass-1234', { catalog: ['e1'], originsDone: ['o1'] })
  ok('export is GUANTU2', enc.startsWith('GUANTU2:'))
  ok('export not plaintext', !enc.includes('banshiyuan') && !enc.includes('"postId"'))

  const imported = await importSave(enc, 5, 'pass-1234')
  ok('import ok', imported.ok, imported.error)
  ok('import slot 5', imported.state?.slot === 5)
  ok('import progress', imported.progress?.catalog?.[0] === 'e1')

  const bad = await importSave(enc, 5, 'wrong')
  ok('wrong password rejected', !bad.ok)
  const need = await importSave(enc, 5)
  ok('need password flag', need.needPassword === true)

  const plain = JSON.stringify({ ...s2, postId: 'banshiyuan', attrs: s2.attrs })
  const old = await importSave(plain, 0)
  ok('legacy plain import', old.ok, old.error)

  const xorKey = '官途-青云-2012-选调-墩苗'
  function xorEncode(str: string, key: string) {
    let out = ''
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return out
  }
  const mixed = xorEncode(JSON.stringify({ ...s2, postId: 'keyuan' }), xorKey)
  let bin = ''
  new TextEncoder().encode(mixed).forEach((b) => {
    bin += String.fromCharCode(b)
  })
  const gu1 = 'GUANTU1:' + btoa(bin)
  const imp1 = await importSave(gu1, 1)
  ok('legacy GUANTU1 import', imp1.ok && imp1.state?.postId === 'keyuan', imp1.error)

  clearSlot(5)
  clearSlot(1)
  clearSlot(0)

  const p = getPost('fuxianzhang')
  ok('fuxianzhang has nextPaths', p.nextPaths.length > 0)

  console.log('done exit', process.exitCode ?? 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
