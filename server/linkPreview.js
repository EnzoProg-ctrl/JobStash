import http from 'node:http'
import https from 'node:https'
import dns from 'node:dns'
import net from 'node:net'
import zlib from 'node:zlib'

// Reads a job posting's page and suggests its company and job title, so
// adding a job can be just pasting the link (GET /api/preview in server.js).
//
//   const { company_name, job_title, found, blocked } = await previewJob(url)
//
// It looks, in this order, at:
//   1. the page's job-posting data (schema.org JobPosting): most careers sites
//      publish it for search engines, and it names both exactly
//   2. its link-preview tags (og:title, og:site_name) and its <title>, e.g.
//      "Brightside Co. hiring Frontend Intern in Manila | LinkedIn"
//   3. the link itself, e.g. linkedin.com/jobs/view/frontend-intern-at-brightside-co-4011…
//      or glassdoor.com/job-listing/frontend-intern-brightside-co-JV_…_KO0,15_KE16,29.htm
// found says where the answer came from ('page', 'link'), or is null when
// nothing was found; then the person types the company themselves. Either one
// can be empty (OnlineJobs.ph pages name the position but rarely the
// employer). blocked is true when the site refused to show the page (JobStreet
// and Indeed do, to every server). It never throws: a page that is slow,
// blocked or odd just finds nothing.
//
// Opening any link people paste is risky for a server: someone could paste an
// address inside the hosting network (the cloud's metadata service,
// 169.254.169.254, or localhost) to make the server reach things the public
// can't. So it only goes to public internet addresses, on the normal web
// ports, checks every redirect the same way, gives up after a few seconds and
// reads at most 1.5 MB (some sites put the job's details at the very end).

const TIME_LIMIT = 6000
const MAX_BYTES = 1536 * 1024
const MAX_REDIRECTS = 3

// Addresses that are not the public internet: this machine, private networks,
// link-local (where cloud metadata services live), carrier-grade NAT,
// documentation ranges, multicast and reserved space.
const notPublic = new net.BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
]) notPublic.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64],
  ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
]) notPublic.addSubnet(address, prefix, 'ipv6')

export function isPublicAddress(address) {
  const family = net.isIP(address)
  if (!family) return false
  // IPv4 written as IPv6 (::ffff:127.0.0.1). No real site's address looks like
  // this, so refuse it outright. (Not as a range in the list above: the list
  // then matches every IPv4 address too.)
  if (family === 6 && /^::ffff:/i.test(address)) return false
  return !notPublic.check(address, family === 4 ? 'ipv4' : 'ipv6')
}

// Used instead of the normal DNS lookup for every connection, so the address
// is checked at the moment of connecting (a name can't pass the check and
// then point somewhere else).
function publicOnlyLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error)
    if (!addresses.length || !addresses.every((entry) => isPublicAddress(entry.address))) {
      return callback(Object.assign(new Error('Not a public address'), { code: 'ENOTPUBLIC' }))
    }
    if (options.all) return callback(null, addresses)
    callback(null, addresses[0].address, addresses[0].family)
  })
}

// Only http(s), only the normal web ports, no "user:password@" in the link,
// and an address written as numbers must itself be public (those skip DNS).
function allowedUrl(text) {
  let url
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.port && url.port !== '80' && url.port !== '443') return null
  if (url.username || url.password) return null
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host) && !isPublicAddress(host)) return null
  return url
}

