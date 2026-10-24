import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Multi-photo, two-engine plant identification.
// 1. Pl@ntNet (when PLANTNET_API_KEY is set) proposes ranked candidates using
//    every photo and the plant organ each one shows.
// 2. A vision model acts as a field botanist: it inspects the same photos,
//    weighs the Pl@ntNet candidates and the user's region, and returns the
//    final answer with look-alikes and the features that separate them.

const ORGANS = ['leaf', 'flower', 'fruit', 'bark', 'habit', 'auto'] as const
export type Organ = (typeof ORGANS)[number]

const input = z.object({
  images: z
    .array(
      z.object({
        // data URL or bare base64 JPEG, client resizes to ≤1600px
        data: z.string().min(100).max(3_500_000),
        organ: z.enum(ORGANS),
      }),
    )
    .min(1)
    .max(5),
  region: z.string().max(200).optional(),
})

// Models occasionally answer 85 instead of 0.85.
const confidence = z.preprocess(
  (v) => (typeof v === 'number' && v > 1 ? v / 100 : v),
  z.number().min(0).max(1),
)

const candidateSchema = z.object({
  scientificName: z.string(),
  commonName: z.string().optional().default(''),
  confidence,
  howToTell: z.string().optional().default(''),
})

const aiSchema = z.object({
  isPlant: z.boolean(),
  scientificName: z.string(),
  commonName: z.string().optional().default(''),
  family: z.string().optional().default(''),
  confidence,
  keyFeatures: z.array(z.string()).default([]),
  reasoning: z.string().default(''),
  alternatives: z.array(candidateSchema).default([]),
  photoTips: z.array(z.string()).default([]),
  needsMorePhotos: z.boolean().default(false),
})

export type Candidate = z.infer<typeof candidateSchema>
export type Identification = {
  isPlant: boolean
  scientificName: string
  commonName: string
  family: string
  confidence: number
  keyFeatures: string[]
  reasoning: string
  alternatives: Candidate[]
  photoTips: string[]
  needsMorePhotos: boolean
  engines: { plantnet: boolean; botanist: boolean }
  agreement: 'agree' | 'disagree' | 'single'
  plantnetTop: Candidate[]
}

const stripPrefix = (data: string) => data.replace(/^data:image\/\w+;base64,/, '')
const binomial = (name: string) => name.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' ')

async function identifyWithPlantNet(images: z.infer<typeof input>['images']): Promise<Candidate[]> {
  const key = process.env.PLANTNET_API_KEY || process.env.FLORA_API_KEY
  if (!key) return []
  const form = new FormData()
  images.forEach((img, i) => {
    const bytes = Buffer.from(stripPrefix(img.data), 'base64')
    form.append('images', new Blob([bytes], { type: 'image/jpeg' }), `plant-${i}.jpg`)
    form.append('organs', img.organ === 'habit' ? 'auto' : img.organ)
  })
  const url = new URL('https://my-api.plantnet.org/v2/identify/all')
  url.searchParams.set('api-key', key)
  url.searchParams.set('nb-results', '6')
  url.searchParams.set('include-related-images', 'false')
  try {
    const res = await fetch(url, { method: 'POST', body: form, signal: AbortSignal.timeout(25000) })
    if (!res.ok) return []
    const json = (await res.json()) as any
    return (json.results ?? []).slice(0, 6).map((r: any) => ({
      scientificName: r.species?.scientificNameWithoutAuthor ?? r.species?.scientificName ?? 'Unknown',
      commonName: r.species?.commonNames?.[0] ?? '',
      confidence: Number(r.score) || 0,
      howToTell: '',
    }))
  } catch {
    return []
  }
}

const BOTANIST_PROMPT = (region: string, organs: string[], plantnet: Candidate[]) => `You are an expert field botanist helping volunteers identify plants, especially invasive plants, from phone photos taken in the field (often in shaded woodland with uneven light, partial views, and cluttered backgrounds).

Photos provided: ${organs.map((o, i) => `#${i + 1} = ${o}`).join(', ')}.
Observer's region: ${region || 'not specified'}.
${
  plantnet.length
    ? `A visual-recognition service (Pl@ntNet) proposed these candidates with scores:\n${plantnet
        .map((c) => `- ${c.scientificName}${c.commonName ? ` (${c.commonName})` : ''}: ${(c.confidence * 100).toFixed(1)}%`)
        .join('\n')}\nTreat these as hints, not answers — verify each against what is actually visible.`
    : 'No other recognition service was available; identify from the photos alone.'
}

