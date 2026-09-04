import { Section } from '../Page'

const ADJACENT = [
  {
    name: 'ccimg / ccimgd',
    detail: 'a local clipboard daemon reached over an SSH reverse tunnel',
    href: 'https://alexanderzeitler.com/articles/paste-clipboard-images-into-claude-code-over-ssh/',
  },
  {
    name: "Matt Goodrich's Alfred script",
    detail: 'hotkey → screencapture → scp the file to the remote box',
    href: 'https://mattgoodrich.com/posts/pasting-screenshots-into-a-remote-claude-session/',
  },
  {
    name: 'clipssh',
    detail: 'same shape, different shell script',
  },
]

export function Problem() {
  return (
    <Section
      id="problem"
      title="The problem this solves"
      lead="Not “how do I paste a screenshot over SSH” — that one is already solved. The harder case is an agent you have no channel into at all."
    >
      <div className="space-y-6 leading-relaxed">
        <p className="text-ink-300">
          A coding agent running as a background or cloud session — reached only
          through chat, with no SSH access into its sandbox and no filesystem you
          share with it — has no camera into your clipboard or your screen. A few
          existing tools solve an <em>adjacent, easier</em> problem: pasting a
          screenshot into an agent <strong className="text-ink-100">while you
          have a live SSH session open</strong> to the exact machine it runs on.
        </p>

        <ul className="space-y-3">
          {ADJACENT.map((tool) => (
            <li
              key={tool.name}
              className="border-ink-800 bg-ink-850/50 rounded-lg border px-5 py-4"
            >
              {tool.href ? (
                <a
                  href={tool.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-signal-400 font-mono text-sm hover:underline"
                >
                  {tool.name} ↗
                </a>
              ) : (
                <span className="text-ink-100 font-mono text-sm">{tool.name}</span>
              )}
              <p className="text-ink-400 mt-1.5 text-sm">{tool.detail}</p>
            </li>
          ))}
        </ul>

        <p className="text-ink-300">
          All three need a live, interactive channel <em>you</em> control between
          two specific machines. None of them work when the agent is a genuinely
          async, sandboxed cloud session with outbound HTTPS and nothing else.
          Farsight is built for that harder case specifically.
        </p>
      </div>
    </Section>
  )
}
