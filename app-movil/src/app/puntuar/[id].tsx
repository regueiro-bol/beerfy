import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconCheck, IconPin } from '@/components/icons'
import { TopBar } from '@/components/top-bar'
import { Button, Loading } from '@/components/ui'
import { submitRating } from '@/lib/api'
import { distanceM, formatDistance, formatScore } from '@/lib/format'
import { useStore, useVenue } from '@/lib/store'
import { C, F } from '@/lib/theme'

/** Mismos criterios, escala (1–5) y textos que la web. */
const CRITERIA = [
  { key: 'score_temperature', name: 'Temperatura', hint: 'Fría, pero que sepa' },
  { key: 'score_foam', name: 'Espuma', hint: 'Dos dedos, cremosa y que aguante' },
  { key: 'score_glass', name: 'Vaso', hint: 'Limpio, frío y enjuagado' },
  { key: 'score_freshness', name: 'Frescura', hint: '¿Sabe a recién llegada del tanque?' },
] as const
const LABELS = ['Mal', 'Flojo', 'Bien', 'Muy bien', 'Top']
type Key = (typeof CRITERIA)[number]['key']

/** El servidor deja puntuar a 120 m del bar más la precisión del GPS (máx. 150 m). */
const RADIUS_M = 120

export default function Puntuar() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const v = useVenue(id)
  const { locate, locState, refresh } = useStore()
  const insets = useSafeAreaInsets()
  const [vals, setVals] = useState<Record<Key, number>>({ score_temperature: 0, score_foam: 0, score_glass: 0, score_freshness: 0 })
  const [comment, setComment] = useState('')
  const [geo, setGeo] = useState<{ lat: number; lng: number; acc?: number } | null>(null)
  const [geoState, setGeoState] = useState<'locating' | 'ok' | 'far' | 'none'>('locating')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; pending: boolean } | null>(null)

  function evaluate(c: { lat: number; lng: number; acc?: number } | null) {
    if (!c || !v || v.lat === null || v.lng === null) {
      setGeo(null)
      setGeoState('none')
      return
    }
    setGeo(c)
    const d = distanceM(c, { lat: v.lat, lng: v.lng })
    setGeoState(d <= RADIUS_M + Math.min(c.acc ?? 0, 150) ? 'ok' : 'far')
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
  const done = Object.values(vals).every((x) => x > 0)
  const avg = done ? (Object.values(vals).reduce((a, b) => a + b, 0) / 4) * 2 : null

  async function send() {
    if (!v) return
    setSending(true)
    setError(null)
    const c = (await locate(true)) ?? geo
    if (!c) {
      setSending(false)
      setGeoState('none')
      return
    }
    const res = await submitRating({ venue_id: v.id, ...vals, comment: comment.trim() || undefined, lat: c.lat, lng: c.lng, acc: c.acc ? Math.round(c.acc) : undefined })
    setSending(false)
    if (res.ok) {
      setResult({ score: res.score ?? avg ?? 0, pending: !!res.pending })
      refresh()
    } else setError(res.error ?? 'No hemos podido guardar tu nota.')
  }

  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: C.ink, padding: 24, paddingTop: insets.top + 40, gap: 18 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck color={C.ink} size={32} width={2.8} />
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 36, lineHeight: 38, color: C.cream }}>¡Tirada puntuada!</Text>
        <Text style={{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.sand }}>
          Le has dado un <Text style={{ fontFamily: F.display, color: C.amber }}>{formatScore(result.score)}</Text> a la caña de {v.name}.
          {result.pending ? ' La revisaremos antes de que cuente para su nota.' : ' Ya cuenta para su nota.'}
        </Text>
        <Button
          label="Compartir mi tirada"
          variant="amber"
          onPress={() => {
            if (v.url) Share.share({ message: `Le he dado un ${formatScore(result.score)} a la caña de ${v.name}. ¿Y a ti, cómo te la tiran? ${v.url}` }).catch(() => {})
          }}
        />
        <Button label="Volver al bar" variant="outline" style={{ borderColor: 'rgba(246,241,228,0.4)' }} textColor={C.cream} onPress={() => router.back()} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.ink }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar close dark title={v.name} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 18, paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        {geoState === 'ok' ? (
          <View style={{ backgroundColor: '#1F3B30', borderWidth: 1.5, borderColor: '#2F6B52', borderRadius: 20, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconPin color="#B9E4CC" size={24} width={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>Estás en {v.name}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: '#B9E4CC' }}>Ubicación comprobada · tu nota cuenta</Text>
            </View>
          </View>
        ) : geoState === 'locating' ? (
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.sand }}>Comprobando que estás en el bar…</Text>
        ) : (
          <View style={{ backgroundColor: '#3A1F17', borderWidth: 1.5, borderColor: '#7A3A26', borderRadius: 20, padding: 14, gap: 10 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>
              {geoState === 'far' ? 'Parece que no estás en el bar' : 'Necesitamos tu ubicación'}
            </Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.sand }}>
              {geoState === 'far'
                ? `Solo se puede puntuar desde el propio local, con la caña delante${geo && v.lat !== null && v.lng !== null ? ` (estás a ${formatDistance(distanceM(geo, { lat: v.lat, lng: v.lng }))})` : ''}.`
                : 'Comprobamos que estás en el bar para que las notas sean de verdad. La ubicación no se guarda.'}
            </Text>
            {locState === 'denied' ? (
              <Button label="Abrir ajustes" variant="amber" style={{ height: 46 }} onPress={() => Linking.openSettings()} />
            ) : (
              <Button label="Volver a comprobar" variant="amber" style={{ height: 46 }} onPress={check} />
            )}
          </View>
        )}

        <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.cream }}>¿Cómo te la han tirado?</Text>

        {CRITERIA.map((c) => (
          <View key={c.key} style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={c.name}>
            <View>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>{c.name}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: '#A89F8B' }}>{c.hint}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {LABELS.map((label, i) => {
                const n = i + 1
                const on = vals[c.key] === n
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${c.name}: ${label}`}
                    onPress={() => setVals((p) => ({ ...p, [c.key]: n }))}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? C.amber : '#1E1A14',
                      borderWidth: 1.5,
                      borderColor: on ? C.amber : '#3D362A',
                    }}
                  >
                    <Text style={{ fontFamily: F.display, fontSize: 16, color: on ? C.ink : C.cream }}>{n}</Text>
                    <Text style={{ fontFamily: F.semibold, fontSize: 10, color: on ? C.ink : '#A89F8B' }}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))}

        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }} nativeID="l-comment">
            Un comentario (opcional)
          </Text>
          <TextInput
            accessibilityLabelledBy="l-comment"
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            multiline
            placeholder="La espuma, el vaso, el ambiente…"
            placeholderTextColor="#7D7462"
            style={{ minHeight: 90, borderRadius: 14, borderWidth: 1.5, borderColor: '#3D362A', backgroundColor: '#1E1A14', padding: 12, fontFamily: F.body, fontSize: 15, color: C.cream, textAlignVertical: 'top' }}
          />
        </View>
        {error ? <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#F2A08A' }}>{error}</Text> : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: Math.max(insets.bottom, 12) + 8, backgroundColor: C.ink, gap: 10, borderTopWidth: 1, borderTopColor: '#2E281E' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.sand }}>Tu nota</Text>
          <Text style={{ fontFamily: F.display, fontSize: 32, color: C.amber }}>{avg === null ? '—' : formatScore(avg)}</Text>
        </View>
        <Button label="Enviar mi nota" variant="amber" onPress={send} loading={sending} disabled={!done || geoState === 'locating'} />
      </View>
    </KeyboardAvoidingView>
  )
}
