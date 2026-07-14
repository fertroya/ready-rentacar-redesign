import { describe, expect, it } from 'vitest'
import { toAnyRentDate } from './dates'

describe('toAnyRentDate', () => {
  it('passes through AnyRent YmdTHisZ', () => {
    expect(toAnyRentDate('20260801T100000Z')).toBe('20260801T100000Z')
  })

  it('converts ISO-8601 to UTC AnyRent format', () => {
    expect(toAnyRentDate('2026-08-01T10:00:00.000Z')).toBe('20260801T100000Z')
  })

  it('rejects empty and invalid input', () => {
    expect(() => toAnyRentDate('')).toThrow(/empty/)
    expect(() => toAnyRentDate('not-a-date')).toThrow(/invalid/)
  })
})
