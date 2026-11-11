import { useEffect, useMemo, useState } from 'react'
import { Linking, ScrollView, Switch, Text, View } from 'react-native'
import { BrandMark } from '@/components/brand'
import { TopBar } from '@/components/top-bar'
import { Body, Button, H1 } from '@/components/ui'
import { distanceM } from '@/lib/format'
import { applyPrefs, DEFAULT_PREFS, loadPrefs, type Prefs } from '@/lib/push'
import { useStore } from '@/lib/store'
import { C, F } from '@/lib/theme'

const OPTIONS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: 'new_nearby', title: 'Bares nuevos cerca de ti', desc: 'Cuando entra en la guía un bar de bodega en tu ciudad' },
  { key: 'saved_changes', title: 'Tus bares guardados', desc: 'Si cambia mucho su nota de tirada' },
  { key: 'passing_by', title: 'Al pasar por delante', desc: 'Un recordatorio para puntuar si estás en un bar de la guía' },
  { key: 'bodega', title: 'La Bodega', desc: 'Artículos nuevos de la guía' },
]

export default function Avisos() {
  const { data, me, saved } = useStore()
  const [enabled, setEnabled] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadPrefs().then((p) => {
      setEnabled(p.enabled)
      setPrefs(p.prefs)
    })
  }, [])

  // Ciudad más cercana (para «bares nuevos cerca de ti»).
  const citySlug = useMemo(() => {
    if (!me || !data) return null
    let best: { slug: string; d: number } | null = null
    for (const c of data.cities) {
      if (c.latitude == null || c.longitude == null) continue
      const d = distanceM(me, { lat: c.latitude, lng: c.longitude })
      if (!best || d < best.d) best = { slug: c.slug, d }
    }
    return best?.slug ?? null
  }, [me, data])

  async function save(nextEnabled: boolean, nextPrefs: Prefs) {
    setBusy(true)
    setEnabled(nextEnabled)
    setPrefs(nextPrefs)
    const err = await applyPrefs(nextEnabled, nextPrefs, { city_slug: citySlug, saved })
    setMsg(err)
    if (err && nextEnabled) setEnabled(false)
    setBusy(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <TopBar close />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 18, paddingBottom: 40 }}>
        <H1>Avisos</H1>

        <View style={{ backgroundColor: C.ink, borderRadius: 22, padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber }}>Así te llegará</Text>
          <View style={{ backgroundColor: 'rgba(246,241,228,0.12)', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
              <BrandMark size={32} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.cream }}>Nuevo bar de bodega cerca</Text>
              <Text style={{ fontFamily: F.body, fontSize: 14, color: C.sand }}>Un bar con tanque acaba de entrar en la guía. ¿Vas a probarla?</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
          <Text style={{ flex: 1, fontFamily: F.display, fontSize: 20, color: C.ink }}>Recibir avisos</Text>
          <Switch value={enabled} disabled={busy} onValueChange={(on) => save(on, prefs)} trackColor={{ true: C.bottle, false: C.line }} accessibilityLabel="Recibir avisos" />
        </View>

        <View style={{ backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, borderRadius: 20, opacity: enabled ? 1 : 0.5 }}>
          {OPTIONS.map((o, i) => (
            <View key={o.key} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: '#EFEBE2' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{o.title}</Text>
                <Text style={{ fontFamily: F.body, fontSize: 13, color: C.stone }}>{o.desc}</Text>
              </View>
              <Switch
                value={prefs[o.key]}
                disabled={!enabled || busy}
                onValueChange={(on) => save(enabled, { ...prefs, [o.key]: on })}
                trackColor={{ true: C.bottle, false: C.line }}
                accessibilityLabel={o.title}
              />
            </View>
          ))}
        </View>

        {msg ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.error }}>{msg}</Text>
            <Button label="Abrir ajustes" variant="outline" onPress={() => Linking.openSettings()} />
          </View>
        ) : null}

        <Body style={{ fontSize: 13 }}>Máximo un aviso por semana. Sin publicidad de marcas. Puedes apagarlos cuando quieras.</Body>
      </ScrollView>
    </View>
  )
}
