import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes } from "./bytes.js";

export const KEY_LENGTH = 32;
export const NONCE_LENGTH = 24;

export interface EncryptedBlob {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  key: Uint8Array;
}

/**
 * Encrypts plaintext with a freshly generated random key and nonce.
 * The key is never sent to the relay — callers embed it only in the
 * client-side reference string (see token.ts). This is what makes the
 * relay zero-knowledge: it only ever stores/serves ciphertext + nonce.
 */
export function encrypt(plaintext: Uint8Array): EncryptedBlob {
  const key = randomBytes(KEY_LENGTH);
  const nonce = randomBytes(NONCE_LENGTH);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(plaintext);
  return { ciphertext, nonce, key };
}

/**
 * Decrypts ciphertext given the nonce (non-secret, relay-provided) and the
 * key (secret, from the reference string). Throws if the AEAD tag doesn't
 * verify — a tampered or wrong-key blob never silently returns garbage.
 */
export function decrypt(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`decrypt: key must be ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  if (nonce.length !== NONCE_LENGTH) {
    throw new Error(`decrypt: nonce must be ${NONCE_LENGTH} bytes, got ${nonce.length}`);
  }
  return xchacha20poly1305(key, nonce).decrypt(ciphertext);
}
