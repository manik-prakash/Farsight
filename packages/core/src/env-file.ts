/**
 * Loads a `.env` file from the current working directory into
 * `process.env`, so a self-hoster can set FARSIGHT_RELAY_URL once in a file
 * instead of exporting it in every shell.
 *
 * Deliberately does NOT override variables that are already set. A real
 * environment variable — including a one-off `FARSIGHT_RELAY_URL=... farsight
 * send ...` — must win over a file that may be stale, otherwise a forgotten
 * `.env` would silently redirect uploads to the wrong relay.
 *
 * A missing or unreadable `.env` is not an error; there simply isn't one.
 */
export function loadDotEnv(): void {
  if (typeof process === "undefined" || typeof process.loadEnvFile !== "function") return;

  const preexisting = { ...process.env };
  try {
    process.loadEnvFile();
  } catch {
    return;
  }
  for (const [key, value] of Object.entries(preexisting)) {
    if (value !== undefined) process.env[key] = value;
  }
}
