import { extname } from "node:path";

// Matches the media types Claude's vision API actually accepts — sending
// anything else would fail downstream regardless of what the relay does.
const EXTENSION_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export function mimeTypeForPath(path: string): string {
  const ext = extname(path).toLowerCase();
  const mimeType = EXTENSION_TO_MIME[ext];
  if (!mimeType) {
    const supported = Object.keys(EXTENSION_TO_MIME).join(", ");
    throw new Error(`unsupported image extension "${ext}" — Farsight supports: ${supported}`);
  }
  return mimeType;
}
