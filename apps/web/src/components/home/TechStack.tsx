import { Section } from '../Page'
import { packages, repoFileUrl } from '../../content'

const FOUNDATIONS = [
  ['TypeScript, strict', 'every workspace, no implicit any'],
  ['@noble/ciphers', 'XChaCha20-Poly1305 — core’s only runtime dependency'],
  ['Model Context Protocol', 'stdio transport, native image content blocks'],
  ['Cloudflare Workers', 'the relay, on the free plan'],
  ['Durable Objects (SQLite)', 'per-token storage and burn-after-read'],
  ['Vitest + workerd', 'relay tests run on the real runtime, not a mock'],
]

export function TechStack() {
  return (
    <Section
      id="stack"
      title="What it's built from"
      lead="Four workspaces in one repo. The names and versions below are read from the packages' own manifests at build time."
    >
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.name}
            className="border-ink-800 bg-ink-850/50 rounded-lg border p-5"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a
                href={repoFileUrl(pkg.path)}
                target="_blank"
                rel="noreferrer noopener"
                className="text-signal-400 font-mono text-sm hover:underline"
              >
                {pkg.name}
              </a>
              <span className="text-ink-600 font-mono text-xs">v{pkg.version}</span>
              {pkg.binary && (
                <span className="border-ink-700 text-ink-300 rounded border px-1.5 py-0.5 font-mono text-[11px]">
                  ${pkg.binary}
                </span>
              )}
            </div>
            <p className="text-ink-400 mt-2 text-sm leading-relaxed">{pkg.summary}</p>
            {pkg.dependencies.length > 0 && (
              <p className="text-ink-600 mt-3 font-mono text-[11px]">
                depends on: {pkg.dependencies.join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

      <dl className="border-ink-800 mt-10 grid gap-x-8 gap-y-5 border-t pt-8 sm:grid-cols-2">
        {FOUNDATIONS.map(([term, detail]) => (
          <div key={term}>
            <dt className="text-ink-100 font-mono text-sm">{term}</dt>
            <dd className="text-ink-400 mt-1 text-sm">{detail}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
