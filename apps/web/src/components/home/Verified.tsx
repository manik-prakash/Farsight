import { Section, Note } from '../Page'
import { Terminal } from '../CodeBlock'

export function Verified() {
  return (
    <Section
      id="verified"
      title="What has actually been tested"
      lead="Stated precisely, including the part that is still unverified — a claim about an agent seeing an image is easy to make and easy to get wrong."
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-ink-100 font-semibold">Protocol correctness</h3>
          <p className="text-ink-300 mt-2 leading-relaxed">
            Verified against{' '}
            <a
              href="https://github.com/modelcontextprotocol/inspector"
              target="_blank"
              rel="noreferrer noopener"
              className="text-signal-400 hover:underline"
            >
              MCP Inspector
            </a>{' '}
            and by driving the stdio server directly. A real{' '}
            <code className="text-signal-400">tools/call</code> round trip through
            the deployed Cloudflare relay returns a byte-identical, spec-valid
            image content block. Exercised end to end against live
            infrastructure: real encryption, a real Durable Object enforcing
            atomic burn-after-read, chunked storage proven with a 2.5 MB blob
            spanning three chunks, and TTL expiry.
          </p>
        </div>

        <div>
          <h3 className="text-ink-100 font-semibold">Vision input</h3>
          <p className="text-ink-300 mt-2 leading-relaxed">
            Confirmed on{' '}
            <strong className="text-ink-100">Claude Code 2.1.259 (Windows)</strong>,
            2026-09-03. A fresh session given only a reference string fetched the
            image and reported the exact random UUID rendered in it — content it
            had no way to infer, so a plausible-sounding hallucination could not
            have matched.
          </p>
        </div>

        <Note tone="warn" title="Other MCP clients remain unverified">
          <p>
            The MCP spec is unambiguous that tool results can carry native image
            content, but real client behaviour has been inconsistent — there are
            tracked cases (
            <a
              href="https://github.com/anthropics/claude-code/issues/31208"
              target="_blank"
              rel="noreferrer noopener"
              className="text-signal-400 hover:underline"
            >
              #31208
            </a>
            ,{' '}
            <a
              href="https://github.com/anthropics/claude-code/issues/53256"
              target="_blank"
              rel="noreferrer noopener"
              className="text-signal-400 hover:underline"
            >
              #53256
            </a>
            ) where a client serialised the base64 payload as inert text instead.
          </p>
          <p>
            That is why <code className="text-signal-400">fetch_image</code> always
            returns a text confirmation alongside the image block: the call
            reports what happened even on a client where the image itself
            doesn&rsquo;t render. If you hit this, it is a client-side gap, not a
            failed fetch.
          </p>
        </Note>

        <div>
          <h3 className="text-ink-100 mb-4 font-semibold">
            Burn-after-read, as the agent sees it
          </h3>
          <Terminal
            label="tools/call — the same reference, twice"
            lines={[
              { comment: '# first call' },
              {
                output:
                  '{ "content": [\n    { "type": "image", "data": "iVBORw0KGgoAAA…", "mimeType": "image/png" },\n    { "type": "text",  "text": "Fetched and decrypted a 70-byte image/png image…" }\n  ] }',
              },
              { comment: '' },
              { comment: '# second call — the relay already deleted it' },
              {
                output:
                  '{ "content": [\n    { "type": "text", "text": "this image was already fetched once and Farsight\\n     deleted it (burn-after-read) — ask for a fresh reference" }\n  ],\n  "isError": true }',
              },
            ]}
          />
        </div>
      </div>
    </Section>
  )
}
