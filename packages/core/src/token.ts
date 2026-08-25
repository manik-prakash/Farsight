import { bytesToBase64Url, base64UrlToBytes } from "./bytes.js";
import { KEY_LENGTH } from "./crypto.js";

const PREFIX = "fs_";

export interface Reference {
  /** Opaque id the relay uses to look up the blob. The relay never sees `key`. */
  relayToken: string;
  /** The AEAD decryption key, base64url-decoded from the reference string. */
  key: Uint8Array;
}

/**
 * Encodes a relay token + decryption key into the single copy-pasteable
 * string a user hands to an agent, e.g. "fs_Jk3x...9fQ.b64urlkey...".
 * The `.` separator keeps the secret key half visually distinct from the
 * relay-visible token half, so it's easy to keep out of anything that
 * logs URLs (the key is never a query param or path segment on the wire).
 */
export function encodeReference(relayToken: string, key: Uint8Array): string {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`encodeReference: key must be ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  return `${PREFIX}${relayToken}.${bytesToBase64Url(key)}`;
}

/**
 * Parses a reference string produced by encodeReference. Throws
 * ReferenceFormatError on anything malformed so callers (CLI, MCP tool)
 * can surface a clear "invalid reference" error instead of a cryptic crash.
 */
export function decodeReference(reference: string): Reference {
  if (!reference.startsWith(PREFIX)) {
    throw new ReferenceFormatError(`reference must start with "${PREFIX}"`);
  }
  const body = reference.slice(PREFIX.length);
  const dotIndex = body.lastIndexOf(".");
  if (dotIndex === -1) {
    throw new ReferenceFormatError('reference must contain a "." separating token and key');
  }
  const relayToken = body.slice(0, dotIndex);
  const keyPart = body.slice(dotIndex + 1);
  if (relayToken.length === 0) {
    throw new ReferenceFormatError("relay token portion is empty");
  }
  let key: Uint8Array;
  try {
    key = base64UrlToBytes(keyPart);
  } catch {
    throw new ReferenceFormatError("key portion is not valid base64url");
  }
  if (key.length !== KEY_LENGTH) {
    throw new ReferenceFormatError(`decoded key must be ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  return { relayToken, key };
}

export class ReferenceFormatError extends Error {
  constructor(message: string) {
    super(`invalid Farsight reference: ${message}`);
    this.name = "ReferenceFormatError";
  }
}
