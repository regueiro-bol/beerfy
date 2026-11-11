import Svg, { Circle, G, Path, Rect } from 'react-native-svg'
import { View } from 'react-native'
import { C } from '@/lib/theme'

/** Icono de Beerfy: caña con corona de espuma (el mismo de la web). viewBox 64×64. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M19 24 L45 24 L42.5 55 Q42.2 58 39.2 58 L24.8 58 Q21.8 58 21.5 55 Z" fill={C.amber} />
      <Path d="M21 34 L43 34" stroke={C.copper} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <G fill={C.foam}>
        <Circle cx={21} cy={22} r={6} />
        <Circle cx={30} cy={17} r={8} />
        <Circle cx={40} cy={19} r={7} />
        <Circle cx={45} cy={24} r={4.5} />
        <Rect x={17} y={20} width={30} height={7} rx={3} />
      </G>
      <Circle cx={27} cy={44} r={1.6} fill={C.foam} opacity={0.8} />
      <Circle cx={34} cy={50} r={1.2} fill={C.foam} opacity={0.8} />
    </Svg>
  )
}

/** El icono sobre su baldosa negra. */
export function BrandTile({ size = 36 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        backgroundColor: C.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BrandMark size={Math.round(size * 0.84)} />
    </View>
  )
}

/**
 * Pin de mapa de Beerfy (el mismo /map/pin.svg de la web): gota negra con borde ámbar y la caña dentro.
 * `active` lo pinta en ámbar para el bar seleccionado.
 */
export function MapPin({ size = 44, active = false }: { size?: number; active?: boolean }) {
  const h = Math.round((size * 56) / 44)
  return (
    <Svg width={size} height={h} viewBox="0 0 44 56">
      <Path
        d="M22 54c0 0-18-17.6-18-31.2C4 12.4 12.1 4 22 4s18 8.4 18 18.8C40 36.4 22 54 22 54z"
        fill={active ? C.amber : C.ink}
        stroke={active ? C.ink : C.amber}
        strokeWidth={2.5}
      />
      <G transform="translate(5 5.5) scale(0.53)">
        <Path d="M19 24 L45 24 L42.5 55 Q42.2 58 39.2 58 L24.8 58 Q21.8 58 21.5 55 Z" fill={active ? C.ink : C.amber} />
        <Path d="M21 34 L43 34" stroke={C.copper} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
        <G fill={C.foam}>
          <Circle cx={21} cy={22} r={6} />
          <Circle cx={30} cy={17} r={8} />
          <Circle cx={40} cy={19} r={7} />
          <Circle cx={45} cy={24} r={4.5} />
          <Rect x={17} y={20} width={30} height={7} rx={3} />
        </G>
      </G>
    </Svg>
  )
}
