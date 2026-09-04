import { describe, it, expect, vi } from "vitest";
import { fetchImage } from "../src/tools/fetchImage.js";
import { encrypt, encodeReference, RelayError, bytesToBase64 } from "farsight-core";

describe("fetchImage tool", () => {
  it("decrypts a fetched blob and returns an image content block plus text", async () => {
    const plaintext = new TextEncoder().encode("pretend this is PNG bytes");
    const { ciphertext, nonce, key } = encrypt(plaintext);
    const reference = encodeReference("tok123", key);

    const downloadBlobImpl = vi.fn(async (opts: { relayToken: string }) => {
      expect(opts.relayToken).toBe("tok123");
      return { ciphertext, nonce, mimeType: "image/png" };
    });

    const result = await fetchImage(reference, { relayUrl: "https://relay.example", downloadBlobImpl: downloadBlobImpl as never });

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({ type: "image", data: bytesToBase64(plaintext), mimeType: "image/png" });
    expect(result.content[1].type).toBe("text");
    expect((result.content[1] as { text: string }).text).toContain(`${plaintext.byteLength}-byte`);
  });

  it("returns an error result for a malformed reference, without calling the relay", async () => {
    const downloadBlobImpl = vi.fn();
    const result = await fetchImage("not-a-valid-reference", {
      relayUrl: "https://relay.example",
      downloadBlobImpl: downloadBlobImpl as never,
    });
    expect(result.isError).toBe(true);
    expect(downloadBlobImpl).not.toHaveBeenCalled();
  });

  it("surfaces a friendly message when the relay reports the blob already consumed", async () => {
    const { key } = encrypt(new Uint8Array([1]));
    const reference = encodeReference("tok", key);
    const downloadBlobImpl = vi.fn(async () => {
      throw new RelayError("consumed", "already fetched");
    });

    const result = await fetchImage(reference, { relayUrl: "https://relay.example", downloadBlobImpl: downloadBlobImpl as never });
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toMatch(/already fetched once/);
  });

  it("surfaces a friendly message when the relay reports not_found", async () => {
    const { key } = encrypt(new Uint8Array([1]));
    const reference = encodeReference("tok", key);
    const downloadBlobImpl = vi.fn(async () => {
      throw new RelayError("not_found", "gone");
    });

    const result = await fetchImage(reference, { relayUrl: "https://relay.example", downloadBlobImpl: downloadBlobImpl as never });
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toMatch(/expired/);
  });

  it("returns an error when the key doesn't match the fetched ciphertext (tampered or wrong reference)", async () => {
    const { ciphertext, nonce } = encrypt(new TextEncoder().encode("secret"));
    const { key: unrelatedKey } = encrypt(new Uint8Array([9]));
    const reference = encodeReference("tok", unrelatedKey);

    const downloadBlobImpl = vi.fn(async () => ({ ciphertext, nonce, mimeType: "image/png" }));
    const result = await fetchImage(reference, { relayUrl: "https://relay.example", downloadBlobImpl: downloadBlobImpl as never });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toMatch(/decryption failed/);
  });
});
