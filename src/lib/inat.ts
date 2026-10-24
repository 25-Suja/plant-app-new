// iNaturalist API helpers (ported from the original desktop app).
// The public iNaturalist API allows browser requests, so these run client-side.

import { isConfirmedInvasive } from './plants'

const API = 'https://api.inaturalist.org/v1'
const ADMINISTRATIVE_PLACE_TYPE = 8

export type Place = { id: number; name: string; displayName: string }
export type MapStatus = 'native' | 'introduced' | 'invasive' | 'unknown'

async function getJson(url: string, retries = 2): Promise<any> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      lastError = error
      if (attempt < retries) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
    }
  }
  throw lastError
}

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

export async function searchLocation(query: string): Promise<Place[]> {
  const q = query.trim()
  if (!q) return []
  const queries = [q]
  const cityOnly = q.split(',')[0].trim()
  if (cityOnly && cityOnly.toLowerCase() !== q.toLowerCase()) queries.push(cityOnly)

  const seen = new Set<number>()
  const places: Place[] = []
  for (const term of queries) {
    const json = await getJson(`${API}/places/autocomplete?${qs({ q: term, per_page: 50 })}`)
    for (const p of json.results ?? []) {
      if (!p.id || seen.has(p.id) || p.place_type !== ADMINISTRATIVE_PLACE_TYPE) continue
      seen.add(p.id)
      places.push({ id: p.id, name: p.name ?? 'Unknown', displayName: p.display_name ?? p.name })
    }
  }
  return places
}

function readEstablishment(taxon: any): string | null {
  const est = taxon?.establishment_means
  if (typeof est === 'string') return est.toLowerCase()
  if (est && typeof est === 'object') {
    if (est.endemic) return 'endemic'
    if (est.establishment_means) return String(est.establishment_means).toLowerCase()
  }
  return null
}

async function lookupAtPlace(species: string, placeId: number): Promise<string | null> {
  const json = await getJson(
    `${API}/taxa?${qs({ q: species, place_id: placeId, rank: 'species', per_page: 1 })}`,
  )
  const taxon = json.results?.[0]
  if (!taxon) return null
  const status = readEstablishment(taxon)
  if (status) return status
  if (taxon.id) {
    const detail = await getJson(`${API}/taxa/${taxon.id}?${qs({ place_id: placeId })}`)
    for (const t of detail.results ?? []) {
      const s = readEstablishment(t)
      if (s) return s
    }
  }
  return null
}

/** Returns the iNaturalist establishment status for a species at a place (falls back to the country). */
export async function checkNativeStatus(species: string, placeId: number): Promise<string> {
  try {
    const status = await lookupAtPlace(species, placeId)
    if (status) return status
    const place = (await getJson(`${API}/places/${placeId}`)).results?.[0]
    const ancestors: number[] = place?.ancestor_place_ids ?? []
    if (ancestors.length >= 2) {
      const country = await lookupAtPlace(species, ancestors[ancestors.length - 2])
      if (country) return country
    }
    return 'unknown / not recorded'
  } catch {
    return 'error checking status'
  }
}

export type MapRegion = {
  placeId: number
  name: string
  status: MapStatus
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: any }
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: (R | undefined)[] = new Array(items.length)
  let next = 0
  let failed = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        try {
          out[i] = await fn(items[i])
        } catch {
          failed++
        }
      }
    }),
  )
  return { results: out, failed }
}

function toMapStatus(recorded: string | null, scientificName: string): MapStatus {
  if (recorded === 'native' || recorded === 'endemic') return 'native'
  if (isConfirmedInvasive(scientificName)) return 'invasive'
  if (recorded === 'introduced' || recorded === 'naturalized') return 'introduced'
  return 'unknown'
}

export async function buildPlantMap(
  plantName: string,
  onProgress?: (message: string) => void,
): Promise<{ scientificName: string; commonName?: string; regions: MapRegion[]; message: string }> {
  const query = plantName.trim()
  const taxa = await getJson(`${API}/taxa?${qs({ q: query, rank: 'species', per_page: 1 })}`)
  const taxon = taxa.results?.[0]
  if (!taxon?.id) throw new Error(`No iNaturalist species found for "${query}".`)
  const scientificName: string = taxon.name ?? query

  onProgress?.(`Found ${scientificName}. Gathering research-grade observations…`)
  const obs = await getJson(
    `${API}/observations?${qs({
      taxon_id: taxon.id,
      geo: 'true',
      per_page: 200,
      order: 'desc',
      quality_grade: 'research',
    })}`,
  )
  const counts = new Map<number, number>()
  for (const o of obs.results ?? []) {
    for (const id of o.place_ids ?? []) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  if (!counts.size) throw new Error(`No geotagged research-grade observations found for ${scientificName}.`)

  // Status records listed on the taxon itself cover most places in one request.
  const detail = await getJson(`${API}/taxa/${taxon.id}`)
  const listed = new Map<number, string>()
  for (const lt of detail.results?.[0]?.listed_taxa ?? []) {
    const id = lt.place?.id ?? lt.place_id
    if (id && lt.establishment_means) listed.set(id, String(lt.establishment_means).toLowerCase())
  }

  const topPlaces = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100).map(([id]) => id)

  // Fetch place geometries in batches and keep only states/provinces.
  onProgress?.('Loading state and province boundaries…')
  const places: any[] = []
  for (let i = 0; i < topPlaces.length; i += 25) {
    const batch = topPlaces.slice(i, i + 25)
    const json = await getJson(`${API}/places/${batch.join(',')}`)
    places.push(...(json.results ?? []))
  }
  const admin = places.filter(
    (p) => p.place_type === ADMINISTRATIVE_PLACE_TYPE && p.geometry_geojson?.coordinates,
  )

  onProgress?.(`Checking status in ${admin.length} regions…`)
  const { results, failed } = await pool(admin, 6, async (p) => {
    const recorded = listed.get(p.id) ?? (await lookupAtPlace(scientificName, p.id))
    return {
      placeId: p.id,
      name: p.display_name ?? p.name,
      status: toMapStatus(recorded, scientificName),
      geometry: p.geometry_geojson,
    } satisfies MapRegion
  })
  const regions = results.filter((r): r is MapRegion => !!r)
  if (!regions.length) {
    throw new Error(`No state or province boundaries with recorded status were available for ${scientificName}.`)
  }
  let message = `${scientificName}: ${regions.length} state/province regions filled from iNaturalist status records.`
  if (failed) message += ` ${failed} region request(s) failed.`
  return {
    scientificName,
    commonName: taxon.preferred_common_name,
    regions,
    message,
  }
}
