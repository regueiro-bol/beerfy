import { Text, View } from 'react-native'
import { C, F } from '@/lib/theme'
import { MapPin } from './brand'

/** Vista previa en navegador; en el móvil se usa el mapa real (mini-map.tsx). */
export function MiniMap({ name }: { lat: number; lng: number; name: string }) {
  return (
    <View style={{ height: 220, borderRadius: 24, backgroundColor: '#EAE6DC', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <MapPin size={44} />
      <Text style={{ fontFamily: F.body, fontSize: 11, color: C.stone }}>{name} · en el móvil, mapa real</Text>
    </View>
  )
}
