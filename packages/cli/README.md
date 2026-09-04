# farsight-cli

**Send an image to an AI coding agent that has no other way to receive one.**

```bash
npx farsight-cli send screenshot.png
# fs_9eBm-z2xJ4OdESwbgE80Xg.GvchtwqKl7W2qnlUDGGZRIKzdL8f-g4yf9ZLLZ0eyJI
```

Paste that string into a chat with any MCP-connected agent that has
[`farsight-mcp`](https://www.npmjs.com/package/farsight-mcp)
registered, and it can fetch, decrypt, and see the image — even when that agent
runs in a sandboxed cloud environment you only reach through a web UI or PR
comments.

The image is encrypted with a fresh XChaCha20-Poly1305 key before it leaves your
machine. **The key never reaches the relay**: it exists only in the reference
string above, which travels through you.

## ⚠️ You need your own relay first

There is no public Farsight relay. The built-in default is a placeholder that
deliberately does not resolve, so `send` will tell you to configure one until
you do.

Deploying one is four commands and costs nothing — it runs entirely inside the
Cloudflare Workers free plan, with no object store and no bucket to create. See
[Running your own relay](https://github.com/manik-prakash/farsight#running-your-own-relay).

## Install

```bash
npm install -g farsight-cli   # or use npx, as above
```

Requires Node 20 or newer.

## Usage

### `farsight send <imagePath>`

Encrypts the image, uploads only the ciphertext, and prints a one-time reference
string to stdout (details go to stderr, so `farsight send x.png | pbcopy` gives
you just the reference).

| Option | Meaning |
| --- | --- |
| `--relay-url <url>` | Override the relay for this call |
| `--ttl <seconds>` | How long the blob may sit unfetched (default 600) |

Supported formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`. Maximum 10 MB.

### `farsight recv <reference> <outputPath>`

Debug and testing only — decrypts a reference straight to a file, bypassing MCP.
Note this **burns the reference**: the relay deletes the blob on first read, so
an agent asked to fetch it afterwards will get an error.

## Configuring the relay

Point `FARSIGHT_RELAY_URL` at your deployment, either as a shell variable or in
a `.env` file in the directory you run from:

```bash
echo 'FARSIGHT_RELAY_URL=https://farsight-relay.<your-subdomain>.workers.dev' > .env
farsight send ./screenshot.png
```

Precedence is `--relay-url` > a real environment variable > `.env` > the
built-in default. A `.env` never overrides a variable you set explicitly, so a
forgotten file can't silently redirect an upload.

## How the blob is protected

- **Burn after read.** The relay deletes the blob the instant it is fetched
  once. A second fetch fails; that is deliberate, not a bug.
- **Short TTL.** Unfetched blobs expire (default 10 minutes).
- **The reference string is the credential.** Whoever holds
  `fs_<token>.<key>` before the intended recipient can race them to it. Treat
  it like a one-time password.

Full details: [threat model](https://github.com/manik-prakash/farsight/blob/main/docs/THREAT_MODEL.md)
and [relay protocol](https://github.com/manik-prakash/farsight/blob/main/docs/RELAY_PROTOCOL.md).

## See also

- [`farsight-mcp`](https://www.npmjs.com/package/farsight-mcp) —
  the other half; runs where the agent lives
- [Project repository](https://github.com/manik-prakash/farsight)

MIT licensed.
