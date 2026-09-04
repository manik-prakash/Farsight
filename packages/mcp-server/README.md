# @farsight/mcp-server

**The MCP server that lets an AI agent see an image sent from someone else's
machine.**

Runs wherever the agent lives — a laptop, a container, a cloud sandbox, anywhere
with outbound HTTPS and nothing else. Its one tool, `fetch_image`, takes the
reference string a human pastes into chat, downloads the encrypted blob,
decrypts it locally, and returns a native MCP image content block the agent can
actually see.

## Register it

```bash
claude mcp add farsight-mcp \
  --env FARSIGHT_RELAY_URL=https://farsight-relay.<your-subdomain>.workers.dev \
  -- npx -y @farsight/mcp-server
```

Or, for any MCP client that takes a JSON config:

```json
{
  "mcpServers": {
    "farsight-mcp": {
      "command": "npx",
      "args": ["-y", "@farsight/mcp-server"],
      "env": { "FARSIGHT_RELAY_URL": "https://farsight-relay.<your-subdomain>.workers.dev" }
    }
  }
}
```

Requires Node 20 or newer. Communicates over stdio.

## ⚠️ You need your own relay

There is no public Farsight relay — the built-in default is a placeholder that
deliberately does not resolve, and `fetch_image` will say so until one is
configured. Deploying one costs nothing and fits entirely inside the Cloudflare
Workers free plan: see
[Running your own relay](https://github.com/manik-prakash/farsight#running-your-own-relay).

**Set `FARSIGHT_RELAY_URL` in the MCP client's own server config**, as shown
above. This server deliberately does **not** read `.env` files: its working
directory is chosen by the MCP client rather than by you, so a `.env` found
there could be one you never wrote — and it could point the agent at someone
else's relay. The CLI, whose working directory is your own shell, does read
`.env`.

Note the variable must be set in the environment the **agent** runs in, which is
a different machine from your laptop whenever the agent is in a container or
cloud sandbox.

## The `fetch_image` tool

| | |
| --- | --- |
| **Input** | `reference` — the `fs_<token>.<key>` string the user pasted |
| **Returns** | an `image` content block, plus a `text` block confirming what happened |
| **On failure** | `isError: true` with a plain-language reason |

It works **once**. The relay deletes the blob on first read, so calling it twice
with the same reference returns a burn-after-read error rather than the image —
that is the design, not a fault.

### Why there's a text block too

MCP's spec is unambiguous that tool results can carry native image content, but
real client behaviour has been inconsistent — there are tracked cases
([#31208](https://github.com/anthropics/claude-code/issues/31208),
[#53256](https://github.com/anthropics/claude-code/issues/53256)) where a client
serialised the base64 payload as inert text instead. The accompanying text block
means the call still reports what happened on a client where the image doesn't
render. If you hit that, it's a client-side gap, not a failed fetch.

**Verified** on Claude Code 2.1.259 (Windows): a fresh session given only a
reference string fetched the image and reported the exact random UUID rendered
in it. Other clients remain unverified.

## What the relay can see

Nothing useful. It stores ciphertext, a nonce, a byte count and a MIME type. The
decryption key exists only inside the reference string, which never touches the
relay — so a hostile relay can neither read the image nor substitute a different
one, since altered ciphertext fails the Poly1305 tag and `fetch_image` returns an
error instead of feeding attacker-chosen content into the agent's context.

See the [threat model](https://github.com/manik-prakash/farsight/blob/main/docs/THREAT_MODEL.md).

## See also

- [`@farsight/cli`](https://www.npmjs.com/package/@farsight/cli) — the `farsight
  send` command that produces the reference string
- [Project repository](https://github.com/manik-prakash/farsight)

MIT licensed.
