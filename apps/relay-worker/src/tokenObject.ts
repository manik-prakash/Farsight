/**
 * Chunk size for stored ciphertext. Durable Object storage caps a single
 * key and value at 2 MB combined, so 1 MiB leaves generous headroom while
 * keeping the number of rows per upload small (the Workers free plan
 * allows 100k row writes/day).
 */
const CHUNK_BYTES = 1024 * 1024;
const CHUNK_PREFIX = "chunk:";

/**
 * Zero-padded so `storage.list()`'s lexicographic key ordering is also
 * sequence ordering — the chunks must be reassembled in the order they
 * were split.
 */
function chunkKey(seq: number): string {
  return `${CHUNK_PREFIX}${String(seq).padStart(4, "0")}`;
}

interface Metadata {
  nonce: string; // base64url, opaque to the relay — it's not secret, just ciphertext framing
  mimeType: string;
  createdAt: number;
  ttlSeconds: number;
  consumed: boolean;
  byteLength: number;
}

/**
 * One TokenObject instance exists per relay token (the Worker derives its
 * id from the token via `idFromName`), and it owns both the ciphertext and
 * the metadata for that token. Durable Objects process a single instance's
 * requests one at a time — the platform serializes access to an instance's
 * storage so two concurrent `/claim` calls can never both see
 * `consumed === false`. That's what makes burn-after-read atomic without
 * any extra locking here: see
 * https://developers.cloudflare.com/durable-objects/ for the guarantee.
 *
 * Keeping the bytes here rather than in an external object store is what
 * lets the relay run entirely on the Workers free plan, and it means there
 * is no window in which the metadata says a blob is valid while its bytes
 * have gone missing somewhere else.
 */
export class TokenObject {
  private readonly storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "PUT" && url.pathname === "/store") {
      return this.store(request);
    }

    if (request.method === "POST" && url.pathname === "/claim") {
      return this.claim();
    }

    return new Response(null, { status: 400 });
  }

  private async store(request: Request): Promise<Response> {
    const nonce = request.headers.get("x-farsight-nonce");
    const mimeType = request.headers.get("x-farsight-mime-type");
    const ttlHeader = request.headers.get("x-farsight-ttl");
    if (!nonce || !mimeType || !ttlHeader) {
      return new Response(null, { status: 400 });
    }

    const bytes = new Uint8Array(await request.arrayBuffer());
    const chunks: Record<string, Uint8Array> = {};
    for (let offset = 0, seq = 0; offset < bytes.byteLength; offset += CHUNK_BYTES, seq++) {
      chunks[chunkKey(seq)] = bytes.slice(offset, offset + CHUNK_BYTES);
    }

    const meta: Metadata = {
      nonce,
      mimeType,
      createdAt: Date.now(),
      ttlSeconds: Number(ttlHeader),
      consumed: false,
      byteLength: bytes.byteLength,
    };

    // Chunks before metadata: a partial write then leaves no `meta`, so the
    // token reads as never-issued (404) rather than as a valid token whose
    // bytes are incomplete.
    await this.storage.put(chunks);
    await this.storage.put<Metadata>("meta", meta);
    await this.storage.setAlarm(meta.createdAt + meta.ttlSeconds * 1000);
    return new Response(null, { status: 204 });
  }

  private async claim(): Promise<Response> {
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

    const stored = await this.storage.list<Uint8Array | ArrayBuffer>({ prefix: CHUNK_PREFIX });
    const body = new Uint8Array(meta.byteLength);
    let offset = 0;
    for (const value of stored.values()) {
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // Burn: the ciphertext goes now, but `meta` stays as a tombstone so a
    // second fetch is a 410 ("you're too late") rather than a 404 ("wrong
    // token"). The alarm clears the tombstone at TTL.
    meta.consumed = true;
    await this.storage.put<Metadata>("meta", meta);
    await this.storage.delete([...stored.keys()]);

    return new Response(body, {
      status: 200,
      headers: {
        "x-farsight-nonce": meta.nonce,
        "x-farsight-mime-type": meta.mimeType,
      },
    });
  }

  /**
   * TTL housekeeping. For a blob that was never fetched this is what frees
   * the ciphertext; for one already burned it clears the consumed
   * tombstone. `deleteAll()` covers the chunk keys either way.
   */
  async alarm(): Promise<void> {
    await this.storage.deleteAll();
  }
}
