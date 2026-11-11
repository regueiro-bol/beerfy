import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextProps, type ViewStyle } from 'react-native'
import { C, F } from '@/lib/theme'
import { formatDistance, formatScore, MIN_VOTES, scoreLabel } from '@/lib/format'
import type { NearVenue } from '@/lib/store'
import { BrandMark } from './brand'
import { IconChevron } from './icons'

export function H1(p: TextProps) {
  return <Text {...p} style={[s.h1, p.style]} />
}
export function H2(p: TextProps) {
  return <Text {...p} style={[s.h2, p.style]} />
}
export function Kicker(p: TextProps) {
  return <Text {...p} style={[s.kicker, p.style]} />
}
export function Body(p: TextProps) {
  return <Text {...p} style={[s.body, p.style]} />
}

/** Etiqueta ámbar con la nota. En calibración muestra los votos que lleva (p. ej. «3/5»). */
export function ScoreBadge({ score, votes = 0, big }: { score: number | null; votes?: number; big?: boolean }) {
  if (score === null) {
    return (
      <View style={[s.badge, big && s.badgeBig, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.sand }]}>
        <Text style={[s.badgeText, { color: C.stone, fontSize: big ? 22 : 13 }]}>{votes > 0 ? `${votes}/${MIN_VOTES}` : 'Nuevo'}</Text>
      </View>
    )
  }
  return (
    <View style={[s.badge, big && s.badgeBig]}>
      <Text style={[s.badgeText, big && { fontSize: 40, lineHeight: 42 }]}>{formatScore(score)}</Text>
    </View>
  )
}

export function Button({
  label,
  onPress,
  variant = 'dark',
  icon,
  disabled,
  loading,
  style,
  textColor,
}: {
  label: string
  onPress?: () => void
  variant?: 'dark' | 'amber' | 'outline'
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textColor?: string
}) {
  const bg = variant === 'dark' ? C.ink : variant === 'amber' ? C.amber : 'transparent'
  const fg = textColor ?? (variant === 'dark' ? C.cream : C.ink)
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1.5, borderColor: C.sand },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

/** Fila de bar: foto (o icono), nombre, distancia/ciudad y nota. */
export function VenueRow({ v }: { v: NearVenue }) {
  const sub = [v.d !== null ? formatDistance(v.d) : v.city?.name, scoreLabel(v.score, v.votes)].filter(Boolean).join(' · ')
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/bar/[id]', params: { id: v.id } })}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
      accessibilityLabel={`${v.name}, ${sub}`}
    >
        {v.cover ? (
          <Image source={{ uri: v.cover }} style={s.thumb} contentFit="cover" transition={150} />
        ) : (
          <View style={[s.thumb, { backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }]}>
            <BrandMark size={40} />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text style={s.rowTitle} numberOfLines={1}>
            {v.name}
          </Text>
          <Text style={s.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        <ScoreBadge score={v.score} votes={v.votes} />
    </Pressable>
  )
}

export function ListLink({ title, subtitle, onPress, left }: { title: string; subtitle?: string; onPress: () => void; left?: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      <IconChevron color={C.stone} size={18} />
    </Pressable>
  )
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={C.amber} size="large" />
    </View>
  )
}

export const s = StyleSheet.create({
  h1: { fontFamily: F.display, fontSize: 32, lineHeight: 34, letterSpacing: -0.8, color: C.ink },
  h2: { fontFamily: F.display, fontSize: 21, lineHeight: 24, color: C.ink },
  kicker: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.bottle },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.stone },
  badge: { backgroundColor: C.amber, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, minWidth: 44, alignItems: 'center' },
  badgeBig: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, transform: [{ rotate: '3deg' }] },
  badgeText: { fontFamily: F.display, fontSize: 16, color: C.ink },
  btn: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  btnText: { fontFamily: F.bold, fontSize: 16 },
  row: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
  },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  rowTitle: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  rowSub: { fontFamily: F.body, fontSize: 13, color: C.stone },
  input: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.body,
    fontSize: 16,
    color: C.ink,
  },
  label: { fontFamily: F.semibold, fontSize: 14, color: C.ink, marginBottom: 6 },
})
