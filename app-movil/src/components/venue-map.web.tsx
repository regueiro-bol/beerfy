import { forwardRef, useImperativeHandle } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Venue } from '@/lib/api'
import { C, F } from '@/lib/theme'
import { MapPin } from './brand'

export type VenueMapHandle = { centerOn: (lat: number, lng: number) => void }

type Props = {
  venues: Venue[]
  selected: string | null
  onSelect: (id: string) => void
  initial: { lat: number; lng: number }
}

/**
 * Vista previa en navegador (solo para revisar diseños): sitúa los pines en un plano simple.
 * En iPhone y Android se usa el mapa real (venue-map.tsx).
 */
export const VenueMap = forwardRef<VenueMapHandle, Props>(function VenueMap({ venues, selected, onSelect, initial }, ref) {
  useImperativeHandle(ref, () => ({ centerOn: () => {} }))
  const span = 0.03
  return (
    <View style={{ flex: 1, backgroundColor: '#EAE6DC', overflow: 'hidden' }}>
      {venues.map((v) => {
        if (v.lat === null || v.lng === null) return null
        const x = 50 + ((v.lng - initial.lng) / span) * 50
        const y = 50 - ((v.lat - initial.lat) / span) * 50
        if (x < 0 || x > 100 || y < 0 || y > 100) return null
        return (
          <Pressable key={v.id} onPress={() => onSelect(v.id)} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: [{ translateX: -20 }, { translateY: -50 }] }}>
            <MapPin size={selected === v.id ? 48 : 38} active={selected === v.id} />
          </Pressable>
        )
      })}
      <Text style={{ position: 'absolute', top: 8, right: 8, fontFamily: F.body, fontSize: 11, color: C.stone }}>Vista previa · en el móvil, mapa real</Text>
    </View>
  )
})
