import { bytesToBase64Url, base64UrlToBytes } from "./bytes.js";
import { RelayError, type DownloadResult, type UploadResult } from "./types.js";
import { DEFAULT_TTL_SECONDS } from "./config.js";

export interface UploadOptions {
  relayUrl: string;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  mimeType: string;
  ttlSeconds?: number;
  fetchImpl?: typeof fetch;
}

export interface DownloadOptions {
  relayUrl: string;
  relayToken: string;
  fetchImpl?: typeof fetch;
}

/** See docs/RELAY_PROTOCOL.md for the full wire contract this implements. */
export async function uploadBlob(options: UploadOptions): Promise<UploadResult> {
  const { relayUrl, ciphertext, nonce, mimeType, ttlSeconds = DEFAULT_TTL_SECONDS, fetchImpl = fetch } = options;
  const res = await fetchImpl(joinUrl(relayUrl, "/v1/blob"), {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-farsight-nonce": bytesToBase64Url(nonce),
      "x-farsight-mime-type": mimeType,
      "x-farsight-ttl": String(ttlSeconds),
    },
    // Cast needed because TS's DOM lib types Uint8Array's backing buffer as
    // ArrayBufferLike, which BodyInit doesn't accept even though fetch
    // implementations all handle a Uint8Array body fine at runtime.
    body: ciphertext as BodyInit,
  });
  if (!res.ok) {
    throw new RelayError("bad_request", `relay rejected upload: ${res.status} ${await safeText(res)}`);
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) {
    throw new RelayError("bad_request", "relay upload response missing token");
  }
  return { relayToken: body.token };
}

/** See docs/RELAY_PROTOCOL.md for the full wire contract this implements. */
export async function downloadBlob(options: DownloadOptions): Promise<DownloadResult> {
  const { relayUrl, relayToken, fetchImpl = fetch } = options;
  const res = await fetchImpl(joinUrl(relayUrl, `/v1/blob/${encodeURIComponent(relayToken)}`), {
    method: "GET",
  });
  if (res.status === 404) {
    // The relay deliberately does not distinguish "never existed" from
    // "TTL expired" over the wire — both look identical to a holder of the
    // wrong or stale token, which avoids leaking timing metadata.
    throw new RelayError("not_found", "no blob found for this reference (it may have expired)");
  }
  if (res.status === 410) {
    throw new RelayError("consumed", "this image was already fetched once and has been deleted");
  }
  if (!res.ok) {
    throw new RelayError("bad_request", `relay rejected download: ${res.status} ${await safeText(res)}`);
  }
  const nonceHeader = res.headers.get("x-farsight-nonce");
  const mimeType = res.headers.get("x-farsight-mime-type");
  if (!nonceHeader || !mimeType) {
    throw new RelayError("bad_request", "relay response missing required headers");
  }
  const ciphertext = new Uint8Array(await res.arrayBuffer());
  const nonce = base64UrlToBytes(nonceHeader);
  return { ciphertext, nonce, mimeType };
}

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, "") + path;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
