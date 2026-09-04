import { Markdown } from '../components/Markdown'
import { PageHeader, Note } from '../components/Page'
import { TrustBoundaryDiagram } from '../components/diagrams/TrustBoundary'
import { threatModelMd, repoFileUrl } from '../content'

export default function Security() {
  return (
    <div className="py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-5">
        <PageHeader
          eyebrow="Reference"
          title="Threat model"
          lead="What the zero-knowledge design protects, and — just as important — what it does not."
        />
      </div>

      {/* Wider than the prose column: the diagram needs the room. */}
      <div className="mx-auto max-w-5xl px-5">
        <TrustBoundaryDiagram />
      </div>

      <div className="mx-auto max-w-3xl px-5">
        <div className="mt-10">
          <Note>
            <p>
              Below is{' '}
              <a
                href={repoFileUrl('docs/THREAT_MODEL.md')}
                target="_blank"
                rel="noreferrer noopener"
                className="text-signal-400 hover:underline"
              >
                docs/THREAT_MODEL.md
              </a>{' '}
              from the repository, verbatim.
            </p>
          </Note>
        </div>

        <div className="mt-12">
          <Markdown>{threatModelMd}</Markdown>
        </div>
      </div>
    </div>
  )
}
