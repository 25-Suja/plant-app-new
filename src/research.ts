// Plant research: facts come from iNaturalist (taxonomy, photos, conservation status)
// and Wikipedia (history, description, habitat, uses). Text is shown as written by its source;
// nothing is generated or invented here.

import { getJson, qs } from './inat'
import { timeoutSignal } from './safe'

const API = 'https://api.inaturalist.org/v1'
const PLANTAE_TAXON_ID = 47126

export type TaxonHit = {
  id: number
  name: string
  commonName?: string
  rank: string
  matchedTerm?: string
  photo?: string
}

export type WikiSection = { heading: string; level: number; text: string }

export type Research = {
  taxonId: number
  scientificName: string
  commonName?: string
  rank: string
  lineage: { rank: string; name: string }[]
  family?: string
  conservation?: string
  observations?: number
  photos: { url: string; credit: string }[]
  inatUrl: string
  wikiTitle?: string
  wikiUrl?: string
  lead?: string
  sections: WikiSection[]
  fallbackSummary?: string
}

export async function searchPlants(query: string): Promise<TaxonHit[]> {
  const q = query.trim()
  if (!q) return []
  let json = await getJson(`${API}/taxa?${qs({ q, taxon_id: PLANTAE_TAXON_ID, per_page: 6 })}`)
  let results: any[] = json.results ?? []
  if (!results.length) {
    json = await getJson(`${API}/taxa?${qs({ q, per_page: 6 })}`)
    results = json.results ?? []
  }
  return results.map((t) => ({
    id: t.id,
    name: t.name,
    commonName: t.preferred_common_name,
    rank: t.rank,
    matchedTerm: t.matched_term,
    photo: t.default_photo?.square_url,
  }))
}

const SKIP = /^(references?|external links?|see also|further reading|notes?|bibliography|footnotes?|sources?|citations?|gallery|general references|cited works)$/i

function parseExtract(text: string): { lead: string; sections: WikiSection[] } {
  const lines = text.split(/\r?\n/)
  const sections: WikiSection[] = []
  let lead: string[] = []
  let current: { heading: string; level: number; body: string[] } | null = null
  const flush = () => {
    if (current) {
      const body = current.body.join('\n').trim()
      if (body && !SKIP.test(current.heading)) sections.push({ heading: current.heading, level: current.level, text: body })
    }
  }
  for (const line of lines) {
    const m = line.match(/^(={2,6})\s*(.+?)\s*\1\s*$/)
    if (m) {
      flush()
      current = { heading: m[2], level: m[1].length, body: [] }
    } else if (current) current.body.push(line)
    else lead.push(line)
  }
  flush()
  return { lead: lead.join('\n').trim(), sections }
}

async function fetchWikipedia(title: string, host: string) {
  const url =
    `https://${host}/w/api.php?` +
    qs({
      action: 'query',
      format: 'json',
      origin: '*',
      redirects: 1,
      prop: 'extracts|info',
      inprop: 'url',
      explaintext: 1,
      exsectionformat: 'wiki',
      titles: title,
    })
  const res = await fetch(url, { signal: timeoutSignal(15000) })
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)
  const json = await res.json()
  const page: any = Object.values(json?.query?.pages ?? {})[0]
  if (!page || page.missing !== undefined || !page.extract) return null
  return { title: page.title as string, url: page.fullurl as string, ...parseExtract(page.extract as string) }
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

export async function loadResearch(taxonId: number): Promise<Research> {
  const detail = await getJson(`${API}/taxa/${taxonId}`)
  const t = detail.results?.[0]
  if (!t) throw new Error('iNaturalist did not return that plant.')

  const lineage = (t.ancestors ?? []).map((a: any) => ({ rank: a.rank, name: a.name }))
  const family = lineage.find((a: any) => a.rank === 'family')?.name

  let wiki: Awaited<ReturnType<typeof fetchWikipedia>> = null
  try {
    let host = 'en.wikipedia.org'
    let title: string | undefined
    if (t.wikipedia_url) {
      const u = new URL(t.wikipedia_url)
      if (u.hostname.endsWith('wikipedia.org')) host = u.hostname
      title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, '')).replace(/_/g, ' ')
    }
    wiki = await fetchWikipedia(title ?? t.name, host)
    if (!wiki && title) wiki = await fetchWikipedia(t.name, 'en.wikipedia.org')
  } catch {
    wiki = null
  }

  const photos = (t.taxon_photos ?? [])
    .slice(0, 6)
    .map((p: any) => ({ url: p.photo?.medium_url ?? p.photo?.url, credit: p.photo?.attribution ?? '' }))
    .filter((p: any) => p.url)

  return {
    taxonId,
    scientificName: t.name,
    commonName: t.preferred_common_name,
    rank: t.rank,
    lineage,
    family,
    conservation: t.conservation_status?.status_name ?? t.conservation_status?.status,
    observations: t.observations_count,
    photos,
    inatUrl: `https://www.inaturalist.org/taxa/${taxonId}`,
    wikiTitle: wiki?.title,
    wikiUrl: wiki?.url,
    lead: wiki?.lead,
    sections: wiki?.sections ?? [],
    fallbackSummary: t.wikipedia_summary ? stripHtml(String(t.wikipedia_summary)) : undefined,
  }
}

export type Topic = 'looks' | 'where' | 'history' | 'uses' | 'more'

const TOPIC_RULES: [Topic, RegExp][] = [
  ['looks', /descri|appearance|morpholog|characteristic|identif|leaves|foliage|flower|fruit|seed|stem|root|bark|anatomy|growth habit|form/i],
  ['where', /distribut|habitat|range|ecolog|native|introduc|invasi|spread|climate|environment|occurrence|biolog|reproduc|life cycle|pollinat|disperse/i],
  ['history', /histor|etymolog|taxonom|nam(e|ing)|classif|discover|origin|evolution|phylogen|synonym|cultural|symbol/i],
  ['uses', /use|toxic|poison|medic|culinary|edible|cultivat|horticultur|ornamental|control|manage|eradicat|removal|safety|health|hazard|pest|threat|conservation|legal|status/i],
]

export function topicOf(heading: string): Topic {
  for (const [topic, re] of TOPIC_RULES) if (re.test(heading)) return topic
  return 'more'
}
