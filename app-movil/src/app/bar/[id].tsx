import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandMark } from '@/components/brand'
import { IconBack, IconBookmark, IconClock, IconGlobe, IconPhone, IconPin, IconPlus, IconShare } from '@/components/icons'
import { MiniMap } from '@/components/mini-map'
import { Button, HoursText, Loading, ScoreBadge } from '@/components/ui'
import { fetchVenue, type VenueDetail } from '@/lib/api'
import { distanceM, formatDistance, formatScore, MIN_VOTES, timeAgo } from '@/lib/format'
import { hoursStatus } from '@/lib/hours'
import { useNow, useStore, useVenue } from '@/lib/store'
import { C, F } from '@/lib/theme'

/** Mismos criterios y nombres que la ficha de la web. */
const CRIT: Array<{ key: 'temperature' | 'foam' | 'glass' | 'freshness'; name: string }> = [
  { key: 'temperature', name: 'Temperatura' },
  { key: 'foam', name: 'Espuma' },
  { key: 'glass', name: 'Vaso' },
  { key: 'freshness', name: 'Tanque / frescura' },
]

const card = { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, borderRadius: 26, padding: 20 } as const
const h2 = { fontFamily: F.display, fontSize: 24, color: C.ink } as const
const small = { fontFamily: F.body, fontSize: 11, lineHeight: 15, color: C.stone } as const

