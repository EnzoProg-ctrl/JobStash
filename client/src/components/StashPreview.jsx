import FilterTabs from './FilterTabs.jsx'
import JobCard from './JobCard.jsx'

// A look at My Stash for the landing page, in a browser-window frame. It is
// drawn with the app's own pieces (FilterTabs, JobCard) and three made-up
// jobs, so it always looks like the real thing, even after the app changes.
//
// It's only a picture: `inert` makes everything inside it unclickable and
// hidden from screen readers, and the frame's label describes it instead.

const DAY = 24 * 60 * 60 * 1000

// Dates are counted back from today, so "Added …" always looks recent.
function sampleJobs(now = Date.now()) {
  return [
    {
      id: 'preview-1',
      job_title: 'Frontend Developer',
      company_name: 'Northwind Labs',
      posting_url: 'https://www.linkedin.com/jobs/view/preview',
      source: null,
      status: 'to_apply',
      outcome: null,
      favorite: true,
      added_at: new Date(now - DAY).toISOString(),
    },
    {
      id: 'preview-2',
      job_title: 'Data Analyst Intern',
      company_name: 'Harbour Analytics',
      posting_url: 'https://www.jobstreet.com.ph/job/preview',
      source: null,
      status: 'done',
      outcome: 'pending',
      favorite: false,
      added_at: new Date(now - 3 * DAY).toISOString(),
    },
    {
      id: 'preview-3',
      job_title: 'UX Designer',
      company_name: 'Lumina Tech',
      posting_url: null,
      source: 'Referral from a classmate',
      status: 'done',
      outcome: 'accepted',
      favorite: false,
      added_at: new Date(now - 6 * DAY).toISOString(),
    },
  ]
}

const nothing = () => {}

export default function StashPreview() {
  const jobs = sampleJobs()

  return (
    <figure
      role="img"
      aria-label="A look at My Stash: saved jobs with their company, where they were found, the date added, and whether you've applied yet"
      className="overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl shadow-ink/10"
    >
      {/* The window's top bar: three dots and the address. */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full bg-line" />
          <span className="size-3 rounded-full bg-line" />
          <span className="size-3 rounded-full bg-line" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-subtle px-3 py-1 text-center text-xs text-muted">
          jobstash-ph.vercel.app/stash
        </span>
        <span className="w-12.5" />
      </div>

      {/* Phones: almost no side padding, so the rows get the same room as
          in the real app. */}
      <div inert="" className="px-1 pt-5 pb-2 select-none min-[400px]:px-3 md:px-8 md:pt-8">
        <p className="px-2 text-[1.75rem] leading-[1.1] font-bold tracking-tight text-ink md:px-0 md:text-[2.25rem]">My Stash</p>
        <p className="mt-2 px-2 text-muted md:px-0 md:text-lg">
          <span className="font-semibold text-brand-blue">1 to apply</span>
          {' · '}
          <span className="font-semibold text-ink">2 applied</span>
          {' · '}
          3 saved in total
        </p>
        <div className="mt-5">
          <FilterTabs value="all" counts={{ to_apply: 1, done: 2, all: 3 }} onChange={nothing} />
        </div>
        <ul className="mt-5 border-t border-line">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} showStatus onSetStatus={nothing} onToggleFavorite={nothing} />
          ))}
        </ul>
      </div>
    </figure>
  )
}
