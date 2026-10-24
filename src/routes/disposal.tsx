import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Ban,
  Camera,
  Clock,
  Footprints,
  Hammer,
  Hand,
  Recycle,
  Scale,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sprout,
  Sun,
  TriangleAlert,
  Wind,
} from 'lucide-react'

import { PageBanner, SectionCard } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { DISPOSAL_GUIDES, GENERAL_METHODS, type DisposalGuide, type DisposalMethod } from '@/lib/plants'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/disposal')({
  validateSearch: (input: Record<string, unknown>): { species?: string } => ({
    species:
      typeof input.species === 'string' && DISPOSAL_GUIDES.some((g) => g.slug === input.species)
        ? input.species
        : undefined,
  }),
  head: () => ({ meta: [{ title: 'Disposal Methods · GlowBots' }] }),
  component: DisposalPage,
})

const METHOD_ICON: Record<DisposalMethod['icon'], React.ComponentType<{ className?: string }>> = {
  bag: ShoppingBag,
  sun: Sun,
  dry: Wind,
  nocompost: Ban,
  boots: Footprints,
  law: Scale,
}

const FORMS = ['All', 'Shrub', 'Vine', 'Tree', 'Herb'] as const

const HAZARD_LABEL: Record<DisposalGuide['hazard'], string | null> = {
  thorns: 'Thorns',
  sap: 'Irritating sap',
  severe: 'Dangerous — do not touch',
  ticks: 'Tick habitat',
  none: null,
}

function DisposalPage() {
  const { species } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<(typeof FORMS)[number]>('All')
  const detailRef = useRef<HTMLDivElement>(null)

  const selected = DISPOSAL_GUIDES.find((g) => g.slug === (species ?? 'japanese-barberry'))!
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DISPOSAL_GUIDES.filter(
      (g) =>
        (form === 'All' || g.growthForm === form) &&
        (!q || g.commonName.toLowerCase().includes(q) || g.scientificName.toLowerCase().includes(q)),
    )
  }, [query, form])

  useEffect(() => {
    if (species) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [species])

  return (
    <div className="pb-14">
      <PageBanner
        icon={<Recycle className="size-10" />}
        title="Disposal Methods"
        subtitle="Removing an invasive plant is only half the job — dispose of it so it can't come back."
      />

      <div className="mx-auto mt-8 max-w-content px-4">
        <h2 className="mb-4 font-display text-2xl font-bold text-forest">The golden rules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GENERAL_METHODS.map((m) => {
            const Icon = METHOD_ICON[m.icon]
            return (
              <article
                key={m.title}
                className={cn(
                  'rounded-[18px] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.07)]',
                  m.icon === 'nocompost' && 'ring-2 ring-danger/30',
                )}
              >
                <span
                  className={cn(
                    'mb-3 grid size-10 place-items-center rounded-xl',
                    m.icon === 'nocompost' ? 'bg-red-50 text-danger' : 'bg-secondary text-leaf',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-forest">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-6 grid gap-4 rounded-[20px] bg-forest p-6 text-white md:grid-cols-[auto_1fr] md:items-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
            <Hammer className="size-7 text-[#b9e2a6]" />
          </span>
          <div>
            <h3 className="font-display text-xl font-bold">Pull, don't just cut</h3>
            <p className="mt-1 text-sm text-moss">
              Most invasive shrubs resprout from a cut stump. Levering out the whole root crown — with a weed
              wrench or a tool like the shrub remover our team engineered — is usually the most lasting fix
              without chemicals. Work when the soil is moist, and always wear gloves.
            </p>
          </div>
        </div>

        <h2 className="mb-4 mt-10 font-display text-2xl font-bold text-forest">Species guides</h2>
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="grid content-start gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search invasive plants"
                className="bg-white pl-9"
                aria-label="Search invasive plants"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FORMS.map((f) => (
                <button
                  key={f}
                  onClick={() => setForm(f)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    form === f ? 'border-leaf bg-leaf text-white' : 'bg-white hover:bg-muted',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <ul className="grid gap-1.5 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
              {list.map((g) => (
                <li key={g.slug}>
                  <button
                    onClick={() => navigate({ search: { species: g.slug }, replace: true, resetScroll: false })}
                    className={cn(
                      'w-full rounded-xl border bg-white px-3.5 py-2.5 text-left transition',
                      selected.slug === g.slug ? 'border-leaf ring-2 ring-leaf/20' : 'hover:border-input',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium text-forest">{g.commonName}</span>
                      {g.hazard === 'severe' && <ShieldAlert className="size-4 text-danger" />}
                    </span>
                    <span className="text-xs italic text-muted-foreground">{g.scientificName}</span>
                  </button>
                </li>
              ))}
              {!list.length && <li className="px-2 text-sm text-muted-foreground">No guides match.</li>}
            </ul>
          </aside>

          <div ref={detailRef} className="scroll-mt-20">
            <GuideDetail guide={selected} />
          </div>
        </div>
      </div>
    </div>
  )
}

function GuideDetail({ guide }: { guide: DisposalGuide }) {
  const hazard = HAZARD_LABEL[guide.hazard]
  return (
    <article key={guide.slug} className="grid gap-5 animate-in fade-in duration-300">
      <header className="rounded-[20px] bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-leaf">{guide.growthForm.toUpperCase()}</p>
            <h3 className="font-display text-3xl font-bold text-forest">{guide.commonName}</h3>
            <p className="italic text-muted-foreground">{guide.scientificName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-forest">
              Difficulty: {['Easy', 'Moderate', 'Hard'][guide.difficulty - 1]}
            </span>
            {hazard && (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  guide.hazard === 'severe' ? 'bg-danger text-white' : 'bg-amber-100 text-amber-900',
                )}
              >
                {hazard}
              </span>
            )}
          </div>
        </div>
        <p className="mt-4 flex gap-2 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-leaf" />
          <span>
            <strong>Best time:</strong> {guide.bestTime}
          </span>
        </p>
        <p className="mt-2 flex gap-2 text-sm">
          <Sprout className="mt-0.5 size-4 shrink-0 text-leaf" />
          <span>
            <strong>Confirm the ID:</strong> {guide.identifyTip}
          </span>
        </p>
      </header>

      {guide.warning && (
        <div className="flex gap-3 rounded-[18px] border-2 border-danger/40 bg-red-50 p-4 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
          <p>{guide.warning}</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard icon={Hand} title="1 · Remove it">
          <ol className="grid gap-2.5 text-sm">
            {guide.remove.map((s, i) => (
              <li key={s} className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-forest">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </SectionCard>
        <SectionCard icon={Recycle} title="2 · Dispose of it" tone={guide.hazard === 'severe' ? 'danger' : 'leaf'}>
          <ul className="grid gap-2.5 text-sm">
            {guide.dispose.map((s) => (
              <li key={s} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-leaf" />
                {s}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard icon={Sprout} title="3 · Follow up">
        <p className="text-sm">{guide.followUp}</p>
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-secondary p-4 text-sm">
        <span className="text-forest">Not sure it's {guide.commonName}? Check before you pull.</span>
        <Link
          to="/scan"
          className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-4 py-2 font-medium text-white hover:bg-forest"
        >
          <Camera className="size-4" /> Scan a plant
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Guidance is general. Check your state's invasive plant council or extension office for local rules, and
        only use herbicides exactly as the label directs.
      </p>
    </article>
  )
}
