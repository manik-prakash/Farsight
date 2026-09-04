/** Shared types for the Farsight relay HTTP contract. See docs/RELAY_PROTOCOL.md. */

export interface UploadResult {
  relayToken: string;
}

export interface DownloadResult {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  mimeType: string;
}

/**
 * "not_found" covers both "token never existed" and "TTL expired" — the
 * relay deliberately doesn't distinguish them over the wire (see
 * relay-client.ts), so an expired blob looks identical to a bad token.
 *
 * "unreachable" is a transport failure: the request never got an HTTP
 * response at all. Most often that means no relay has been configured, since
 * the built-in default host deliberately does not resolve.
 */
export type RelayErrorCode = "not_found" | "consumed" | "bad_request" | "unreachable";

export class RelayError extends Error {
  constructor(
    public readonly code: RelayErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RelayError";
  }
}
