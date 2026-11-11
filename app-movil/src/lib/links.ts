import { Linking, Platform } from 'react-native'

/** Abre la app de mapas del móvil con la ruta hasta el bar. */
export function openDirections(lat: number | null, lng: number | null, name: string) {
  if (lat === null || lng === null) return
  const q = encodeURIComponent(name)
  const url =
    Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  Linking.openURL(url).catch(() => {})
}
