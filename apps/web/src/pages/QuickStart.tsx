import { Link } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { Page, PageHeader, Section, Note } from '../components/Page'

export default function QuickStart() {
  return (
    <Page>
      <PageHeader
        eyebrow="Getting started"
        title="Quick start"
        lead="Two things to set up: a relay of your own, and the MCP server registered with your agent."
      />

      <Note tone="warn" title="There is no public relay">
        <p>
          <code className="text-signal-400">DEFAULT_RELAY_URL</code> is a
          placeholder that does not resolve, so running your own is currently the
          only way to use Farsight. It costs nothing — see below.
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
          code={`cd apps/relay-worker

npx wrangler dev      # local dev, no Cloudflare account needed

npx wrangler login    # deploy: authenticate once
npx wrangler deploy   # -> https://farsight-relay.<subdomain>.workers.dev`}
        />

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

      <Section id="configure" title="2. Point both ends at it">
        <p className="text-ink-300 mb-6 leading-relaxed">
          The CLI reads <code className="text-signal-400">FARSIGHT_RELAY_URL</code>{' '}
          from a shell variable or a <code className="text-signal-400">.env</code>{' '}
          file:
        </p>

        <CodeBlock
          label="on your machine"
          code={`cp .env.example .env    # then edit in your relay URL
farsight send ./screenshot.png`}
        />

        <p className="text-ink-300 mt-6 leading-relaxed">
          Precedence is <code className="text-signal-400">--relay-url</code> &gt; a
          real environment variable &gt; <code className="text-signal-400">.env</code>{' '}
          &gt; the built-in default. A <code className="text-signal-400">.env</code>{' '}
          never overrides a variable you set explicitly, so a forgotten file
          can&rsquo;t silently redirect an upload.
        </p>

        <div className="mt-6">
          <Note tone="warn" title="The MCP server does not read .env">
            <p>
              Its working directory is chosen by the MCP client, not by you, so a{' '}
              <code className="text-signal-400">.env</code> found there could be one
              you never wrote — and it could point the agent at someone
              else&rsquo;s relay. Set the variable in the client&rsquo;s own server
              config, in the environment the <strong className="text-ink-100">agent</strong>{' '}
              runs in. That is a different machine from your laptop whenever the
              agent is in a container or cloud sandbox.
            </p>
          </Note>
        </div>
      </Section>

      <Section id="register" title="3. Register the MCP server">
        <p className="text-ink-300 mb-6 leading-relaxed">
          Once the packages are published to npm:
        </p>
        <CodeBlock
          label="from npm"
          code={`npx farsight-cli send ./screenshot.png

claude mcp add farsight-mcp -- npx -y farsight-mcp`}
        />

        <p className="text-ink-300 mt-8 mb-6 leading-relaxed">
          Until then, run from a source checkout:
        </p>
        <CodeBlock
          label="from source"
          code={`npm install
npm run build

node packages/cli/bin/farsight.js send ./screenshot.png

claude mcp add farsight-mcp -- node ./packages/mcp-server/bin/farsight-mcp.js`}
        />
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
