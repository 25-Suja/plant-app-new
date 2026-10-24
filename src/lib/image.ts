// Browser-side photo helpers used by the field camera and uploads.
// Everything here runs on a <canvas>; nothing is sent anywhere.

export type PhotoQuality = {
  brightness: number // mean luma, 0–255
  sharpness: number // variance of the Laplacian on a small grayscale copy
  verdict: 'good' | 'dark' | 'bright' | 'blurry'
}

const SAMPLE_WIDTH = 240

/** Score brightness and sharpness of any drawable source (video, image, canvas). */
export function measureQuality(
  source: CanvasImageSource,
  width: number,
  height: number,
): PhotoQuality {
  const scale = SAMPLE_WIDTH / Math.max(1, width)
  const w = SAMPLE_WIDTH
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const gray = new Float32Array(w * h)
  let sum = 0
  for (let i = 0; i < w * h; i++) {
    const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    gray[i] = g
    sum += g
  }
  const brightness = sum / (w * h)

  let lapSum = 0
  let lapSq = 0
  let n = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const lap = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i]
      lapSum += lap
      lapSq += lap * lap
      n++
    }
  }
  const mean = lapSum / Math.max(1, n)
  const sharpness = lapSq / Math.max(1, n) - mean * mean

  let verdict: PhotoQuality['verdict'] = 'good'
  if (brightness < 55) verdict = 'dark'
  else if (brightness > 215) verdict = 'bright'
  else if (sharpness < 60) verdict = 'blurry'
  return { brightness, sharpness, verdict }
}

/**
 * Field correction for shaded woodland photos: per-channel levels stretch
 * (removes the green colour cast of a leaf canopy) plus a gentle gamma lift
 * for dark frames. Leaves well-exposed photos almost untouched.
 */
export function enhanceForField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]
  let luma = 0
  const pixels = d.length / 4
  for (let i = 0; i < d.length; i += 4) {
    hist[0][d[i]]++
    hist[1][d[i + 1]]++
    hist[2][d[i + 2]]++
    luma += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
  }
  luma /= pixels

  const bounds = hist.map((h) => {
    const lowTarget = pixels * 0.005
    const highTarget = pixels * 0.995
    let acc = 0
    let lo = 0
    let hi = 255
    for (let v = 0; v < 256; v++) {
      acc += h[v]
      if (acc <= lowTarget) lo = v
      if (acc < highTarget) hi = v
    }
    return [lo, Math.max(lo + 32, hi)] as const
  })

  // Lift shadows only when the frame is genuinely dark.
  const gamma = luma < 70 ? 0.7 : luma < 100 ? 0.85 : 1
  const luts = bounds.map(([lo, hi]) => {
    const lut = new Uint8ClampedArray(256)
    for (let v = 0; v < 256; v++) {
      const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)))
      lut[v] = Math.round(255 * Math.pow(t, gamma))
    }
    return lut
  })
  for (let i = 0; i < d.length; i += 4) {
    d[i] = luts[0][d[i]]
    d[i + 1] = luts[1][d[i + 1]]
    d[i + 2] = luts[2][d[i + 2]]
  }
  ctx.putImageData(img, 0, 0)
}

/** Draw a source into a canvas no larger than maxSide, optionally cropping to a centred zoom. */
export function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  { maxSide = 1600, zoom = 1 }: { maxSide?: number; zoom?: number } = {},
) {
  const cropW = width / zoom
  const cropH = height / zoom
  const sx = (width - cropW) / 2
  const sy = (height - cropH) / 2
  const scale = Math.min(1, maxSide / Math.max(cropW, cropH))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cropW * scale)
  canvas.height = Math.round(cropH * scale)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.88) {
  return canvas.toDataURL('image/jpeg', quality)
}

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    // Revoke after decode; the decoded bitmap stays usable for drawing.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
