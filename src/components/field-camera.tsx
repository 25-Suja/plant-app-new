import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Flashlight, FlashlightOff, Loader2, RefreshCw, SunMedium, X, ZoomIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { canvasToJpeg, drawToCanvas, enhanceForField, measureQuality, type PhotoQuality } from '@/lib/image'
import { cn } from '@/lib/utils'

export type CapturedPhoto = { dataUrl: string; quality: PhotoQuality; enhanced: boolean }

type Caps = {
  zoom?: { min: number; max: number; step: number }
  exposure?: { min: number; max: number; step: number }
  torch?: boolean
  pointsOfInterest?: boolean
}

const QUALITY_COPY: Record<PhotoQuality['verdict'], { label: string; tone: string }> = {
  good: { label: 'Good light & focus — ready', tone: 'bg-emerald-500' },
  dark: { label: 'Too dark — turn on the torch, raise exposure, or step into light', tone: 'bg-amber-500' },
  bright: { label: 'Too bright — shade the plant or lower exposure', tone: 'bg-amber-500' },
  blurry: { label: 'Blurry — hold steady or tap the plant to focus', tone: 'bg-amber-500' },
}

export function FieldCamera({
  guide,
  autoEnhance,
  onCapture,
  onClose,
}: {
  guide: string
  autoEnhance: boolean
  onCapture: (photo: CapturedPhoto) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceIndex, setDeviceIndex] = useState(-1)
  const [caps, setCaps] = useState<Caps>({})
  const [zoom, setZoom] = useState(1)
  const [exposure, setExposure] = useState(0)
  const [torch, setTorch] = useState(false)
  const [live, setLive] = useState<PhotoQuality | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null)
  const [flash, setFlash] = useState(false)

  const track = () => streamRef.current?.getVideoTracks()[0]

  const start = useCallback(async (index: number, list: MediaDeviceInfo[]) => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setError('')
    try {
      const device = list[index]
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(device ? { deviceId: { exact: device.deviceId } } : { facingMode: { ideal: 'environment' } }),
          width: { ideal: 2560 },
          height: { ideal: 1920 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      const t = stream.getVideoTracks()[0]
      const c: any = t.getCapabilities?.() ?? {}
      const next: Caps = {}
      if (c.zoom?.max > c.zoom?.min) next.zoom = { min: c.zoom.min, max: c.zoom.max, step: c.zoom.step || 0.1 }
      if (c.exposureCompensation?.max > c.exposureCompensation?.min)
        next.exposure = {
          min: c.exposureCompensation.min,
          max: c.exposureCompensation.max,
          step: c.exposureCompensation.step || 0.1,
        }
      if (c.torch) next.torch = true
      if (c.pointsOfInterest || c.focusMode?.includes?.('single-shot')) next.pointsOfInterest = true
      // Continuous autofocus and auto exposure suit moving branches in the woods.
      const advanced: any[] = []
      if (c.focusMode?.includes?.('continuous')) advanced.push({ focusMode: 'continuous' })
      if (c.exposureMode?.includes?.('continuous')) advanced.push({ exposureMode: 'continuous' })
      if (c.whiteBalanceMode?.includes?.('continuous')) advanced.push({ whiteBalanceMode: 'continuous' })
      if (advanced.length) await t.applyConstraints({ advanced } as any).catch(() => {})
      setCaps(next)
      setZoom(next.zoom?.min ?? 1)
      setExposure(0)
      setTorch(false)
      // Device labels are only available after permission is granted.
      if (!list.length) {
        const all = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')
        setDevices(all)
        const active = t.getSettings().deviceId
        setDeviceIndex(Math.max(0, all.findIndex((d) => d.deviceId === active)))
      }
    } catch (e: any) {
      setError(
        e?.name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access in your browser settings, or use “Upload photos” instead.'
          : 'The camera could not be started on this device. Use “Upload photos” to choose or take a picture instead.',
      )
    }
  }, [])

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support live camera access. Use “Upload photos” instead.')
      return
    }
    start(-1, [])
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [start])

  // Live light/focus meter
  useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current
      if (!v || !v.videoWidth) return
      setLive(measureQuality(v, v.videoWidth, v.videoHeight))
    }, 700)
    return () => clearInterval(id)
  }, [])

  const apply = (constraint: Record<string, unknown>) =>
    track()?.applyConstraints({ advanced: [constraint] } as any).catch(() => {})

  const onZoom = (value: number) => {
    setZoom(value)
    if (caps.zoom) apply({ zoom: value })
  }

  const onTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setFocusPoint({ x, y })
    setTimeout(() => setFocusPoint(null), 1200)
    if (caps.pointsOfInterest) {
      apply({ pointsOfInterest: [{ x, y }], focusMode: 'single-shot', exposureMode: 'single-shot' })
      setTimeout(() => apply({ focusMode: 'continuous', exposureMode: 'continuous' }), 2500)
    }
  }

  const capture = async () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    setBusy(true)
    setFlash(true)
    setTimeout(() => setFlash(false), 150)
    // Burst of frames; keep the sharpest to beat hand shake and swaying leaves.
    const digitalZoom = caps.zoom ? 1 : zoom
    let best: { canvas: HTMLCanvasElement; q: PhotoQuality } | null = null
    for (let i = 0; i < 4; i++) {
      const canvas = drawToCanvas(v, v.videoWidth, v.videoHeight, { zoom: digitalZoom })
      const q = measureQuality(canvas, canvas.width, canvas.height)
      if (!best || q.sharpness > best.q.sharpness) best = { canvas, q }
      await new Promise((r) => setTimeout(r, 110))
    }
    const { canvas, q } = best!
    const enhance = autoEnhance && q.brightness < 110
    if (enhance) enhanceForField(canvas)
    onCapture({
      dataUrl: canvasToJpeg(canvas),
      quality: enhance ? measureQuality(canvas, canvas.width, canvas.height) : q,
      enhanced: enhance,
    })
    setBusy(false)
  }

  const zoomRange = caps.zoom ?? { min: 1, max: 4, step: 0.1 }
  const meter = live ? QUALITY_COPY[live.verdict] : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-white/80 line-clamp-2">{guide}</p>
        <button onClick={onClose} className="rounded-full bg-white/10 p-2" aria-label="Close camera">
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden" onPointerDown={onTap}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 size-full object-cover"
          style={!caps.zoom && zoom > 1 ? { transform: `scale(${zoom})` } : undefined}
        />
        {/* Framing guide */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/10" />
          ))}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
        {focusPoint && (
          <div
            className="pointer-events-none absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-300 animate-in zoom-in-50"
            style={{ left: `${focusPoint.x * 100}%`, top: `${focusPoint.y * 100}%` }}
          />
        )}
        {flash && <div className="pointer-events-none absolute inset-0 bg-white/70" />}
        {meter && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur">
            <span className={cn('size-2.5 rounded-full', meter.tone)} />
            {meter.label}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <p className="max-w-sm rounded-2xl bg-black/70 p-5 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="grid gap-3 px-5 pb-6 pt-4 bg-black">
        <label className="flex items-center gap-3 text-xs text-white/80">
          <ZoomIn className="size-4 shrink-0" />
          <input
            type="range"
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            className="flex-1 accent-[#8ecf70]"
            aria-label="Zoom"
          />
          <span className="w-10 text-right tabular-nums">{zoom.toFixed(1)}×</span>
        </label>
        {caps.exposure && (
          <label className="flex items-center gap-3 text-xs text-white/80">
            <SunMedium className="size-4 shrink-0" />
            <input
              type="range"
              min={caps.exposure.min}
              max={caps.exposure.max}
              step={caps.exposure.step}
              value={exposure}
              onChange={(e) => {
                const v = Number(e.target.value)
                setExposure(v)
                apply({ exposureCompensation: v })
              }}
              className="flex-1 accent-[#8ecf70]"
              aria-label="Exposure"
            />
            <span className="w-10 text-right tabular-nums">{exposure > 0 ? '+' : ''}{exposure.toFixed(1)}</span>
          </label>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="rounded-full text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
            disabled={!caps.torch}
            onClick={() => {
              setTorch((t) => !t)
              apply({ torch: !torch })
            }}
            aria-label="Toggle torch"
          >
            {torch ? <Flashlight /> : <FlashlightOff />}
          </Button>
          <button
            onClick={capture}
            disabled={busy || !!error}
            className="grid size-[74px] place-items-center rounded-full border-4 border-white bg-white/20 transition active:scale-95 disabled:opacity-40"
            aria-label="Take photo"
          >
            {busy ? <Loader2 className="size-7 animate-spin" /> : <Camera className="size-7" />}
          </button>
          <Button
            variant="ghost"
            className="rounded-full text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
            disabled={devices.length < 2}
            onClick={() => {
              const next = (deviceIndex + 1) % devices.length
              setDeviceIndex(next)
              start(next, devices)
            }}
            aria-label="Switch camera"
          >
            <RefreshCw />
          </Button>
        </div>
        <p className="text-center text-[11px] text-white/50">
          Tap the plant to focus · Fill the frame with one leaf, flower, fruit or bark patch
        </p>
      </div>
    </div>
  )
}
