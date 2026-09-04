import { Section } from '../Page'

const CASES = [
  {
    title: 'A cloud agent session you only reach through a web UI',
    body: 'The agent is running somewhere you cannot SSH into. Something renders wrong locally. Screenshot it, send it, paste the reference into the chat you already have open.',
  },
  {
    title: 'An agent working through PR comments',
    body: 'The review conversation is asynchronous and text-only. A reference string is text, so it travels the same channel the rest of the review does.',
  },
  {
    title: 'A container or CI sandbox with outbound HTTPS and nothing else',
    body: 'No shared volume to drop a file into, no port to tunnel back through. An HTTPS GET is the one capability such a sandbox reliably has.',
  },
  {
    title: 'Anything the agent cannot reach on its own',
    body: 'A photo of a whiteboard, a design mockup, an error on a second screen, a visual diff. If you can save it as a file, the agent can look at it.',
  },
]

export function UseCases() {
  return (
    <Section
      id="use-cases"
      title="When you'd reach for it"
      lead="One shape of problem: you can see something, the agent can't, and there is no file path you both share."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CASES.map((c) => (
          <div
            key={c.title}
            className="border-ink-800 bg-ink-850/50 hover:border-ink-700 rounded-lg border p-5 transition"
          >
            <h3 className="text-ink-100 font-semibold">{c.title}</h3>
            <p className="text-ink-400 mt-2 text-sm leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="border-ink-800 mt-10 border-t pt-8">
        <h3 className="text-ink-100 font-semibold">What it deliberately isn&rsquo;t</h3>
        <p className="text-ink-400 mt-2 text-sm leading-relaxed">
          Not a general file-transfer tool — for that use{' '}
          <a
            href="https://github.com/magic-wormhole/magic-wormhole"
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal-400 hover:underline"
          >
            Magic Wormhole
          </a>{' '}
          or{' '}
          <a
            href="https://github.com/schollz/croc"
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal-400 hover:underline"
          >
            croc
          </a>
          , which already do it well. And not a terminal-graphics tool: rendering
          a picture inside a terminal emulator for a human to look at is a
          different, purely human-facing problem. Farsight is shaped around
          handing one image to one MCP tool call.
        </p>
      </div>
    </Section>
  )
}
