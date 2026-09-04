# Farsight

**Give a terminal-only or cloud-hosted AI coding agent a way to *see* an
image, with no SSH tunnel, no shared filesystem, and no server that ever
sees the plaintext.**

```
farsight send screenshot.png
# fs_9eBm-z2xJ4OdESwbgE80Xg.GvchtwqKl7W2qnlUDGGZRIKzdL8f-g4yf9ZLLZ0eyJI
```

Paste that string into a chat with any MCP-connected agent that has
`farsight-mcp` registered, and it can fetch, decrypt, and see the image —
even if that agent is running in a sandboxed cloud environment you only
talk to through a web UI or PR comments.

## The problem this solves

Desktop chat apps let you drag an image straight into the conversation.
A coding agent running as a background/cloud session — reached only
through chat, with no SSH access into its sandbox and no filesystem you
share with it — has no equivalent. There's no camera into your local
clipboard or screen from in there.

A few existing tools solve an *adjacent, easier* problem — pasting a
screenshot into Claude Code **while you have a live SSH session open** to
the exact machine it's running on:

- [**ccimg/ccimgd**](https://alexanderzeitler.com/articles/paste-clipboard-images-into-claude-code-over-ssh/) —
  a local clipboard daemon reached over an SSH reverse tunnel
  (`ssh -R 9998:localhost:9998`) from the remote box.
- [**Matt Goodrich's Alfred script**](https://mattgoodrich.com/posts/pasting-screenshots-into-a-remote-claude-session/) —
  hotkey → `screencapture` → `scp` the file to the remote box → paste the
  remote path into the chat.
- **clipssh** — same shape, different shell script.

All three need a live, interactive channel *you* control between the two
specific machines. None of them work when the agent is a genuinely async,
sandboxed cloud session with outbound HTTPS and nothing else. Farsight is
built for that harder case specifically.

## How it works

```
┌────────────────┐        ciphertext only        ┌──────────────────────┐
│  farsight send  │ ─────────────────────────────▶│   relay (Cloudflare   │
│  (your laptop)  │                                │  Worker + DO storage) │
└────────────────┘                                └──────────────────────┘
        │  prints a reference string                        ▲
        │  fs_<relay-token>.<key>                            │  HTTPS GET
        ▼                                                     │  (burns the
   you paste it into a chat ──────────────────────────────────┘   blob)
        │
        ▼
┌───────────────────┐   fetch_image(reference)   ┌──────────────────┐
│   your AI agent    │ ──────────────────────────▶│  farsight-mcp     │
│ (local or cloud,    │◀──────────────────────────│  (runs wherever    │
│  MCP-connected)     │  MCP ImageContent block     │  the agent lives)  │
└───────────────────┘                             └──────────────────┘
```

1. **`farsight send <path>`** reads the image, generates a fresh random
   XChaCha20-Poly1305 key, encrypts it, and uploads only the ciphertext to
   the relay. It prints a single reference string —
   `fs_<relay-token>.<key>` — and the key half **never touches the
   relay**.
2. **The relay** (a Cloudflare Worker, with a Durable Object per token
   holding both the encrypted bytes and the burn-after-read state)
   stores the blob briefly and deletes it the instant it's fetched once,
   or after its TTL expires — whichever comes first. It only ever sees
   ciphertext, never the key. Uploads are rate-limited per IP (20/60s by
   default) so an exposed relay can't double as free anonymous blob
   storage. Keeping the bytes in the Durable Object rather than an object
   store is what lets the relay run entirely on Cloudflare's free plan.
3. **`farsight-mcp`** runs as an MCP server wherever the agent lives — a
   laptop, a container, a cloud sandbox, anywhere with outbound HTTPS and
   nothing else needed. Its one tool, `fetch_image`, downloads the blob,
   decrypts it locally, and returns it as a native MCP `ImageContent`
   block the agent can see directly in the tool result.

No SSH tunnel, no shared disk, no persistent server-held key. See
[`docs/RELAY_PROTOCOL.md`](docs/RELAY_PROTOCOL.md) for the exact wire
contract and [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) for what the
zero-knowledge design does and doesn't protect against.

## Quick start

Once published to npm (`@farsight/cli`, `@farsight/mcp-server`):

```bash
npx @farsight/cli send ./screenshot.png

claude mcp add farsight-mcp -- npx -y @farsight/mcp-server
```

Until then, run from a source checkout:

```bash
npm install
npm run build

# Send an image (set FARSIGHT_RELAY_URL first — see "Running your own relay")
node packages/cli/bin/farsight.js send ./screenshot.png

# Register the MCP server with your agent, e.g. Claude Code:
claude mcp add farsight-mcp -- node ./packages/mcp-server/bin/farsight-mcp.js
```

Either way, paste the printed reference into a chat with that agent and ask
it to fetch and describe the image.

## Demo

A real terminal session against a deployed Cloudflare relay. No animated
GIF here: this was built on a Windows box with no headless
screen-recording path available, and a staged one would misrepresent the
tool — this is unedited, real command output, with the relay subdomain
redacted.

```
$ farsight send ./small.png    # a 1x1 PNG, kept tiny so the output stays readable
fs_CQtwWPaZzmxLRo33gwTd5w.L9Ik0IGBS6W04VzFFyFnUkFZ1oKjwEMx_zxb3_4hQhM
(image/png, 70 bytes, expires in 600s if unfetched)

$ # paste the reference into an MCP-connected agent's chat, or call the
$ # tool directly — this is what a tools/call round trip returns:
{
  "result": {
    "content": [
      { "type": "image", "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...", "mimeType": "image/png" },
      { "type": "text", "text": "Fetched and decrypted a 70-byte image/png image via Farsight. If no image appeared above this text, your MCP client isn't rendering the image content block as real vision input for the model..." }
    ]
  }
}

$ # the same reference again — burn-after-read means it's gone:
{
  "result": {
    "content": [
      { "type": "text", "text": "this image was already fetched once and Farsight deleted it (burn-after-read) — ask for a fresh reference" }
    ],
    "isError": true
  }
}
```

### Running your own relay

There is no public Farsight relay — `DEFAULT_RELAY_URL` in
`packages/core/src/config.ts` is a placeholder that does not resolve, so
running your own is currently the only way to use Farsight.

```bash
cd apps/relay-worker
npx wrangler dev      # local dev, no Cloudflare account needed

npx wrangler login    # deploy: authenticate once
npx wrangler deploy   # -> https://farsight-relay.<subdomain>.workers.dev
```

**The relay runs entirely within the Cloudflare Workers free plan.** There
is no object store and no bucket to create: ciphertext lives in the same
per-token Durable Object that enforces burn-after-read, stored as 1 MiB
chunks under Durable Object storage's 2 MB-per-value limit. That keeps the
whole system on free-tier services — R2 would have required linking a
payment method even to stay inside its free tier.

The free plan's ceilings are the practical limits: 5 GB of total Durable
Object storage, 100k requests/day, and 100k row writes/day. Farsight caps
a single image at **10 MB** (10 chunks) accordingly.

Point both ends at the result with `FARSIGHT_RELAY_URL`, either as a shell
variable or in a `.env` file (copy `.env.example`; `.env` is gitignored):

```bash
cp .env.example .env    # then edit in your relay URL
farsight send ./screenshot.png
```

Precedence is `--relay-url` > a real environment variable > `.env` > the
built-in default. A `.env` never overrides a variable you set explicitly,
so a forgotten file can't silently redirect an upload.

The MCP server reads the same environment variable but **not** `.env` files.
Its working directory is chosen by the MCP client, not by you, so a `.env`
found there could be one you never wrote — and it could point the agent at
someone else's relay. Set the variable in the client's own server config
instead, in the environment the **agent** runs in; that is a different
machine from your laptop whenever the agent is in a container or cloud
sandbox.

## Tested against

- **Protocol correctness**: verified against
  [MCP Inspector](https://github.com/modelcontextprotocol/inspector) and by
  driving the stdio server directly — `fetch_image` registers with a
  spec-valid `inputSchema`, and a real `tools/call` round trip through the
  **deployed** Cloudflare relay returns a byte-identical, spec-valid
  `{type: "image", data, mimeType}` block. Exercised end-to-end against
  live infrastructure: real XChaCha20-Poly1305 encryption, a real Durable
  Object enforcing atomic burn-after-read, chunked storage proven with a
  2.5 MB blob spanning three chunks, and TTL expiry.
- **Vision input**: confirmed on **Claude Code 2.1.259 (Windows),
  2026-09-03**. A fresh session given only a reference string fetched the
  image and reported the exact random UUID rendered in it — content it had
  no way to infer, so a plausible-sounding hallucination could not have
  matched. That client passes the image block to the model as genuine
  vision input.
- **Other MCP clients remain unverified.** MCP's spec is unambiguous that
  tool results can carry native image content, but real client behavior has
  been inconsistent — see
  [`anthropics/claude-code#31208`](https://github.com/anthropics/claude-code/issues/31208)
  and [`#53256`](https://github.com/anthropics/claude-code/issues/53256)
  for cases where a client serialized the base64 payload as inert text
  instead. **That's why `fetch_image` always returns a text confirmation
  alongside the image block** — the tool call reports what happened even on
  a client where the image itself doesn't render. If you hit this, it's a
  client-side gap, not a sign the fetch failed.

## Non-goals

- **Not a general file-transfer tool.** For that, use
  [Magic Wormhole](https://github.com/magic-wormhole/magic-wormhole) or
  [croc](https://github.com/schollz/croc) — both already do this well.
  Farsight is specifically shaped around handing one image to one MCP
  tool call.
- **Not a terminal-graphics tool.** Kitty/iTerm2/Sixel inline image
  protocols solve a different, purely human-facing problem (rendering a
  picture inside a terminal emulator for a person to look at) and are out
  of scope here — see
  [anthropics/claude-code#2266](https://github.com/anthropics/claude-code/issues/2266)
  for that specific, still-open feature request.

## Project layout

```
packages/core/         crypto, reference-string format, relay HTTP client (shared)
packages/cli/          `farsight` — send/recv commands
packages/mcp-server/   `farsight-mcp` — the fetch_image MCP tool
apps/relay-worker/     Cloudflare Worker relay (Durable Objects, no object store)
docs/                  wire protocol + threat model
```

Each package has its own test suite (`npm test` at the repo root runs all
of them). The relay worker's tests run against the real Workers runtime
(`workerd`) via `@cloudflare/vitest-plugin` — not a mock.

## Roadmap

- [x] **Milestone 1 — MVP**: file-path send, relay, MCP fetch, TTL +
      burn-after-read, all verified end-to-end.
- [ ] **v2 — ship-readiness** (in progress): scoped npm names
      (`@farsight/*`, since the unscoped `farsight` was already taken),
      publish metadata, per-IP upload rate limiting, a real Cloudflare
      deploy, and the real-client vision check are done — the relay runs on
      the Workers free plan with no object store, and an MCP-connected
      agent has been confirmed to actually see a relayed image. Still open:
      publishing the three packages to npm and pushing this repo to GitHub.
- [ ] **Milestone 2**: `farsight watch` — clipboard-watching daemon for
      one-hotkey capture.
- [ ] **Milestone 3**: QR-code handoff for phone-photo → terminal.
- [ ] **Milestone 4** *(design only, deliberately not built)*: a
      persistent per-agent inbox so the agent polls for new images
      instead of a human pasting a token each time. Deferred because it
      changes the trust model — a longer-lived inbox ID needs its own
      access control story that a one-time burn-after-read token doesn't.

## License

MIT — see [LICENSE](LICENSE).
