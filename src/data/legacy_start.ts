/** 全出身通关后的隐藏开局 */
import { loadOriginsDone } from '../state/origins_done'
import { ORIGINS } from './origins'

export function allOriginsCleared(): boolean {
  return loadOriginsDone().length >= ORIGINS.length
}

export const LEGACY_START = {
  id: 'legacy',
  name: '老档案重生',
  tag: '隐藏 · 全出身通关',
  desc: '你已走过十六种入仕路径。这一次，带着记忆与一点点「组织印象」重新报到。',
}
