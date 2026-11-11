import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Body, H1, ListLink, Loading } from '@/components/ui'
import { useStore } from '@/lib/store'
import { C } from '@/lib/theme'

export default function Ciudades() {
  const { data } = useStore()
  if (!data) return <Loading />
  const count = (slug: string) => data.venues.filter((v) => v.city?.slug === slug).length
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
        <View style={{ gap: 6 }}>
          <H1>Ciudades</H1>
          <Body>Dónde tomar cerveza de bodega, ciudad a ciudad.</Body>
        </View>
        <View style={{ gap: 10 }}>
          {data.cities.map((c) => {
            const n = count(c.slug)
            return (
              <ListLink
                key={c.id}
                title={c.name}
                subtitle={`${n} ${n === 1 ? 'bar' : 'bares'}${c.region ? ` · ${c.region}` : ''}`}
                onPress={() => router.push({ pathname: '/ciudad/[slug]', params: { slug: c.slug } })}
              />
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
