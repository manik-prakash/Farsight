import type { ReactNode } from 'react'

/** Standard page frame: consistent width, padding, and vertical rhythm. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">{children}</div>
}

/** Wider frame for pages whose content is diagrams rather than prose. */
export function WidePage({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">{children}</div>
}

interface PageHeaderProps {
  eyebrow?: string
  title: string
  lead?: ReactNode
}

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <header className="mb-12">
      {eyebrow && (
        <p className="text-signal-400 mb-3 font-mono text-xs tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-ink-100 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {lead && <p className="text-ink-300 mt-4 text-lg leading-relaxed">{lead}</p>}
    </header>
  )
}

interface SectionProps {
  id?: string
  title: string
  lead?: ReactNode
  children: ReactNode
}

export function Section({ id, title, lead, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 py-12 sm:py-16">
      <h2 className="text-ink-100 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {lead && <p className="text-ink-300 mt-3 max-w-2xl leading-relaxed">{lead}</p>}
      <div className="mt-8">{children}</div>
    </section>
  )
}

/** A bordered aside for a caveat that shouldn't be skimmed past. */
export function Note({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn'
  title?: string
  children: ReactNode
}) {
  const accent = tone === 'warn' ? 'border-l-warn-400' : 'border-l-signal-600'
  return (
    <aside className={`border-ink-800 bg-ink-850/60 rounded-r-lg border border-l-4 ${accent} px-5 py-4`}>
      {title && <p className="text-ink-100 mb-1.5 font-semibold">{title}</p>}
      <div className="text-ink-300 space-y-3 text-sm leading-relaxed">{children}</div>
    </aside>
  )
}
