import {
  bytesToBase64Url,
  decodeReference,
  decrypt,
  encodeReference,
  encrypt,
  randomBytes,
} from '@farsight/core'

/**
 * The relay issues 16 random bytes, base64url-encoded, as a blob token
 * (`randomToken` in apps/relay-worker/src/index.ts). The demo never talks to a
 * relay, so it mints a token of the same shape locally — enough to assemble a
 * realistic reference string without inventing a different format.
 */
export const RELAY_TOKEN_BYTES = 16

export function simulateRelayToken(): string {
  return bytesToBase64Url(randomBytes(RELAY_TOKEN_BYTES))
}

export interface PipelineResult {
  plaintext: Uint8Array
  ciphertext: Uint8Array
  nonce: Uint8Array
  key: Uint8Array
  relayToken: string
  /** The single string a user pastes into a chat. Contains the key. */
  reference: string
  /** What comes back out after parsing the reference and decrypting. */
  decrypted: Uint8Array
  /** Index of the first differing byte, or -1 when the round trip is clean. */
  firstMismatch: number
  /** AEAD tag plus framing: how much larger the ciphertext is. */
  overheadBytes: number
}

/**
 * The full client-side half of a `farsight send` / `fetch_image` cycle, using
 * the same @farsight/core functions the CLI and MCP server call. Everything
 * here is pure and offline: no relay, no network, no persistence.
 *
 * The decrypt step deliberately goes through `decodeReference` rather than
 * reusing the key already in hand, so the round trip exercises the real string
 * format instead of trusting it.
 */
export function runPipeline(plaintext: Uint8Array): PipelineResult {
  const { ciphertext, nonce, key } = encrypt(plaintext)
  const relayToken = simulateRelayToken()
  const reference = encodeReference(relayToken, key)

  const parsed = decodeReference(reference)
  const decrypted = decrypt(ciphertext, nonce, parsed.key)

  return {
    plaintext,
    ciphertext,
    nonce,
    key,
    relayToken,
    reference,
    decrypted,
    firstMismatch: firstMismatch(plaintext, decrypted),
    overheadBytes: ciphertext.byteLength - plaintext.byteLength,
  }
}

/**
 * Index of the first differing byte, or -1 if identical. A plain deep-equality
 * assertion on multi-megabyte arrays is slow enough to time a test out, so
 * comparison is a byte scan here and in the test suite.
 */
export function firstMismatch(a: Uint8Array, b: Uint8Array): number {
  if (a.byteLength !== b.byteLength) return Math.min(a.byteLength, b.byteLength)
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return i
  }
  return -1
}

/** Hex preview of the first `count` bytes, for showing what the relay stores. */
export function hexPreview(bytes: Uint8Array, count = 16): string {
  return Array.from(bytes.slice(0, count))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}
