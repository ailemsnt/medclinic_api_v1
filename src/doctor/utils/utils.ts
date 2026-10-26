export const CLINIC_TIME_ZONE = 'America/Sao_Paulo'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toAbsoluteDayMinutes(timeString: string): number {
  const [hour, minute] = timeString.split(':').map(Number)

  if (hour === 0 && minute === 0) {
    return 1440
  }

  return hour * 60 + minute
}

/** Converte "HH:MM" em minutos desde 00:00 (ex.: "08:30" -> 510). */
export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function toClinicTime(date: Date): { weekDay: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return {
    weekDay: WEEK_DAYS.indexOf(part('weekday')),
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  }
}

export function clinicDayStart(date: string): Date {
  return new Date(`${date}T00:00:00-03:00`)
}
