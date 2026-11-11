import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchData, loadCachedData, type AppData, type Venue } from './api'
import { distanceM } from './format'
import { hoursStatus, madridMinuteOfWeek, type HoursStatus } from './hours'

type Coords = { lat: number; lng: number; acc?: number }
export type LocState = 'unknown' | 'granted' | 'denied' | 'prompt'

type Ctx = {
  data: AppData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  me: Coords | null
  locState: LocState
  locate: (ask?: boolean) => Promise<Coords | null>
  saved: string[]
  toggleSaved: (id: string) => void
  ageOk: boolean | null
  confirmAge: () => void
}

const StoreCtx = createContext<Ctx | null>(null)
const SAVED_KEY = 'bfy-saved'
const AGE_KEY = 'bfy-age'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<Coords | null>(null)
  const [locState, setLocState] = useState<LocState>('unknown')
  const [saved, setSaved] = useState<string[]>([])
  const [ageOk, setAgeOk] = useState<boolean | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setData(await fetchData())
    } catch {
      setError('No hemos podido actualizar la guía. Revisa tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  const locate = useCallback(async (ask = false): Promise<Coords | null> => {
    try {
      let perm = await Location.getForegroundPermissionsAsync()
      if (!perm.granted && ask && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync()
      if (!perm.granted) {
        setLocState(perm.canAskAgain ? 'prompt' : 'denied')
        return null
      }
      setLocState('granted')
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const c = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy ?? undefined }
      setMe(c)
      return c
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const [cached, s, age] = await Promise.all([
        loadCachedData(),
        AsyncStorage.getItem(SAVED_KEY).catch(() => null),
        AsyncStorage.getItem(AGE_KEY).catch(() => null),
      ])
      if (cached) {
        setData(cached)
        setLoading(false)
      }
      if (s) setSaved(JSON.parse(s) as string[])
      setAgeOk(age === '1')
      refresh()
      locate(false)
    })()
  }, [refresh, locate])

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {})
      return next
    })
  }, [])

  const confirmAge = useCallback(() => {
    setAgeOk(true)
    AsyncStorage.setItem(AGE_KEY, '1').catch(() => {})
  }, [])

  const value = useMemo(
    () => ({ data, loading, error, refresh, me, locState, locate, saved, toggleSaved, ageOk, confirmAge }),
    [data, loading, error, refresh, me, locState, locate, saved, toggleSaved, ageOk, confirmAge]
  )
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore fuera de StoreProvider')
  return ctx
}

/** Minuto de la semana en hora de España; se actualiza cada minuto. */
export function useNow() {
  const [now, setNow] = useState(() => madridMinuteOfWeek())
  useEffect(() => {
    const t = setInterval(() => setNow(madridMinuteOfWeek()), 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}

export type NearVenue = Venue & { d: number | null; status: HoursStatus | null }

/** Bares ordenados por cercanía (si hay ubicación) o por nota. */
export function useNearby(limit?: number): NearVenue[] {
  const { data, me } = useStore()
  const now = useNow()
  return useMemo(() => {
    const list = (data?.venues ?? []).map((v) => ({
      ...v,
      d: me && v.lat !== null && v.lng !== null ? distanceM(me, { lat: v.lat, lng: v.lng }) : null,
      status: hoursStatus(v.hours, now),
    }))
    list.sort((a, b) => {
      if (a.d !== null && b.d !== null) return a.d - b.d
      if (a.score !== null && b.score !== null) return b.score - a.score
      return a.score !== null ? -1 : b.score !== null ? 1 : 0
    })
    return limit ? list.slice(0, limit) : list
  }, [data, me, limit, now])
}

export function useVenue(id: string | undefined) {
  const { data } = useStore()
  return data?.venues.find((v) => v.id === id) ?? null
}
