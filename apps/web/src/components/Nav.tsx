import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { REPO_URL } from '../content'

const ROUTES = [
  { to: '/', label: 'Overview', end: true },
  { to: '/quickstart', label: 'Quick start' },
  { to: '/demo', label: 'Demo' },
  { to: '/protocol', label: 'Protocol' },
  { to: '/security', label: 'Security' },
]

function linkClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded px-3 py-1.5 text-sm transition',
    isActive ? 'text-signal-400 bg-ink-800' : 'text-ink-300 hover:text-ink-100 hover:bg-ink-850',
  ].join(' ')
}

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-ink-800 bg-ink-900/85 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <Link to="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Eye />
          <span className="text-ink-100 group-hover:text-signal-400 font-mono text-base font-semibold transition">
            farsight
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {ROUTES.map((r) => (
            <NavLink key={r.to} to={r.to} end={r.end} className={linkClass}>
              {r.label}
            </NavLink>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink-300 hover:text-ink-100 hover:bg-ink-850 ml-2 rounded px-3 py-1.5 text-sm transition"
          >
            GitHub ↗
          </a>
        </nav>

        <button
          type="button"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="text-ink-300 hover:text-ink-100 ml-auto rounded p-2 md:hidden"
        >
          <span className="block h-px w-5 bg-current" />
          <span className="mt-1.5 block h-px w-5 bg-current" />
          <span className="mt-1.5 block h-px w-5 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="border-ink-800 flex flex-col gap-1 border-t px-5 py-3 md:hidden">
          {ROUTES.map((r) => (
            <NavLink
              key={r.to}
              to={r.to}
              end={r.end}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {r.label}
            </NavLink>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ink-300 hover:text-ink-100 rounded px-3 py-1.5 text-sm"
          >
            GitHub ↗
          </a>
        </nav>
      )}
    </header>
  )
}

/** The mark from the favicon: an aperture ring with a solid pupil. */
export function Eye({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  )
}
