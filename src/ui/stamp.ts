/* 盖章动画：在文档 overlay 上追加 stamp 类即可 */
export function playStamp(overlay: HTMLElement) {
  overlay.classList.remove('stamped')
  // reflow
  void overlay.offsetWidth
  overlay.classList.add('stamped')
}
