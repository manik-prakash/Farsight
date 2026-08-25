import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const downloadBlob = vi.fn();
vi.mock("@farsight/core", async () => {
  const actual = await vi.importActual<typeof import("@farsight/core")>("@farsight/core");
  return { ...actual, downloadBlob: (...args: unknown[]) => downloadBlob(...args) };
});

const core = await import("@farsight/core");
const { recv } = await import("../src/commands/recv.js");

describe("recv command", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "farsight-recv-test-"));
    downloadBlob.mockReset();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("decrypts a downloaded blob and writes the plaintext to disk", async () => {
    const plaintext = new TextEncoder().encode("round-trip me");
    const { ciphertext, nonce, key } = core.encrypt(plaintext);
    const reference = core.encodeReference("tok_xyz", key);
    downloadBlob.mockResolvedValue({ ciphertext, nonce, mimeType: "image/png" });

    const outputPath = join(dir, "out.png");
    const result = await recv(reference, outputPath, { relayUrl: "https://relay.example" });

    expect(downloadBlob).toHaveBeenCalledWith({ relayUrl: "https://relay.example", relayToken: "tok_xyz" });
    expect(result.mimeType).toBe("image/png");
    expect(result.byteLength).toBe(plaintext.byteLength);
    expect(new Uint8Array(await readFile(outputPath))).toEqual(plaintext);
  });

  it("rejects a malformed reference before contacting the relay", async () => {
    await expect(recv("garbage", join(dir, "out.png"))).rejects.toThrow(/invalid Farsight reference/);
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
