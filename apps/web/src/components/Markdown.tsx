import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { resolveMarkdownHref } from '../lib/links'
import { nodeText, slugify } from '../lib/slug'
import { stripLeadingHeading } from '../lib/markdown'

function heading(Tag: 'h1' | 'h2' | 'h3' | 'h4') {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const id = slugify(nodeText(children))
    return (
      <Tag id={id} className="group scroll-mt-24">
        {children}
        <a
          href={`#${id}`}
          aria-label="Link to this section"
          className="text-ink-600 hover:text-signal-400 ml-2 opacity-0 no-underline transition group-hover:opacity-100"
        >
          #
        </a>
      </Tag>
    )
  }
}

const components: Components = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),

  a({ href, children }) {
    const link = resolveMarkdownHref(href)
    if (link.internal) return <Link to={link.href}>{children}</Link>
    return (
      <a
        href={link.href}
        {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {children}
      </a>
    )
  },

  // The README's ASCII diagrams only line up in monospace at a fixed size, so
  // wide blocks scroll horizontally rather than wrapping.
  pre({ children }) {
    return <pre className="overflow-x-auto">{children}</pre>
  },

  table({ children }) {
    return (
      <div className="overflow-x-auto">
        <table>{children}</table>
      </div>
    )
  },
}

interface MarkdownProps {
  children: string
  /** Drop the document's own top-level heading. Default true. */
  stripTitle?: boolean
}

/** Renders repo Markdown with the site's palette and working links. */
export function Markdown({ children, stripTitle = true }: MarkdownProps) {
  const source = stripTitle ? stripLeadingHeading(children) : children
  return (
    <div className="prose-farsight">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
