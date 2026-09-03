import { readFile } from "node:fs/promises";
import { encrypt, encodeReference, uploadBlob, resolveRelayUrl, DEFAULT_TTL_SECONDS } from "@farsight/core";
import { mimeTypeForPath } from "../mimeType.js";

export interface SendOptions {
  relayUrl?: string;
  ttlSeconds?: number;
}

export interface SendResult {
  reference: string;
  mimeType: string;
  byteLength: number;
  ttlSeconds: number;
}

/**
 * Reads, encrypts, and uploads an image, returning the reference string to
 * hand to an agent. Kept separate from the CLI's print/exit-code wiring in
 * index.ts so it's directly unit-testable.
 */
export async function send(imagePath: string, options: SendOptions = {}): Promise<SendResult> {
  const mimeType = mimeTypeForPath(imagePath);
  const plaintext = await readFile(imagePath);
  const { ciphertext, nonce, key } = encrypt(new Uint8Array(plaintext));

  const relayUrl = resolveRelayUrl(options.relayUrl);
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  const { relayToken } = await uploadBlob({ relayUrl, ciphertext, nonce, mimeType, ttlSeconds });
  const reference = encodeReference(relayToken, key);

  return { reference, mimeType, byteLength: plaintext.byteLength, ttlSeconds };
}
