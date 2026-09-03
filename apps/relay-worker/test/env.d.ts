import type { Env as WorkerEnv } from "../src/types.js";

// `@cloudflare/vitest-plugin` types its `env` helper as `Cloudflare.Env`
// (the shape `wrangler types` normally generates). Point that at this
// Worker's hand-maintained bindings so tests can reach TOKENS — e.g. to
// inspect a Durable Object's storage via runInDurableObject — without
// casting, and so the two stay in sync.
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}

export {};
