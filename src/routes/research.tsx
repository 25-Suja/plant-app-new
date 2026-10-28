import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpen, ExternalLink, Globe, Loader2, Recycle, Search, ShieldAlert } from 'lucide-react'

import { PageBanner, SectionCard } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { findGuide, isConfirmedInvasive } from '@/lib/plants'
import { loadResearch, searchPlants, topicOf, type Research, type TaxonHit, type Topic } from '@/lib/research'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/research')({
  validateSearch: (input: Record<string, unknown>): { q?: string } => ({
    q: typeof input.q === 'string' && input.q.trim() ? input.q.trim().slice(0, 120) : undefined,
  }),
  head: () => ({ meta: [{ title: 'Plant Research · GlowBots' }] }),
  component: ResearchPage,
})

const TOPIC_TITLES: Record<Topic, string> = {
  looks: 'How it looks',
  where: 'Where it grows & how it behaves',
  history: 'History, naming & classification',
  uses: 'Uses, safety & control',
  more: 'More from the source',
}
const TOPIC_ORDER: Topic[] = ['looks', 'where', 'history', 'uses', 'more']

const QUICK_PICKS = ['Japanese barberry', 'Garlic mustard', 'Kudzu', 'Sugar maple']

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{1,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="mb-2 text-sm leading-relaxed text-foreground/90">
            {p}
          </p>
        ))}
    </>
  )
}

