import { Link } from 'react-router-dom'
import { Section } from '../Page'
import { DataFlowDiagram } from '../diagrams/DataFlow'

const STEPS = [
  {
    n: '01',
    cmd: 'farsight send <path>',
    body: (
      <>
        Reads the image, generates a fresh random XChaCha20-Poly1305 key,
        encrypts it, and uploads <em>only the ciphertext</em>. It prints one
        reference string — <code className="text-signal-400">fs_&lt;token&gt;.&lt;key&gt;</code>{' '}
        — and the key half never touches the relay.
      </>
    ),
  },
  {
    n: '02',
    cmd: 'the relay',
    body: (
      <>
        A Cloudflare Worker with a Durable Object per token, holding both the
        encrypted bytes and the burn-after-read state. It deletes the blob the
        instant it is fetched once, or when the TTL expires — whichever comes
        first. Uploads are rate-limited per IP so an exposed relay can&rsquo;t
        double as free anonymous blob storage.
      </>
    ),
  },
  {
    n: '03',
    cmd: 'farsight-mcp',
    body: (
      <>
        Runs as an MCP server wherever the agent lives — a laptop, a container,
        a cloud sandbox, anywhere with outbound HTTPS. Its one tool,{' '}
        <code className="text-signal-400">fetch_image</code>, downloads the blob,
        decrypts it locally, and returns a native MCP image content block the
        agent can see in the tool result.
      </>
    ),
  },
]

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      title="How it works"
      lead="Three moving parts, and one deliberate asymmetry: the bytes go over the network, the key goes through you."
    >
      <DataFlowDiagram />

      <ol className="mt-12 space-y-8">
        {STEPS.map((step) => (
          <li key={step.n} className="flex gap-5">
            <span className="text-ink-600 font-mono text-sm tabular-nums">{step.n}</span>
            <div>
              <p className="text-ink-100 font-mono text-sm">{step.cmd}</p>
              <p className="text-ink-300 mt-2 leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-ink-400 mt-10 text-sm">
        No SSH tunnel, no shared disk, no persistent server-held key. The exact
        wire contract is on the <Link to="/protocol" className="text-signal-400 hover:underline">protocol page</Link>;
        what the design does and doesn&rsquo;t protect against is on the{' '}
        <Link to="/security" className="text-signal-400 hover:underline">threat model page</Link>.
      </p>
    </Section>
  )
}
