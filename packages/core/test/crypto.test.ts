import { describe, it, expect } from "vitest";
import { encrypt, decrypt, KEY_LENGTH, NONCE_LENGTH } from "../src/crypto.js";

describe("encrypt/decrypt", () => {
  it("round-trips arbitrary bytes losslessly", () => {
    const plaintext = new TextEncoder().encode("a screenshot's worth of bytes, pretend this is a PNG");
    const { ciphertext, nonce, key } = encrypt(plaintext);
    const decrypted = decrypt(ciphertext, nonce, key);
    expect(decrypted).toEqual(plaintext);
  });

  it("generates a fresh key and nonce on every call", () => {
    const plaintext = new TextEncoder().encode("same input twice");
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a.key).not.toEqual(b.key);
    expect(a.nonce).not.toEqual(b.nonce);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
  });

  it("produces the documented key and nonce lengths", () => {
    const { key, nonce } = encrypt(new Uint8Array([1, 2, 3]));
    expect(key.length).toBe(KEY_LENGTH);
    expect(nonce.length).toBe(NONCE_LENGTH);
  });

  it("throws on decrypt with the wrong key (AEAD tag fails to verify)", () => {
    const { ciphertext, nonce, key } = encrypt(new TextEncoder().encode("secret"));
    const wrongKey = new Uint8Array(key.length).fill(7);
    expect(() => decrypt(ciphertext, nonce, wrongKey)).toThrow();
  });

  it("throws on decrypt against tampered ciphertext", () => {
    const { ciphertext, nonce, key } = encrypt(new TextEncoder().encode("secret"));
    const tampered = ciphertext.slice();
    tampered[0] ^= 0xff;
    expect(() => decrypt(tampered, nonce, key)).toThrow();
  });

  it("rejects a key of the wrong length before touching the cipher", () => {
    const { ciphertext, nonce } = encrypt(new Uint8Array([1]));
    expect(() => decrypt(ciphertext, nonce, new Uint8Array(16))).toThrow(/32 bytes/);
  });

  it("rejects a nonce of the wrong length before touching the cipher", () => {
    const { ciphertext, key } = encrypt(new Uint8Array([1]));
    expect(() => decrypt(ciphertext, new Uint8Array(12), key)).toThrow(/24 bytes/);
  });
});
