#!/usr/bin/env node
import { buildProgram } from "../dist/index.js";

buildProgram().parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
