import { useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Globe, Loader2, Palette, RotateCcw, Search } from 'lucide-react'

import { PageBanner, SectionCard } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildPlantMap, type MapRegion, type MapStatus } from '@/lib/inat'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/maps')({
  head: () => ({ meta: [{ title: 'Plant Distribution Map · GlowBots' }] }),
  component: MapsPage,
})

const STATUS_COLORS: Record<MapStatus, string> = {
  native: '#16803c',
  introduced: '#e6a700',
  invasive: '#e6003d',
  unknown: '#8a8a8a',
}

const LEGEND: { status: MapStatus; name: string; description: string }[] = [
  { status: 'native', name: 'Green', description: 'Native or endemic to the area.' },
  { status: 'introduced', name: 'Orange / yellow', description: 'Introduced or naturalized.' },
  { status: 'invasive', name: 'Red', description: 'Confirmed invasive species.' },
  { status: 'unknown', name: 'Gray', description: 'Status is unavailable for the area.' },
]

const W = 1200
const H = 600
const MARGIN = 40

const mercY = (lat: number) => Math.asinh(Math.tan((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180))

function useProjectedPaths(regions: MapRegion[]) {
  return useMemo(() => {
    const polys: { region: MapRegion; rings: number[][][] }[] = []
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const region of regions) {
      const g = region.geometry
      const polygons: number[][][][] = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
      for (const polygon of polygons) {
        const rings = polygon.map((ring) =>
          ring
            .filter((c) => Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90)
            .map(([lon, lat]) => {
              const x = (lon * Math.PI) / 180
              const y = mercY(lat)
              minX = Math.min(minX, x)
              maxX = Math.max(maxX, x)
              minY = Math.min(minY, y)
              maxY = Math.max(maxY, y)
              return [x, y]
            }),
        )
        polys.push({ region, rings })
      }
    }
    if (!polys.length) return []
    const spanX = Math.max(maxX - minX, 0.1)
    const spanY = Math.max(maxY - minY, 0.1)
    const scale = Math.min((W - 2 * MARGIN) / spanX, (H - 2 * MARGIN) / spanY)
    const ox = (W - spanX * scale) / 2
    const oy = (H - spanY * scale) / 2
    return polys.map(({ region, rings }) => ({
      region,
      d: rings
        .filter((r) => r.length >= 3)
        .map(
          (r) =>
            'M' +
            r.map(([x, y]) => `${(ox + (x - minX) * scale).toFixed(1)},${(H - oy - (y - minY) * scale).toFixed(1)}`).join('L') +
            'Z',
        )
        .join(''),
    }))
  }, [regions])
}

function MapsPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; tone: 'muted' | 'ok' | 'warn' | 'danger' }>({
    text: 'Search for a plant to color the provinces and states where its status is recorded.',
    tone: 'muted',
  })
  const [regions, setRegions] = useState<MapRegion[]>([])
  const [title, setTitle] = useState('')
  const [hover, setHover] = useState<MapRegion | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const paths = useProjectedPaths(regions)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setMessage({ text: 'Enter a plant name to map.', tone: 'danger' })
      return
    }
    setLoading(true)
    setRegions([])
    setView({ x: 0, y: 0, k: 1 })
    setMessage({ text: 'Loading plant distribution map…', tone: 'warn' })
    try {
      const result = await buildPlantMap(query, (text) => setMessage({ text, tone: 'warn' }))
      setRegions(result.regions)
      setTitle(result.commonName ? `${result.commonName} (${result.scientificName})` : result.scientificName)
      setMessage({ text: result.message, tone: 'ok' })
    } catch (err: any) {
      setMessage({ text: err?.message || 'iNaturalist map search failed. Try again.', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H }
  }

  const onWheel = (e: React.WheelEvent) => {
    const p = toSvg(e.clientX, e.clientY)
    setView((v) => {
      const k = Math.min(8, Math.max(0.5, v.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2)))
      return { k, x: p.x - ((p.x - v.x) * k) / v.k, y: p.y - ((p.y - v.y) * k) / v.k }
    })
  }

  const counts = regions.reduce<Record<MapStatus, number>>(
    (acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1 }),
    { native: 0, introduced: 0, invasive: 0, unknown: 0 },
  )

  return (
    <div className="pb-14">
      <PageBanner
        icon={<Globe className="size-10" />}
        title="Plant Distribution Map"
        subtitle="See which provinces and states have recorded native or introduced status."
      />
      <div className="mx-auto mt-6 grid max-w-content gap-5 px-4 lg:grid-cols-[1fr_340px]">
        <SectionCard icon={Search} title="Find a plant">
          <p className="mb-3 text-sm text-muted-foreground">
            Type a plant name to see the provinces and states with recorded native, introduced, or invasive status.
          </p>
          <form onSubmit={search} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Japanese barberry or Berberis thunbergii"
              aria-label="Plant name"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Show map
            </Button>
          </form>

          {paths.length > 0 && (
            <div className="relative mt-4 overflow-hidden rounded-xl bg-[#eaf2f7]">
              <p className="absolute left-3 top-2 z-10 font-display text-sm font-bold text-forest">{title}</p>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="block w-full cursor-grab touch-none active:cursor-grabbing"
                onWheel={onWheel}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  const p = toSvg(e.clientX, e.clientY)
                  drag.current = { x: p.x, y: p.y, vx: view.x, vy: view.y }
                }}
                onPointerMove={(e) => {
                  if (!drag.current) return
                  const p = toSvg(e.clientX, e.clientY)
                  const d = drag.current
                  setView((v) => ({ ...v, x: d.vx + p.x - d.x, y: d.vy + p.y - d.y }))
                }}
                onPointerUp={() => (drag.current = null)}
                onPointerLeave={() => {
                  drag.current = null
                  setHover(null)
                }}
              >
                <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                  {paths.map((p, i) => (
                    <path
                      key={i}
                      d={p.d}
                      fill={STATUS_COLORS[p.region.status]}
                      fillRule="evenodd"
                      stroke="#fff"
                      strokeWidth={1 / view.k}
                      opacity={hover && hover.placeId !== p.region.placeId ? 0.75 : 1}
                      onPointerEnter={() => setHover(p.region)}
                    />
                  ))}
                </g>
              </svg>
              {hover && (
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs shadow">
                  <strong>{hover.name}</strong> · <span className="capitalize">{hover.status}</span>
                </div>
              )}
              <div className="absolute right-3 top-2 flex gap-1">
                {[
                  ['+', 1.3],
                  ['−', 1 / 1.3],
                ].map(([label, f]) => (
                  <button
                    key={label}
                    onClick={() =>
                      setView((v) => {
                        const k = Math.min(8, Math.max(0.5, v.k * (f as number)))
                        return { k, x: W / 2 - ((W / 2 - v.x) * k) / v.k, y: H / 2 - ((H / 2 - v.y) * k) / v.k }
                      })
                    }
                    className="grid size-8 place-items-center rounded-lg bg-white text-lg shadow hover:bg-muted"
                    aria-label={label === '+' ? 'Zoom in' : 'Zoom out'}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setView({ x: 0, y: 0, k: 1 })}
                  className="grid size-8 place-items-center rounded-lg bg-white shadow hover:bg-muted"
                  aria-label="Reset view"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
            </div>
          )}

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
        </SectionCard>

        <SectionCard icon={Palette} title="Province colors" className="content-start self-start">
          <ul className="grid gap-3.5">
            {LEGEND.map((l) => (
              <li key={l.status} className="flex gap-3">
                <span className="mt-0.5 h-4 w-5 shrink-0 rounded-sm" style={{ background: STATUS_COLORS[l.status] }} />
                <span className="flex-1">
                  <span className="flex justify-between text-sm font-semibold">
                    {l.name}
                    {regions.length > 0 && <span className="tabular-nums text-muted-foreground">{counts[l.status]}</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{l.description}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Scroll or use + / − to zoom, drag to pan.</p>
        </SectionCard>
      </div>
    </div>
  )
}
