import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, Note } from '../components/Page'
import {
  formatBytes,
  hexPreview,
  runPipeline,
  type PipelineResult,
} from '../demo/pipeline'

/** Big enough for a real screenshot, small enough not to jank the main thread. */
const MAX_BYTES = 2 * 1024 * 1024

interface Loaded {
  name: string
  type: string
  previewUrl: string
  result: PipelineResult
}

export default function Demo() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError(`That's a ${file.type || 'file of unknown type'}. Pick an image.`)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(
        `${formatBytes(file.size)} is larger than this demo's ${formatBytes(MAX_BYTES)} cap. The real CLI accepts up to 10 MB.`,
      )
      return
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = runPipeline(bytes)

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const previewUrl = URL.createObjectURL(file)
    previewUrlRef.current = previewUrl

    setLoaded({ name: file.name, type: file.type, previewUrl, result })
  }, [])

  return (
    <Page>
      <PageHeader
        eyebrow="Live"
        title="Watch it encrypt"
        lead={
          <>
            This page imports the real{' '}
            <code className="text-signal-400">farsight-core</code> — the same
            module the CLI and the MCP server call. Drop in an image and it runs
            the actual encryption, assembles a real reference string, and
            decrypts it back.
          </>
        }
      />

      <Note title="Nothing leaves your browser">
        <p>
          There is no upload here, and no relay involved: open your
          browser&rsquo;s Network tab and you will see this page make no
          requests. The demo stops exactly where the real tool would hand
          ciphertext to a relay.
        </p>
      </Note>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) void handleFile(file)
        }}
        className={`mt-10 rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragging ? 'border-signal-400 bg-signal-400/5' : 'border-ink-700 bg-ink-850/40'
        }`}
      >
        <p className="text-ink-200">Drop an image here</p>
        <p className="text-ink-400 mt-1 text-sm">
          PNG, JPEG, WebP — up to {formatBytes(MAX_BYTES)}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border-ink-600 text-ink-100 hover:border-signal-600 hover:text-signal-400 mt-5 rounded-md border px-4 py-2 text-sm font-semibold transition"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {error && (
        <p className="border-danger-400/40 bg-danger-400/5 text-danger-400 mt-6 rounded-lg border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loaded && <Result loaded={loaded} />}

      <p className="text-ink-400 mt-14 text-sm leading-relaxed">
        A full round trip through a relay would need CORS on the Worker, which
        would let any website upload blobs from a visitor&rsquo;s browser against
        that relay&rsquo;s rate limit. Not worth it for a demo — to see the whole
        path, <Link to="/quickstart" className="text-signal-400 hover:underline">deploy your own relay</Link>{' '}
        and run the CLI.
      </p>
    </Page>
  )
}

