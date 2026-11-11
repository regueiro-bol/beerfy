import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SITE } from '@/lib/api'
import { C, F } from '@/lib/theme'
import { BrandMark } from './brand'
import { Button } from './ui'

/** Muro de edad, con el mismo texto que la web. Se recuerda en el dispositivo. */
export function AgeGate({ onYes }: { onYes: () => void }) {
  const [no, setNo] = useState(false)
  return (
    <View style={{ flex: 1, backgroundColor: C.ink }}>
      <Image source={require('@/assets/images/hero.jpg')} style={{ position: 'absolute', inset: 0, opacity: 0.45 }} contentFit="cover" />
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BrandMark size={40} />
          <Text style={{ fontFamily: F.display, fontSize: 24, color: C.cream }}>Beerfy</Text>
        </View>

        {!no ? (
          <View style={{ gap: 16 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber }}>Solo para mayores de edad</Text>
            <Text style={{ fontFamily: F.display, fontSize: 44, lineHeight: 44, letterSpacing: -1, color: C.cream }}>
              Antes de la primera <Text style={{ color: C.amber }}>caña</Text>…
            </Text>
            <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.cream }}>¿Tienes 18 años o más?</Text>
            <Button label="Sí, tengo 18 o más" variant="amber" onPress={onYes} />
            <Button label="Todavía no" variant="outline" onPress={() => setNo(true)} style={{ borderColor: 'rgba(246,241,228,0.4)' }} textColor={C.cream} />
            <Text style={{ fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.sand }}>
              Beerfy es una guía de bares para personas adultas. Bebe con moderación. Guardamos tu respuesta en este dispositivo; no recogemos tu edad ni tu fecha de nacimiento.{' '}
              <Text accessibilityRole="link" style={{ textDecorationLine: 'underline', color: C.cream }} onPress={() => WebBrowser.openBrowserAsync(`${SITE}/privacidad`)}>
                Privacidad
              </Text>
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 42, color: C.cream }}>Te esperamos dentro de unos años.</Text>
            <Text style={{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.sand }}>
              Beerfy habla de bares y de cerveza, así que es solo para mayores de 18. Gracias por decir la verdad.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setNo(false)} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.cream, textDecorationLine: 'underline' }}>Me he equivocado</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  )
}
