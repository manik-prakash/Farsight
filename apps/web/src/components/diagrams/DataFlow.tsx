/**
 * The end-to-end path an image takes. The visual argument: ciphertext goes
 * over the network through the relay, while the key rides the human path
 * (a reference string you paste into chat) and never touches the relay at all.
 */
export function DataFlowDiagram() {
  return (
    <figure className="border-ink-800 bg-ink-850/50 rounded-xl border p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 900 400"
          className="h-auto w-full min-w-[700px]"
          role="img"
          aria-label="Farsight data flow: farsight send encrypts on your laptop and uploads only ciphertext to the relay; the reference string containing the key is pasted into chat by you; farsight-mcp downloads the ciphertext and decrypts it where the agent runs."
        >
          <defs>
            <marker
              id="df-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-ink-400" />
            </marker>
            <marker
              id="df-arrow-key"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-warn-400" />
            </marker>
          </defs>

          {/* ---- the three machines ---- */}
          <Box x={20} y={48} title="your laptop" sub="farsight send" note="encrypts, uploads" />
          <Box
            x={345}
            y={48}
            title="the relay"
            sub="Cloudflare Worker"
            note="Durable Object per token"
            accent
          />
          <Box
            x={670}
            y={48}
            title="the agent's sandbox"
            sub="farsight-mcp"
            note="decrypts, returns image"
          />

          {/* ---- network path: ciphertext only ---- */}
          <line
            x1={230}
            y1={100}
            x2={341}
            y2={100}
            className="stroke-ink-400"
            strokeWidth={1.5}
            markerEnd="url(#df-arrow)"
          />
          <text x={285} y={88} textAnchor="middle" className="fill-ink-300 font-mono text-[11px]">
            ciphertext
          </text>
          <text x={285} y={122} textAnchor="middle" className="fill-ink-400 font-mono text-[10px]">
            + nonce, MIME
          </text>

          <line
            x1={555}
            y1={100}
            x2={666}
            y2={100}
            className="stroke-ink-400"
            strokeWidth={1.5}
            markerEnd="url(#df-arrow)"
          />
          <text x={610} y={88} textAnchor="middle" className="fill-ink-300 font-mono text-[11px]">
            HTTPS GET
          </text>
          <text x={610} y={122} textAnchor="middle" className="fill-danger-400 font-mono text-[10px]">
            burns the blob
          </text>

          {/* ---- human path: the reference string, which carries the key ---- */}
          <path
            d="M 125 158 L 125 268"
            className="stroke-warn-400"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            fill="none"
          />
          <path
            d="M 125 268 L 125 300 L 326 300"
            className="stroke-warn-400"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            fill="none"
            markerEnd="url(#df-arrow-key)"
          />
          <text x={138} y={200} className="fill-warn-400 font-mono text-[11px]">
            fs_&lt;token&gt;.&lt;key&gt;
          </text>
          <text x={138} y={218} className="fill-ink-400 font-mono text-[10px]">
            printed to your terminal
          </text>

          <rect
            x={330}
            y={276}
            width={240}
            height={48}
            rx={8}
            className="fill-ink-800 stroke-warn-400/50"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text x={450} y={297} textAnchor="middle" className="fill-ink-100 text-[12px]">
            you paste it into chat
          </text>
          <text x={450} y={313} textAnchor="middle" className="fill-ink-400 font-mono text-[10px]">
            the only path the key travels
          </text>

          <path
            d="M 574 300 L 775 300 L 775 158"
            className="stroke-warn-400"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            fill="none"
            markerEnd="url(#df-arrow-key)"
          />

          {/* ---- the takeaway ---- */}
          <text x={450} y={370} textAnchor="middle" className="fill-ink-300 text-[12px]">
            The relay carries the bytes. You carry the key. They never meet.
          </text>
        </svg>
      </div>
      <figcaption className="text-ink-400 mt-4 text-sm">
        The key exists only inside the reference string. It is generated on your
        machine, printed to your terminal, and read again in the agent&rsquo;s
        sandbox — it is never part of any request to the relay.
      </figcaption>
    </figure>
  )
}

interface BoxProps {
  x: number
  y: number
  title: string
  sub: string
  note: string
  accent?: boolean
}

function Box({ x, y, title, sub, note, accent }: BoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={210}
        height={110}
        rx={10}
        className={accent ? 'fill-ink-800 stroke-signal-600' : 'fill-ink-800 stroke-ink-600'}
        strokeWidth={1.5}
      />
      <text x={x + 105} y={y + 32} textAnchor="middle" className="fill-ink-400 text-[11px]">
        {title}
      </text>
      <text
        x={x + 105}
        y={y + 58}
        textAnchor="middle"
        className={accent ? 'fill-signal-400 font-mono text-[14px]' : 'fill-ink-100 font-mono text-[14px]'}
      >
        {sub}
      </text>
      <text x={x + 105} y={y + 82} textAnchor="middle" className="fill-ink-400 text-[11px]">
        {note}
      </text>
    </g>
  )
}
