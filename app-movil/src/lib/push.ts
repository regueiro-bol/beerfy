import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { savePushPrefs } from './api'

export type Prefs = { new_nearby: boolean; saved_changes: boolean; passing_by: boolean; bodega: boolean }
export const DEFAULT_PREFS: Prefs = { new_nearby: true, saved_changes: true, passing_by: false, bodega: false }
const KEY = 'bfy-push-prefs'

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
})

export async function loadPrefs(): Promise<{ enabled: boolean; prefs: Prefs }> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as { enabled: boolean; prefs: Prefs }
  } catch {}
  return { enabled: false, prefs: DEFAULT_PREFS }
}

async function getToken(ask: boolean): Promise<string | null> {
  if (!Device.isDevice || Platform.OS === 'web') return null
  if (Platform.OS === 'android') {
    // eslint-disable-next-line import/namespace
    await Notifications.setNotificationChannelAsync('default', { name: 'Avisos de Beerfy', importance: Notifications.AndroidImportance.DEFAULT })
  }
  let perm = await Notifications.getPermissionsAsync()
  if (!perm.granted && ask && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync()
  if (!perm.granted) return null
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  if (!projectId) return null
  const t = await Notifications.getExpoPushTokenAsync({ projectId })
  return t.data
}

/**
 * Activa o actualiza los avisos. Devuelve un error legible si el móvil no da permiso.
 * Solo se envía al servidor el token del aviso, las preferencias, la ciudad y los bares guardados.
 */
export async function applyPrefs(enabled: boolean, prefs: Prefs, extra: { city_slug: string | null; saved: string[] }): Promise<string | null> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ enabled, prefs })).catch(() => {})
  try {
    const token = await getToken(enabled)
    if (!token) return enabled ? 'Para recibir avisos, permite las notificaciones de Beerfy en los ajustes del móvil.' : null
    const res = await savePushPrefs({ token, enabled, platform: Platform.OS, prefs, ...extra })
    return res.ok ? null : res.error ?? 'No hemos podido guardar tus avisos.'
  } catch {
    return 'No hemos podido activar los avisos en este momento.'
  }
}
