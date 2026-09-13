import { ORIGIN_EVENTS } from '../src/data/events_origin'
import { ORIGINS } from '../src/data/origins'

console.log('total origin events', ORIGIN_EVENTS.length)
for (const o of ORIGINS) {
  const all = ORIGIN_EVENTS.filter((e) => e.originIds?.includes(o.id))
  const mains = all.filter((e) => e.kind === 'main')
  const other = all.filter((e) => e.kind !== 'main')
  console.log(
    o.id.padEnd(14),
    'main',
    mains.length,
    'other',
    other.length,
    mains.map((m) => m.storyOrder).join(','),
  )
}
