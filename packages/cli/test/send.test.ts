import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const uploadBlob = vi.fn();
vi.mock("@farsight/core", async () => {
  const actual = await vi.importActual<typeof import("@farsight/core")>("@farsight/core");
  return { ...actual, uploadBlob: (...args: unknown[]) => uploadBlob(...args) };
});

const { send } = await import("../src/commands/send.js");

describe("send command", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "farsight-send-test-"));
    uploadBlob.mockReset();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("encrypts the file and uploads ciphertext, returning a parseable reference", async () => {
    const imagePath = join(dir, "shot.png");
    await writeFile(imagePath, Buffer.from("fake png bytes"));
    uploadBlob.mockResolvedValue({ relayToken: "tok_abc" });

    const result = await send(imagePath, { relayUrl: "https://relay.example" });

    expect(uploadBlob).toHaveBeenCalledOnce();
    const call = uploadBlob.mock.calls[0][0];
    expect(call.relayUrl).toBe("https://relay.example");
    expect(call.mimeType).toBe("image/png");
    // What's uploaded must not be the plaintext bytes.
    expect(Buffer.from(call.ciphertext)).not.toEqual(Buffer.from("fake png bytes"));

    expect(result.reference).toMatch(/^fs_tok_abc\./);
    expect(result.mimeType).toBe("image/png");
    expect(result.byteLength).toBe(Buffer.byteLength("fake png bytes"));
  });

  it("passes through a custom ttlSeconds and defaults it otherwise", async () => {
    const imagePath = join(dir, "shot.jpg");
    await writeFile(imagePath, Buffer.from("x"));
    uploadBlob.mockResolvedValue({ relayToken: "tok" });

    await send(imagePath, { relayUrl: "https://relay.example", ttlSeconds: 42 });
    expect(uploadBlob.mock.calls[0][0].ttlSeconds).toBe(42);

    await send(imagePath, { relayUrl: "https://relay.example" });
    expect(uploadBlob.mock.calls[1][0].ttlSeconds).toBeGreaterThan(0);
  });

  it("rejects an unsupported file extension before touching the network", async () => {
    const imagePath = join(dir, "doc.pdf");
    await writeFile(imagePath, Buffer.from("x"));
    await expect(send(imagePath)).rejects.toThrow(/unsupported image extension/);
    expect(uploadBlob).not.toHaveBeenCalled();
  });
});

describe("send relay URL resolution", () => {
  let dir: string;
  const original = process.env.FARSIGHT_RELAY_URL;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "farsight-send-env-test-"));
    uploadBlob.mockReset();
    uploadBlob.mockResolvedValue({ relayToken: "tok" });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    if (original === undefined) delete process.env.FARSIGHT_RELAY_URL;
    else process.env.FARSIGHT_RELAY_URL = original;
  });

  async function fixture(): Promise<string> {
    const imagePath = join(dir, "shot.png");
    await writeFile(imagePath, Buffer.from("x"));
    return imagePath;
  }

  // Regression: the --relay-url help text and README both promised
  // FARSIGHT_RELAY_URL support the CLI never actually implemented, so a
  // self-hoster's uploads silently went to the placeholder default host.
  it("uploads to FARSIGHT_RELAY_URL when no explicit relayUrl is given", async () => {
    process.env.FARSIGHT_RELAY_URL = "https://self-hosted.example";
    await send(await fixture());
    expect(uploadBlob.mock.calls[0][0].relayUrl).toBe("https://self-hosted.example");
  });

  it("lets an explicit relayUrl win over the environment", async () => {
    process.env.FARSIGHT_RELAY_URL = "https://self-hosted.example";
    await send(await fixture(), { relayUrl: "https://flag.example" });
    expect(uploadBlob.mock.calls[0][0].relayUrl).toBe("https://flag.example");
  });
});
