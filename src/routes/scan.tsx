import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Camera,
  CircleAlert,
  CircleCheck,
  ImagePlus,
  Loader2,
  MapPin,
  Microscope,
  Recycle,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { PageBanner, SectionCard } from '@/components/app-shell'
import { FieldCamera, type CapturedPhoto } from '@/components/field-camera'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { identifyPlant, type Identification, type Organ } from '@/lib/identify.functions'
import { canvasToJpeg, drawToCanvas, enhanceForField, fileToImage, measureQuality } from '@/lib/image'
import { uuid } from '@/lib/safe'
import { checkNativeStatus, searchLocation, type Place } from '@/lib/inat'
import { findGuide, isConfirmedInvasive } from '@/lib/plants'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/scan')({
  head: () => ({ meta: [{ title: 'Scan a Plant · GlowBots' }] }),
  component: ScanPage,
})

const ORGAN_OPTIONS: { value: Organ; label: string; guide: string }[] = [
  { value: 'leaf', label: 'Leaf', guide: 'Leaf: one leaf flat against your palm or the sky, top side, filling the frame.' },
  { value: 'flower', label: 'Flower', guide: 'Flower: straight on, close enough to count petals.' },
  { value: 'fruit', label: 'Fruit / berry', guide: 'Fruit: berries or seed pods in focus, still attached to the stem.' },
  { value: 'bark', label: 'Stem / bark', guide: 'Stem or bark: show thorns, hairs or bark texture up close.' },
  { value: 'habit', label: 'Whole plant', guide: 'Whole plant: step back so the full shape and growth habit are visible.' },
]

type Shot = CapturedPhoto & { id: string; organ: Organ }
const MAX_SHOTS = 5

const STATUS_STYLE = (status: string) => {
  const s = status.toLowerCase()
  if (s === 'confirmed invasive') return { label: 'CONFIRMED INVASIVE', className: 'bg-danger text-white' }
  if (s === 'introduced' || s === 'naturalized') return { label: s.toUpperCase(), className: 'bg-warn text-white' }
  if (s === 'native' || s === 'endemic') return { label: s.toUpperCase(), className: 'bg-leaf text-white' }
  if (s === 'unknown / not recorded') return { label: 'NOT RECORDED IN SELECTED REGION', className: 'bg-muted text-foreground' }
  return { label: s.toUpperCase(), className: 'bg-muted text-foreground' }
}

