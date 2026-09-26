import CardMenu from './CardMenu.jsx'
import StatusBadge from './StatusBadge.jsx'
import { siteName, timeAgo } from '../lib/format.js'

// Letter-circle colours. Each pair passes the 4.5 : 1 contrast check. A company
// always gets the same colour, because it is picked from its name.
const AVATAR_COLOURS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
]

// Mixes the letters (×31 each step) rather than just adding them, so similar
// names still spread across the colours. With six colours some companies will
// share one; that is expected.
function avatarColour(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length]
}

// One saved job. Drawn once here and repeated for every row in My Stash.
//
// It is a grid so the ⋮ menu exists once but sits in two places:
//   phone:    [circle] [text        ] [⋮]
//                      [badge] [Open]
//   768px up: [circle] [text] [badge] [Open] [⋮]
export default function JobCard({ job, onSetStatus }) {
  // The title is optional, so a link can be saved before you know what the
  // role is called. Without one, the company moves up to the bold line.
  const heading = job.job_title || job.company_name
  const subheading = job.job_title ? job.company_name : null
  const site = siteName(job.posting_url)

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 rounded-card border border-line bg-surface p-4 shadow-sm md:grid-cols-[auto_1fr_auto_auto] md:gap-x-6 md:px-6 md:py-5">
      {/* The company name is right beside it, so screen readers skip this. */}
      <span
        className={`col-start-1 row-start-1 flex size-12 items-center justify-center self-start rounded-full text-lg font-bold md:size-14 md:self-center ${avatarColour(job.company_name)}`}
        aria-hidden="true"
      >
        {job.company_name.charAt(0).toUpperCase()}
      </span>

      <div className="col-start-2 row-start-1 min-w-0">
        <h2 className="font-semibold wrap-anywhere md:text-lg">{heading}</h2>
        {subheading && <p className="wrap-anywhere">{subheading}</p>}
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M7 9a3 3 0 004.2.3l2-2a3 3 0 00-4.2-4.2l-.8.8M9 7a3 3 0 00-4.2-.3l-2 2a3 3 0 004.2 4.2l.8-.8" />
          </svg>
          <span className="wrap-anywhere">
            {site && <>{site} · </>}
            Added <time dateTime={job.added_at}>{timeAgo(job.added_at)}</time>
          </span>
        </p>
      </div>

      <div className="col-span-2 col-start-2 row-start-2 flex flex-wrap items-center gap-3 md:col-span-1 md:col-start-3 md:row-start-1 md:gap-6">
        <StatusBadge status={job.status} />
        <a
          href={job.posting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-brand-blue hover:bg-subtle"
        >
          Open Posting
          <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      <div className="col-start-3 row-start-1 self-start md:col-start-4 md:self-center">
        <CardMenu
          label={heading}
          status={job.status}
          onSetStatus={(status) => onSetStatus(job, status)}
        />
      </div>
    </li>
  )
}
