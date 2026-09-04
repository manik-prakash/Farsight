import { Link } from 'react-router-dom'
import { Terminal } from '../CodeBlock'
import { REPO_URL } from '../../content'

export function Hero() {
  return (
    <section className="border-ink-800 border-b">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
        <p className="text-signal-400 mb-5 font-mono text-xs tracking-[0.18em] uppercase">
          CLI + MCP server
        </p>

        <h1 className="text-ink-100 max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Let a sandboxed AI agent <span className="text-signal-400">see</span> an image.
        </h1>

        <p className="text-ink-300 mt-6 max-w-2xl text-lg leading-relaxed">
          Desktop chat apps let you drag a screenshot into the conversation. A
          coding agent running in a cloud sandbox — one you reach only through a
          web UI or PR comments — has no equivalent. Farsight gives it one, with
          no SSH tunnel, no shared filesystem, and no server that ever sees the
          plaintext.
        </p>

        <div className="mt-10 max-w-2xl">
          <Terminal
            lines={[
              { command: 'npx farsight-cli send screenshot.png' },
              {
                output:
                  'fs_9eBm-z2xJ4OdESwbgE80Xg.GvchtwqKl7W2qnlUDGGZRIKzdL8f-g4yf9ZLLZ0eyJI',
              },
              { comment: '# paste that into a chat with any MCP-connected agent' },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/quickstart"
            className="bg-signal-400 text-ink-950 hover:bg-signal-500 rounded-md px-5 py-2.5 text-sm font-semibold transition"
          >
            Quick start
          </Link>
          <Link
            to="/demo"
            className="border-ink-600 text-ink-100 hover:border-signal-600 hover:text-signal-400 rounded-md border px-5 py-2.5 text-sm font-semibold transition"
          >
            Watch it encrypt, live
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink-300 hover:text-ink-100 px-2 py-2.5 text-sm transition"
          >
            GitHub ↗
          </a>
        </div>

        <dl className="border-ink-800 mt-14 grid grid-cols-2 gap-x-6 gap-y-6 border-t pt-8 sm:grid-cols-4">
          {[
            ['XChaCha20-Poly1305', 'authenticated encryption'],
            ['Burn after read', 'deleted on first fetch'],
            ['10 minutes', 'default TTL'],
            ['Free tier', 'no paid service needed'],
          ].map(([term, detail]) => (
            <div key={term}>
              <dt className="text-ink-100 font-mono text-sm">{term}</dt>
              <dd className="text-ink-400 mt-1 text-xs">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
