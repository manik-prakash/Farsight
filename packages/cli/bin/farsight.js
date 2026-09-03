#!/usr/bin/env node
import { loadDotEnv } from "@farsight/core";
import { buildProgram } from "../dist/index.js";

// Picks up FARSIGHT_RELAY_URL from a .env in the working directory, without
// overriding anything already set in the real environment.
loadDotEnv();

buildProgram().parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
