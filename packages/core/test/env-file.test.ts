import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDotEnv } from "../src/env-file.js";

describe("loadDotEnv", () => {
  let dir: string;
  let cwd: string;
  const original = process.env.FARSIGHT_RELAY_URL;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "farsight-dotenv-test-"));
    cwd = process.cwd();
    process.chdir(dir);
    delete process.env.FARSIGHT_RELAY_URL;
  });

  afterEach(async () => {
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
    if (original === undefined) delete process.env.FARSIGHT_RELAY_URL;
    else process.env.FARSIGHT_RELAY_URL = original;
  });

  it("reads a variable out of .env in the working directory", async () => {
    await writeFile(join(dir, ".env"), "FARSIGHT_RELAY_URL=https://from-dotenv.example\n");
    loadDotEnv();
    expect(process.env.FARSIGHT_RELAY_URL).toBe("https://from-dotenv.example");
  });

  // A forgotten .env must never silently redirect uploads away from the
  // relay the user named explicitly for this invocation.
  it("does not override a variable already set in the environment", async () => {
    await writeFile(join(dir, ".env"), "FARSIGHT_RELAY_URL=https://from-dotenv.example\n");
    process.env.FARSIGHT_RELAY_URL = "https://from-shell.example";
    loadDotEnv();
    expect(process.env.FARSIGHT_RELAY_URL).toBe("https://from-shell.example");
  });

  it("is a no-op when there is no .env at all", () => {
    expect(() => loadDotEnv()).not.toThrow();
    expect(process.env.FARSIGHT_RELAY_URL).toBeUndefined();
  });
});
