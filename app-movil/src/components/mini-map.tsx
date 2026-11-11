import { useEffect, useState } from 'react'
import MapView, { Marker } from 'react-native-maps'
import { MapPin } from './brand'

/** Mapa pequeño y fijo con el pin de Beerfy en el bar (como en la ficha de la web). */
export function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [track, setTrack] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setTrack(false), 600)
    return () => clearTimeout(t)
  }, [])
  return (
    <MapView
      style={{ height: 220, borderRadius: 24 }}
      initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      liteMode
      accessibilityLabel={`Mapa con la ubicación de ${name}`}
    >
      <Marker coordinate={{ latitude: lat, longitude: lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={track}>
        <MapPin size={44} />
      </Marker>
    </MapView>
  )
}
