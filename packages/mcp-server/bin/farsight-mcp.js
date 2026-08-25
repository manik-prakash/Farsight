#!/usr/bin/env node
import { main } from "../dist/index.js";

main().catch((err) => {
  console.error("farsight-mcp failed to start:", err);
  process.exit(1);
});
