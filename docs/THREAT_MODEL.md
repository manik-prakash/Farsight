# Threat model

## What the relay can and cannot see

The relay stores and serves **ciphertext only**. Per blob it can observe:

- Byte size of the encrypted blob
- Upload and (if fetched) download timestamps
- The declared MIME type (e.g. `image/png`) — sent in plaintext so the MCP
  tool can label the returned image correctly
- The nonce — not secret, it's AEAD framing, not key material

It can never observe:

- The plaintext image
- The decryption key (it only ever exists in the reference string, which
  never touches the relay's request path except as an opaque token — the
  key half of `fs_<token>.<key>` is never sent to the server)

This mirrors Magic Wormhole and Firefox Send's trust model: the relay is a
dumb, untrusted bulletin board, not a party you need to trust with content.

## What Farsight does NOT protect against

- **A compromised endpoint.** If the machine running `farsight send` or the
  agent running `farsight-mcp` is already compromised, encryption in
  transit doesn't help — the attacker already has the plaintext.
- **Someone who intercepts the reference string itself.** The reference
  string *is* the credential — whoever has `fs_<token>.<key>` before the
  legitimate recipient can race them to fetch it. Treat it like a
  one-time password: paste it directly into the intended chat, don't post
  it somewhere public first.
- **Traffic analysis by the relay operator.** The relay can correlate
  upload/download timing and blob sizes even though it can't read content.
  If that matters for your use case, self-host the relay (see
  `apps/relay-node`, future work) rather than using the public demo
  instance.
- **Availability.** Burn-after-read means a lost or dropped download is
  gone — there is no retry. This is a deliberate trade-off (matching Magic
  Wormhole), not an oversight; re-send if a fetch fails partway.
- **Denial of service against the relay.** The public demo relay has no
  rate limiting beyond Cloudflare's platform defaults. Don't rely on it for
  anything you can't afford to have someone else exhaust.

## Why XChaCha20-Poly1305 with a random key, not sealed-box public-key crypto

There is no persistent recipient identity in this system — "the recipient"
is just whoever holds the second half of a one-time token, generated fresh
per send. Public-key sealed boxes exist to solve a different problem
(anonymous sender, known long-lived recipient key) that doesn't apply here.
A random symmetric key per message, transported entirely out-of-band in the
reference string, is simpler and matches the actual trust model — see
`packages/core/src/crypto.ts`.
