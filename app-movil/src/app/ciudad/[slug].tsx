import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, View } from 'react-native'
import { TopBar } from '@/components/top-bar'
import { Body, H1, H2, Kicker, Loading, VenueRow } from '@/components/ui'
import { useNearby, useStore } from '@/lib/store'
import { C } from '@/lib/theme'

export default function Ciudad() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data } = useStore()
  const all = useNearby()
  const city = data?.cities.find((c) => c.slug === slug)
  const venues = useMemo(() => {
    const list = all.filter((v) => v.city?.slug === slug)
    // Mejor nota primero; los que están en calibración, después.
    return [...list].sort((a, b) => (a.score !== null && b.score !== null ? b.score - a.score : a.score !== null ? -1 : b.score !== null ? 1 : 0))
  }, [all, slug])

  if (!data) return <Loading />
  const scored = venues.filter((v) => v.score !== null)
  const rest = venues.filter((v) => v.score === null)

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <TopBar />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 16, paddingBottom: 40 }}>
        <View style={{ gap: 6 }}>
          <Kicker>{city?.region ?? 'Ciudad'}</Kicker>
          <H1>Cerveza de bodega en {city?.name ?? slug}</H1>
          <Body>
            {venues.length} {venues.length === 1 ? 'bar' : 'bares'} con tanque en la guía.
          </Body>
        </View>
        {scored.length ? <H2>Las mejores cañas</H2> : null}
        <View style={{ gap: 10 }}>
          {scored.map((v) => (
            <VenueRow key={v.id} v={v} />
          ))}
        </View>
        {rest.length ? <H2>{scored.length ? 'Más bares' : 'Bares en la guía'}</H2> : null}
        <View style={{ gap: 10 }}>
          {rest.map((v) => (
            <VenueRow key={v.id} v={v} />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
