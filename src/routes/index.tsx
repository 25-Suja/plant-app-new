import { Link, createFileRoute } from '@tanstack/react-router'
import { Camera, Globe, Recycle } from 'lucide-react'

import { Logo } from '@/components/app-shell'

export const Route = createFileRoute('/')({
  component: Home,
})

const FEATURES = [
  {
    to: '/scan',
    icon: Camera,
    title: 'Scan a plant',
    body: 'A woodland-ready camera plus two identification engines that check each other.',
  },
  {
    to: '/disposal',
    icon: Recycle,
    title: 'Dispose of it safely',
    body: 'Species-by-species steps so pulled invasives never take root again.',
  },
  {
    to: '/maps',
    icon: Globe,
    title: 'See where it belongs',
    body: 'Map the states and provinces where a plant is native, introduced, or invasive.',
  },
] as const

function Home() {
  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src="/.netlify/images?url=/img/woodland.png&w=1600&fm=webp"
          srcSet="/.netlify/images?url=/img/woodland.png&w=800&fm=webp 800w, /.netlify/images?url=/img/woodland.png&w=1600&fm=webp 1600w"
          sizes="100vw"
          alt="A shaded woodland trail with a red-berried Japanese barberry shrub in the foreground"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-leaf/85 via-forest/85 to-forest" />
        <div className="mx-auto flex min-h-[78vh] max-w-content flex-col items-center justify-center gap-5 px-5 py-16 text-center text-white">
          <div className="rounded-full p-1.5 ring-[5px] ring-white shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
            <Logo size={200} className="ring-0" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">Avonwood GlowBots</h1>
          <p className="max-w-xl text-lg text-moss">
            Identify plants — even in the shade of the woods — check their regional status, and learn how to
            remove invasives for good.
          </p>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-forest shadow-lg transition hover:scale-[1.03]"
          >
            <Camera className="size-5" /> Scan a Plant
          </Link>
        </div>
      </section>

      <section className="mx-auto -mt-14 grid max-w-content gap-4 px-4 pb-14 md:grid-cols-3">
        {FEATURES.map(({ to, icon: Icon, title, body }) => (
          <Link
            key={to}
            to={to}
            className="group relative rounded-[20px] bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition hover:-translate-y-1"
          >
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-secondary text-leaf transition group-hover:bg-leaf group-hover:text-white">
              <Icon className="size-5" />
            </span>
            <h2 className="font-display text-xl font-bold text-forest">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
