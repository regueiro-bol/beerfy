import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import type { OpeningPeriod } from './hours'

/** La app habla con la misma web (www.beerfy.es): mismos bares, mismas notas, mismas reglas. */
export const SITE = 'https://www.beerfy.es'
const API = `${SITE}/api/app`

export type City = { id: string; slug: string; name: string; region: string | null; latitude: number | null; longitude: number | null }
export type Venue = {
  id: string
  slug: string
  name: string
  address: string | null
  district: string | null
  lat: number | null
  lng: number | null
  city: { slug: string; name: string } | null
  url: string | null
  cover: string | null
  coverCredit: string | null
  score: number | null
  votes: number
  beers: string[]
  publishedAt: string | null
  /** Horario semanal (Google), para calcular «Abierto ahora» en el móvil. */
  hours: OpeningPeriod[] | null
}
export type Chapter = { slug: string; n: string; title: string; short: string; minutes: number; image: string | null; url: string }
export type AppData = { site: string; cities: City[]; venues: Venue[]; bodega: Chapter[]; egPage: string }

export type VenueDetail = {
  description: string | null
  descriptionReviewed: boolean
  address: string | null
  phone: string | null
  website: string | null
  mapsUri: string | null
  beers: Array<{
    name: string
    brewery: string
    style: string | null
    unpasteurized: boolean
    status: 'confirmada' | 'por_confirmar'
    source: 'equipo' | 'bar' | 'comunidad' | null
    lastConfirmedAt: string | null
  }>
  criteria: {
    temperature: number | null
    foam: number | null
    glass: number | null
    freshness: number | null
    votes: number
    comments: Array<{ comment: string; score: number; created_at: string }>
  }
  /** Datos de Google Maps (horario, nota, características). Pueden faltar. */
  google: {
    openNow: boolean | null
    weekdays: string[]
    rating: number | null
    ratingCount: number | null
    businessStatus: string | null
    features: string[]
  } | null
}

const CACHE_KEY = 'bfy-data-v1'
const INSTALL_KEY = 'bfy-install-id'

let installId: string | null = null
/** Identificador anónimo de esta instalación (para el límite de una nota por bar y día). */
export async function getInstallId() {
  if (installId) return installId
  try {
    installId = await AsyncStorage.getItem(INSTALL_KEY)
    if (!installId) {
      installId = Crypto.randomUUID()
      await AsyncStorage.setItem(INSTALL_KEY, installId)
    }
  } catch {
    installId = installId || Crypto.randomUUID()
  }
  return installId
}

async function headers() {
  return { 'Content-Type': 'application/json', 'X-Beerfy-Install': await getInstallId() }
}

/** Datos guardados de la última vez, para abrir al instante y funcionar sin cobertura. */
export async function loadCachedData(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as AppData) : null
  } catch {
    return null
  }
}

export async function fetchData(): Promise<AppData> {
  const res = await fetch(`${API}/data`, { headers: await headers() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as AppData
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {})
  return data
}

export async function fetchVenue(id: string): Promise<VenueDetail> {
  const res = await fetch(`${API}/venue/${id}`, { headers: await headers() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as VenueDetail
}

export type Result = { ok: boolean; error?: string; score?: number; pending?: boolean; ratingId?: string }

async function post(path: string, body: unknown): Promise<Result> {
  try {
    const res = await fetch(`${API}/${path}`, { method: 'POST', headers: await headers(), body: JSON.stringify(body) })
    const json = (await res.json().catch(() => null)) as Result | null
    return json ?? { ok: false, error: 'No hemos podido conectar. Inténtalo de nuevo.' }
  } catch {
    return { ok: false, error: 'Sin conexión. Comprueba tu cobertura e inténtalo de nuevo.' }
  }
}

export const submitRating = (body: {
  venue_id: string
  score_temperature: number
  score_foam: number
  score_glass: number
  score_freshness: number
  comment?: string
  lat: number
  lng: number
  acc?: number
}) => post('rate', body)

export const submitSuggestion = (body: {
  venue_name: string
  city_id?: string
  city_name?: string
  address?: string
  notes?: string
  notify?: boolean
  email?: string
}) => post('suggest', body)

export const savePushPrefs = (body: {
  token: string
  enabled: boolean
  platform?: string
  prefs?: Record<string, boolean>
  city_slug?: string | null
  saved?: string[]
}) => post('push', body)
