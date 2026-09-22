// Small display helpers for job cards. No React in here, so they are easy to
// test on their own.

// Job boards people actually use get their proper names. Anything else shows
// its web address, which is still more useful than a full URL.
const SITE_NAMES = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  jobstreet: 'JobStreet',
}

// "https://ph.indeed.com/viewjob?jk=..." -> "Indeed"
// "https://careers.meridian.example.org/..." -> "careers.meridian.example.org"
export function siteName(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    // Match on a whole part of the address, so ph.indeed.com and
    // jobstreet.com.ph are both recognised.
    const brand = host.split('.').find((part) => part in SITE_NAMES)
    return brand ? SITE_NAMES[brand] : host
  } catch {
    // Not a valid link. The server rejects these, but old data might not.
    return ''
  }
}

const UNITS = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// "2026-09-20T09:15:00Z" -> "2 days ago", "yesterday", "just now"
export function timeAgo(date, now = Date.now()) {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relative.format(Math.round(seconds / size), unit)
    }
  }
  return 'just now'
}
