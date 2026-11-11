import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconLocate, IconNavigate } from '@/components/icons'
import { Button, HoursText, Loading, ScoreBadge } from '@/components/ui'
import { VenueMap, type VenueMapHandle } from '@/components/venue-map'
import { formatDistance, scoreLabel } from '@/lib/format'
import { openDirections } from '@/lib/links'
import { useNearby, useStore } from '@/lib/store'
import { C, F } from '@/lib/theme'

const OURENSE = { lat: 42.3358, lng: -7.8639 }

export default function Cerca() {
  const insets = useSafeAreaInsets()
  const { data, me, locate } = useStore()
  const all = useNearby()
  const [onlyScored, setOnlyScored] = useState(false)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [city, setCity] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const map = useRef<VenueMapHandle>(null)

  useEffect(() => {
    locate(true)
  }, [locate])

  const venues = useMemo(
    () => all.filter((v) => (!onlyOpen || v.status?.open) && (!onlyScored || v.score !== null) && (!city || v.city?.slug === city)),
    [all, onlyOpen, onlyScored, city]
  )
  const current = venues.find((v) => v.id === selected) ?? venues[0] ?? null
  const cityObj = data?.cities.find((c) => c.slug === city)
  const initial =
    cityObj?.latitude != null && cityObj.longitude != null ? { lat: cityObj.latitude, lng: cityObj.longitude } : me ?? OURENSE

  if (!data) return <Loading />

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{ height: 38, borderRadius: 19, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: active ? C.ink : C.white }}
    >
      <Text style={{ fontFamily: F.semibold, fontSize: 13, color: active ? C.cream : C.ink }}>{label}</Text>
    </Pressable>
  )

  return (
    <View style={{ flex: 1 }}>
      <VenueMap key={city ?? 'all'} ref={map} venues={venues} selected={current?.id ?? null} onSelect={setSelected} initial={initial} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {chip('Abierto ahora', onlyOpen, () => setOnlyOpen((x) => !x))}
        {chip('Con nota', onlyScored, () => setOnlyScored((x) => !x))}
        {chip('Todas', city === null, () => setCity(null))}
        {data.cities.map((c) => chip(c.name, city === c.slug, () => setCity(c.slug)))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centrar en mi ubicación"
        onPress={async () => {
          const c = me ?? (await locate(true))
          if (c) {
            setCity(null)
            map.current?.centerOn(c.lat, c.lng)
          }
        }}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 210,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: C.white,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.ink,
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <IconLocate color={C.me} size={22} width={2.2} />
      </Pressable>

      {!current && onlyOpen ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: C.paper, borderRadius: 22, padding: 18, gap: 10 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>No hay bares de la guía abiertos ahora{city && cityObj ? ` en ${cityObj.name}` : ''}.</Text>
          <Button label="Ver todos" variant="outline" style={{ height: 46 }} onPress={() => setOnlyOpen(false)} />
        </View>
      ) : null}

      {current ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: C.paper,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            padding: 20,
            paddingTop: 12,
            gap: 12,
            shadowColor: C.ink,
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.sand, alignSelf: 'center' }} />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.bottle }}>
                {[current.d !== null ? formatDistance(current.d) : null, current.city?.name].filter(Boolean).join(' · ')}
              </Text>
              <Text style={{ fontFamily: F.display, fontSize: 24, color: C.ink }} numberOfLines={1}>
                {current.name}
              </Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: C.stone }} numberOfLines={1}>
                {current.beers.join(' · ')} · {scoreLabel(current.score, current.votes)}
              </Text>
              <HoursText status={current.status} />
            </View>
            <ScoreBadge score={current.score} votes={current.votes} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Ver ficha" variant="outline" style={{ flex: 1, height: 48 }} onPress={() => router.push({ pathname: '/bar/[id]', params: { id: current.id } })} />
            <Button
              label="Llévame"
              style={{ flex: 1, height: 48 }}
              icon={<IconNavigate color={C.amber} size={18} width={2.4} />}
              onPress={() => openDirections(current.lat, current.lng, current.name)}
            />
          </View>
        </View>
      ) : null}
    </View>
  )
}