function fetchPage(text, redirectsLeft, deadline) {
  return new Promise((resolve, reject) => {
    const url = allowedUrl(text)
    if (!url) return reject(new Error('Link not allowed'))
    const timeLeft = deadline - Date.now()
    if (timeLeft <= 0) return reject(new Error('Too slow'))

    const request = (url.protocol === 'https:' ? https : http).get(url, {
      lookup: publicOnlyLookup,
      timeout: timeLeft,
      headers: {
        // Says who is asking, like the link-preview readers of chat apps do.
        'User-Agent': 'Mozilla/5.0 (compatible; JobStashBot/1.0; +https://jobstash-ph.vercel.app)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'Accept-Language': 'en',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    })
    const timer = setTimeout(() => request.destroy(new Error('Too slow')), timeLeft)
    const finish = (fn, value) => { clearTimeout(timer); fn(value) }

    request.on('timeout', () => request.destroy(new Error('Too slow')))
    request.on('error', (error) => finish(reject, error))
    request.on('response', (response) => {
      const { statusCode, headers } = response
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        response.resume()
        if (redirectsLeft <= 0) return finish(reject, new Error('Too many redirects'))
        const next = new URL(headers.location, url).href
        clearTimeout(timer)
        return fetchPage(next, redirectsLeft - 1, deadline).then(resolve, reject)
      }
      if (statusCode !== 200 || !/html/i.test(headers['content-type'] ?? '')) {
        response.resume()
        return finish(reject, Object.assign(new Error(`Not a readable page (${statusCode})`), { status: statusCode }))
      }

      const encoding = (headers['content-encoding'] ?? '').toLowerCase()
      const body =
        encoding === 'gzip' ? response.pipe(zlib.createGunzip())
        : encoding === 'deflate' ? response.pipe(zlib.createInflate())
        : encoding === 'br' ? response.pipe(zlib.createBrotliDecompress())
        : response
      const chunks = []
      let size = 0
      const done = () => finish(resolve, { html: Buffer.concat(chunks).toString('utf8'), url: url.href })
      body.on('data', (chunk) => {
        chunks.push(chunk)
        size += chunk.length
        // The details are near the top; the rest isn't needed.
        if (size >= MAX_BYTES) {
          request.destroy()
          done()
        }
      })
      body.on('end', done)
      body.on('error', (error) => (size ? done() : finish(reject, error)))
    })
  })
}

// ---- Reading the page ----

function decode(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function clean(text, max) {
  if (typeof text !== 'string') return ''
  // Decoded twice: some sites encode their titles twice ("&amp;amp;" for "&").
  const tidy = decode(decode(text)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return tidy.length > max ? '' : tidy
}

// 1. schema.org JobPosting, in <script type="application/ld+json">.
function fromJobPostingData(html) {
  const blocks = html.matchAll(/<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)
  for (const [, json] of blocks) {
    let data
    try {
      data = JSON.parse(json.trim())
    } catch {
      continue
    }
    const queue = [data]
    while (queue.length) {
      const item = queue.shift()
      if (!item || typeof item !== 'object') continue
      if (Array.isArray(item)) { queue.push(...item); continue }
      if (item['@graph']) queue.push(item['@graph'])
      const types = [].concat(item['@type'] ?? [])
      if (types.includes('JobPosting')) {
        const organization = item.hiringOrganization
        return {
          job_title: clean(item.title, 160),
          company_name: clean(typeof organization === 'string' ? organization : organization?.name, 120),
        }
      }
    }
  }
  return {}
}

function metaTags(html) {
  const tags = {}
  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const attributes = {}
    for (const [, name, , double, single] of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      attributes[name.toLowerCase()] = double ?? single
    }
    const key = (attributes.property ?? attributes.name ?? '').toLowerCase()
    if (key && attributes.content && !(key in tags)) tags[key] = attributes.content
  }
  return tags
}

// Job sites whose name must never be taken for the company.
const JOB_SITES = /^(linkedin|indeed(\.com)?|jobstreet|jobstreet by seek|seek|glassdoor|kalibrr|onlinejobs(\.ph)?|jora|monster|ziprecruiter|greenhouse|lever|workday|smartrecruiters|ashby|workable|breezy|bossjob|foundit|wellfound)$/i

// Headings of pages that aren't one job: search results, sign-in walls,
// "not found" pages. A job site shows these for expired or private postings.
const NOT_A_JOB = /\b(jobs|careers|vacancies) in\b|open roles|\d[\d,]*\+? (jobs|results)|job search|search jobs|sign ?(in|up)|log ?in|join now|not found|\b404\b|access denied|just a moment|captcha/i

// 2. A title like the ones job sites write, split into position and company.
// matched says whether it followed one of those patterns.
function splitTitle(raw, siteName, host) {
  let title = clean(raw, 300).replace(/^job application for /i, '')     // Greenhouse
  if (!title || NOT_A_JOB.test(title)) return {}
  // Drop a trailing "| LinkedIn", "- Indeed.com", "| Jobstreet" or the site's own name.
  const suffix = /\s+[|\-–—·]\s+([^|\-–—·]+)$/
  const last = title.match(suffix)
  const onJobSite = Boolean(last && JOB_SITES.test(last[1].trim()))
  if (last && (onJobSite || (siteName && last[1].trim() === siteName))) {
    title = title.replace(suffix, '').trim()
  }
  // A listing number at the end ("AI Video Creator & Editor 1758871" on
  // OnlineJobs.ph) isn't part of the job's name.
  title = title.replace(/\s+#?\d{5,}$/, '')
  // OnlineJobs.ph titles are only the position, written freely by the
  // employer (who usually stays anonymous), dashes and "at" included.
  if (host.endsWith('onlinejobs.ph')) return { job_title: title, matched: true }

  let match = title.match(/^(.+?) hiring (.+?)(?: in [^|]+)?$/i)        // LinkedIn
  if (match) return { company_name: match[1], job_title: match[2], matched: true }
  match = title.match(/^(.+?) at (.+)$/i)                                // "Position at Company"
  if (match) return { job_title: match[1], company_name: match[2], matched: true }
  const parts = title.split(/\s+[|\-–—]\s+/).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2 && host.endsWith('lever.co')) {                  // Lever: "Company - Position"
    return { company_name: parts[0], job_title: parts[1], matched: true }
  }
  if (parts.length >= 2) return { job_title: parts[0], company_name: parts[1], matched: true }  // Indeed: "Position - Company - Place"
  // A job site's page whose title is only the position: OnlineJobs.ph, where
  // most employers stay anonymous ("AI Video Creator & Editor - OnlineJobs.ph").
  // The title is still worth filling in; the person types the company.
  return { job_title: title, matched: onJobSite }
}

// 3. The link itself, for sites that put the words in it.
// Short words that are written in capitals in job titles.
const ABBREVIATIONS = new Set(['ai', 'ml', 'ui', 'ux', 'qa', 'it', 'hr', 'pr', 'seo', 'sql', 'php', 'aws', 'crm', 'erp', 'bpo', 'ceo', 'cto', 'cfo', 'vp', 'ph', 'usa', 'uk'])

function words(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => (ABBREVIATIONS.has(word.toLowerCase()) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(' ')
}

export function fromLink(text) {
  let url
  try {
    url = new URL(text)
  } catch {
    return {}
  }
  const host = url.hostname.replace(/^www\./, '')
  const path = decodeURIComponent(url.pathname)
  // linkedin.com/jobs/view/frontend-intern-at-brightside-co-4011223344
  let match = host.endsWith('linkedin.com') && path.match(/\/jobs\/view\/([a-z0-9-]+?)-at-([a-z0-9-]+?)-\d+\/?$/i)
  if (match) return { job_title: words(match[1]), company_name: words(match[2]) }
  // kalibrr.com/c/brightside-co/jobs/123456/frontend-intern
  match = host.endsWith('kalibrr.com') && path.match(/\/c\/([a-z0-9-]+)\/jobs\/\d+\/([a-z0-9-]+)/i)
  if (match) return { job_title: words(match[2]), company_name: words(match[1]) }
  // glassdoor.com/job-listing/senior-developer-acme-corp-JV_IC2195824_KO0,16_KE17,26.htm
  // The numbers say where the position (KO) and the company (KE) sit in the
  // words before "-JV_". Glassdoor blocks pages being read, so this is all
  // there is.
  match = /(^|\.)glassdoor\./.test(host) && path.match(/\/job-listing\/([a-z0-9-]+)-JV_.*?_KO(\d+),(\d+)(?:_KE(\d+),(\d+))?/i)
  if (match) {
    const [, slug, titleStart, titleEnd, companyStart, companyEnd] = match
    const part = (start, end) => (start === undefined ? '' : words(slug.slice(Number(start), Number(end))))
    const job_title = part(titleStart, titleEnd)
    const company_name = part(companyStart, companyEnd)
    if (job_title || company_name) return { job_title, company_name }
  }
  return {}
}

// strength says how sure it is: 'data' (job-posting data), 'pattern' (a title
// in a job site's usual style) or 'weak' (a careers site's name plus a plain
// page title). Nothing found: {}.
export function readDetails(html, host = '') {
  const fromData = fromJobPostingData(html)
  if (fromData.company_name || fromData.job_title) return { ...fromData, strength: 'data' }

  const tags = metaTags(html)
  const siteName = clean(tags['og:site_name'] ?? '', 120)
  // Sites differ in which title says more (Greenhouse's og:title is only the
  // position; its <title> has "... at Company"), so try each one.
  const titles = [tags['og:title'], tags['twitter:title'], html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]]
  let plain = ''
  for (const title of titles) {
    if (!title) continue
    const fromTitle = splitTitle(title, siteName, host)
    const job_title = clean(fromTitle.job_title ?? '', 160)
    let company_name = clean(fromTitle.company_name ?? '', 120)
    if (JOB_SITES.test(company_name)) company_name = ''
    if (fromTitle.matched && (company_name || job_title)) return { company_name, job_title, strength: 'pattern' }
    plain ||= job_title
  }
  // A careers site's own name, minus "Careers" or "Jobs", is its company.
  if (plain && siteName && !JOB_SITES.test(siteName)) {
    return { company_name: siteName.replace(/\s+(careers|jobs)$/i, '').trim(), job_title: plain, strength: 'weak' }
  }
  return {}
}

// Pages that only check whether a real person is visiting ("Just a moment…").
// Sites behind bot protection (JobStreet, Indeed, Glassdoor) send these to any
// server, whatever it says it is. JobStash doesn't try to get past them.
const CHECK_PAGE = /<title[^>]*>\s*(just a moment|attention required|access denied|verify(ing)? you are (a )?human|security check|are you a robot)/i

// The answer also says when the site refused to be read (blocked: true), so
// the Add Job pop-up can explain instead of just saying nothing was found.
export async function previewJob(text) {
  let page = {}
  let blocked = false
  try {
    const { html, url } = await fetchPage(text, MAX_REDIRECTS, Date.now() + TIME_LIMIT)
    if (CHECK_PAGE.test(html)) blocked = true
    else page = readDetails(html, new URL(url).hostname)
  } catch (error) {
    // Refused (401, 403, 429 or 503): blocked. Slow, not a page, or not
    // allowed: just nothing. Either way, fall back to the link.
    blocked = [401, 403, 429, 503].includes(error.status)
  }
  const link = fromLink(text)
  // Sure about the page: use it, filling any gap from the link.
  if (page.strength === 'data' || page.strength === 'pattern') {
    return {
      company_name: page.company_name || link.company_name || '',
      job_title: page.job_title || link.job_title || '',
      found: 'page',
      blocked,
    }
  }
  // Otherwise the words in the link win over a vague page.
  if (link.company_name || link.job_title) {
    return { company_name: link.company_name, job_title: link.job_title, found: 'link', blocked }
  }
  if (page.strength === 'weak') return { company_name: page.company_name, job_title: page.job_title, found: 'page', blocked }
  return { company_name: '', job_title: '', found: null, blocked }
}
