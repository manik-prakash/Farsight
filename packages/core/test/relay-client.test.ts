import { describe, it, expect, vi } from "vitest";
import { uploadBlob, downloadBlob } from "../src/relay-client.js";
import { RelayError } from "../src/types.js";
import { DEFAULT_RELAY_URL } from "../src/config.js";
import { bytesToBase64Url } from "../src/bytes.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("uploadBlob", () => {
  it("POSTs ciphertext with metadata headers and returns the relay token", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://relay.example/v1/blob");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        "x-farsight-mime-type": "image/png",
        "x-farsight-ttl": "600",
      });
      return jsonResponse({ token: "tok_abc" });
    });

    const result = await uploadBlob({
      relayUrl: "https://relay.example",
      ciphertext: new Uint8Array([1, 2, 3]),
      nonce: new Uint8Array(24).fill(9),
      mimeType: "image/png",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.relayToken).toBe("tok_abc");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("respects a custom ttlSeconds", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)["x-farsight-ttl"]).toBe("30");
      return jsonResponse({ token: "tok" });
    });
    await uploadBlob({
      relayUrl: "https://relay.example",
      ciphertext: new Uint8Array([1]),
      nonce: new Uint8Array(24),
      mimeType: "image/png",
      ttlSeconds: 30,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
  });

  it("throws RelayError when the relay rejects the upload", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(
      uploadBlob({
        relayUrl: "https://relay.example",
        ciphertext: new Uint8Array([1]),
        nonce: new Uint8Array(24),
        mimeType: "image/png",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(RelayError);
  });
});

describe("downloadBlob", () => {
  it("GETs the blob and decodes the nonce header", async () => {
    const nonce = new Uint8Array(24).fill(5);
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe("https://relay.example/v1/blob/tok_abc");
      return new Response(new Uint8Array([9, 9, 9]), {
        status: 200,
        headers: {
          "x-farsight-nonce": bytesToBase64Url(nonce),
          "x-farsight-mime-type": "image/png",
        },
      });
    });

    const result = await downloadBlob({
      relayUrl: "https://relay.example",
      relayToken: "tok_abc",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.nonce).toEqual(nonce);
    expect(new Uint8Array(result.ciphertext)).toEqual(new Uint8Array([9, 9, 9]));
  });

  it('maps HTTP 404 to a RelayError with code "not_found"', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(
      downloadBlob({ relayUrl: "https://relay.example", relayToken: "gone", fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it('maps HTTP 410 to a RelayError with code "consumed"', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 410 }));
    await expect(
      downloadBlob({ relayUrl: "https://relay.example", relayToken: "used", fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: "consumed" });
  });

  it("throws RelayError when required headers are missing", async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 }));
    await expect(
      downloadBlob({ relayUrl: "https://relay.example", relayToken: "tok", fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow(RelayError);
  });

  it("URL-encodes the relay token in the request path", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe("https://relay.example/v1/blob/tok%2Fwith%2Fslash");
      return new Response(new Uint8Array([1]), {
        status: 200,
        headers: { "x-farsight-nonce": bytesToBase64Url(new Uint8Array(24)), "x-farsight-mime-type": "image/png" },
      });
    });
    await downloadBlob({ relayUrl: "https://relay.example", relayToken: "tok/with/slash", fetchImpl: fetchImpl as unknown as typeof fetch });
  });
});

describe("unreachable relays", () => {
  // Without this handling the caller sees Node's bare "fetch failed", which
  // tells a first-time user nothing about the thing they actually have to do.
  const offline = () => {
    throw new TypeError("fetch failed");
  };

  it("names the missing configuration when the URL is still the built-in default", async () => {
    const promise = uploadBlob({
      relayUrl: DEFAULT_RELAY_URL,
      ciphertext: new Uint8Array([1]),
      nonce: new Uint8Array(24),
      mimeType: "image/png",
      fetchImpl: offline as unknown as typeof fetch,
    });

    await expect(promise).rejects.toMatchObject({ code: "unreachable" });
    await expect(promise).rejects.toThrow(/no relay configured/);
    await expect(promise).rejects.toThrow(/FARSIGHT_RELAY_URL/);
  });

  it("names the URL and the cause when a configured relay is unreachable", async () => {
    const promise = downloadBlob({
      relayUrl: "https://relay.example",
      relayToken: "tok",
      fetchImpl: offline as unknown as typeof fetch,
    });

    await expect(promise).rejects.toMatchObject({ code: "unreachable" });
    await expect(promise).rejects.toThrow(/could not reach the relay at https:\/\/relay\.example/);
    await expect(promise).rejects.toThrow(/fetch failed/);
    // A real relay URL must not be blamed on missing configuration.
    await expect(promise).rejects.not.toThrow(/no relay configured/);
  });

  it("leaves HTTP-level failures classified as before", async () => {
    // A relay that answers 404 is reachable; only transport failures are
    // "unreachable", or the burn-after-read messages would get swallowed.
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(
      downloadBlob({ relayUrl: "https://relay.example", relayToken: "tok", fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});
