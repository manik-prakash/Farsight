import { describe, it, expect } from "vitest";
import { bytesToBase64, bytesToBase64Url, base64UrlToBytes, randomBytes } from "../src/bytes.js";

describe("bytesToBase64", () => {
  it("matches Buffer's standard base64 encoding", () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 65, 66, 67]);
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
  });
});

describe("bytesToBase64Url / base64UrlToBytes", () => {
  it("round-trips arbitrary bytes, including values needing +/ in standard base64", () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 65, 66, 67, 0, 0, 0]);
    const encoded = bytesToBase64Url(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(base64UrlToBytes(encoded)).toEqual(bytes);
  });

  it("round-trips random byte lengths that need padding (1, 2, and 0 extra bytes)", () => {
    for (const length of [1, 2, 3, 4, 5]) {
      const bytes = randomBytes(length);
      expect(base64UrlToBytes(bytesToBase64Url(bytes))).toEqual(bytes);
    }
  });
});

describe("randomBytes", () => {
  it("returns the requested length and varies between calls", () => {
    const a = randomBytes(16);
    const b = randomBytes(16);
    expect(a.length).toBe(16);
    expect(a).not.toEqual(b);
  });
});