function Result({ loaded }: { loaded: Loaded }) {
  const { result } = loaded
  const clean = result.firstMismatch === -1

  return (
    <div className="mt-10 space-y-6">
      <Stage
        step="01"
        title="On your machine"
        caption="What you started with. It never leaves this tab."
      >
        <div className="flex flex-wrap items-center gap-5">
          <img
            src={loaded.previewUrl}
            alt={loaded.name}
            className="border-ink-700 max-h-28 rounded border object-contain"
          />
          <dl className="space-y-1 font-mono text-xs">
            <Row label="file" value={loaded.name} />
            <Row label="type" value={loaded.type} />
            <Row label="size" value={formatBytes(result.plaintext.byteLength)} />
          </dl>
        </div>
      </Stage>

      <Stage
        step="02"
        title="Encrypted, in your browser"
        caption="A fresh 32-byte key and 24-byte nonce per send, XChaCha20-Poly1305."
      >
        <dl className="space-y-2 font-mono text-xs">
          <Row
            label="ciphertext"
            value={`${formatBytes(result.ciphertext.byteLength)}  (+${result.overheadBytes} B auth tag)`}
          />
          <Row label="first bytes" value={hexPreview(result.ciphertext, 16) + ' …'} />
          <Row label="nonce" value={hexPreview(result.nonce, 24)} tone="dim" />
        </dl>
      </Stage>

      <Stage
        step="03"
        title="The two halves part ways"
        caption="Only the left column would be uploaded. The key goes in the string you paste."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-ink-700 bg-ink-950 rounded-lg border p-4">
            <p className="text-ink-400 font-mono text-[11px] tracking-wider uppercase">
              → to the relay
            </p>
            <p className="text-ink-200 mt-2 font-mono text-xs break-all">
              ciphertext, nonce, MIME type
            </p>
            <p className="text-ink-600 mt-2 text-[11px]">
              enough to store and serve, not enough to read
            </p>
          </div>
          <div className="border-warn-400/40 bg-warn-400/5 rounded-lg border p-4">
            <p className="text-warn-400 font-mono text-[11px] tracking-wider uppercase">
              ✗ never sent
            </p>
            <p className="text-warn-400 mt-2 font-mono text-xs break-all">
              {hexPreview(result.key, 32)}
            </p>
            <p className="text-ink-600 mt-2 text-[11px]">the 32-byte decryption key</p>
          </div>
        </div>
      </Stage>

      <Stage
        step="04"
        title="The reference string"
        caption="One copy-pasteable string. The token half is public; the half after the dot is the key."
      >
        <ReferenceString reference={result.reference} token={result.relayToken} />
      </Stage>

      <Stage
        step="05"
        title="Decrypted again, from the string alone"
        caption="Parsed with decodeReference and decrypted — the same path fetch_image takes inside the agent."
      >
        <div
          className={`rounded-lg border px-4 py-3 font-mono text-sm ${
            clean
              ? 'border-signal-600/50 bg-signal-600/10 text-signal-400'
              : 'border-danger-400/50 bg-danger-400/5 text-danger-400'
          }`}
        >
          {clean
            ? `✓ ${result.decrypted.byteLength} bytes recovered, byte-identical to the original`
            : `✗ first mismatch at byte ${result.firstMismatch}`}
        </div>
      </Stage>
    </div>
  )
}

function ReferenceString({ reference, token }: { reference: string; token: string }) {
  const [copied, setCopied] = useState(false)
  const keyPart = reference.slice(`fs_${token}.`.length)

  return (
    <div className="border-ink-700 bg-ink-950 rounded-lg border p-4">
      <p className="font-mono text-xs leading-relaxed break-all">
        <span className="text-ink-400">fs_</span>
        <span className="text-ink-200">{token}</span>
        <span className="text-ink-400">.</span>
        <span className="text-warn-400">{keyPart}</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(reference).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }}
          className="text-signal-400 font-mono text-xs hover:underline"
        >
          {copied ? 'copied' : 'copy'}
        </button>
        <span className="text-ink-600 text-[11px]">
          <span className="text-ink-200">token</span> the relay sees ·{' '}
          <span className="text-warn-400">key</span> it never does
        </span>
      </div>
      <p className="text-ink-600 mt-3 text-[11px] leading-relaxed">
        This one points at no relay — the token was minted locally, so pasting it
        into an agent will not fetch anything.
      </p>
    </div>
  )
}

function Stage({
  step,
  title,
  caption,
  children,
}: {
  step: string
  title: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <section className="border-ink-800 bg-ink-850/40 rounded-xl border p-5 sm:p-6">
      <div className="flex items-baseline gap-3">
        <span className="text-ink-600 font-mono text-xs tabular-nums">{step}</span>
        <h2 className="text-ink-100 font-semibold">{title}</h2>
      </div>
      <p className="text-ink-400 mt-1 mb-5 text-sm">{caption}</p>
      {children}
    </section>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'dim' }) {
  return (
    <div className="flex gap-3">
      <dt className="text-ink-600 w-24 shrink-0">{label}</dt>
      <dd className={`break-all ${tone === 'dim' ? 'text-ink-400' : 'text-ink-200'}`}>{value}</dd>
    </div>
  )
}
