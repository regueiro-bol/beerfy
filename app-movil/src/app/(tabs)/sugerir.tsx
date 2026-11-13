import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconCheck } from '@/components/icons'
import { Body, Button, H1, Loading, s } from '@/components/ui'
import { submitSuggestion } from '@/lib/api'
import { pickPhoto, sendTankPhoto } from '@/lib/photo'
import { useStore } from '@/lib/store'
import { C, F } from '@/lib/theme'

/** Sugerir un bar: mismo formulario y misma validación automática que la web. */
export default function Sugerir() {
  const { data } = useStore()
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState<string>('')
  const [cityName, setCityName] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [notify, setNotify] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [suggestionId, setSuggestionId] = useState<string | null>(null)
  const [photoMsg, setPhotoMsg] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)

  if (!data) return <Loading />

  const reset = () => {
    setName('')
    setCityId('')
    setCityName('')
    setAddress('')
    setNotes('')
    setNotify(false)
    setEmail('')
    setDone(false)
    setSuggestionId(null)
    setPhotoMsg(null)
  }

  async function addPhoto(source: 'camera' | 'library') {
    if (!suggestionId) return
    const p = await pickPhoto(source)
    if (!p) return
    if ('error' in p) {
      setPhotoMsg(p.error)
      return
    }
    setPhotoBusy(true)
    const r = await sendTankPhoto(p, { suggestion_id: suggestionId })
    setPhotoBusy(false)
    setPhotoMsg(r.message)
  }

  async function send() {
    setSending(true)
    setError(null)
    const res = await submitSuggestion({
      venue_name: name,
      city_id: cityId || undefined,
      city_name: cityId === 'otra' ? cityName : undefined,
      address,
      notes,
      notify,
      email: notify ? email : undefined,
    })
    setSending(false)
    if (res.ok) {
      setSuggestionId(res.id ?? null)
      setDone(true)
    }
    else setError(res.error ?? 'No hemos podido enviar la sugerencia.')
  }

  if (done) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper, padding: 24, justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.bottle, alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck color={C.amber} size={32} width={2.6} />
        </View>
        <H1>¡Gracias por la pista!</H1>
        <Body>Revisamos cada bar antes de publicarlo. {notify ? 'Te escribiremos cuando esté en la guía.' : ''}</Body>
        {suggestionId ? (
          <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sand, borderRadius: 22, padding: 18, gap: 10, backgroundColor: C.white }}>
            <Text style={{ fontFamily: F.display, fontSize: 19, color: C.ink }}>¿Tienes una foto del tanque?</Text>
            <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.stone }}>
              Una foto del tanque o del grifo de bodega nos ayuda a verificar el bar antes. No se publica.
            </Text>
            {photoMsg ? (
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.bottle }}>{photoMsg}</Text>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  label="Hacer foto"
                  style={{ flex: 1, height: 48 }}
                  loading={photoBusy}
                  onPress={() => addPhoto('camera')}
                />
                <Button label="Galería" variant="outline" style={{ flex: 1, height: 48 }} disabled={photoBusy} onPress={() => addPhoto('library')} />
              </View>
            )}
          </View>
        ) : null}
        <Button label="Sugerir otro bar" variant="outline" onPress={reset} />
      </SafeAreaView>
    )
  }

  const chip = (id: string, label: string) => (
    <Pressable
      key={id}
      accessibilityRole="radio"
      accessibilityState={{ checked: cityId === id }}
      onPress={() => setCityId(id)}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 22,
        justifyContent: 'center',
        backgroundColor: cityId === id ? C.ink : C.white,
        borderWidth: 1.5,
        borderColor: cityId === id ? C.ink : C.line,
      }}
    >
      <Text style={{ fontFamily: F.semibold, fontSize: 14, color: cityId === id ? C.cream : C.ink }}>{label}</Text>
    </Pressable>
  )

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <H1>Sugerir un bar</H1>
            <Body>Cuéntanos qué bar sirve cerveza de bodega y por qué merece estar en la guía. Lo revisamos antes de publicarlo.</Body>
          </View>

          <View>
            <Text style={s.label} nativeID="l-name">
              Nombre del bar
            </Text>
            <TextInput accessibilityLabelledBy="l-name" value={name} onChangeText={setName} maxLength={120} style={s.input} placeholder="Ej.: Bar O Tanque" placeholderTextColor={C.sand} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={s.label}>Ciudad</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup">
              {data.cities.map((c) => chip(c.id, c.name))}
              {chip('otra', 'Otra')}
            </View>
            {cityId === 'otra' ? (
              <TextInput accessibilityLabel="Nombre de la ciudad" value={cityName} onChangeText={setCityName} maxLength={80} style={s.input} placeholder="¿En qué ciudad está?" placeholderTextColor={C.sand} />
            ) : null}
          </View>

          <View>
            <Text style={s.label} nativeID="l-address">
              Dirección (opcional)
            </Text>
            <TextInput accessibilityLabelledBy="l-address" value={address} onChangeText={setAddress} maxLength={200} style={s.input} />
          </View>

          <View>
            <Text style={s.label} nativeID="l-notes">
              ¿Por qué lo recomiendas? (opcional)
            </Text>
            <TextInput
              accessibilityLabelledBy="l-notes"
              value={notes}
              onChangeText={setNotes}
              maxLength={1000}
              multiline
              style={[s.input, { minHeight: 110, textAlignVertical: 'top' }]}
              placeholder="Cómo la tiran, la espuma, el vaso…"
              placeholderTextColor={C.sand}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
            <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 15, color: C.ink }}>Avisadme cuando publiquéis el bar</Text>
            <Switch value={notify} onValueChange={setNotify} trackColor={{ true: C.bottle, false: C.line }} accessibilityLabel="Avisadme cuando publiquéis el bar" />
          </View>
          {notify ? (
            <View>
              <Text style={s.label} nativeID="l-email">
                Tu email
              </Text>
              <TextInput
                accessibilityLabelledBy="l-email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                maxLength={160}
                style={s.input}
              />
              <Text style={{ fontFamily: F.body, fontSize: 12, color: C.stone, marginTop: 6 }}>Solo lo usamos para avisarte de este bar.</Text>
            </View>
          ) : null}

          {error ? <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.error }}>{error}</Text> : null}
          <Button label="Enviar sugerencia" onPress={send} loading={sending} disabled={name.trim().length < 2 || !cityId} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
