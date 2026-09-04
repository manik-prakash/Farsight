import { describe, it, expect } from 'vitest'
import { decodeReference, decrypt } from 'farsight-core'
import {
  RELAY_TOKEN_BYTES,
  firstMismatch,
  formatBytes,
  hexPreview,
  runPipeline,
  simulateRelayToken,
} from '../src/demo/pipeline'

/** crypto.getRandomValues rejects buffers over 64 KiB, so fill in slices. */
function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length)
  for (let offset = 0; offset < length; offset += 65536) {
    crypto.getRandomValues(out.subarray(offset, Math.min(offset + 65536, length)))
  }
  return out
}

describe('runPipeline', () => {
  it('round trips back to byte-identical plaintext', () => {
    const plaintext = randomBytes(4096)
    const result = runPipeline(plaintext)

    expect(result.firstMismatch).toBe(-1)
    expect(result.decrypted.byteLength).toBe(plaintext.byteLength)
  })

  it('produces a reference that parses back to the same key', () => {
    const result = runPipeline(randomBytes(64))
    const parsed = decodeReference(result.reference)

    expect(parsed.relayToken).toBe(result.relayToken)
    expect(Array.from(parsed.key)).toEqual(Array.from(result.key))
  })

  it('never leaves the key recoverable from what the relay would hold', () => {
    // The relay stores ciphertext + nonce. Neither may contain the key, or the
    // whole zero-knowledge claim collapses.
    const result = runPipeline(randomBytes(2048))
    const relayHolds = new Uint8Array(result.ciphertext.byteLength + result.nonce.byteLength)
    relayHolds.set(result.ciphertext)
    relayHolds.set(result.nonce, result.ciphertext.byteLength)

    expect(indexOfSubarray(relayHolds, result.key)).toBe(-1)
  })

  it('rejects tampered ciphertext instead of returning garbage', () => {
    // The authentication property the threat model relies on: a relay that
    // serves different bytes cannot smuggle an image into an agent's context.
    const result = runPipeline(randomBytes(512))
    const tampered = Uint8Array.from(result.ciphertext)
    tampered[0] ^= 0xff

    expect(() => decrypt(tampered, result.nonce, result.key)).toThrow()
  })

  it('generates a distinct key and nonce on every run', () => {
    const a = runPipeline(randomBytes(32))
    const b = runPipeline(randomBytes(32))

    expect(Array.from(a.key)).not.toEqual(Array.from(b.key))
    expect(Array.from(a.nonce)).not.toEqual(Array.from(b.nonce))
    expect(a.relayToken).not.toBe(b.relayToken)
  })

  it('reports the AEAD tag as ciphertext overhead', () => {
    const result = runPipeline(randomBytes(100))
    expect(result.overheadBytes).toBe(16)
  })

  it('handles an empty file without throwing', () => {
    const result = runPipeline(new Uint8Array(0))
    expect(result.firstMismatch).toBe(-1)
  })
})

describe('simulateRelayToken', () => {
  it('matches the shape the relay issues: 16 bytes, base64url', () => {
    const token = simulateRelayToken()

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token).toHaveLength(Math.ceil((RELAY_TOKEN_BYTES * 8) / 6))
  })
})

describe('helpers', () => {
  it('firstMismatch finds the differing byte', () => {
    expect(firstMismatch(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(-1)
    expect(firstMismatch(new Uint8Array([1, 2, 3]), new Uint8Array([1, 9, 3]))).toBe(1)
    expect(firstMismatch(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(2)
  })

  it('hexPreview pads each byte to two digits', () => {
    expect(hexPreview(new Uint8Array([0, 15, 255]), 3)).toBe('00 0f ff')
  })

  it('formatBytes scales its unit', () => {
    expect(formatBytes(70)).toBe('70 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(2_621_440)).toBe('2.50 MB')
  })
})

function indexOfSubarray(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}
