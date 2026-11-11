import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BrandTile } from '@/components/brand'
import { IconBell, IconNavigate, IconPin, IconPlusCircle } from '@/components/icons'
import { Body, Button, H1, H2, Kicker, Loading, VenueRow, s } from '@/components/ui'
import { formatDistance, formatScore, scoreLabel } from '@/lib/format'
import { useNearby, useStore } from '@/lib/store'
import { openDirections } from '@/lib/links'
import { C, F } from '@/lib/theme'

export default function Home() {
  const { data, loading, error, refresh, me, locState, locate } = useStore()
  const nearby = useNearby(6)
  const top = nearby[0]

  if (loading && !data) return <Loading />

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refresh(); locate(false) }} tintColor={C.amber} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BrandTile size={40} />
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.ink }}>Beerfy</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Avisos"
            onPress={() => router.push('/avisos')}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}
          >
            <IconBell color={C.ink} size={20} />
          </Pressable>
        </View>

        <View style={{ gap: 6 }}>
          <H1>¿Dónde te tiran bien la caña?</H1>
          <Body>La guía de los bares con cerveza de bodega, puntuados por quien está en la barra.</Body>
        </View>

        {error && !data ? <Body style={{ color: C.error }}>{error}</Body> : null}

        {!me ? (
          <View style={{ backgroundColor: C.bottle, borderRadius: 24, padding: 20, gap: 12 }}>
            <IconPin color={C.amber} size={28} width={2.2} />
            <Text style={{ fontFamily: F.display, fontSize: 22, color: C.cream }}>Los bares más cerca de ti</Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.sand }}>
              {locState === 'denied'
                ? 'Has desactivado la ubicación para Beerfy. Puedes activarla en los ajustes del móvil.'
                : 'Usamos tu ubicación solo en el móvil para ordenar los bares por distancia. No se guarda.'}
            </Text>
            {locState === 'denied' ? (
              <Button label="Abrir ajustes" variant="amber" onPress={() => Linking.openSettings()} />
            ) : (
              <Button label="Activar ubicación" variant="amber" onPress={() => locate(true)} />
            )}
          </View>
        ) : top ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/bar/[id]', params: { id: top.id } })}
            style={{ backgroundColor: C.ink, borderRadius: 26, overflow: 'hidden' }}
            accessibilityLabel={`La más cercana: ${top.name}`}
          >
              {top.cover ? <Image source={{ uri: top.cover }} style={{ height: 150 }} contentFit="cover" transition={150} /> : null}
              <View style={{ padding: 18, gap: 8 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber }}>
                  La más cercana{top.d !== null ? ` · ${formatDistance(top.d)}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ flex: 1, fontFamily: F.display, fontSize: 26, color: C.cream }} numberOfLines={2}>
                    {top.name}
                  </Text>
                  {top.score !== null ? (
                    <View style={[s.badge]}>
                      <Text style={s.badgeText}>{formatScore(top.score)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ fontFamily: F.body, fontSize: 14, color: C.sand }}>
                  {top.beers.join(' · ')} · {scoreLabel(top.score, top.votes)}
                </Text>
                <Button
                  label="Llévame"
                  variant="amber"
                  icon={<IconNavigate color={C.ink} size={18} width={2.4} />}
                  onPress={() => openDirections(top.lat, top.lng, top.name)}
                  style={{ marginTop: 6, height: 48 }}
                />
              </View>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H2>{me ? 'Cerca de ti' : 'Los mejor puntuados'}</H2>
          <Pressable accessibilityRole="link" onPress={() => router.push('/cerca')} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.bottle }}>Ver mapa</Text>
          </Pressable>
        </View>
        <View style={{ gap: 10 }}>
          {(me ? nearby.slice(1) : nearby).map((v) => (
            <VenueRow key={v.id} v={v} />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sugerir')}
          style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sand, borderRadius: 22, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' }}
        >
          <IconPlusCircle color={C.bottle} size={30} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>¿Conoces un bar con tanque?</Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, color: C.stone }}>Sugiérelo y lo añadimos a la guía.</Text>
          </View>
        </Pressable>

        <Kicker style={{ color: C.stone, textAlign: 'center', marginTop: 4 }}>Bebe con moderación</Kicker>
      </ScrollView>
    </SafeAreaView>
  )
}
