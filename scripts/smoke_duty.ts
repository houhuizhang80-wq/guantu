/** 深度公务冒烟：五种模式全流程 */
import { createNewGame } from '../src/state/game'
import { startDuty, chooseDuty, dismissDuty, canStartDuty } from '../src/systems/duty'
import { getDutyItem, PISHI_POOL, XINFANG_POOL, QICAO_POOL, HUIYI_POOL, PEIXUN_DAYS } from '../src/data/duties'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v)
  },
  removeItem: (k: string) => {
    mem.delete(k)
  },
}

// pool integrity
for (const pool of [PISHI_POOL, XINFANG_POOL, QICAO_POOL, HUIYI_POOL, PEIXUN_DAYS]) {
  for (const item of pool) {
    assert(getDutyItem(item.id)?.id === item.id, `lookup ${item.id}`)
    assert(item.choices.length >= 2, `choices ${item.id}`)
    for (const c of item.choices) assert(!!c.id && !!c.label, `choice label ${item.id}`)
    if (item.next) assert(!!getDutyItem(item.next), `next ${item.id} -> ${item.next}`)
  }
}

function runKind(kind: 'pishi' | 'xinfang' | 'qicao' | 'huiyi' | 'peixun') {
  const s = createNewGame('shengkao', 'tianfu')
  s.currentEventId = null
  s.actionPoints = 5
  s.probationLeft = 0
  const gate = canStartDuty(s, kind)
  assert(gate.ok, `gate ${kind}: ${gate.reason}`)
  startDuty(s, kind)
  assert(!!s.dutyRun && s.dutyRun.kind === kind, `run ${kind}`)
  let steps = 0
  while (s.dutyRun && !s.dutyRun.done && steps++ < 40) {
    const item = getDutyItem(s.dutyRun.itemId)
    assert(!!item, `item ${s.dutyRun.itemId}`)
    const pick = item!.choices[0]
    const r = chooseDuty(s, pick.id)
    assert(typeof r.text === 'string', 'has text')
  }
  assert(s.dutyRun?.done, `finished ${kind} in ${steps}`)
  assert((s.dutyDone ?? []).includes(kind), `dutyDone ${kind}`)
  assert((s.dutyYearScore ?? 0) > 0 || kind === 'pishi', `year score ${kind} ${s.dutyYearScore}`)
  dismissDuty(s)
  assert(!s.dutyRun, `dismiss ${kind}`)
  // 本月不能重复
  s.actionPoints = 5
  const again = canStartDuty(s, kind)
  assert(!again.ok, `no repeat ${kind}`)
  console.log('ok', kind, 'score', Math.round(s.dutyRun ? 0 : 0), 'attrs', { ...s.attrs }, 'risk', Math.round(s.risk))
}

runKind('pishi')
runKind('xinfang')
runKind('qicao')
runKind('huiyi')
runKind('peixun')

// peixun costs 2 AP
const s2 = createNewGame('shengkao')
s2.actionPoints = 1
s2.probationLeft = 0
s2.currentEventId = null
assert(!canStartDuty(s2, 'peixun').ok, 'peixun needs 2 ap')
s2.actionPoints = 2
assert(canStartDuty(s2, 'peixun').ok, 'peixun with 2 ap')

// event blocks duty
const s3 = createNewGame('shengkao')
s3.currentEventId = 'main_baodao'
assert(!canStartDuty(s3, 'pishi').ok, 'blocked by event')

console.log('duty smoke ok', {
  pishi: PISHI_POOL.length,
  xinfang: XINFANG_POOL.length,
  qicao: QICAO_POOL.length,
  huiyi: HUIYI_POOL.length,
  peixun: PEIXUN_DAYS.length,
})
