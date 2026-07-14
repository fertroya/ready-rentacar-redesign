/**
 * AnyRent Cloud API expects dates as `Ymd\THis\Z`, e.g. `20260801T100000Z`.
 * Accept ISO-8601 from clients and normalize here so the front stays idiomatic.
 */
export function toAnyRentDate(input: string): string {
  const raw = input.trim()
  if (!raw) {
    throw new Error('empty date')
  }

  // Already AnyRent format
  if (/^\d{8}T\d{6}Z$/.test(raw)) {
    return raw
  }

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`invalid date: ${raw}`)
  }

  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  const y = d.getUTCFullYear()
  const m = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  const h = pad(d.getUTCHours())
  const min = pad(d.getUTCMinutes())
  const s = pad(d.getUTCSeconds())
  return `${y}${m}${day}T${h}${min}${s}Z`
}
