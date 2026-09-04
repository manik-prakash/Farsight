import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { SERVER_VERSION } from "../src/index.js";

describe("SERVER_VERSION", () => {
  // The handshake version drifted from the manifest twice, most recently when
  // 0.2.1 shipped announcing 0.2.0. This fails the moment they diverge again.
  it("matches the package manifest", () => {
    const manifest = new URL("../package.json", import.meta.url);
    const { version } = JSON.parse(readFileSync(manifest, "utf8")) as { version: string };

    expect(SERVER_VERSION).toBe(version);
  });

  it("is a real version string, not a placeholder", () => {
    expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
