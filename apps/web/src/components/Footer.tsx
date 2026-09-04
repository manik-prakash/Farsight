import { Link } from 'react-router-dom'
import { REPO_URL, repoFileUrl } from '../content'

export function Footer() {
  return (
    <footer className="border-ink-800 text-ink-400 mt-24 border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          Farsight — MIT licensed. Built by{' '}
          <a
            href="https://github.com/manik-prakash"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-signal-400 transition"
          >
            Manik Prakash
          </a>
          .
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/protocol" className="hover:text-signal-400 transition">
            Relay protocol
          </Link>
          <Link to="/security" className="hover:text-signal-400 transition">
            Threat model
          </Link>
          <a
            href={repoFileUrl('LICENSE')}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-signal-400 transition"
          >
            License
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-signal-400 transition"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </footer>
  )
}
