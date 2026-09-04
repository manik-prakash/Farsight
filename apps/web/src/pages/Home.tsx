import { Link } from 'react-router-dom'
import { Hero } from '../components/home/Hero'
import { Problem } from '../components/home/Problem'
import { HowItWorks } from '../components/home/HowItWorks'
import { UseCases } from '../components/home/UseCases'
import { TechStack } from '../components/home/TechStack'
import { Verified } from '../components/home/Verified'

export default function Home() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-3xl divide-ink-800 divide-y px-5">
        <Problem />
        <UseCases />
      </div>

      <div className="mx-auto max-w-5xl px-5">
        <HowItWorks />
      </div>

      <div className="mx-auto max-w-3xl divide-ink-800 divide-y px-5">
        <Verified />
        <TechStack />
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-8">
        <div className="border-ink-800 bg-ink-850/50 rounded-xl border p-8 text-center">
          <h2 className="text-ink-100 text-2xl font-semibold tracking-tight">
            There is no public relay
          </h2>
          <p className="text-ink-300 mx-auto mt-3 max-w-xl leading-relaxed">
            Running your own is currently the only way to use Farsight — and it
            fits entirely inside Cloudflare&rsquo;s free plan, with no object
            store and no bucket to create.
          </p>
          <Link
            to="/quickstart"
            className="bg-signal-400 text-ink-950 hover:bg-signal-500 mt-6 inline-block rounded-md px-5 py-2.5 text-sm font-semibold transition"
          >
            Deploy one in four commands
          </Link>
        </div>
      </div>
    </>
  )
}
