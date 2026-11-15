import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
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

/**
 * Reduce la foto a 1600 px como máximo (JPEG) y la devuelve en base64.
 * Se envía como JSON: el fetch de Expo no admite archivos dentro de FormData en iOS/Android.
 */
async function toBase64(p: Picked): Promise<string> {
  const ctx = ImageManipulator.manipulate(p.uri)
  if (Math.max(p.width, p.height) > 1600) ctx.resize(p.width >= p.height ? { width: 1600 } : { height: 1600 })
  const img = await ctx.renderAsync()
  const out = await img.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true })
  if (!out.base64) throw new Error('sin base64')
  return out.base64
}

async function postPhoto<T>(path: string, photo: Picked, fields: Record<string, string | number | undefined | null>): Promise<T | null> {
  const body: Record<string, string | number> = { photo_base64: await toBase64(photo) }
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null && !(typeof v === 'number' && !Number.isFinite(v))) body[k] = v
  const res = await fetch(`${SITE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Beerfy-Install': await getInstallId() },
    body: JSON.stringify(body),
  })
  return (await res.json().catch(() => null)) as T | null
}

/** Envía la foto del tanque a Beerfy (bar, con ubicación) o a una sugerencia recién enviada. */
export async function sendTankPhoto(
  photo: Picked,
  fields: { venue_id?: string; suggestion_id?: string; lat?: number; lng?: number; acc?: number }
): Promise<PhotoResult> {
  try {
    const json = await postPhoto<PhotoResult>('/api/photo-check', photo, fields)
    return json ?? { ok: false, message: 'No hemos podido enviar la foto. Inténtalo de nuevo.' }
  } catch {
    return { ok: false, message: 'Sin conexión. Comprueba tu cobertura e inténtalo de nuevo.' }
  }
}

/** Foto de la caña de una nota: «servida» (recién tirada) o «encaje» (a medio beber). */
export async function sendRatingPhoto(
  photo: Picked,
  fields: { rating_id: string; token: string; kind: 'servida' | 'encaje'; taken_at: number }
): Promise<{ ok: boolean; message: string }> {
  try {
    const json = await postPhoto<{ ok: boolean; message: string }>('/api/rating-photo', photo, fields)
    return json ?? { ok: false, message: 'No hemos podido enviar la foto.' }
  } catch {
    return { ok: false, message: 'Sin conexión. Inténtalo de nuevo.' }
  }
}
