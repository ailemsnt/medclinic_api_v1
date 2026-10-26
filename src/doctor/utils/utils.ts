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
