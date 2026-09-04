import { Markdown } from '../components/Markdown'
import { Page, PageHeader, Note } from '../components/Page'
import { relayProtocolMd, repoFileUrl } from '../content'

export default function Protocol() {
  return (
    <Page>
      <PageHeader
        eyebrow="Reference"
        title="Relay protocol"
        lead="The wire contract between the CLI, the MCP server, and any relay implementation. Two endpoints, no authentication, no sessions."
      />

      <Note>
        <p>
          This page renders{' '}
          <a
            href={repoFileUrl('docs/RELAY_PROTOCOL.md')}
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal-400 hover:underline"
          >
            docs/RELAY_PROTOCOL.md
          </a>{' '}
          from the repository, verbatim. There is no second copy to fall out of
          date.
        </p>
      </Note>

      <div className="mt-12">
        <Markdown>{relayProtocolMd}</Markdown>
      </div>
    </Page>
  )
}
