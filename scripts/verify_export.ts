/** AES-GCM 导出/导入往返自检 */
import { webcrypto } from 'node:crypto'

const EXPORT_MAGIC = 'GUANTU2:'
const PBKDF2_ITERS = 180_000
const SALT_LEN = 16
const IV_LEN = 12

function toB64(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin)
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function asBuf(u8: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u8.byteLength)
  new Uint8Array(out).set(u8)
  return out
}

async function deriveAesKey(password: string, salt: Uint8Array) {
  const base = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asBuf(salt), iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function main() {
  const save = { attrs: { ZJ: 50 }, postId: 'x1', year: 2026, month: 9, turn: 1 }
  const payload = {
    k: 2,
    save,
    progress: { catalog: ['a', 'b'], originsDone: ['o1'], promoFails: [], exportedAt: new Date().toISOString() },
  }
  const plain = new TextEncoder().encode(JSON.stringify(payload))
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveAesKey('test-pass-123', salt)
  const cipher = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv: asBuf(iv) }, key, asBuf(plain)))
  const packed = new Uint8Array(salt.length + iv.length + cipher.length)
  packed.set(salt, 0)
  packed.set(iv, salt.length)
  packed.set(cipher, salt.length + iv.length)
  const file = EXPORT_MAGIC + toB64(packed)

  if (!file.startsWith('GUANTU2:')) throw new Error('prefix')
  if (file.includes('postId') || file.includes('"attrs"')) throw new Error('plaintext leaked')

  const packed2 = fromB64(file.slice(EXPORT_MAGIC.length))
  const salt2 = packed2.subarray(0, SALT_LEN)
  const iv2 = packed2.subarray(SALT_LEN, SALT_LEN + IV_LEN)
  const cipher2 = packed2.subarray(SALT_LEN + IV_LEN)
  const key2 = await deriveAesKey('test-pass-123', salt2)
  const plain2 = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: asBuf(iv2) }, key2, asBuf(cipher2))
  const body = JSON.parse(new TextDecoder().decode(plain2))
  if (body.save.postId !== 'x1' || body.progress.catalog.length !== 2) throw new Error('roundtrip')

  let rejected = false
  try {
    const key3 = await deriveAesKey('wrong', salt2)
    await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: asBuf(iv2) }, key3, asBuf(cipher2))
  } catch {
    rejected = true
  }
  if (!rejected) throw new Error('wrong password accepted')

  console.log('aes-export-import ok', { len: file.length, notJson: true })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
