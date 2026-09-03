import { describe, it, expect, afterEach } from "vitest";
import { resolveRelayUrl, DEFAULT_RELAY_URL } from "../src/config.js";

describe("resolveRelayUrl", () => {
  const original = process.env.FARSIGHT_RELAY_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.FARSIGHT_RELAY_URL;
    else process.env.FARSIGHT_RELAY_URL = original;
  });

  it("prefers an explicit argument over everything else", () => {
    process.env.FARSIGHT_RELAY_URL = "https://from-env.example";
    expect(resolveRelayUrl("https://explicit.example")).toBe("https://explicit.example");
  });

  it("falls back to FARSIGHT_RELAY_URL when no argument is given", () => {
    process.env.FARSIGHT_RELAY_URL = "https://from-env.example";
    expect(resolveRelayUrl()).toBe("https://from-env.example");
    expect(resolveRelayUrl(undefined)).toBe("https://from-env.example");
  });

  it("falls back to the default when neither is set", () => {
    delete process.env.FARSIGHT_RELAY_URL;
    expect(resolveRelayUrl()).toBe(DEFAULT_RELAY_URL);
  });

  it("ignores an empty FARSIGHT_RELAY_URL rather than sending uploads to an empty host", () => {
    process.env.FARSIGHT_RELAY_URL = "";
    expect(resolveRelayUrl()).toBe(DEFAULT_RELAY_URL);
  });
});
