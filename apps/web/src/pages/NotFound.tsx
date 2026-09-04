import { Link } from 'react-router-dom'
import { Page, PageHeader } from '../components/Page'

export default function NotFound() {
  return (
    <Page>
      <PageHeader
        eyebrow="404"
        title="No blob found for this reference"
        lead="That page isn't here — though if this were a real Farsight reference, the honest answer would be that it already burned."
      />
      <Link
        to="/"
        className="text-signal-400 font-mono text-sm transition hover:underline"
      >
        &larr; back to the overview
      </Link>
    </Page>
  )
}