function ResearchPage() {
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [query, setQuery] = useState(q ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hits, setHits] = useState<TaxonHit[]>([])
  const [data, setData] = useState<Research | null>(null)

  const open = async (taxonId: number) => {
    setLoading(true)
    setError('')
    try {
      setData(await loadResearch(taxonId))
      window.scrollTo?.({ top: 0 })
    } catch (e: any) {
      setError(e?.message || 'Could not load research. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const run = async (name: string) => {
    const term = name.trim()
    if (!term) return setError('Enter a plant name to research.')
    setQuery(term)
    setLoading(true)
    setError('')
    setData(null)
    setHits([])
    try {
      const found = await searchPlants(term)
      if (!found.length) {
        setError(`iNaturalist found no plant called “${term}”. Try the scientific name.`)
        setLoading(false)
        return
      }
      setHits(found)
      await open(found[0].id)
    } catch (e: any) {
      setError(e?.message || 'The search service did not respond. Try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (q) run(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const grouped = useMemo(() => {
    const g: Record<Topic, { heading: string; level: number; text: string }[]> = {
      looks: [], where: [], history: [], uses: [], more: [],
    }
    for (const s of data?.sections ?? []) g[topicOf(s.heading)].push(s)
    return g
  }, [data])

  const invasive = data ? isConfirmedInvasive(data.scientificName) : false
  const guide = data ? findGuide(data.scientificName) : undefined

  return (
    <div className="pb-14">
      <PageBanner
        icon={<BookOpen className="size-10" />}
        title="Plant Research"
        subtitle="Type a plant's name to read its history, appearance and what you need to know — with sources."
      />
      <div className="mx-auto mt-6 grid max-w-content gap-5 px-4">
        <SectionCard icon={Search} title="Research a plant">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              navigate({ search: { q: query.trim() || undefined } })
              if (query.trim() === q) run(query)
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Japanese barberry or Berberis thunbergii"
              aria-label="Plant name"
              className="text-base"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Research
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_PICKS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => navigate({ search: { q: p } })}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-forest hover:bg-moss"
              >
                {p}
              </button>
            ))}
          </div>
          {hits.length > 1 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Other matches:{' '}
              {hits.slice(1).map((h, i) => (
                <button key={h.id} type="button" className="mr-2 underline" onClick={() => open(h.id)}>
                  {h.commonName ? `${h.commonName} (${h.name})` : h.name}
                  {i < hits.length - 2 ? ',' : ''}
                </button>
              ))}
            </p>
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
          {loading && (
            <p className="mt-3 text-sm text-warn">
              <Loader2 className="mr-2 inline size-4 animate-spin" />
              Gathering information…
            </p>
          )}
        </SectionCard>

        {data && (
          <>
            <SectionCard icon={BookOpen} title={data.commonName ? `${data.commonName} · ${data.scientificName}` : data.scientificName}>
              {invasive && (
                <p className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-danger">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  This plant is on the GlowBots confirmed-invasive list.
                  {guide && (
                    <Link to="/disposal" search={{ species: guide.slug }} className="ml-1 font-semibold underline">
                      See how to remove it safely
                    </Link>
                  )}
                </p>
              )}
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="inline font-semibold">Scientific name: </dt><dd className="inline italic">{data.scientificName}</dd></div>
                {data.commonName && <div><dt className="inline font-semibold">Common name: </dt><dd className="inline">{data.commonName}</dd></div>}
                <div><dt className="inline font-semibold">Rank: </dt><dd className="inline capitalize">{data.rank}</dd></div>
                {data.family && <div><dt className="inline font-semibold">Family: </dt><dd className="inline">{data.family}</dd></div>}
                {data.conservation && <div><dt className="inline font-semibold">Conservation status: </dt><dd className="inline capitalize">{data.conservation}</dd></div>}
                {typeof data.observations === 'number' && <div><dt className="inline font-semibold">iNaturalist observations: </dt><dd className="inline">{data.observations.toLocaleString()}</dd></div>}
              </dl>
              {data.lineage.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Classification: {data.lineage.filter((l) => ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'].includes(l.rank)).map((l) => l.name).join(' › ')} › {data.scientificName}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-leaf">
                <Link to="/maps" search={{}} className="inline-flex items-center gap-1.5 underline" onClick={() => sessionStorageSafe(data.scientificName)}>
                  <Globe className="size-4" /> World map
                </Link>
                {guide && (
                  <Link to="/disposal" search={{ species: guide.slug }} className="inline-flex items-center gap-1.5 underline">
                    <Recycle className="size-4" /> Disposal guide
                  </Link>
                )}
              </div>
            </SectionCard>

            {data.photos.length > 0 && (
              <SectionCard title="Photos (iNaturalist community)">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {data.photos.map((p, i) => (
                    <figure key={i} className="overflow-hidden rounded-xl bg-muted">
                      <img src={p.url} alt={`${data.scientificName} photo ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" />
                      <figcaption className="p-1.5 text-[10px] leading-tight text-muted-foreground">{p.credit}</figcaption>
                    </figure>
                  ))}
                </div>
              </SectionCard>
            )}

            {(data.lead || data.fallbackSummary) && (
              <SectionCard title="Overview">
                <Paragraphs text={data.lead || data.fallbackSummary || ''} />
              </SectionCard>
            )}

            {TOPIC_ORDER.map(
              (topic) =>
                grouped[topic].length > 0 && (
                  <SectionCard key={topic} title={TOPIC_TITLES[topic]}>
                    <div className="grid gap-4">
                      {grouped[topic].map((s, i) => (
                        <div key={i}>
                          <h3 className={cn('mb-1 font-semibold text-forest', s.level > 2 && 'text-sm')}>{s.heading}</h3>
                          <Paragraphs text={s.text} />
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ),
            )}

            {!data.lead && !data.sections.length && !data.fallbackSummary && (
              <SectionCard title="Written information">
                <p className="text-sm text-muted-foreground">
                  No Wikipedia article was found for this plant, so no written background is shown rather than inventing
                  one. The facts above come from iNaturalist.
                </p>
              </SectionCard>
            )}

            <SectionCard title="Sources">
              <ul className="grid gap-1.5 text-sm">
                <li>
                  <a className="inline-flex items-center gap-1 underline" href={data.inatUrl} target="_blank" rel="noreferrer">
                    iNaturalist taxon page <ExternalLink className="size-3.5" />
                  </a>{' '}
                  — taxonomy, conservation status, observation count, photos.
                </li>
                {data.wikiUrl && (
                  <li>
                    <a className="inline-flex items-center gap-1 underline" href={data.wikiUrl} target="_blank" rel="noreferrer">
                      Wikipedia: {data.wikiTitle} <ExternalLink className="size-3.5" />
                    </a>{' '}
                    — written text above (CC BY-SA 4.0), shown without changes.
                  </li>
                )}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Information is quoted from these sources and is not written by the app. Always confirm a plant's
                identity and safety (thorns, sap, toxicity) before handling it.
              </p>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}

// Hand the plant name to the map page without adding a search param there.
function sessionStorageSafe(name: string) {
  try {
    window.sessionStorage.setItem('glowbots:map-prefill', name)
  } catch {
    /* ignore */
  }
}
