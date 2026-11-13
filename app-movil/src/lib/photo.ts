import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { Platform } from 'react-native'
import { getInstallId, SITE } from './api'

export type PhotoResult = { ok: boolean; status?: 'confirmada' | 'revisar' | 'rechazada'; message: string; beer?: string | null }
export type Picked = { uri: string; width: number; height: number }

/** Hace una foto con la cámara o la elige de la galería. Devuelve null si se cancela. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<Picked | { error: string } | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return { error: 'Sin permiso de cámara no podemos hacer la foto. Puedes activarlo en los ajustes del móvil o elegir una foto de la galería.' }
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false, exif: false }
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
  if (res.canceled || !res.assets?.[0]) return null
  const a = res.assets[0]
  return { uri: a.uri, width: a.width, height: a.height }
}

/** Reduce la foto a 1600 px como máximo (JPEG): sube rápido y gasta pocos datos. */
async function shrink(p: Picked): Promise<string> {
  try {
    const ctx = ImageManipulator.manipulate(p.uri)
    if (Math.max(p.width, p.height) > 1600) ctx.resize(p.width >= p.height ? { width: 1600 } : { height: 1600 })
    const img = await ctx.renderAsync()
    const out = await img.saveAsync({ compress: 0.8, format: SaveFormat.JPEG })
    return out.uri
  } catch {
    return p.uri
  }
}

/** Envía la foto del tanque a Beerfy (bar, con ubicación) o a una sugerencia recién enviada. */
export async function sendTankPhoto(
  photo: Picked,
  fields: { venue_id?: string; suggestion_id?: string; lat?: number; lng?: number; acc?: number }
): Promise<PhotoResult> {
  try {
    const uri = await shrink(photo)
    const fd = new FormData()
    if (Platform.OS === 'web') {
      fd.append('photo', await (await fetch(uri)).blob(), 'tanque.jpg')
    } else {
      // React Native envía el archivo a partir de su uri.
      fd.append('photo', { uri, name: 'tanque.jpg', type: 'image/jpeg' } as unknown as Blob)
    }
    for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) fd.append(k, String(v))
    const res = await fetch(`${SITE}/api/photo-check`, { method: 'POST', body: fd, headers: { 'X-Beerfy-Install': await getInstallId() } })
    const json = (await res.json().catch(() => null)) as PhotoResult | null
    return json ?? { ok: false, message: 'No hemos podido enviar la foto. Inténtalo de nuevo.' }
  } catch {
    return { ok: false, message: 'Sin conexión. Comprueba tu cobertura e inténtalo de nuevo.' }
  }
}
