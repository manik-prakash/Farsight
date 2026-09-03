import { SELF, env, runInDurableObject } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const NONCE_B64URL = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; // 24 zero bytes, base64url — content is irrelevant to the relay, it's opaque ciphertext framing
const CIPHERTEXT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

// The rate limiter's storage persists for the whole test file, keyed on
// cf-connecting-ip. Every test except the rate-limit test itself gets its
// own random IP so a burst in one test can't exhaust another test's quota.
async function upload(ttlSeconds = 600, mimeType = "image/png", ip = crypto.randomUUID()) {
  const res = await SELF.fetch("https://relay.test/v1/blob", {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-farsight-nonce": NONCE_B64URL,
      "x-farsight-mime-type": mimeType,
      "x-farsight-ttl": String(ttlSeconds),
      "cf-connecting-ip": ip,
    },
    body: CIPHERTEXT,
  });
  return res;
}

describe("Farsight relay worker", () => {
  it("round-trips an upload through a single download", async () => {
    const uploadRes = await upload();
    expect(uploadRes.status).toBe(200);
    const { token } = (await uploadRes.json()) as { token: string };
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    const downloadRes = await SELF.fetch(`https://relay.test/v1/blob/${token}`);
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get("x-farsight-nonce")).toBe(NONCE_B64URL);
    expect(downloadRes.headers.get("x-farsight-mime-type")).toBe("image/png");
    const body = new Uint8Array(await downloadRes.arrayBuffer());
    expect(body).toEqual(CIPHERTEXT);
  });

  it("burns the token after the first successful read (second fetch gets 410)", async () => {
    const uploadRes = await upload();
    const { token } = (await uploadRes.json()) as { token: string };

    const first = await SELF.fetch(`https://relay.test/v1/blob/${token}`);
    expect(first.status).toBe(200);

    const second = await SELF.fetch(`https://relay.test/v1/blob/${token}`);
    expect(second.status).toBe(410);
  });

  it("returns 404 for a token that was never issued", async () => {
    const res = await SELF.fetch("https://relay.test/v1/blob/not-a-real-token");
    expect(res.status).toBe(404);
  });

  it("returns 404 once the TTL has elapsed, even if never fetched", async () => {
    const uploadRes = await upload(1);
    const { token } = (await uploadRes.json()) as { token: string };

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await SELF.fetch(`https://relay.test/v1/blob/${token}`);
    expect(res.status).toBe(404);
  });

  it("rejects an upload missing the required headers", async () => {
    const res = await SELF.fetch("https://relay.test/v1/blob", {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: CIPHERTEXT,
    });
    expect(res.status).toBe(400);
  });

  it("rejects an upload with an out-of-range ttl", async () => {
    const res = await upload(0);
    expect(res.status).toBe(400);
  });

  it("rejects an empty body", async () => {
    const res = await SELF.fetch("https://relay.test/v1/blob", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-farsight-nonce": NONCE_B64URL,
        "x-farsight-mime-type": "image/png",
        "x-farsight-ttl": "600",
      },
      body: new Uint8Array(0),
    });
    expect(res.status).toBe(400);
  });

  it("rate-limits uploads from the same client past the configured burst (20/60s in wrangler.toml)", async () => {
    const ip = crypto.randomUUID();
    const results = await Promise.all(Array.from({ length: 25 }, () => upload(600, "image/png", ip)));
    const statuses = results.map((r) => r.status);
    const okCount = statuses.filter((s) => s === 200).length;
    const limitedCount = statuses.filter((s) => s === 429).length;
    expect(okCount).toBeLessThanOrEqual(20);
    expect(limitedCount).toBeGreaterThan(0);
    expect(okCount + limitedCount).toBe(25);
  });

  it("issues a different token for every upload", async () => {
    const a = await upload();
    const b = await upload();
    const { token: tokenA } = (await a.json()) as { token: string };
    const { token: tokenB } = (await b.json()) as { token: string };
    expect(tokenA).not.toBe(tokenB);
  });
});

