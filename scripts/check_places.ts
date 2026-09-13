import { createNewGame } from '../src/state/game'
import { localizePlace, PROVINCES } from '../src/data/provinces'

const s = createNewGame('benxiang', 'tianfu')
console.log('province', s.provinceId, s.flags.provinceName, 'hometown', s.flags.hometown)
console.log('localize', localizePlace('青石镇政府门口，云河县委组织部', s.provinceId))
console.log('provinces', PROVINCES.length)
// unique county/town
const towns = new Set(PROVINCES.map((p) => p.places.town))
const counties = new Set(PROVINCES.map((p) => p.places.county))
console.log('unique towns', towns.size, 'counties', counties.size)
if (towns.size < PROVINCES.length) console.log('dup towns', [...towns])
if (counties.size < PROVINCES.length) console.log('dup counties', [...counties])
