/**
 * «Abierto ahora», «cierra a las…» y «cierra pronto», calculados en el móvil a partir del
 * horario semanal de Google que guarda la web cada día. La hora es la de España (Europe/Madrid),
 * esté donde esté el teléfono, porque los bares están en España.
 */

export type OpeningPoint = { day: number; hour: number; minute: number }
export type OpeningPeriod = { open: OpeningPoint; close?: OpeningPoint }

export type HoursStatus = {
  open: boolean
  /** Queda una hora o menos para que cierre. */
  soon: boolean
  /** Texto corto para listas: «Abierto · cierra a las 24:00», «Cerrado · abre mañana a las 8:00»… */
  label: string
}

const WEEK = 7 * 1440
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
/** Minutos antes del cierre a partir de los que se avisa «Cierra pronto». */
export const SOON_MIN = 60

const mow = (p: OpeningPoint) => p.day * 1440 + p.hour * 60 + p.minute

/** Minuto de la semana (0 = domingo 0:00) en hora de España. */
export function madridMinuteOfWeek(date: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
    const hour = Number(get('hour'))
    const minute = Number(get('minute'))
    if (day >= 0 && Number.isFinite(hour) && Number.isFinite(minute)) return day * 1440 + hour * 60 + minute
  } catch {
    // Sin soporte de zonas horarias: se usa la hora del teléfono.
  }
  return date.getDay() * 1440 + date.getHours() * 60 + date.getMinutes()
}

/** «7:00», «24:00» para la medianoche de cierre, como en Google. */
function clock(minOfDay: number, isClose: boolean) {
  const m = ((minOfDay % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, '0')
  return isClose && m === 0 ? '24:00' : `${h}:${mm}`
}

export function hoursStatus(periods: OpeningPeriod[] | null | undefined, now: number = madridMinuteOfWeek()): HoursStatus | null {
  if (!periods || periods.length === 0) return null
  // Abierto 24 h: un único periodo sin cierre.
  if (periods.length === 1 && !periods[0]!.close) return { open: true, soon: false, label: 'Abierto 24 h' }

  const spans = periods
    .filter((p) => p.close)
    .map((p) => {
      const start = mow(p.open)
      let end = mow(p.close!)
      if (end <= start) end += WEEK
      return { start, end }
    })
  if (spans.length === 0) return null

  // ¿Abierto ahora? (también los turnos que empiezan el sábado y acaban el domingo)
  for (const s of spans) {
    for (const t of [now, now + WEEK]) {
      if (t >= s.start && t < s.end) {
        // Turnos encadenados (p. ej. cierra a las 24:00 y reabre a las 0:00): se toma el cierre final.
        let end = s.end
        for (let guard = 0; guard < 7; guard++) {
          const next = spans.find((o) => o.start % WEEK === end % WEEK)
          if (!next) break
          end += next.end - next.start
        }
        const left = end - t
        const closeLabel = clock(end, true)
        if (left >= WEEK) return { open: true, soon: false, label: 'Abierto 24 h' }
        if (left <= SOON_MIN) return { open: true, soon: true, label: `Cierra pronto · a las ${closeLabel}` }
        return { open: true, soon: false, label: `Abierto · cierra a las ${closeLabel}` }
      }
    }
  }

  // Cerrado: próxima apertura.
  let best = Infinity
  for (const s of spans) {
    const wait = (((s.start - now) % WEEK) + WEEK) % WEEK
    if (wait < best) best = wait
  }
  const openAt = now + best
  const openDayIdx = Math.floor(openAt / 1440) % 7
  const dayDiff = Math.floor(openAt / 1440) - Math.floor(now / 1440)
  const when =
    dayDiff === 0
      ? `abre a las ${clock(openAt, false)}`
      : dayDiff === 1
        ? `abre mañana a las ${clock(openAt, false)}`
        : `abre el ${DAYS[openDayIdx]} a las ${clock(openAt, false)}`
  return { open: false, soon: false, label: `Cerrado · ${when}` }
}
