import { writeFile } from "node:fs/promises";
import { decodeReference, decrypt, downloadBlob, resolveRelayUrl } from "@farsight/core";

export interface RecvOptions {
  relayUrl?: string;
}

export interface RecvResult {
  outputPath: string;
  mimeType: string;
  byteLength: number;
}

/**
 * Debug/test-only counterpart to `send`: decrypts a reference straight from
 * the CLI, without going through the MCP server. This is what lets the
 * relay + crypto round-trip be verified with no MCP client involved at all
 * (see docs/RELAY_PROTOCOL.md and the project README's verification steps).
 */
export async function recv(reference: string, outputPath: string, options: RecvOptions = {}): Promise<RecvResult> {
  const { relayToken, key } = decodeReference(reference);
  const relayUrl = resolveRelayUrl(options.relayUrl);
  const blob = await downloadBlob({ relayUrl, relayToken });
  const plaintext = decrypt(blob.ciphertext, blob.nonce, key);
  await writeFile(outputPath, plaintext);
  return { outputPath, mimeType: blob.mimeType, byteLength: plaintext.byteLength };
}
