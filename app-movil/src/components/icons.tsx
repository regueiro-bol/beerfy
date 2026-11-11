import Svg, { Circle, Path } from 'react-native-svg'

/** Iconos de trazo de la web (mismos trazados que la barra de pestañas de www.beerfy.es). */
type P = { size?: number; color: string; width?: number }

const S = ({ size = 22, color, width = 1.9, children }: P & { children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
)

export const IconHome = (p: P) => (
  <S {...p}>
    <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </S>
)
export const IconCities = (p: P) => (
  <S {...p}>
    <Path d="M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13" />
    <Path d="M13 11h3M13 15h3" />
  </S>
)
export const IconPin = (p: P) => (
  <S {...p}>
    <Path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <Circle cx={12} cy={9.5} r={2.5} />
  </S>
)
export const IconBook = (p: P) => (
  <S {...p}>
    <Path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2z" />
    <Path d="M4 21V5M8 7h6" />
  </S>
)
export const IconPlusCircle = (p: P) => (
  <S {...p}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 8v8M8 12h8" />
  </S>
)
export const IconPlus = (p: P) => (
  <S {...p}>
    <Path d="M12 5v14M5 12h14" />
  </S>
)
export const IconBack = (p: P) => (
  <S {...p}>
    <Path d="M15 6l-6 6 6 6" />
  </S>
)
export const IconClose = (p: P) => (
  <S {...p}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </S>
)
export const IconChevron = (p: P) => (
  <S {...p}>
    <Path d="M9 6l6 6-6 6" />
  </S>
)
export const IconBell = (p: P) => (
  <S {...p}>
    <Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
    <Path d="M10 21h4" />
  </S>
)
export const IconShare = (p: P) => (
  <S {...p}>
    <Path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" />
  </S>
)
export const IconBookmark = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" fill={filled ? p.color : 'none'} stroke={p.color} strokeWidth={p.width ?? 1.9} strokeLinejoin="round">
    <Path d="M6 3h12v18l-6-4-6 4z" />
  </Svg>
)
export const IconNavigate = (p: P) => (
  <S {...p}>
    <Path d="M3 11l18-8-8 18-2-8z" />
  </S>
)
export const IconLocate = (p: P) => (
  <S {...p}>
    <Circle cx={12} cy={12} r={4} />
    <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </S>
)
export const IconCheck = (p: P) => (
  <S {...p}>
    <Path d="M5 12l5 5 9-10" />
  </S>
)
