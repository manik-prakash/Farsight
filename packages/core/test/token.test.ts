import { describe, it, expect } from "vitest";
import { encodeReference, decodeReference, ReferenceFormatError } from "../src/token.js";
import { randomBytes } from "../src/bytes.js";
import { KEY_LENGTH } from "../src/crypto.js";

describe("encodeReference/decodeReference", () => {
  it("round-trips a relay token and key", () => {
    const key = randomBytes(KEY_LENGTH);
    const ref = encodeReference("abc123", key);
    expect(ref.startsWith("fs_")).toBe(true);
    const decoded = decodeReference(ref);
    expect(decoded.relayToken).toBe("abc123");
    expect(decoded.key).toEqual(key);
  });

  it("handles relay tokens that themselves contain no dots (typical case)", () => {
    const key = randomBytes(KEY_LENGTH);
    const ref = encodeReference("Jk3xQ9fQ-ab", key);
    const decoded = decodeReference(ref);
    expect(decoded.relayToken).toBe("Jk3xQ9fQ-ab");
  });

  it("rejects a reference missing the fs_ prefix", () => {
    expect(() => decodeReference("abc.def")).toThrow(ReferenceFormatError);
  });

  it("rejects a reference with no separator between token and key", () => {
    expect(() => decodeReference("fs_noSeparatorHere")).toThrow(ReferenceFormatError);
  });

  it("rejects a reference with an empty token portion", () => {
    const key = randomBytes(KEY_LENGTH);
    const bogus = `fs_.${Buffer.from(key).toString("base64url")}`;
    expect(() => decodeReference(bogus)).toThrow(ReferenceFormatError);
  });

  it("rejects a key that decodes to the wrong length", () => {
    expect(() => decodeReference("fs_abc123.dG9vc2hvcnQ")).toThrow(/32 bytes/);
  });

  it("rejects a key portion that isn't valid base64url", () => {
    expect(() => decodeReference("fs_abc123.not base64!!!")).toThrow(ReferenceFormatError);
  });

  it("throws when encoding with a key of the wrong length", () => {
    expect(() => encodeReference("abc123", new Uint8Array(16))).toThrow(/32 bytes/);
  });
});