export default function Ficha() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const v = useVenue(id)
  const { me, saved, toggleSaved } = useStore()
  const insets = useSafeAreaInsets()
  const [detail, setDetail] = useState<VenueDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const now = useNow()

  useEffect(() => {
    if (!id) return
    fetchVenue(id)
      .then(setDetail)
      .catch(() => setFailed(true))
  }, [id])

  if (!v) return <Loading />
  const isSaved = saved.includes(v.id)
  const status = hoursStatus(v.hours, now)
  const d = me && v.lat !== null && v.lng !== null ? distanceM(me, { lat: v.lat, lng: v.lng }) : null
  const crit = detail?.criteria
  const g = detail?.google ?? null
  const closed = g?.businessStatus && g.businessStatus !== 'OPERATIONAL' ? g.businessStatus : null
  const shareText =
    v.score !== null
      ? `${v.name} tira la cerveza de bodega con un ${formatScore(v.score)} en Beerfy. ¿Vamos?`
      : `${v.name} tiene cerveza de bodega en tanque. ¿Vamos a por una caña?`
  const share = () => {
    if (v.url) Share.share({ message: `${shareText} ${v.url}`, url: v.url }).catch(() => {})
  }
  const round = (btn: React.ReactNode, label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(246,241,228,0.95)', alignItems: 'center', justifyContent: 'center' }}
    >
      {btn}
    </Pressable>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Portada */}
        <View style={{ height: 300, backgroundColor: C.ink }}>
          {v.cover ? (
            <Image source={{ uri: v.cover }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={150} accessibilityLabel={v.name} />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <BrandMark size={110} />
            </View>
          )}
          {v.coverCredit ? (
            <Text style={{ position: 'absolute', right: 12, bottom: 34, fontFamily: F.body, fontSize: 10, color: C.cream }}>Foto: {v.coverCredit} · Google</Text>
          ) : null}
          <View style={{ position: 'absolute', top: insets.top + 8, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
            {round(<IconBack color={C.ink} size={20} width={2.2} />, 'Volver', () => (router.canGoBack() ? router.back() : router.replace('/')))}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {round(<IconBookmark color={C.ink} size={20} filled={isSaved} />, isSaved ? 'Quitar de guardados' : 'Guardar', () => toggleSaved(v.id))}
              {round(<IconShare color={C.ink} size={20} />, 'Compartir', share)}
            </View>
          </View>
        </View>

        <View style={{ marginTop: -24, backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, gap: 22 }}>
          {/* Cabecera */}
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.bottle }}>
                {[v.city?.name, d !== null ? formatDistance(d) : null].filter(Boolean).join(' · ')}
              </Text>
              <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 36, letterSpacing: -0.8, color: C.ink }}>{v.name}</Text>
              {status ? (
                <HoursText status={status} size={14} />
              ) : g?.openNow != null ? (
                <Text style={{ fontFamily: F.semibold, fontSize: 14, color: g.openNow ? C.open : C.stone }}>{g.openNow ? 'Abierto ahora' : 'Cerrado ahora'}</Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <ScoreBadge score={v.score} votes={v.votes} big />
              <Text style={{ fontFamily: F.bold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: C.stone }}>
                {v.score !== null ? `${v.votes} votos` : `${v.votes}/${MIN_VOTES} votos`}
              </Text>
            </View>
          </View>

          {closed ? (
            <Text style={{ backgroundColor: '#FBE3DC', color: '#8A2A12', borderRadius: 12, padding: 10, fontFamily: F.semibold, fontSize: 14 }}>
              {closed === 'CLOSED_PERMANENTLY' ? 'Cerrado permanentemente' : 'Cerrado temporalmente'}
            </Text>
          ) : null}

          {!detail && !failed ? <ActivityIndicator color={C.amber} /> : null}
          {failed ? <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone }}>No hemos podido cargar todos los datos del bar. Revisa tu conexión.</Text> : null}

          {/* En tanque */}
          {detail && detail.beers.length > 0 ? (
            <View style={{ gap: 12 }}>
              <Text style={[h2, { fontSize: 28 }]}>En tanque</Text>
              {detail.beers.map((b) => (
                <View key={b.name} style={{ backgroundColor: C.foam, borderWidth: 1.5, borderColor: C.ink, borderRadius: 24, padding: 18, gap: 10 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {b.unpasteurized ? <Chip dark label="Sin pasteurizar" /> : null}
                    <Chip label="Tanque" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: F.display, fontSize: 24, color: C.ink }}>{b.name}</Text>
                    <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone }}>
                      {b.brewery}
                      {b.style ? ` · ${b.style}` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: F.body, fontSize: 12, color: C.stone }}>
                    {b.status === 'confirmada' ? 'Confirmada' : 'Por confirmar'}
                    {b.lastConfirmedAt ? ` ${timeAgo(b.lastConfirmedAt)}` : ''}
                    {b.source === 'equipo' ? ' por el equipo de Beerfy' : b.source === 'bar' ? ' por el propio bar' : ' por la comunidad'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Cómo la tiran */}
          <View style={{ backgroundColor: C.ink, borderRadius: 28, padding: 20, gap: 12 }}>
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.cream }}>Cómo la tiran</Text>
            {v.score === null ? (
              <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.sand }}>
                Nota en calibración: {v.votes} de {MIN_VOTES} puntuaciones. La nota aparece a partir de {MIN_VOTES}, para que dos o tres votos no decidan. Si estás en la barra, suma la tuya.
              </Text>
            ) : null}
            {crit && crit.votes > 0
              ? CRIT.map((c) => {
                  const val = crit[c.key]
                  return (
                    <View key={c.key} style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.cream }}>{c.name}</Text>
                        <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.amber }}>{val === null ? '—' : formatScore(val)}</Text>
                      </View>
                      <View style={{ height: 10, borderRadius: 5, backgroundColor: '#2E281E' }}>
                        <View style={{ height: 10, borderRadius: 5, backgroundColor: C.amber, width: `${val === null ? 0 : val * 10}%` }} />
                      </View>
                    </View>
                  )
                })
              : null}
            <Button
              label="Puntuar mi tirada"
              variant="amber"
              style={{ marginTop: 4, height: 48 }}
              onPress={() => router.push({ pathname: '/puntuar/[id]', params: { id: v.id } })}
            />
          </View>

          {/* Últimas tiradas */}
          {crit?.comments.length ? (
            <View style={{ gap: 10 }}>
              <Text style={h2}>Últimas tiradas</Text>
              {crit.comments.map((c, i) => (
                <View key={i} style={{ backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, borderRadius: 20, padding: 14, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.body, fontSize: 12, color: C.stone }}>{timeAgo(c.created_at)}</Text>
                    <ScoreBadge score={c.score} />
                  </View>
                  <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink }}>{c.comment}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Invitar */}
          <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>¿Con quién te la tomarías?</Text>
              <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone }}>Mándale este bar con su nota.</Text>
            </View>
            <Button label="Invitar" variant="amber" style={{ height: 46, paddingHorizontal: 16 }} icon={<IconShare color={C.ink} size={18} />} onPress={share} />
          </View>

          {/* Sobre este bar */}
          <View style={{ gap: 10 }}>
            <Text style={[h2, { fontSize: 28 }]}>Sobre este bar</Text>
            <Text style={{ fontFamily: F.serif, fontSize: 20, lineHeight: 30, color: '#26231C' }}>{detail?.description || 'Descripción en preparación.'}</Text>
            {detail?.description ? (
              <Text style={small}>
                {detail.descriptionReviewed
                  ? 'Descripción redactada con asistencia de IA y revisada por el equipo de Beerfy.'
                  : 'Descripción redactada con asistencia de IA a partir de fuentes públicas; pendiente de revisión.'}
              </Text>
            ) : null}
          </View>

          {v.lat !== null && v.lng !== null ? <MiniMap lat={v.lat} lng={v.lng} name={v.name} /> : null}

          {/* Cómo llegar */}
          <View style={{ backgroundColor: C.ink, borderRadius: 28, padding: 22, gap: 14 }}>
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.cream }}>Cómo llegar</Text>
            {detail?.address ?? v.address ? (
              <Row icon={<IconPin color={C.amber} size={20} />} text={(detail?.address ?? v.address) as string} />
            ) : null}
            {detail?.phone ? (
              <Row icon={<IconPhone color={C.amber} size={20} />} text={detail.phone} onPress={() => Linking.openURL(`tel:${detail.phone!.replace(/\s/g, '')}`)} />
            ) : null}
            {detail?.website ? (
              <Row icon={<IconGlobe color={C.amber} size={20} />} text="Web del local" onPress={() => Linking.openURL(detail.website!)} />
            ) : null}
            {detail?.mapsUri ? <Button label="Abrir en Google Maps" variant="amber" style={{ marginTop: 4 }} onPress={() => Linking.openURL(detail.mapsUri!)} /> : null}
          </View>

          {/* El local (Google) */}
          {g && g.features.length > 0 ? (
            <View style={[card, { gap: 14 }]}>
              <Text style={h2}>El local</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {g.features.map((f) => (
                  <View key={f} style={{ backgroundColor: C.cream, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
                    <Text style={{ fontFamily: F.semibold, fontSize: 14, color: '#26231C' }}>{f}</Text>
                  </View>
                ))}
              </View>
              <Text style={small}>Datos de Google Maps. Pueden no estar al día.</Text>
            </View>
          ) : null}

          {/* Nota de Google y horario */}
          {g && (g.rating !== null || g.weekdays.length > 0) ? (
            <View style={[card, { gap: 14 }]}>
              {g.rating !== null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 16 }}>
                  <Text style={{ fontFamily: F.display, fontSize: 34, color: C.ink }}>{g.rating.toFixed(1).replace('.', ',')}</Text>
                  <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone }}>
                    sobre 5 en Google{g.ratingCount ? `\n${g.ratingCount.toLocaleString('es-ES')} reseñas` : ''}
                  </Text>
                </View>
              ) : null}
              {g.weekdays.length > 0 ? (
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <IconClock color={C.copper} size={20} />
                      <Text style={h2}>Horario</Text>
                    </View>
                    {g.openNow != null ? (
                      <Text
                        style={{
                          fontFamily: F.bold,
                          fontSize: 12,
                          overflow: 'hidden',
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          backgroundColor: g.openNow ? '#DDF3E5' : '#F3EEE2',
                          color: g.openNow ? '#1F6B3E' : C.stone,
                        }}
                      >
                        {g.openNow ? 'Abierto ahora' : 'Cerrado ahora'}
                      </Text>
                    ) : null}
                  </View>
                  {g.weekdays.map((w, i) => {
                    const k = w.indexOf(':')
                    return (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, borderBottomWidth: i < g.weekdays.length - 1 ? 1 : 0, borderBottomColor: C.line, paddingBottom: 6 }}>
                        <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink, textTransform: 'capitalize' }}>{w.substring(0, k)}</Text>
                        <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone, textAlign: 'right', flexShrink: 1 }}>{w.substring(k + 1).trim()}</Text>
                      </View>
                    )
                  })}
                </View>
              ) : null}
              <Text style={small}>Horario y puntuación de Google Maps. No son valoraciones de Beerfy ni miden la tirada.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Barra fija inferior */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 12) + 4,
          backgroundColor: C.paper,
          borderTopWidth: 1,
          borderTopColor: C.line,
        }}
      >
        <Button
          label="Puntuar mi tirada"
          variant="amber"
          icon={<IconPlus color={C.ink} size={20} width={2.4} />}
          onPress={() => router.push({ pathname: '/puntuar/[id]', params: { id: v.id } })}
        />
      </View>
    </View>
  )
}

function Chip({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <View style={{ backgroundColor: dark ? C.bottle : C.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: dark ? C.cream : C.ink }}>{label}</Text>
    </View>
  )
}

function Row({ icon, text, onPress }: { icon: React.ReactNode; text: string; onPress?: () => void }) {
  const body = (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: 24 }}>
      {icon}
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.cream, textDecorationLine: onPress ? 'underline' : 'none' }}>{text}</Text>
    </View>
  )
  return onPress ? (
    <Pressable accessibilityRole="link" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center' }}>
      {body}
    </Pressable>
  ) : (
    body
  )
}
