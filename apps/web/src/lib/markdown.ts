/**
 * Drops a document's leading `# Title`. Each page supplies its own heading, so
 * rendering the file's own would put two h1s on the page.
 */
export function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^\s*#\s+.*(\r?\n)+/, '')
}
