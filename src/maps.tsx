import 'mapbox-gl/dist/mapbox-gl.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpen, Globe, Loader2, Palette, Search } from 'lucide-react'

import { PageBanner, SectionCard } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildWorldMap, type MapStatus, type WorldMapResult } from '@/lib/inat'
import { getMapboxToken } from '@/lib/mapbox.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/maps')({
  head: () => ({ meta: [{ title: 'World Distribution Map · GlowBots' }] }),
  component: MapsPage,
})

const STATUS_COLORS: Record<MapStatus, string> = {
  native: '#16803c',
  introduced: '#f2a100',
  invasive: '#e6003d',
  unknown: '#8a8a8a',
}

const LEGEND: { status: MapStatus; name: string; description: string }[] = [
  { status: 'native', name: 'Green · Native', description: 'iNaturalist lists it as native or endemic here.' },
  { status: 'introduced', name: 'Orange · Introduced', description: 'Introduced or naturalized here.' },
  { status: 'invasive', name: 'Red · Invasive', description: 'Recorded as invasive here, or introduced and on the GlowBots confirmed-invasive list.' },
  { status: 'unknown', name: 'Gray · Other record', description: 'A record exists (for example cultivated or vagrant) but it is not native/introduced/invasive.' },
]

const QUICK_PICKS = ['Japanese barberry', 'Lantana camara', 'Japanese knotweed', 'Kudzu']

const NO_FILL = 'rgba(0,0,0,0)'

function MapsPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; tone: 'muted' | 'ok' | 'warn' | 'danger' }>({
    text: 'The whole world is shown. Search for a plant to color the places where iNaturalist records its status.',
    tone: 'muted',
  })
  const [result, setResult] = useState<WorldMapResult | null>(null)
  const [info, setInfo] = useState<string>('')
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [mapError, setMapError] = useState('')

  // Pre-fill from the Research page.
  useEffect(() => {
    try {
      const pre = window.sessionStorage.getItem('glowbots:map-prefill')
      if (pre) {
        window.sessionStorage.removeItem('glowbots:map-prefill')
        setQuery(pre)
        run(pre)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const readyRef = useRef(false)
  const resultRef = useRef<WorldMapResult | null>(null)

  // Create the Mapbox map once, in the browser only.
  useEffect(() => {
    let cancelled = false
    let map: any
    ;(async () => {
      try {
        const { token, problem } = await getMapboxToken()
        if (!token) throw new Error(problem || 'Mapbox token missing.')
        const mod: any = await import('mapbox-gl')
        const mapboxgl = mod.default ?? mod
        if (cancelled || !container.current) return
        mapboxgl.accessToken = token
        const narrow = window.innerWidth < 640
        map = new mapboxgl.Map({
          container: container.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [10, 22],
          zoom: narrow ? 0.6 : 1.3,
          minZoom: 0.3,
          projection: 'mercator',
          dragRotate: false,
          attributionControl: true,
        })
        mapRef.current = map
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        map.touchZoomRotate.disableRotation()

        map.on('load', () => {
          const firstSymbol = map.getStyle().layers?.find((l: any) => l.type === 'symbol')?.id
          map.addSource('countries', { type: 'vector', url: 'mapbox://mapbox.country-boundaries-v1' })
          map.addLayer(
            {
              id: 'country-fill',
              type: 'fill',
              source: 'countries',
              'source-layer': 'country_boundaries',
              filter: ['any', ['==', 'all', ['get', 'worldview']], ['in', 'US', ['get', 'worldview']]],
              paint: { 'fill-color': NO_FILL, 'fill-opacity': 0.78 },
            },
            firstSymbol,
          )
          map.addSource('states', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          map.addLayer(
            {
              id: 'state-fill',
              type: 'fill',
              source: 'states',
              paint: {
                'fill-color': ['match', ['get', 'status'], 'native', STATUS_COLORS.native, 'introduced', STATUS_COLORS.introduced, 'invasive', STATUS_COLORS.invasive, STATUS_COLORS.unknown],
                'fill-opacity': 0.85,
              },
            },
            firstSymbol,
          )
          map.addLayer(
            {
              id: 'state-line',
              type: 'line',
              source: 'states',
              paint: { 'line-color': '#ffffff', 'line-width': 0.8 },
            },
            firstSymbol,
          )

          const describe = (e: any) => {
            const f = map.queryRenderedFeatures(e.point, { layers: ['state-fill', 'country-fill'] })?.[0]
            if (!f) return setInfo('')
            const r = resultRef.current
            if (f.layer.id === 'state-fill') {
              return setInfo(`${f.properties.name} · ${f.properties.status}`)
            }
            const iso = f.properties.iso_3166_1
            const rec = r?.countries.find((c) => c.iso === iso)
            const name = f.properties.name_en ?? rec?.name ?? iso
            setInfo(rec ? `${name} · ${rec.status === 'unknown' ? rec.raw : rec.status}` : `${name} · no status recorded`)
          }
          map.on('mousemove', describe)
          map.on('click', describe)
          readyRef.current = true
          setMapState('ready')
          if (resultRef.current) paint(resultRef.current)
        })
        map.on('error', (e: any) => {
          const m = String(e?.error?.message ?? '')
          if (!readyRef.current && m) {
            setMapError(m.includes('401') || m.includes('Unauthorized') ? 'Mapbox rejected the token (401). Check MAPBOX_API_KEY.' : m)
            setMapState('error')
          }
        })
      } catch (err: any) {
        if (!cancelled) {
          setMapError(err?.message || 'The map could not start.')
          setMapState('error')
        }
      }
    })()
    return () => {
      cancelled = true
      readyRef.current = false
      map?.remove?.()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function paint(r: WorldMapResult | null) {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const byStatus: Record<MapStatus, string[]> = { native: [], introduced: [], invasive: [], unknown: [] }
    for (const c of r?.countries ?? []) byStatus[c.status].push(c.iso)
    const expr: any[] = ['match', ['get', 'iso_3166_1']]
    ;(['native', 'introduced', 'invasive', 'unknown'] as MapStatus[]).forEach((s) => {
      if (byStatus[s].length) expr.push(byStatus[s], STATUS_COLORS[s])
    })
    map.setPaintProperty('country-fill', 'fill-color', expr.length > 2 ? [...expr, NO_FILL] : NO_FILL)
    const features = (r?.regions ?? []).map((g) => ({
      type: 'Feature',
      properties: { name: g.name, status: g.status },
      geometry: g.geometry,
    }))
    map.getSource('states')?.setData({ type: 'FeatureCollection', features })
  }

  useEffect(() => {
    resultRef.current = result
    paint(result)
  }, [result])

  const run = async (name: string) => {
    const q = name.trim()
    if (!q) {
      setMessage({ text: 'Enter a plant name to map.', tone: 'danger' })
      return
    }
    setQuery(q)
    setLoading(true)
    setResult(null)
    setInfo('')
    setMessage({ text: 'Loading worldwide distribution…', tone: 'warn' })
    try {
      const r = await buildWorldMap(q, (text) => setMessage({ text, tone: 'warn' }))
      setResult(r)
      setMessage({ text: r.message, tone: 'ok' })
    } catch (err: any) {
      setMessage({ text: err?.message || 'iNaturalist map search failed. Try again.', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<MapStatus, number> = { native: 0, introduced: 0, invasive: 0, unknown: 0 }
    for (const x of result?.countries ?? []) c[x.status]++
    for (const x of result?.regions ?? []) c[x.status]++
    return c
  }, [result])

  const grouped = useMemo(() => {
    const g: Record<MapStatus, string[]> = { native: [], introduced: [], invasive: [], unknown: [] }
    for (const x of result?.countries ?? []) g[x.status].push(x.name)
    for (const x of result?.regions ?? []) g[x.status].push(x.name)
    ;(Object.keys(g) as MapStatus[]).forEach((k) => g[k].sort((a, b) => a.localeCompare(b)))
    return g
  }, [result])

  const title = result ? (result.commonName ? `${result.commonName} (${result.scientificName})` : result.scientificName) : ''

  return (
    <div className="pb-14">
      <PageBanner
        icon={<Globe className="size-10" />}
        title="World Distribution Map"
        subtitle="Where a plant is native, introduced, or invasive — straight from iNaturalist records."
      />
      <div className="mx-auto mt-6 grid max-w-content gap-5 px-4 lg:grid-cols-[1fr_340px]">
        <SectionCard icon={Search} title="Find a plant">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(query)
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
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Show map
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_PICKS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => run(p)}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-forest hover:bg-moss"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="relative mt-4 overflow-hidden rounded-xl bg-[#eaf2f7]">
            {title && (
              <p className="pointer-events-none absolute left-3 top-2 z-10 max-w-[70%] rounded bg-white/80 px-2 py-0.5 font-display text-sm font-bold text-forest">
                {title}
              </p>
            )}
            <div ref={container} className="h-[380px] w-full sm:h-[520px]" aria-label="World map" />
            {mapState === 'loading' && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline size-5 animate-spin" /> Loading map…
              </div>
            )}
            {mapState === 'error' && (
              <div className="absolute inset-0 grid place-items-center bg-white/90 p-6 text-center text-sm text-danger">
                <p>
                  The map could not load: {mapError}
                  <br />
                  <span className="text-muted-foreground">The lists below still show the iNaturalist results.</span>
                </p>
              </div>
            )}
            {info && (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs capitalize shadow">
                <strong>{info}</strong>
              </div>
            )}
          </div>

          <p
            className={cn(
              'mt-4 rounded-xl bg-[#eef4ea] p-3 text-sm',
              message.tone === 'ok' && 'text-leaf',
              message.tone === 'warn' && 'text-warn',
              message.tone === 'danger' && 'text-danger',
              message.tone === 'muted' && 'text-muted-foreground',
            )}
          >
            {loading && <Loader2 className="mr-2 inline size-4 animate-spin" />}
            {message.text}
          </p>

          {result && (
            <div className="mt-4 grid gap-3">
              {(['native', 'introduced', 'invasive', 'unknown'] as MapStatus[]).map(
                (s) =>
                  grouped[s].length > 0 && (
                    <details key={s} className="rounded-xl border p-3" open={s !== 'unknown'}>
                      <summary className="cursor-pointer text-sm font-semibold">
                        <span className="mr-2 inline-block h-3 w-4 rounded-sm align-middle" style={{ background: STATUS_COLORS[s] }} />
                        {LEGEND.find((l) => l.status === s)!.name} ({grouped[s].length})
                      </summary>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{grouped[s].join(' · ')}</p>
                    </details>
                  ),
              )}
              {result.unmatched.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Could not place on the map ({result.unmatched.length}): {result.unmatched.join(', ')}.
                </p>
              )}
              <Link
                to="/research"
                search={{ q: result.scientificName }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-leaf underline"
              >
                <BookOpen className="size-4" /> Read the full research on {result.scientificName}
              </Link>
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Palette} title="Map colors" className="content-start self-start">
          <ul className="grid gap-3.5">
            {LEGEND.map((l) => (
              <li key={l.status} className="flex gap-3">
                <span className="mt-0.5 h-4 w-5 shrink-0 rounded-sm" style={{ background: STATUS_COLORS[l.status] }} />
                <span className="flex-1">
                  <span className="flex justify-between text-sm font-semibold">
                    {l.name}
                    {result && <span className="tabular-nums text-muted-foreground">{counts[l.status]}</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{l.description}</span>
                </span>
              </li>
            ))}
            <li className="flex gap-3">
              <span className="mt-0.5 h-4 w-5 shrink-0 rounded-sm border bg-[#f4f4f0]" />
              <span className="flex-1">
                <span className="block text-sm font-semibold">No color · No record</span>
                <span className="block text-xs text-muted-foreground">
                  iNaturalist has no status for this place, so nothing is guessed.
                </span>
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            A color only appears if iNaturalist has a record for it, so a given plant may not show all four colors. Try
            the quick picks to see native, introduced and invasive ranges together. Pinch or scroll to zoom, drag to pan,
            tap a place for details.
          </p>
        </SectionCard>
      </div>
    </div>
  )
}