function ScanPage() {
  // Location
  const [locationQuery, setLocationQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [place, setPlace] = useState<Place | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationMsg, setLocationMsg] = useState<{ text: string; tone: 'muted' | 'ok' | 'warn' | 'danger' }>({
    text: '',
    tone: 'muted',
  })

  // Photos
  const [organ, setOrgan] = useState<Organ>('leaf')
  const [shots, setShots] = useState<Shot[]>([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [autoEnhance, setAutoEnhance] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // Result
  const [step, setStep] = useState<'' | 'identify' | 'status'>('')
  const [result, setResult] = useState<Identification | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [alerting, setAlerting] = useState(false)

  useEffect(() => {
    if (!alerting) return
    const t = setTimeout(() => setAlerting(false), 8400)
    return () => clearTimeout(t)
  }, [alerting])

  const findPlaces = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!locationQuery.trim()) {
      setLocationMsg({ text: 'Please enter a location query to search.', tone: 'danger' })
      return
    }
    setLocating(true)
    setLocationMsg({ text: `Searching iNaturalist places for “${locationQuery.trim()}”…`, tone: 'muted' })
    try {
      const matches = await searchLocation(locationQuery)
      setPlaces(matches)
      setPlace(null)
      setLocationMsg(
        matches.length
          ? { text: `Found ${matches.length} match(es). Choose one below.`, tone: 'ok' }
          : {
              text: `No state or province found for “${locationQuery.trim()}”. Try the region and country, like “Ontario, Canada”.`,
              tone: 'warn',
            },
      )
    } catch {
      setLocationMsg({ text: 'The location service did not respond. Check your connection and try again.', tone: 'danger' })
    } finally {
      setLocating(false)
    }
  }

  const addShot = (photo: CapturedPhoto) => {
    setShots((prev) => [...prev, { ...photo, id: uuid(), organ }].slice(0, MAX_SHOTS))
    setResult(null)
    setStatus('')
    // Suggest the next most useful plant part.
    const used = new Set([...shots.map((s) => s.organ), organ])
    const nextOrgan = (['leaf', 'bark', 'habit', 'fruit', 'flower'] as Organ[]).find((o) => !used.has(o))
    if (nextOrgan) setOrgan(nextOrgan)
  }

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files).slice(0, MAX_SHOTS - shots.length)) {
      try {
        const img = await fileToImage(file)
        const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight)
        const q = measureQuality(canvas, canvas.width, canvas.height)
        const enhance = autoEnhance && q.brightness < 110
        if (enhance) enhanceForField(canvas)
        addShot({ dataUrl: canvasToJpeg(canvas), quality: q, enhanced: enhance })
      } catch {
        setError(`Could not read ${file.name}. Try a JPG or PNG photo.`)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const scan = async () => {
    setError('')
    setAlerting(false)
    if (!shots.length) return setError('Please add or capture at least one photo first.')
    if (!place) return setError('Search for a location and select a matching place before scanning.')
    setResult(null)
    setStatus('')
    setStep('identify')
    try {
      const id = await identifyPlant({
        data: {
          images: shots.map((s) => ({ data: s.dataUrl, organ: s.organ })),
          region: place.displayName,
        },
      })
      setResult(id)
      if (!id.isPlant) {
        setStep('')
        return
      }
      setStep('status')
      let native = await checkNativeStatus(id.scientificName, place.id)
      if (native === 'introduced' && isConfirmedInvasive(id.scientificName)) native = 'confirmed invasive'
      setStatus(native)
      if (native === 'confirmed invasive') setAlerting(true)
    } catch (e: any) {
      setError(e?.message || 'Scan failed. Please try again.')
    } finally {
      setStep('')
    }
  }

  const guide = result ? findGuide(result.scientificName) : undefined
  const currentGuide = ORGAN_OPTIONS.find((o) => o.value === organ)!.guide

  return (
    <div className={cn('min-h-full pb-12 transition-colors', alerting && 'invasive-flash')}>
      <PageBanner
        title="Plant Scanner & Native Status Checker"
        subtitle="Pick a place, add a few photos, and find out if a plant belongs there."
      />

      {alerting && (
        <div className="fixed right-5 top-20 z-30 rounded-xl bg-danger px-4 py-2.5 font-display text-base font-bold tracking-wide text-white shadow-lg animate-pulse">
          INVASIVE
        </div>
      )}

      <div className="mx-auto mt-6 grid max-w-content gap-5 px-4 lg:grid-cols-2">
        <div className="grid gap-5 content-start">
          <SectionCard icon={MapPin} title="1 · Choose a location">
            <form onSubmit={findPlaces} className="flex gap-2">
              <Input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Try Connecticut, Ontario, or Queensland"
                aria-label="Search state or province worldwide"
              />
              <Button type="submit" disabled={locating}>
                {locating ? <Loader2 className="animate-spin" /> : <Search />} Find place
              </Button>
            </form>
            {locationMsg.text && (
              <p
                className={cn(
                  'mt-2 text-sm',
                  locationMsg.tone === 'ok' && 'text-leaf',
                  locationMsg.tone === 'warn' && 'text-warn',
                  locationMsg.tone === 'danger' && 'text-danger',
                  locationMsg.tone === 'muted' && 'text-muted-foreground',
                )}
              >
                {locationMsg.text}
              </p>
            )}
            {places.length > 0 && (
              <div className="mt-3 grid max-h-56 gap-1.5 overflow-y-auto pr-1">
                {places.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlace(p)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition',
                      place?.id === p.id ? 'border-leaf bg-secondary font-medium text-forest' : 'hover:bg-muted',
                    )}
                  >
                    {p.displayName}
                    {place?.id === p.id && <CircleCheck className="size-4 text-leaf" />}
                  </button>
                ))}
              </div>
            )}
            {place && (
              <p className="mt-2 text-xs italic text-muted-foreground">
                Selected place: {place.displayName} (ID: {place.id})
              </p>
            )}
          </SectionCard>

          <SectionCard icon={Camera} title="2 · Add plant photos">
            <p className="text-sm text-muted-foreground">
              Up to {MAX_SHOTS} photos of the <strong>same plant</strong>. Two or more different parts
              (for example leaf + stem) give far more accurate results than one photo.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Plant part for the next photo">
              {ORGAN_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  role="radio"
                  aria-checked={organ === o.value}
                  onClick={() => setOrgan(o.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    organ === o.value ? 'border-leaf bg-leaf text-white' : 'bg-white hover:bg-muted',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{currentGuide}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => setCameraOpen(true)} disabled={shots.length >= MAX_SHOTS}>
                <Camera /> Field camera
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={shots.length >= MAX_SHOTS}>
                <ImagePlus /> Upload photos
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </div>
            <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary/70 px-3 py-2.5 text-sm">
              <span>
                <span className="font-medium text-forest">Woodland light correction</span>
                <span className="block text-xs text-muted-foreground">
                  Brightens shade and removes the green canopy tint from dark photos.
                </span>
              </span>
              <Switch checked={autoEnhance} onCheckedChange={setAutoEnhance} />
            </label>

            {shots.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {shots.map((s) => (
                  <figure key={s.id} className="group relative overflow-hidden rounded-xl bg-[#eef4ea]">
                    <img src={s.dataUrl} alt={`${s.organ} photo`} className="aspect-square w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-[11px] text-white">
                      <span className="capitalize">{ORGAN_OPTIONS.find((o) => o.value === s.organ)?.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5',
                          s.quality.verdict === 'good' ? 'bg-emerald-600' : 'bg-amber-600',
                        )}
                      >
                        {s.quality.verdict === 'good' ? 'sharp' : s.quality.verdict}
                        {s.enhanced && ' · corrected'}
                      </span>
                    </figcaption>
                    <button
                      onClick={() => setShots((prev) => prev.filter((x) => x.id !== s.id))}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1.5 text-white opacity-90 hover:bg-black/70"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mt-4 grid place-items-center rounded-xl border-2 border-dashed border-input bg-[#eef4ea]/60 px-4 py-10 text-center text-sm text-muted-foreground">
                No photos yet
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-5 content-start">
          <SectionCard icon={Sparkles} title="3 · Identify the plant">
            <Button size="lg" className="w-full" onClick={scan} disabled={!!step || !shots.length}>
              {step ? <Loader2 className="animate-spin" /> : <Microscope />}
              Identify & check status
            </Button>
            {step && (
              <ol className="mt-3 grid gap-1.5 text-sm">
                <li className={cn('flex items-center gap-2', step === 'identify' ? 'text-warn' : 'text-leaf')}>
                  {step === 'identify' ? <Loader2 className="size-4 animate-spin" /> : <CircleCheck className="size-4" />}
                  Comparing {shots.length} photo{shots.length > 1 ? 's' : ''} against plant databases and a botanist model…
                </li>
                <li className={cn('flex items-center gap-2', step === 'status' ? 'text-warn' : 'text-muted-foreground')}>
                  {step === 'status' ? <Loader2 className="size-4 animate-spin" /> : <span className="size-4" />}
                  Checking iNaturalist regional status…
                </li>
              </ol>
            )}
            {error && (
              <p className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}
          </SectionCard>

          <SectionCard icon={CircleCheck} title="Result">
            {!result ? (
              <p className="text-sm text-muted-foreground">
                {shots.length ? 'Ready when you are — press Identify.' : 'Select or capture an image to begin.'}
              </p>
            ) : !result.isPlant ? (
              <p className="text-sm text-warn">
                We couldn't find a plant in these photos. Move closer so one plant fills the frame and try again.
              </p>
            ) : (
              <ResultView result={result} status={status} place={place} guideSlug={guide?.slug} />
            )}
          </SectionCard>
        </div>
      </div>

      {cameraOpen && (
        <FieldCamera
          guide={currentGuide}
          autoEnhance={autoEnhance}
          onClose={() => setCameraOpen(false)}
          onCapture={(photo) => {
            addShot(photo)
            if (shots.length + 1 >= MAX_SHOTS) setCameraOpen(false)
          }}
        />
      )}
    </div>
  )
}

function ResultView({
  result,
  status,
  place,
  guideSlug,
}: {
  result: Identification
  status: string
  place: Place | null
  guideSlug?: string
}) {
  const pct = Math.round(result.confidence * 100)
  const statusStyle = status ? STATUS_STYLE(status) : null
  const invasive = status === 'confirmed invasive' || isConfirmedInvasive(result.scientificName)
  return (
    <div className="grid gap-4">
      <div>
        <p className="font-display text-2xl font-bold italic text-forest">{result.scientificName}</p>
        <p className="text-muted-foreground">
          {result.commonName}
          {result.family && <span className="text-xs"> · {result.family}</span>}
        </p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium">Confidence</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full', pct >= 80 ? 'bg-leaf' : pct >= 55 ? 'bg-warn' : 'bg-danger')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {result.agreement === 'agree'
            ? '✓ Pl@ntNet and the botanist model agree on this species.'
            : result.agreement === 'disagree'
              ? `Engines disagree — Pl@ntNet's top pick was ${result.plantnetTop[0]?.scientificName}. Confidence is capped; add more photos.`
              : result.engines.botanist
                ? 'Identified by the botanist model from your photos.'
                : 'Identified by Pl@ntNet visual recognition.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Native status in {place?.name ?? 'region'}:</span>
        {statusStyle ? (
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold tracking-wide', statusStyle.className)}>
            {statusStyle.label}
          </span>
        ) : (
          <Loader2 className="size-4 animate-spin text-warn" />
        )}
      </div>
      {status === 'unknown / not recorded' && (
        <p className="text-xs text-muted-foreground">
          iNaturalist has no native-status record for this species in the selected region. This does not
          confirm that the species is invasive.
        </p>
      )}

      {invasive && (
        <Link
          to="/disposal"
          search={{ species: guideSlug }}
          className="flex items-center justify-between gap-3 rounded-xl bg-danger px-4 py-3 text-white shadow-sm transition hover:brightness-110"
        >
          <span className="flex items-center gap-2 font-medium">
            <Recycle className="size-5" /> How to remove & dispose of {result.commonName || 'this plant'}
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {result.keyFeatures.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Features we saw
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {result.keyFeatures.map((f) => (
              <li key={f} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-forest">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.reasoning && <p className="text-sm leading-relaxed">{result.reasoning}</p>}

      {result.alternatives.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Look-alikes to rule out
          </p>
          <ul className="grid gap-2">
            {result.alternatives.map((a) => (
              <li key={a.scientificName} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span>
                    <em>{a.scientificName}</em>
                    {a.commonName && <span className="text-muted-foreground"> · {a.commonName}</span>}
                  </span>
                  <span className="tabular-nums text-xs text-muted-foreground">{Math.round(a.confidence * 100)}%</span>
                </div>
                {a.howToTell && <p className="mt-0.5 text-xs text-muted-foreground">{a.howToTell}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.photoTips.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <p className="mb-1 font-semibold">
            {result.needsMorePhotos ? 'Add these photos to confirm:' : 'To be even more certain:'}
          </p>
          <ul className="list-disc pl-5 text-xs">
            {result.photoTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
