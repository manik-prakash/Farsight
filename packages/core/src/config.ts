/**
 * Shared defaults so the CLI and MCP server agree on where the relay lives
 * without duplicating the URL in two packages.
 *
 * There is no public Farsight relay running yet — this placeholder host
 * does not resolve, so both ends must be pointed at a self-hosted relay
 * (see the README's self-hosting section). Kept as a named constant rather
 * than removed so the "no relay configured" failure is a clear DNS error
 * against an obviously fake host, not an undefined-URL crash.
 */
export const DEFAULT_RELAY_URL = "https://farsight-relay.example.workers.dev";
export const DEFAULT_TTL_SECONDS = 600; // 10 minutes

/**
 * Single definition of relay-URL precedence, shared by the CLI and the MCP
 * server so `--relay-url`, FARSIGHT_RELAY_URL, and the default can never
 * drift apart between the two ends of a transfer:
 *
 *   explicit argument  >  FARSIGHT_RELAY_URL  >  DEFAULT_RELAY_URL
 *
 * The `process` guard keeps this usable if core is ever loaded somewhere
 * without Node globals; there it simply falls through to the default.
 */
export function resolveRelayUrl(explicit?: string): string {
  if (explicit) return explicit;
  const fromEnv = typeof process !== "undefined" ? process.env?.FARSIGHT_RELAY_URL : undefined;
  return fromEnv || DEFAULT_RELAY_URL;
}
