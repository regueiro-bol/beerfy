import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconCheck, IconPin } from '@/components/icons'
import { TopBar } from '@/components/top-bar'
import { Button, Loading } from '@/components/ui'
import { distanceM, formatDistance } from '@/lib/format'
import { pickPhoto, sendTankPhoto, type Picked, type PhotoResult } from '@/lib/photo'
import { useStore, useVenue } from '@/lib/store'
import { C, F } from '@/lib/theme'

/** Mismo margen que el servidor: 120 m del bar más la precisión del GPS (máx. 150 m). */
const RADIUS_M = 120

/** Confirmar el tanque con una foto hecha en el bar. */
export default function Verificar() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const v = useVenue(id)
  const { locate, locState } = useStore()
  const insets = useSafeAreaInsets()
  const [photo, setPhoto] = useState<Picked | null>(null)
  const [geo, setGeo] = useState<{ lat: number; lng: number; acc?: number } | null>(null)
  const [geoState, setGeoState] = useState<'locating' | 'ok' | 'far' | 'none'>('locating')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PhotoResult | null>(null)

  function evaluate(c: { lat: number; lng: number; acc?: number } | null) {
    if (!c || !v || v.lat === null || v.lng === null) {
      setGeo(c)
      setGeoState(c ? 'ok' : 'none')
      return
    }
    setGeo(c)
    setGeoState(distanceM(c, { lat: v.lat, lng: v.lng }) <= RADIUS_M + Math.min(c.acc ?? 0, 150) ? 'ok' : 'far')
  }
  function check() {
    setGeoState('locating')
    locate(true).then(evaluate)
  }
  useEffect(() => {
    if (v) locate(true).then(evaluate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.id])

  if (!v) return <Loading />

  async function choose(source: 'camera' | 'library') {
    setError(null)
    setResult(null)
    const p = await pickPhoto(source)
    if (!p) return
    if ('error' in p) setError(p.error)
    else setPhoto(p)
  }

  async function send() {
    if (!photo || !v) return
    setSending(true)
    setError(null)
    const c = (await locate(true)) ?? geo
    if (!c) {
      setSending(false)
      setGeoState('none')
      return
    }
    const r = await sendTankPhoto(photo, { venue_id: v.id, lat: c.lat, lng: c.lng, acc: c.acc ? Math.round(c.acc) : undefined })
    setSending(false)
    if (r.ok) setResult(r)
    else setError(r.message)
  }

  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: C.ink, padding: 24, paddingTop: insets.top + 40, gap: 18 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck color={C.ink} size={32} width={2.8} />
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 36, lineHeight: 38, color: C.cream }}>{result.status === 'confirmada' ? '¡Confirmado!' : '¡Gracias!'}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.sand }}>{result.message}</Text>
        <Button label={`Volver a ${v.name}`} variant="amber" onPress={() => router.back()} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      <TopBar close dark title={v.name} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 18, paddingBottom: 140 }}>
        <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 34, color: C.cream }}>¿Ves el tanque?</Text>
        <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.sand }}>
          Haz una foto en la que se vea bien el tanque o el grifo con el rótulo de bodega. Así mantenemos la guía al día.
        </Text>

        {geoState === 'ok' ? (
          <View style={{ backgroundColor: '#1F3B30', borderWidth: 1.5, borderColor: '#2F6B52', borderRadius: 20, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconPin color="#B9E4CC" size={24} width={2.2} />
            <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 15, color: C.cream }}>Estás en {v.name}</Text>
          </View>
        ) : geoState === 'locating' ? (
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.sand }}>Comprobando que estás en el bar…</Text>
        ) : (
          <View style={{ backgroundColor: '#3A1F17', borderWidth: 1.5, borderColor: '#7A3A26', borderRadius: 20, padding: 14, gap: 10 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{geoState === 'far' ? 'Parece que no estás en el bar' : 'Necesitamos tu ubicación'}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.sand }}>
              {geoState === 'far'
                ? `La foto hay que hacerla en el propio local${geo && v.lat !== null && v.lng !== null ? ` (estás a ${formatDistance(distanceM(geo, { lat: v.lat, lng: v.lng }))})` : ''}.`
                : 'Comprobamos que estás en el bar para que la confirmación sea de verdad. La ubicación no se guarda.'}
            </Text>
            {locState === 'denied' ? (
              <Button label="Abrir ajustes" variant="amber" style={{ height: 46 }} onPress={() => Linking.openSettings()} />
            ) : (
              <Button label="Volver a comprobar" variant="amber" style={{ height: 46 }} onPress={check} />
            )}
          </View>
        )}

        {photo ? (
          <View style={{ gap: 10 }}>
            <Image source={{ uri: photo.uri }} style={{ height: 340, borderRadius: 24 }} contentFit="cover" accessibilityLabel="Tu foto" />
            <Button label="Cambiar foto" variant="outline" textColor={C.cream} style={{ height: 46, borderColor: 'rgba(246,241,228,0.4)' }} onPress={() => choose('camera')} />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Button label="Hacer foto" variant="amber" onPress={() => choose('camera')} />
            <Button label="Elegir de la galería" variant="outline" textColor={C.cream} style={{ borderColor: 'rgba(246,241,228,0.4)' }} onPress={() => choose('library')} />
          </View>
        )}

        {error ? <Text style={{ fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: '#F2A08A' }}>{error}</Text> : null}

        <Text style={{ fontFamily: F.body, fontSize: 12, lineHeight: 18, color: '#A89F8B' }}>
          La foto solo la ve el equipo de Beerfy para verificar el bar: no se publica. Le quitamos la ubicación y los datos de la cámara. Una IA comprueba si se ve el tanque; si hay dudas, la revisa una persona.
        </Text>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: Math.max(insets.bottom, 12) + 8, backgroundColor: C.ink, borderTopWidth: 1, borderTopColor: '#2E281E' }}>
        <Button label={sending ? 'Revisando la foto…' : 'Enviar foto'} variant="amber" onPress={send} loading={sending} disabled={!photo || geoState === 'locating'} />
      </View>
    </View>
  )
}
