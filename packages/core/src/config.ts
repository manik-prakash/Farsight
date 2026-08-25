/**
 * Shared defaults so the CLI and MCP server agree on where the public demo
 * relay lives without duplicating the URL in two packages. This is a
 * public, best-effort demo instance — see docs/THREAT_MODEL.md. Anyone
 * self-hosting overrides it via FARSIGHT_RELAY_URL.
 */
export const DEFAULT_RELAY_URL = "https://farsight-relay.example.workers.dev";
export const DEFAULT_TTL_SECONDS = 600; // 10 minutes
