import type { Env } from "./types.js";

interface Metadata {
  relayToken: string;
  nonce: string; // base64url, opaque to the relay — it's not secret, just ciphertext framing
  mimeType: string;
  createdAt: number;
  ttlSeconds: number;
  consumed: boolean;
}

export interface StoreRequest {
  relayToken: string;
  nonce: string;
  mimeType: string;
  ttlSeconds: number;
}

export interface ClaimResult {
  nonce: string;
  mimeType: string;
}

/**
 * One TokenObject instance exists per relay token (the Worker derives its
 * id from the token via `idFromName`). Durable Objects process a single
 * instance's requests one at a time — the platform serializes access to an
 * instance's storage so two concurrent `/claim` calls can never both see
 * `consumed === false`. That's what makes burn-after-read atomic without
 * any extra locking here: see
 * https://developers.cloudflare.com/durable-objects/ for the guarantee.
 */
export class TokenObject {
  private readonly storage: DurableObjectStorage;
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "PUT" && url.pathname === "/store") {
      const body = (await request.json()) as StoreRequest;
      const meta: Metadata = {
        relayToken: body.relayToken,
        nonce: body.nonce,
        mimeType: body.mimeType,
        createdAt: Date.now(),
        ttlSeconds: body.ttlSeconds,
        consumed: false,
      };
      await this.storage.put<Metadata>("meta", meta);
      await this.storage.setAlarm(meta.createdAt + meta.ttlSeconds * 1000);
      return new Response(null, { status: 204 });
    }

    if (request.method === "POST" && url.pathname === "/claim") {
      const meta = await this.storage.get<Metadata>("meta");
      if (!meta) {
        return new Response(null, { status: 404 });
      }
      if (Date.now() > meta.createdAt + meta.ttlSeconds * 1000) {
        await this.storage.deleteAll();
        return new Response(null, { status: 404 });
      }
      if (meta.consumed) {
        return new Response(null, { status: 410 });
      }
      meta.consumed = true;
      await this.storage.put<Metadata>("meta", meta);
      const result: ClaimResult = { nonce: meta.nonce, mimeType: meta.mimeType };
      return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
    }

    return new Response(null, { status: 400 });
  }

  /** TTL housekeeping for blobs that are never fetched. */
  async alarm(): Promise<void> {
    const meta = await this.storage.get<Metadata>("meta");
    if (!meta) return;
    if (!meta.consumed) {
      // Never claimed before expiry — the R2 object would otherwise be
      // orphaned forever, since nothing else ever deletes an unclaimed blob.
      await this.env.BLOBS.delete(meta.relayToken);
    }
    await this.storage.deleteAll();
  }
}