describe("Farsight relay worker — Durable Object blob storage", () => {
  // Vitest's toEqual walks typed arrays element by element, which on a
  // multi-megabyte blob costs more than the round trip itself and makes the
  // test load-sensitive. Compare directly and report the offending index.
  function firstMismatch(actual: Uint8Array, expected: Uint8Array): number {
    if (actual.byteLength !== expected.byteLength) return -2;
    for (let i = 0; i < actual.byteLength; i++) {
      if (actual[i] !== expected[i]) return i;
    }
    return -1;
  }

  // crypto.getRandomValues() refuses buffers over 64 KiB, so fill in slices.
  function randomBytes(byteLength: number): Uint8Array {
    const out = new Uint8Array(byteLength);
    for (let offset = 0; offset < byteLength; offset += 65536) {
      crypto.getRandomValues(out.subarray(offset, Math.min(offset + 65536, byteLength)));
    }
    return out;
  }

  // Ciphertext is stored as 1 MiB chunks because Durable Object storage
  // caps a key and value at 2 MB combined, so anything over that size is
  // the only thing exercising the split/reassemble path.
  async function uploadBytes(bytes: Uint8Array) {
    return SELF.fetch("https://relay.test/v1/blob", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-farsight-nonce": NONCE_B64URL,
        "x-farsight-mime-type": "image/png",
        "x-farsight-ttl": "600",
        "cf-connecting-ip": crypto.randomUUID(),
      },
      body: bytes,
    });
  }

  it("round-trips a multi-chunk blob byte-for-byte", async () => {
    // 2.5 MiB spans three chunks, with a final partial one.
    const original = randomBytes(2.5 * 1024 * 1024);

    const uploadRes = await uploadBytes(original);
    expect(uploadRes.status).toBe(200);
    const { token } = (await uploadRes.json()) as { token: string };

    const downloadRes = await SELF.fetch(`https://relay.test/v1/blob/${token}`);
    expect(downloadRes.status).toBe(200);
    const returned = new Uint8Array(await downloadRes.arrayBuffer());
    expect(returned.byteLength).toBe(original.byteLength);
    expect(firstMismatch(returned, original)).toBe(-1);
  }, 15_000);

  it("rejects a blob over the 10 MB cap", async () => {
    const res = await uploadBytes(new Uint8Array(10 * 1024 * 1024 + 1));
    expect(res.status).toBe(400);
  });

  it("actually frees the stored chunks on burn, not just the consumed flag", async () => {
    const original = randomBytes(2.5 * 1024 * 1024);
    const uploadRes = await uploadBytes(original);
    const { token } = (await uploadRes.json()) as { token: string };

    const id = env.TOKENS.idFromName(token);
    const stub = env.TOKENS.get(id);

    const before = await runInDurableObject(stub, async (_instance, state) => {
      return [...(await state.storage.list({ prefix: "chunk:" })).keys()].length;
    });
    expect(before).toBe(3);

    expect((await SELF.fetch(`https://relay.test/v1/blob/${token}`)).status).toBe(200);

    // The metadata tombstone must survive (it's what makes a second fetch a
    // 410 rather than a 404), but the ciphertext itself must be gone.
    const after = await runInDurableObject(stub, async (_instance, state) => {
      return {
        chunks: [...(await state.storage.list({ prefix: "chunk:" })).keys()].length,
        meta: await state.storage.get("meta"),
      };
    });
    expect(after.chunks).toBe(0);
    expect(after.meta).toMatchObject({ consumed: true });
  }, 15_000);

  it("frees stored chunks when the TTL expires without a fetch", async () => {
    const original = randomBytes(2.5 * 1024 * 1024);
    const res = await SELF.fetch("https://relay.test/v1/blob", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-farsight-nonce": NONCE_B64URL,
        "x-farsight-mime-type": "image/png",
        "x-farsight-ttl": "1",
        "cf-connecting-ip": crypto.randomUUID(),
      },
      body: original,
    });
    const { token } = (await res.json()) as { token: string };

    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect((await SELF.fetch(`https://relay.test/v1/blob/${token}`)).status).toBe(404);

    const stub = env.TOKENS.get(env.TOKENS.idFromName(token));
    const remaining = await runInDurableObject(stub, async (_instance, state) => {
      return [...(await state.storage.list()).keys()].length;
    });
    expect(remaining).toBe(0);
  }, 15_000);
});
