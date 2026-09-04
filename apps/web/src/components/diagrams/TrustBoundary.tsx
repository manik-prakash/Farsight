/**
 * What crosses the line to the relay and what does not. Sourced from
 * docs/THREAT_MODEL.md — if that file's claims change, this must change too.
 */
export function TrustBoundaryDiagram() {
  return (
    <figure className="border-ink-800 bg-ink-850/50 rounded-xl border p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 900 380"
          className="h-auto w-full min-w-[700px]"
          role="img"
          aria-label="Trust boundary: your machine holds the plaintext image and the 32-byte key; the ciphertext and nonce cross to the relay; the key is blocked at the boundary and never crosses."
        >
          <defs>
            <marker
              id="tb-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-signal-500" />
            </marker>
          </defs>

          {/* ---- the boundary itself ---- */}
          <line
            x1={450}
            y1={18}
            x2={450}
            y2={352}
            className="stroke-danger-400/60"
            strokeWidth={1.5}
            strokeDasharray="7 6"
          />
          <text x={450} y={12} textAnchor="middle" className="fill-danger-400 font-mono text-[11px]">
            trust boundary
          </text>

          {/* ---- left: machines you control ---- */}
          <text x={30} y={44} className="fill-ink-100 text-[14px] font-semibold">
            Your machine, and the agent&rsquo;s
          </text>
          <text x={30} y={64} className="fill-ink-400 text-[11px]">
            where encryption and decryption happen
          </text>
          <Item x={30} y={92} tone="held" label="the plaintext image" />
          <Item x={30} y={128} tone="held" label="the 32-byte XChaCha20 key" />
          <Item x={30} y={164} tone="held" label="the decrypted result" />

          {/* ---- right: what the relay holds ---- */}
          <text x={490} y={44} className="fill-ink-100 text-[14px] font-semibold">
            The relay
          </text>
          <text x={490} y={64} className="fill-ink-400 text-[11px]">
            a dumb, untrusted bulletin board
          </text>
          <Item x={490} y={92} tone="sees" label="the ciphertext" />
          <Item x={490} y={128} tone="sees" label="the nonce (AEAD framing, not secret)" />
          <Item x={490} y={164} tone="sees" label="byte size and MIME type" />
          <Item x={490} y={200} tone="sees" label="upload / download timestamps" />

          {/* ---- what crosses ---- */}
          <line
            x1={300}
            y1={266}
            x2={600}
            y2={266}
            className="stroke-signal-500"
            strokeWidth={1.5}
            markerEnd="url(#tb-arrow)"
          />
          <text x={450} y={256} textAnchor="middle" className="fill-signal-400 font-mono text-[11px]">
            ciphertext + nonce
          </text>

          {/* ---- what is stopped ---- */}
          <line
            x1={300}
            y1={318}
            x2={432}
            y2={318}
            className="stroke-warn-400"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <g className="stroke-danger-400" strokeWidth={2.5} strokeLinecap="round">
            <line x1={442} y1={310} x2={458} y2={326} />
            <line x1={458} y1={310} x2={442} y2={326} />
          </g>
          <text x={296} y={322} textAnchor="end" className="fill-warn-400 font-mono text-[11px]">
            the key
          </text>
          <text x={476} y={322} className="fill-ink-400 text-[11px]">
            never sent, so a hostile relay can neither read the image
          </text>
          <text x={476} y={338} className="fill-ink-400 text-[11px]">
            nor forge one: wrong bytes fail the Poly1305 tag.
          </text>
        </svg>
      </div>
      <figcaption className="text-ink-400 mt-4 text-sm">
        Substitution matters as much as secrecy here. A fetched image lands in
        an agent&rsquo;s context, so a relay that could swap in a different one
        would be a prompt-injection channel. It cannot: altered ciphertext
        fails authentication and <code className="text-signal-400">fetch_image</code>{' '}
        returns an error instead of an image.
      </figcaption>
    </figure>
  )
}

function Item({ x, y, label, tone }: { x: number; y: number; label: string; tone: 'held' | 'sees' }) {
  const held = tone === 'held'
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={380}
        height={28}
        rx={6}
        className={held ? 'fill-ink-800 stroke-ink-700' : 'fill-ink-850 stroke-ink-700'}
        strokeWidth={1}
      />
      <text
        x={x + 12}
        y={y + 19}
        className={held ? 'fill-warn-400 font-mono text-[12px]' : 'fill-ink-400 font-mono text-[12px]'}
      >
        {held ? '●' : '○'}
      </text>
      <text x={x + 30} y={y + 19} className="fill-ink-200 text-[12px]">
        {label}
      </text>
    </g>
  )
}
