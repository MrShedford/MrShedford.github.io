// Content dates are plain YYYY-MM-DD. Formatting in UTC keeps "2026-10-01"
// from rendering as 30 September for anyone west of Greenwich.

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const monthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(date: string): string {
  return dayFormat.format(new Date(date))
}

export function formatMonth(date: string): string {
  return monthFormat.format(new Date(date))
}

export function yearOf(date: string): string {
  return date.slice(0, 4)
}
