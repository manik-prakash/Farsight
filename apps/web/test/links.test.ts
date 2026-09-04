import { describe, it, expect } from 'vitest'
import { resolveMarkdownHref } from '../src/lib/links'
import { slugify } from '../src/lib/slug'
import { stripLeadingHeading } from '../src/lib/markdown'
import { REPO_URL, relayProtocolMd, threatModelMd } from '../src/content'

describe('resolveMarkdownHref', () => {
  it('routes the two docs that have their own page', () => {
    expect(resolveMarkdownHref('docs/RELAY_PROTOCOL.md')).toEqual({
      href: '/protocol',
      external: false,
      internal: true,
    })
    expect(resolveMarkdownHref('./docs/THREAT_MODEL.md')).toEqual({
      href: '/security',
      external: false,
      internal: true,
    })
  })

  it('keeps a fragment when routing a doc link', () => {
    expect(resolveMarkdownHref('docs/THREAT_MODEL.md#what-the-relay-can-and-cannot-see').href).toBe(
      '/security#what-the-relay-can-and-cannot-see',
    )
  })

  it('sends every other repo-relative path to GitHub', () => {
    expect(resolveMarkdownHref('LICENSE').href).toBe(`${REPO_URL}/blob/main/LICENSE`)
    expect(resolveMarkdownHref('packages/core/src/config.ts').href).toBe(
      `${REPO_URL}/blob/main/packages/core/src/config.ts`,
    )
    expect(resolveMarkdownHref('apps/relay-worker/wrangler.toml').external).toBe(true)
  })

  it('passes absolute URLs through, marked external', () => {
    const link = resolveMarkdownHref('https://github.com/schollz/croc')
    expect(link.href).toBe('https://github.com/schollz/croc')
    expect(link.external).toBe(true)
    expect(link.internal).toBe(false)
  })

  it('leaves same-page anchors alone', () => {
    expect(resolveMarkdownHref('#non-goals')).toEqual({
      href: '#non-goals',
      external: false,
      internal: false,
    })
  })

  it('does not open mailto: links in a new tab', () => {
    expect(resolveMarkdownHref('mailto:someone@example.com').external).toBe(false)
  })

  it('tolerates a missing href', () => {
    expect(resolveMarkdownHref(undefined).href).toBe('#')
  })
})

describe('slugify', () => {
  it('makes GitHub-style anchors', () => {
    expect(slugify('What the relay can and cannot see')).toBe('what-the-relay-can-and-cannot-see')
    expect(slugify('POST /v1/blob')).toBe('post-v1blob')
  })
})

describe('bundled docs', () => {
  // The ?raw imports are the site's whole content pipeline. If a doc is moved
  // or renamed, this fails at test time rather than shipping an empty page.
  it('inlines the real Markdown files', () => {
    expect(relayProtocolMd).toContain('POST /v1/blob')
    expect(threatModelMd).toContain('What the relay can and cannot see')
  })
})

describe('stripLeadingHeading', () => {
  it('removes the document title so the page supplies the only h1', () => {
    expect(stripLeadingHeading('# Threat model\n\nThe relay stores…')).toBe('The relay stores…')
    expect(stripLeadingHeading('# Farsight relay protocol (v1)\r\n\r\nBody')).toBe('Body')
  })

  it('leaves a document that starts with body text alone', () => {
    expect(stripLeadingHeading('Body first\n\n# Later heading\n')).toBe(
      'Body first\n\n# Later heading\n',
    )
  })

  it('does not eat an h2', () => {
    expect(stripLeadingHeading('## Section\n\nBody')).toBe('## Section\n\nBody')
  })
})
