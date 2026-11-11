import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import MapView, { Marker } from 'react-native-maps'
import type { Venue } from '@/lib/api'
import { MapPin } from './brand'

export type VenueMapHandle = { centerOn: (lat: number, lng: number) => void }

type Props = {
  venues: Venue[]
  selected: string | null
  onSelect: (id: string) => void
  initial: { lat: number; lng: number }
}

/** Mapa con el pin de Beerfy. Apple Maps en iPhone y Google Maps en Android. */
export const VenueMap = forwardRef<VenueMapHandle, Props>(function VenueMap({ venues, selected, onSelect, initial }, ref) {
  const map = useRef<MapView>(null)
  // Los pines se dibujan como vistas: se deja que se pinten y luego se congelan (rendimiento).
  const [track, setTrack] = useState(true)
  useEffect(() => {
    setTrack(true)
    const t = setTimeout(() => setTrack(false), 600)
    return () => clearTimeout(t)
  }, [selected, venues.length])

  useImperativeHandle(ref, () => ({
    centerOn: (lat, lng) => map.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 400),
  }))

  return (
    <MapView
      ref={map}
      style={{ flex: 1 }}
      initialRegion={{ latitude: initial.lat, longitude: initial.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
      showsUserLocation
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      toolbarEnabled={false}
    >
      {venues.map((v) =>
        v.lat === null || v.lng === null ? null : (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.lat, longitude: v.lng }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onSelect(v.id)}
            tracksViewChanges={track}
            accessibilityLabel={v.name}
            zIndex={selected === v.id ? 10 : 1}
          >
            <MapPin size={selected === v.id ? 48 : 38} active={selected === v.id} />
          </Marker>
        )
      )}
    </MapView>
  )
})
