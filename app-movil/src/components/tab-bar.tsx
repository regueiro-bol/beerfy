import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, F } from '@/lib/theme'
import { IconBook, IconCities, IconHome, IconPin, IconPlusCircle } from './icons'

/** La misma barra de pestañas de la web en móvil: negra, con «Cerca de mí» como botón central ámbar. */
const TABS: Record<string, { label: string; Icon: typeof IconHome; center?: boolean }> = {
  index: { label: 'Inicio', Icon: IconHome },
  ciudades: { label: 'Ciudades', Icon: IconCities },
  cerca: { label: 'Cerca de mí', Icon: IconPin, center: true },
  bodega: { label: 'La Bodega', Icon: IconBook },
  sugerir: { label: 'Sugerir', Icon: IconPlusCircle },
}

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: C.ink,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {state.routes.map((route, i) => {
        const t = TABS[route.name]
        if (!t) return null
        const active = state.index === i
        const onPress = () => {
          const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!active && !e.defaultPrevented) navigateToTab(route.key)
        }
        if (t.center) {
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  marginTop: -22,
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: C.amber,
                  borderWidth: 4,
                  borderColor: C.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: C.amber,
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                <IconPin color={C.ink} size={24} width={2.4} />
              </View>
              <Text style={{ fontFamily: F.bold, fontSize: 11, color: active ? C.amber : C.cream }}>{t.label}</Text>
            </Pressable>
          )
        }
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <t.Icon color={active ? C.amber : C.sand} />
            <Text style={{ fontFamily: F.semibold, fontSize: 11, color: active ? C.amber : C.sand }}>{t.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
