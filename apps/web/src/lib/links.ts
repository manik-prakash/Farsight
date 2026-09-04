import { repoFileUrl } from '../content'

/**
 * The repo's Markdown links to sibling files by relative path. Rendered on a
 * website those all 404, so each one is remapped: the two docs that have their
 * own route point at the route, and everything else points at the file on
 * GitHub.
 */
const ROUTE_FOR_DOC: Record<string, string> = {
  'docs/RELAY_PROTOCOL.md': '/protocol',
  'docs/THREAT_MODEL.md': '/security',
}

export interface ResolvedLink {
  href: string
  /** True when the link leaves the site and should open in a new tab. */
  external: boolean
  /** True when it should be routed by react-router rather than the browser. */
  internal: boolean
}

export function resolveMarkdownHref(raw: string | undefined): ResolvedLink {
  const href = (raw ?? '').trim()

  // Same-page anchors and already-absolute URLs are left alone.
  if (!href || href.startsWith('#')) {
    return { href: href || '#', external: false, internal: false }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return { href, external: !href.startsWith('mailto:'), internal: false }
  }

  const path = href.replace(/^\.\//, '')
  const [filePath, hash] = path.split('#', 2)

  const route = ROUTE_FOR_DOC[filePath]
  if (route) {
    return { href: hash ? `${route}#${hash}` : route, external: false, internal: true }
  }

  // Any other repo-relative path (LICENSE, packages/**, apps/**) is a real
  // file that only exists on GitHub.
  return { href: repoFileUrl(path), external: true, internal: false }
}
