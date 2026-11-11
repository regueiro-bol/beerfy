import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconChevron } from '@/components/icons'
import { Body, H1, Kicker, Loading } from '@/components/ui'
import { useStore } from '@/lib/store'
import { C, F } from '@/lib/theme'

/** La Bodega: los capítulos de la guía se abren en el lector de la web, dentro de la app. */
const open = (url: string) => WebBrowser.openBrowserAsync(url, { toolbarColor: C.ink, controlsColor: C.amber })

export default function Bodega() {
  const { data } = useStore()
  if (!data) return <Loading />
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        <View style={{ gap: 6 }}>
          <Kicker>La Bodega · la guía</Kicker>
          <H1>Todo sobre la cerveza de bodega</H1>
          <Body>Qué es, cómo llega al bar, cómo se tira y en qué se diferencia del barril.</Body>
        </View>

        {data.bodega.map((c) => (
          <Pressable
            key={c.slug}
            accessibilityRole="link"
            onPress={() => open(c.url)}
            style={({ pressed }) => [
              { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, borderRadius: 20, overflow: 'hidden', flexDirection: 'row' },
              pressed && { opacity: 0.85 },
            ]}
          >
            {c.image ? <Image source={{ uri: c.image }} style={{ width: 96 }} contentFit="cover" /> : null}
            <View style={{ flex: 1, padding: 14, gap: 4 }}>
              <Text style={{ fontFamily: F.display, fontSize: 15, color: C.bottle }}>{c.n}</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 16, lineHeight: 21, color: C.ink }}>{c.title}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: C.stone }}>{c.minutes} min de lectura</Text>
            </View>
            <View style={{ justifyContent: 'center', paddingRight: 12 }}>
              <IconChevron color={C.stone} size={18} />
            </View>
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="link"
          onPress={() => open(data.egPage)}
          style={{ backgroundColor: C.bottle, borderRadius: 22, padding: 18, gap: 4 }}
        >
          <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber }}>Guía de marca</Text>
          <Text style={{ fontFamily: F.display, fontSize: 20, color: C.cream }}>Estrella Galicia de Bodega: ficha y bares</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
