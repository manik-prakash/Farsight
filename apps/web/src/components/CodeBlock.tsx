import { useCallback, useEffect, useRef, useState } from 'react'

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback((text: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1600)
      },
      () => setCopied(false),
    )
  }, [])

  return [copied, copy]
}

interface CodeBlockProps {
  code: string
  /** Shown in the block's title bar, e.g. a filename or shell name. */
  label?: string
}

export function CodeBlock({ code, label }: CodeBlockProps) {
  const [copied, copy] = useCopy()

  return (
    <figure className="border-ink-700 bg-ink-950 overflow-hidden rounded-lg border">
      <figcaption className="border-ink-700 bg-ink-850 text-ink-400 flex items-center justify-between border-b px-4 py-2 font-mono text-xs">
        <span>{label ?? 'shell'}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="hover:text-signal-400 transition"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[0.82rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

export interface TerminalLine {
  /** A command you type. Rendered after a `$` prompt. */
  command?: string
  /** Output the tool prints back. */
  output?: string
  /** A comment explaining the step, dimmed. */
  comment?: string
}

/**
 * A terminal transcript. Commands, output, and asides are distinguished
 * visually instead of by the `$` and `#` prefixes a plain code block relies
 * on, so it stays readable and the output is obviously not something to type.
 */
export function Terminal({ lines, label = 'terminal' }: { lines: TerminalLine[]; label?: string }) {
  return (
    <div className="border-ink-700 bg-ink-950 overflow-hidden rounded-lg border">
      <div className="border-ink-700 bg-ink-850 flex items-center gap-2 border-b px-4 py-2">
        <span className="bg-ink-600 size-2.5 rounded-full" />
        <span className="bg-ink-600 size-2.5 rounded-full" />
        <span className="bg-ink-600 size-2.5 rounded-full" />
        <span className="text-ink-400 ml-2 font-mono text-xs">{label}</span>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-[0.82rem] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className={i > 0 ? 'mt-1' : undefined}>
            {line.comment !== undefined && (
              <div className="text-ink-400 whitespace-pre">{line.comment}</div>
            )}
            {line.command !== undefined && (
              <div className="whitespace-pre">
                <span className="text-signal-500 select-none">$ </span>
                <span className="text-ink-100">{line.command}</span>
              </div>
            )}
            {line.output !== undefined && (
              <div className="text-signal-400 whitespace-pre">{line.output}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
