import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const NONCE_B64URL = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; // 24 zero bytes, base64url — content is irrelevant to the relay, it's opaque ciphertext framing
const CIPHERTEXT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

async function upload(ttlSeconds = 600, mimeType = "image/png") {
  const res = await SELF.fetch("https://relay.test/v1/blob", {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-farsight-nonce": NONCE_B64URL,
      "x-farsight-mime-type": mimeType,
      "x-farsight-ttl": String(ttlSeconds),
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

  it("issues a different token for every upload", async () => {
    const a = await upload();
    const b = await upload();
    const { token: tokenA } = (await a.json()) as { token: string };
    const { token: tokenB } = (await b.json()) as { token: string };
    expect(tokenA).not.toBe(tokenB);
  });
});