Method:
1. Look at every photo. Note leaf arrangement (alternate/opposite/whorled), leaf shape, margin, venation, compound vs simple, stem features (thorns, hairs, pith, bark), flowers, fruit, growth form.
2. Ignore background plants; focus on the plant centred in the photos.
3. Consider plants that actually occur in the observer's region and season, and common native look-alikes of invasive species (and vice versa).
4. Only claim high confidence when diagnostic features are clearly visible. If key features are missing, lower confidence and say which photo would settle it.

Respond with ONLY a JSON object, no markdown, matching:
{
  "isPlant": boolean,
  "scientificName": "Genus species",
  "commonName": string,
  "family": string,
  "confidence": number between 0 and 1,
  "keyFeatures": [short strings: the visible features that support the ID],
  "reasoning": "2-3 sentences",
  "alternatives": [{"scientificName": string, "commonName": string, "confidence": number, "howToTell": "the feature that separates it from your top answer"}] (up to 3),
  "photoTips": [specific extra shots that would raise certainty, empty if none needed],
  "needsMorePhotos": boolean
}`

async function identifyWithBotanist(
  images: z.infer<typeof input>['images'],
  region: string,
  plantnet: Candidate[],
) {
  const prompt = BOTANIST_PROMPT(region, images.map((i) => i.organ), plantnet)

  // Free option: use Groq (vision model) when no Anthropic key is configured.
  if (!process.env.ANTHROPIC_API_KEY && process.env.GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              ...images.slice(0, 3).map((img) => ({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${stripPrefix(img.data)}` },
              })),
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(40000),
    })
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const json = (await res.json()) as any
    const gtext: string = json.choices?.[0]?.message?.content ?? ''
    const gmatch = gtext.match(/\{[\s\S]*\}/)
    if (!gmatch) throw new Error('No JSON in Groq response')
    return aiSchema.parse(JSON.parse(gmatch[0]))
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5-5',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          ...images.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: stripPrefix(img.data) },
          })),
          { type: 'text' as const, text: prompt },
        ],
      },
    ],
  })
  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in model response')
  return aiSchema.parse(JSON.parse(match[0]))
}

export const identifyPlant = createServerFn({ method: 'POST' })
  .validator(input)
  .handler(async ({ data }): Promise<Identification> => {
    const region = data.region ?? ''
    const plantnet = await identifyWithPlantNet(data.images)

    let botanist: z.infer<typeof aiSchema> | null = null
    let aiError = ''
    try {
      botanist = await identifyWithBotanist(data.images, region, plantnet)
    } catch (error) {
      console.error('Botanist identification failed', error)
      aiError = error instanceof Error ? error.message.slice(0, 200) : 'unknown error'
    }

    if (!botanist && !plantnet.length) {
      const keys = [
        process.env.PLANTNET_API_KEY ? 'PlantNet key: set' : 'PlantNet key: MISSING',
        process.env.GROQ_API_KEY ? 'Groq key: set' : 'Groq key: missing',
        process.env.ANTHROPIC_API_KEY ? 'Anthropic key: set' : 'Anthropic key: missing',
      ].join(', ')
      throw new Error(`Identification is unavailable right now (${keys}; AI error: ${aiError || 'none'}).`)
    }

    if (!botanist) {
      const [top, ...rest] = plantnet
      return {
        isPlant: true,
        scientificName: top.scientificName,
        commonName: top.commonName,
        family: '',
        confidence: top.confidence,
        keyFeatures: [],
        reasoning: 'Identified by Pl@ntNet visual recognition.',
        alternatives: rest.slice(0, 3),
        photoTips: top.confidence < 0.5 ? ['Add a close-up of a single leaf and one of the stem or bark.'] : [],
        needsMorePhotos: top.confidence < 0.5,
        engines: { plantnet: true, botanist: false },
        agreement: 'single',
        plantnetTop: plantnet,
      }
    }

    const ai = botanist
    // Cross-check the two engines. Agreement raises confidence; disagreement caps it.
    const pnMatch = plantnet.find((c) => binomial(c.scientificName) === binomial(ai.scientificName))
    const agreement: Identification['agreement'] = !plantnet.length
      ? 'single'
      : pnMatch
        ? 'agree'
        : 'disagree'
    let confidence = ai.confidence
    if (pnMatch) {
      confidence = Math.min(0.99, 1 - (1 - ai.confidence) * (1 - pnMatch.confidence))
    } else if (agreement === 'disagree') {
      confidence = Math.min(confidence, 0.75)
    }

    return {
      ...ai,
      confidence,
      engines: { plantnet: plantnet.length > 0, botanist: true },
      agreement,
      plantnetTop: plantnet,
    }
  })
