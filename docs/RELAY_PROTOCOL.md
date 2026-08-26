# Farsight relay protocol (v1)

This is the wire contract any relay backend must implement. `packages/core`'s
`relay-client.ts` is the reference client against this contract, and
`apps/relay-worker` is the reference (Cloudflare Workers) implementation.
A different backend — e.g. the self-hostable Node/SQLite relay noted as
future work — only needs to satisfy this document to be a drop-in
replacement; nothing else in the system should assume Cloudflare-specific
behavior.

The relay only ever sees **ciphertext**. It never sees the decryption key —
that lives solely in the client-side reference string (see
`packages/core/src/token.ts`). The relay can observe blob size, upload
time, and declared MIME type, and nothing else.

## `POST /v1/blob`

Uploads one encrypted blob and returns a relay token that identifies it.

**Request**

- `Content-Type: application/octet-stream`
- `X-Farsight-Nonce`: base64url-encoded AEAD nonce (24 bytes decoded)
- `X-Farsight-Mime-Type`: e.g. `image/png` — not secret, used for the
  `ImageContent` block's `mimeType` on the way out
- `X-Farsight-Ttl`: integer seconds until the blob expires if never fetched
- Body: raw ciphertext bytes

**Response — 200**

```json
{ "token": "<opaque relay-assigned id>" }
```

The token must be unguessable (the relay generates it; it is not
client-supplied) and must not itself leak the decryption key.

**Response — 4xx**: any non-2xx status on a malformed request (missing
headers, empty body, oversized body). Body content is not part of the
contract; clients only rely on the status code.

**Response — 429**: too many uploads from this client recently. The
reference implementation limits uploads (not downloads) to 20 per 60
seconds per client IP, so the public relay can't be used as free anonymous
encrypted blob storage. This is an implementation detail of
`apps/relay-worker`, not part of the contract itself — a different backend
may rate-limit differently or not at all, as long as it returns a non-2xx,
non-404/410 status when it does.

## `GET /v1/blob/:token`

Fetches and **permanently deletes** the blob in one atomic operation
(burn-after-first-read). Two concurrent requests for the same token must
never both succeed.

**Response — 200** (first and only successful fetch)

- `X-Farsight-Nonce`: the same base64url nonce provided at upload
- `X-Farsight-Mime-Type`: the same MIME type provided at upload
- Body: raw ciphertext bytes

**Response — 404**: no blob exists for this token. This code is used both
for a token that never existed *and* for a token whose TTL has expired —
the relay deliberately does not distinguish these cases over the wire, so
an expired blob is indistinguishable from a wrong token to anyone who
doesn't already hold it.

**Response — 410**: the token existed and was valid, but has already been
fetched once. This is the burn-after-read signal, kept distinct from 404
specifically so a client can tell "you're too late" from "this token is
simply wrong" — a distinction that only matters to someone who already had
a legitimate copy of the token, so it leaks nothing to an attacker who
doesn't.

## Non-goals of this contract

- No authentication. Possession of the token (for GET) is the only access
  control; possession of the token *and* key is what makes the content
  useful. This mirrors Magic Wormhole's trust model, not a traditional
  auth system.
- No listing, no search, no persistent identity for senders or receivers.
  A relay backend that adds any of this is building a different product;
  Farsight's relay is intentionally as dumb and stateless-per-token as
  possible.
