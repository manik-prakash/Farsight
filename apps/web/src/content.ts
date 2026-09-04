/**
 * The single place this app reaches outside its own directory.
 *
 * The reference docs on this site are the repo's real Markdown, inlined at
 * build time rather than transcribed. Farsight has already shipped a README
 * that described the relay as using an object store two commits after the
 * bucket was deleted; a second hand-maintained copy of the same facts is how
 * that happens. Editing `docs/*.md` updates the site, and there is nothing
 * else to remember.
 */
import relayProtocolMd from '../../../docs/RELAY_PROTOCOL.md?raw'
import threatModelMd from '../../../docs/THREAT_MODEL.md?raw'

import cliPkg from '../../../packages/cli/package.json'
import corePkg from '../../../packages/core/package.json'
import mcpPkg from '../../../packages/mcp-server/package.json'
import relayPkg from '../../relay-worker/package.json'

export { relayProtocolMd, threatModelMd }

export const REPO_URL = 'https://github.com/manik-prakash/farsight'

/** Blob URL for a repo-relative path, for links out of the rendered docs. */
export function repoFileUrl(path: string): string {
  return `${REPO_URL}/blob/main/${path.replace(/^\.?\//, '')}`
}

export interface PackageCard {
  name: string
  version: string
  path: string
  binary?: string
  summary: string
  /** Runtime dependencies, read from the real package.json. */
  dependencies: string[]
  /** npm page, for the workspaces that are actually published. */
  npmUrl?: string
}

/** Runtime dependency names, if the manifest declares any — the relay worker has none. */
function deps(pkg: object): string[] {
  const dependencies = 'dependencies' in pkg ? pkg.dependencies : undefined
  if (typeof dependencies !== 'object' || dependencies === null) return []
  return Object.keys(dependencies).sort()
}

/**
 * npm page for a package, or undefined when the manifest marks it private.
 *
 * Read from `private` rather than a list of published names kept here: the
 * relay worker is private today, and anything that changes status should
 * change this page by itself.
 */
function npmUrl(pkg: object): string | undefined {
  if ('private' in pkg && pkg.private === true) return undefined
  const name = 'name' in pkg && typeof pkg.name === 'string' ? pkg.name : undefined
  return name ? `https://www.npmjs.com/package/${name}` : undefined
}

/**
 * The four workspaces, described with names and versions read from their own
 * package.json files so a version bump can't leave this page behind.
 */
export const packages: PackageCard[] = [
  {
    name: corePkg.name,
    version: corePkg.version,
    path: 'packages/core',
    summary:
      'Encryption, the reference-string format, and the relay HTTP client. Shared by every other package, and browser-safe — this site runs it directly.',
    dependencies: deps(corePkg),
    npmUrl: npmUrl(corePkg),
  },
  {
    name: cliPkg.name,
    version: cliPkg.version,
    path: 'packages/cli',
    binary: 'farsight',
    summary:
      'The command you run on your own machine. `send` encrypts and uploads; `recv` fetches and decrypts.',
    dependencies: deps(cliPkg),
    npmUrl: npmUrl(cliPkg),
  },
  {
    name: mcpPkg.name,
    version: mcpPkg.version,
    path: 'packages/mcp-server',
    binary: 'farsight-mcp',
    summary:
      'The MCP server that runs wherever the agent lives. One tool, `fetch_image`, returning a native image content block.',
    dependencies: deps(mcpPkg),
    npmUrl: npmUrl(mcpPkg),
  },
  {
    name: relayPkg.name,
    version: relayPkg.version,
    path: 'apps/relay-worker',
    summary:
      'The Cloudflare Worker. Stores ciphertext in a per-token Durable Object and deletes it on first read.',
    dependencies: deps(relayPkg),
    npmUrl: npmUrl(relayPkg),
  },
]
