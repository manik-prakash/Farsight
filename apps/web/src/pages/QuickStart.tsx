import { Link } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { Page, PageHeader, Section, Note } from '../components/Page'
import { REPO_URL } from '../content'

export default function QuickStart() {
  return (
    <Page>
      <PageHeader
        eyebrow="Getting started"
        title="Quick start"
        lead="The CLI and the MCP server come from npm. The one thing you have to set up yourself is a relay — and that is step 1 for a reason."
      />

      <Note tone="warn" title="There is no public relay">
        <p>
          Farsight&rsquo;s built-in default is a placeholder that does not
          resolve, so running your own relay is currently the only way to use
          it. It costs nothing and takes about a minute — see below.
        </p>
      </Note>

      <Section id="relay" title="1. Deploy a relay">
        <p className="text-ink-300 mb-6 leading-relaxed">
          The relay is a Cloudflare Worker. There is no object store and no
          bucket to create: ciphertext lives in the same per-token Durable Object
          that enforces burn-after-read, stored as 1 MiB chunks under Durable
          Object storage&rsquo;s 2 MB-per-value limit.
        </p>

        <CodeBlock
          label="deploy the relay"
          code={`git clone ${REPO_URL}.git
cd farsight/apps/relay-worker

npx wrangler dev      # optional: run it locally first, no account needed

npx wrangler login    # authenticate once
npx wrangler deploy   # -> https://farsight-relay.<your-subdomain>.workers.dev`}
        />

        <p className="text-ink-400 mt-4 text-sm leading-relaxed">
          This is the only step that needs the repository. Everything after it
          comes from npm, so once the relay is deployed you can delete the
          checkout — keep the URL <code className="text-signal-400">wrangler</code>{' '}
          prints, you will need it twice below.
        </p>

        <div className="mt-6">
          <Note title="It fits the free plan">
            <p>
              R2 would have required linking a payment method even to stay inside
              its free tier; keeping the bytes in the Durable Object avoids that
              entirely. The free plan&rsquo;s ceilings are the practical limits —
              5 GB of total Durable Object storage, 100k requests/day, and 100k
              row writes/day. A single image is capped at{' '}
              <strong className="text-ink-100">10 MB</strong> accordingly.
            </p>
          </Note>
        </div>
      </Section>

      <Section id="configure" title="2. Send an image">
        <p className="text-ink-300 mb-6 leading-relaxed">
          Nothing to install — point{' '}
          <code className="text-signal-400">farsight-cli</code> at the relay you
          just deployed and it prints a one-time reference string:
        </p>

        <CodeBlock
          label="on your machine"
          code={`FARSIGHT_RELAY_URL=https://farsight-relay.<your-subdomain>.workers.dev \\
  npx farsight-cli send ./screenshot.png

# fs_9eBm-z2xJ4OdESwbgE80Xg.GvchtwqKl7W2qnlUDGGZRIKzdL8f-g4yf9ZLLZ0eyJI`}
        />

        <p className="text-ink-300 mt-8 mb-6 leading-relaxed">
          If you will use it more than once, install it and keep the relay URL in
          a <code className="text-signal-400">.env</code> file in whatever
          directory you run from:
        </p>

        <CodeBlock
          label="for repeated use"
          code={`npm install -g farsight-cli

echo 'FARSIGHT_RELAY_URL=https://farsight-relay.<your-subdomain>.workers.dev' > .env
farsight send ./screenshot.png`}
        />

        <p className="text-ink-300 mt-6 leading-relaxed">
          Precedence is <code className="text-signal-400">--relay-url</code> &gt; a
          real environment variable &gt; <code className="text-signal-400">.env</code>{' '}
          &gt; the built-in default. A <code className="text-signal-400">.env</code>{' '}
          never overrides a variable you set explicitly, so a forgotten file
          can&rsquo;t silently redirect an upload.
        </p>
      </Section>

      <Section id="register" title="3. Register the MCP server">
        <p className="text-ink-300 mb-6 leading-relaxed">
          This is the half that runs where the <strong className="text-ink-100">agent</strong>{' '}
          lives — which is a different machine from your laptop whenever the
          agent is in a container or a cloud sandbox.
        </p>

        <CodeBlock
          label="register with Claude Code"
          code={`claude mcp add farsight-mcp \\
  --env FARSIGHT_RELAY_URL=https://farsight-relay.<your-subdomain>.workers.dev \\
  -- npx -y farsight-mcp`}
        />

        <div className="mt-6">
          <Note tone="warn" title="The --env flag is not optional">
            <p>
              <code className="text-signal-400">farsight-mcp</code> deliberately
              ignores <code className="text-signal-400">.env</code> files, so
              unlike the CLI it will not pick the relay URL up from the
              filesystem. Its working directory is chosen by the MCP client
              rather than by you, so a{' '}
              <code className="text-signal-400">.env</code> found there could be
              one you never wrote — and it could point the agent at someone
              else&rsquo;s relay. The client&rsquo;s own server config is both
              the safe route and the only one that reliably works.
            </p>
          </Note>
        </div>

        <p className="text-ink-300 mt-8 mb-6 leading-relaxed">
          For any client that takes a JSON config instead:
        </p>

        <CodeBlock
          label="mcp config"
          code={`{
  "mcpServers": {
    "farsight-mcp": {
      "command": "npx",
      "args": ["-y", "farsight-mcp"],
      "env": { "FARSIGHT_RELAY_URL": "https://farsight-relay.<your-subdomain>.workers.dev" }
    }
  }
}`}
        />

        <p className="text-ink-400 mt-8 text-sm leading-relaxed">
          Working on Farsight itself rather than using it? Point the client at a
          checkout instead:{' '}
          <code className="text-signal-400">
            claude mcp add farsight-mcp -- node ./packages/mcp-server/bin/farsight-mcp.js
          </code>{' '}
          after <code className="text-signal-400">npm install &amp;&amp; npm run build</code>.
        </p>
      </Section>

      <Section id="use" title="4. Paste the reference into a chat">
        <p className="text-ink-300 leading-relaxed">
          Give the agent the printed{' '}
          <code className="text-signal-400">fs_&lt;token&gt;.&lt;key&gt;</code> string
          and ask it to fetch and describe the image. It works once: the relay
          deletes the blob the moment it is read.
        </p>
        <p className="text-ink-400 mt-6 text-sm">
          Curious what the encryption step actually does?{' '}
          <Link to="/demo" className="text-signal-400 hover:underline">
            Run it in your browser
          </Link>{' '}
          — the demo uses the same code the CLI does.
        </p>
      </Section>
    </Page>
  )
}
