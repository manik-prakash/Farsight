import {
  decodeReference,
  decrypt,
  downloadBlob,
  bytesToBase64,
  RelayError,
  ReferenceFormatError,
} from "@farsight/core";

export interface FetchImageDeps {
  relayUrl: string;
  /** Injectable for tests; defaults to the real relay HTTP client. */
  downloadBlobImpl?: typeof downloadBlob;
}

export interface ImageContentBlock {
  type: "image";
  data: string;
  mimeType: string;
}

export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface FetchImageResult {
  content: Array<ImageContentBlock | TextContentBlock>;
  isError?: boolean;
  // The MCP SDK's CallToolResult type carries an index signature for
  // forward-compatible extra fields; mirrored here so this return type is
  // assignable to it without a cast at the call site in index.ts.
  [key: string]: unknown;
}

const CLIENT_COMPATIBILITY_NOTE =
  "If no image appeared above this text, your MCP client isn't rendering the " +
  "image content block as real vision input for the model (a known " +
  "inconsistency across MCP clients — see this project's README for tracked " +
  "issues). The image was still fetched and decrypted successfully.";

/**
 * Fetches, decrypts, and returns a Farsight-relayed image as a native MCP
 * image content block, alongside a text block. The text block is not
 * decorative: some MCP clients silently fail to treat an image content
 * block as true vision input (see README "Tested against" section), so a
 * tool call that returned only an image block would be silently useless on
 * those clients. This way the call always reports something a human or
 * model can act on, and successfully fetching + decrypting is confirmed in
 * text even when the image itself doesn't render.
 */
export async function fetchImage(reference: string, deps: FetchImageDeps): Promise<FetchImageResult> {
  const download = deps.downloadBlobImpl ?? downloadBlob;

  let parsed;
  try {
    parsed = decodeReference(reference);
  } catch (err) {
    return errorResult(err instanceof ReferenceFormatError ? err.message : `invalid reference: ${String(err)}`);
  }

  let blob;
  try {
    blob = await download({ relayUrl: deps.relayUrl, relayToken: parsed.relayToken });
  } catch (err) {
    if (err instanceof RelayError) {
      return errorResult(relayErrorMessage(err));
    }
    return errorResult(`could not reach the relay: ${err instanceof Error ? err.message : String(err)}`);
  }

  let plaintext: Uint8Array;
  try {
    plaintext = decrypt(blob.ciphertext, blob.nonce, parsed.key);
  } catch {
    return errorResult(
      "decryption failed: the key in this reference doesn't match the fetched blob " +
        "(wrong reference, or the blob was tampered with in transit)",
    );
  }

  return {
    content: [
      { type: "image", data: bytesToBase64(plaintext), mimeType: blob.mimeType },
      {
        type: "text",
        text: `Fetched and decrypted a ${plaintext.byteLength}-byte ${blob.mimeType} image via Farsight. ${CLIENT_COMPATIBILITY_NOTE}`,
      },
    ],
  };
}

function relayErrorMessage(err: RelayError): string {
  switch (err.code) {
    case "not_found":
      return "no image found for this reference — it may have already expired (Farsight blobs have a short TTL)";
    case "consumed":
      return "this image was already fetched once and Farsight deleted it (burn-after-read) — ask for a fresh reference";
    case "unreachable":
      // Already a complete, actionable sentence (see reachRelay in
      // @farsight/core) — prefixing it would only bury the instruction.
      return err.message;
    default:
      return `relay error: ${err.message}`;
  }
}

function errorResult(message: string): FetchImageResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
