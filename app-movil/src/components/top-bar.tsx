import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, F } from '@/lib/theme'
import { IconBack, IconClose } from './icons'

/** Cabecera simple con botón de volver (o cerrar) y título. */
export function TopBar({ title, close, dark }: { title?: string; close?: boolean; dark?: boolean }) {
  const insets = useSafeAreaInsets()
  const fg = dark ? C.cream : C.ink
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={close ? 'Cerrar' : 'Volver'}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? 'rgba(246,241,228,0.12)' : 'transparent' }}
      >
        {close ? <IconClose color={fg} size={20} width={2.4} /> : <IconBack color={fg} size={22} width={2.2} />}
      </Pressable>
      {title ? (
        <Text style={{ fontFamily: F.displayBold, fontSize: 18, color: fg, flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  )
}
