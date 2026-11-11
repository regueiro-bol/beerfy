import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Share, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandMark } from '@/components/brand'
import { IconBack, IconBookmark, IconNavigate, IconPlus, IconShare } from '@/components/icons'
import { Body, Button, H2, Loading, ScoreBadge } from '@/components/ui'
import { fetchVenue, type VenueDetail } from '@/lib/api'
import { distanceM, formatDistance, formatScore, MIN_VOTES, timeAgo } from '@/lib/format'
import { openDirections } from '@/lib/links'
import { useStore, useVenue } from '@/lib/store'
import { C, F } from '@/lib/theme'

const CRIT: { key: 'temperature' | 'foam' | 'glass' | 'freshness'; name: string }[] = [
  { key: 'temperature', name: 'Temperatura' },
  { key: 'foam', name: 'Espuma' },
  { key: 'glass', name: 'Vaso' },
  { key: 'freshness', name: 'Frescura' },
]

export default function Ficha() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const v = useVenue(id)
  const { me, saved, toggleSaved } = useStore()
  const insets = useSafeAreaInsets()
  const [detail, setDetail] = useState<VenueDetail | null>(null)

  useEffect(() => {
    if (id) fetchVenue(id).then(setDetail).catch(() => {})
  }, [id])

  if (!v) return <Loading />
  const isSaved = saved.includes(v.id)
  const d = me && v.lat !== null && v.lng !== null ? distanceM(me, { lat: v.lat, lng: v.lng }) : null
  const crit = detail?.criteria
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
              {round(<IconShare color={C.ink} size={20} />, 'Compartir', () => {
                if (v.url) Share.share({ message: `${v.name}: ¿cómo te tiran la caña? ${v.url}`, url: v.url }).catch(() => {})
              })}
            </View>
          </View>
        </View>

        <View style={{ marginTop: -24, backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, gap: 18 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.bottle }}>
                {[v.city?.name, d !== null ? formatDistance(d) : null].filter(Boolean).join(' · ')}
              </Text>
              <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 34, letterSpacing: -0.8, color: C.ink }}>{v.name}</Text>
              {v.address ? <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone }}>{v.address}</Text> : null}
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <ScoreBadge score={v.score} votes={v.votes} big />
              <Text style={{ fontFamily: F.bold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: C.stone }}>
                {v.score !== null ? `${v.votes} votos` : `${v.votes}/${MIN_VOTES} votos`}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(detail?.beers.length ? detail.beers.map((b) => b.name) : v.beers).map((b) => (
              <View key={b} style={{ backgroundColor: C.bottle, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.cream }}>{b}</Text>
              </View>
            ))}
          </View>

          {v.score === null ? (
            <View style={{ backgroundColor: C.foam, borderRadius: 20, borderWidth: 1.5, borderColor: '#EADFC4', padding: 16, gap: 4 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>Nota en calibración · {v.votes} de {MIN_VOTES}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.stone }}>
                La nota aparece a partir de {MIN_VOTES} puntuaciones, para que dos o tres votos no decidan. Si estás en la barra, suma la tuya.
              </Text>
            </View>
          ) : null}

          {crit && crit.votes > 0 ? (
            <View style={{ backgroundColor: C.ink, borderRadius: 24, padding: 18, gap: 12 }}>
              <Text style={{ fontFamily: F.display, fontSize: 19, color: C.cream }}>Cómo la tiran</Text>
              {CRIT.map((c) => {
                const val = crit[c.key]
                return (
                  <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ width: 100, fontFamily: F.semibold, fontSize: 13, color: C.cream }}>{c.name}</Text>
                    <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#2E281E' }}>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.amber, width: `${val === null ? 0 : val * 10}%` }} />
                    </View>
                    <Text style={{ width: 32, textAlign: 'right', fontFamily: F.bold, fontSize: 13, color: C.amber }}>{val === null ? '—' : formatScore(val)}</Text>
                  </View>
                )
              })}
            </View>
          ) : null}

          {detail?.description ? (
            <View style={{ gap: 6 }}>
              <H2>El bar</H2>
              <Body>{detail.description}</Body>
            </View>
          ) : null}

          {crit?.comments.length ? (
            <View style={{ gap: 10 }}>
              <H2>Últimas tiradas</H2>
              {crit.comments.map((c, i) => (
                <View key={i} style={{ backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, borderRadius: 18, padding: 14, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.body, fontSize: 12, color: C.stone }}>{timeAgo(c.created_at)}</Text>
                    <ScoreBadge score={c.score} />
                  </View>
                  <Text style={{ fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink }}>{c.comment}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 12) + 4, backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cómo llegar"
          onPress={() => openDirections(v.lat, v.lng, v.name)}
          style={{ width: 56, height: 54, borderRadius: 18, borderWidth: 1.5, borderColor: C.sand, alignItems: 'center', justifyContent: 'center' }}
        >
          <IconNavigate color={C.ink} size={22} width={2.2} />
        </Pressable>
        <Button
          label="Puntuar mi tirada"
          style={{ flex: 1 }}
          icon={<IconPlus color={C.amber} size={20} width={2.4} />}
          onPress={() => router.push({ pathname: '/puntuar/[id]', params: { id: v.id } })}
        />
      </View>
    </View>
  )
}
