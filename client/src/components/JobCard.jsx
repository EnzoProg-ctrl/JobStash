import CardMenu from './CardMenu.jsx'
import StatusBadge from './StatusBadge.jsx'
import { siteName, timeAgo } from '../lib/format.js'

// One saved job. Drawn once here and repeated for every row in My Stash.
//
// On a phone everything stacks: the badge and link sit under the text. From
// 768px up (md:) the card becomes one row with them on the right.
export default function JobCard({ job, onSetStatus }) {
  // The title is optional, so a link can be saved before you know what the
  // role is called. Without one, the company moves up to the bold line.
  const heading = job.job_title || job.company_name
  const subheading = job.job_title ? job.company_name : null
  const site = siteName(job.posting_url)

  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-sm md:flex-row md:items-center md:p-6">
      <div className="flex min-w-0 flex-1 gap-4">
        {/* The company name is right beside it, so screen readers skip this. */}
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-subtle text-lg font-bold text-primary"
          aria-hidden="true"
        >
          {job.company_name.charAt(0).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold wrap-anywhere">{heading}</h2>
          {subheading && <p className="wrap-anywhere">{subheading}</p>}
          <p className="text-sm text-muted">
            {site && <>{site} · </>}
            Added <time dateTime={job.added_at}>{timeAgo(job.added_at)}</time>
          </p>
        </div>

        <CardMenu
          label={heading}
          status={job.status}
          onSetStatus={(status) => onSetStatus(job, status)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-15 md:shrink-0 md:pl-0">
        <StatusBadge status={job.status} />
        <a
          href={job.posting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-brand-blue hover:bg-subtle"
        >
          Open Posting
          <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </li>
  )
}
