# farsight-core

Shared internals for [Farsight](https://github.com/manik-prakash/farsight):
encryption, the reference-string format, and the relay HTTP client.

**You probably want one of the other two packages instead:**

- [`farsight-cli`](https://www.npmjs.com/package/farsight-cli) — `farsight
  send`, the command you run on your own machine
- [`farsight-mcp`](https://www.npmjs.com/package/farsight-mcp) —
  the `fetch_image` MCP tool, which runs where the agent lives

This package exists so those two agree on the wire format and the crypto rather
than each implementing it. It has no CLI and no side effects on import.

## What's in it

| Export | Purpose |
| --- | --- |
| `encrypt` / `decrypt` | XChaCha20-Poly1305 with a fresh random key and nonce per call |
| `encodeReference` / `decodeReference` | The `fs_<token>.<key>` string format |
| `uploadBlob` / `downloadBlob` | The relay HTTP contract |
| `resolveRelayUrl` | `--relay-url` > env var > `.env` > built-in default |
| `loadDotEnv` | Reads a `.env` without overriding anything already set |
| `bytesToBase64`, `randomBytes`, … | Small byte helpers |

One runtime dependency: [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers).

## Runs in a browser too

Nothing here imports a `node:` builtin — it uses `btoa`/`atob`,
`crypto.getRandomValues`, and a pure-JS cipher, so the whole encryption path
works unchanged in a browser. The
[project site's demo](https://github.com/manik-prakash/farsight/tree/main/apps/web)
imports this package directly rather than reimplementing anything.

`loadDotEnv` is the one exception: it needs Node, and returns silently
everywhere else.

## Documentation

- [farsight-web-dtor.vercel.app](https://farsight-web-dtor.vercel.app) — the project site

- [Relay protocol](https://github.com/manik-prakash/farsight/blob/main/docs/RELAY_PROTOCOL.md)
  — the wire contract `uploadBlob` and `downloadBlob` implement
- [Threat model](https://github.com/manik-prakash/farsight/blob/main/docs/THREAT_MODEL.md)
  — what the zero-knowledge design does and does not protect

MIT licensed.
