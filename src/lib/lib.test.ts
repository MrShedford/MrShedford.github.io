import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { countByCategory, filterByCategory, parseRavingSearch, raveLabel } from './raving.ts'
import { formatRange, parsePortfolioSearch, toTimelineRows } from './timeline.ts'
import { parseGallerySearch, tagsByUse } from './gallery.ts'

describe('raving filters', () => {
  const ravings = [
    { slug: 'a', category: 'music' as const },
    { slug: 'b', category: 'tv' as const },
    { slug: 'c', category: 'music' as const },
  ]

  test('?category= accepts only known categories', () => {
    assert.deepEqual(parseRavingSearch({ category: 'music' }), { category: 'music' })
    assert.deepEqual(parseRavingSearch({ category: 'video-games' }), { category: 'video-games' })
    assert.deepEqual(parseRavingSearch({ category: 'books' }), {})
    assert.deepEqual(parseRavingSearch({}), {})
  })

  test('filters by category, or returns everything for "all"', () => {
    assert.deepEqual(filterByCategory(ravings, 'music').map((r) => r.slug), ['a', 'c'])
    assert.deepEqual(filterByCategory(ravings, 'movies'), [])
    assert.deepEqual(filterByCategory(ravings, undefined).map((r) => r.slug), ['a', 'b', 'c'])
  })

  test('counts every category, including empty ones', () => {
    assert.deepEqual(countByCategory(ravings), { music: 2, 'video-games': 0, movies: 0, tv: 1 })
  })

  test('rave labels cover the whole scale', () => {
    assert.equal(raveLabel(10), 'All-timer')
    assert.equal(raveLabel(9), 'Instant classic')
    assert.equal(raveLabel(5), 'Worth a look')
    assert.equal(raveLabel(1), 'Not for me')
  })
})

describe('timeline', () => {
  test('formats date ranges', () => {
    assert.equal(formatRange({ date: '2024-03-01', ongoing: true }), 'Mar 2024 – Present')
    assert.equal(formatRange({ date: '2021-01-10', endDate: '2024-02-28', ongoing: false }), 'Jan 2021 – Feb 2024')
    assert.equal(formatRange({ date: '2023-06-15', ongoing: false }), 'Jun 2023')
    assert.equal(formatRange({ date: '2023-06-01', endDate: '2023-06-30', ongoing: false }), 'Jun 2023')
  })

  test('formats in UTC, so the first of the month never slips back a month', () => {
    assert.equal(formatRange({ date: '2026-10-01', ongoing: false }), 'Oct 2026')
  })

  test('inserts a year marker at each change of year and alternates sides', () => {
    const rows = toTimelineRows([{ date: '2025-05-01' }, { date: '2025-01-01' }, { date: '2023-01-01' }])
    assert.deepEqual(
      rows.map((row) => (row.type === 'year' ? row.year : row.side)),
      ['2025', 'left', 'right', '2023', 'left'],
    )
  })

  test('?kind= accepts only known kinds', () => {
    assert.deepEqual(parsePortfolioSearch({ kind: 'award' }), { kind: 'award' })
    assert.deepEqual(parsePortfolioSearch({ kind: 'hobby' }), {})
  })
})

describe('gallery', () => {
  test('orders tags by use, then alphabetically', () => {
    const photos = [{ tags: ['night', 'city'] }, { tags: ['city'] }, { tags: ['beach'] }]
    assert.deepEqual(tagsByUse(photos), ['city', 'beach', 'night'])
  })

  test('drops empty or non-string search values', () => {
    assert.deepEqual(parseGallerySearch({ tag: '', photo: 'abc' }), { photo: 'abc' })
    assert.deepEqual(parseGallerySearch({ tag: 5 }), {})
  })
})
