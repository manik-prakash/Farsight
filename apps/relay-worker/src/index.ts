import { TokenObject } from "./tokenObject.js";
import type { Env } from "./types.js";

export { TokenObject };

// Sized against the Workers free plan rather than an object store: each
// upload becomes ceil(size / 1 MiB) Durable Object row writes, and the free
// plan allows 100k row writes/day. Comfortably above a typical screenshot.
const MAX_BLOB_BYTES = 10 * 1024 * 1024;
const MIN_TTL_SECONDS = 1;
const MAX_TTL_SECONDS = 24 * 60 * 60; // 1 day

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/v1/blob") {
      return handleUpload(request, env);
    }

    const claimMatch = url.pathname.match(/^\/v1\/blob\/([^/]+)$/);
    if (request.method === "GET" && claimMatch) {
      return handleDownload(claimMatch[1], env);
    }

    return new Response("not found", { status: 404 });
  },
};

async function handleUpload(request: Request, env: Env): Promise<Response> {
  // "unknown" groups every local-dev/no-header request into one bucket,
  // which is fine off-production — cf-connecting-ip is always set on the
  // real edge, which is the only place this limit actually matters.
  const clientIp = request.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await env.UPLOAD_LIMITER.limit({ key: clientIp });
  if (!success) {
    return new Response("rate limit exceeded — too many uploads from this address, try again shortly", {
      status: 429,
    });
  }

  const nonce = request.headers.get("x-farsight-nonce");
  const mimeType = request.headers.get("x-farsight-mime-type");
  const ttlHeader = request.headers.get("x-farsight-ttl");
  if (!nonce || !mimeType || !ttlHeader) {
    return new Response("missing required headers", { status: 400 });
  }
  const ttlSeconds = Number(ttlHeader);
  if (!Number.isFinite(ttlSeconds) || ttlSeconds < MIN_TTL_SECONDS || ttlSeconds > MAX_TTL_SECONDS) {
    return new Response(`ttl must be between ${MIN_TTL_SECONDS} and ${MAX_TTL_SECONDS} seconds`, { status: 400 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return new Response("empty body", { status: 400 });
  }
  if (body.byteLength > MAX_BLOB_BYTES) {
    return new Response("blob too large", { status: 400 });
  }

  const relayToken = randomToken();
  const stub = env.TOKENS.get(env.TOKENS.idFromName(relayToken));
  const stored = await stub.fetch("https://token/store", {
    method: "PUT",
    headers: {
      "x-farsight-nonce": nonce,
      "x-farsight-mime-type": mimeType,
      "x-farsight-ttl": String(ttlSeconds),
    },
    body,
  });
  if (!stored.ok) {
    return new Response("failed to store blob", { status: 500 });
  }

  return new Response(JSON.stringify({ token: relayToken }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function handleDownload(relayToken: string, env: Env): Promise<Response> {
  const stub = env.TOKENS.get(env.TOKENS.idFromName(relayToken));
  const claimRes = await stub.fetch("https://token/claim", { method: "POST" });

  if (claimRes.status === 404) return new Response(null, { status: 404 });
  if (claimRes.status === 410) return new Response(null, { status: 410 });
  if (!claimRes.ok) return new Response(null, { status: 500 });

  const nonce = claimRes.headers.get("x-farsight-nonce");
  const mimeType = claimRes.headers.get("x-farsight-mime-type");
  if (!nonce || !mimeType) {
    return new Response(null, { status: 500 });
  }

  return new Response(claimRes.body, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "x-farsight-nonce": nonce,
      "x-farsight-mime-type": mimeType,
    },
  });
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
