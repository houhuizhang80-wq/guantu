/** WebAudio 合成音效：盖章 / 翻纸 / 点击 / 提示（无外部资源） */

let ctx: AudioContext | null = null
let muted = false
let volume = 0.85
let master: GainNode | null = null

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try {
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : volume
      master.connect(ctx.destination)
    } catch {
      return null
    }
  }
  return ctx
}

function masterNode(a: AudioContext): AudioNode {
  if (!master) {
    master = a.createGain()
    master.connect(a.destination)
  }
  master.gain.value = muted ? 0 : volume
  return master
}

export function isMuted() {
  return muted
}

export function setMuted(v: boolean) {
  muted = v
  localStorage.setItem('guantu_muted_v1', v ? '1' : '0')
  if (master) master.gain.value = muted ? 0 : volume
}

export function getVolume() {
  return volume
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v))
  localStorage.setItem('guantu_vol_v1', String(volume))
  if (master) master.gain.value = muted ? 0 : volume
}

export function initAudioFromStore() {
  muted = localStorage.getItem('guantu_muted_v1') === '1'
  const raw = localStorage.getItem('guantu_vol_v1')
  if (raw != null) {
    const n = Number(raw)
    if (!Number.isNaN(n)) volume = Math.max(0, Math.min(1, n))
  }
}

function ensureResume() {
  const a = ac()
  if (a && a.state === 'suspended') void a.resume()
  return a
}

function noiseBuffer(a: AudioContext, dur: number) {
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

/** 盖章：低频冲击 + 短噪声 */
export function playStampSound() {
  if (muted) return
  const a = ensureResume()
  if (!a) return
  const dest = masterNode(a)
  const t = a.currentTime

  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.18)
  g.gain.setValueAtTime(0.55, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
  osc.connect(g).connect(dest)
  osc.start(t)
  osc.stop(t + 0.24)

  const src = a.createBufferSource()
  src.buffer = noiseBuffer(a, 0.08)
  const ng = a.createGain()
  ng.gain.setValueAtTime(0.35, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  const filt = a.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.value = 900
  src.connect(filt).connect(ng).connect(dest)
  src.start(t)
}

/** 翻纸：带通噪声短促两段 */
export function playPaperSound() {
  if (muted) return
  const a = ensureResume()
  if (!a) return
  const dest = masterNode(a)
  const t0 = a.currentTime
  for (let i = 0; i < 2; i++) {
    const t = t0 + i * 0.07
    const src = a.createBufferSource()
    src.buffer = noiseBuffer(a, 0.12)
    const filt = a.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = 1800 + i * 400
    filt.Q.value = 1.2
    const g = a.createGain()
    g.gain.setValueAtTime(0.001, t)
    g.gain.linearRampToValueAtTime(0.18, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    src.connect(filt).connect(g).connect(dest)
    src.start(t)
  }
}

export function playClickSound() {
  if (muted) return
  const a = ensureResume()
  if (!a) return
  const dest = masterNode(a)
  const t = a.currentTime
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(880, t)
  g.gain.setValueAtTime(0.08, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  osc.connect(g).connect(dest)
  osc.start(t)
  osc.stop(t + 0.06)
}

export function playNotifySound() {
  if (muted) return
  const a = ensureResume()
  if (!a) return
  const dest = masterNode(a)
  const t = a.currentTime
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, t)
  osc.frequency.setValueAtTime(659, t + 0.08)
  g.gain.setValueAtTime(0.1, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g).connect(dest)
  osc.start(t)
  osc.stop(t + 0.22)
}
