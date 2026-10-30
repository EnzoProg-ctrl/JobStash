import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router'
import { createJob, previewJob } from '../api'

// The Add Job pop-up. It is shown while the address is /stash/add, on top of
// My Stash, and closing it just goes back to /stash.
//
// Pasting the link is enough: JobStash reads the job's page and fills in the
// company and position (server/linkPreview.js). They stay editable, and when
// nothing can be read, the person types the company as before.
//
// manual: the "Add Job Without Link" pop-up (/stash/add/manual), for jobs seen
// offline, referrals and cold emails. The link is optional, nothing is read
// from it, and "Where you found it" says where the job came from (source,
// server migration 006). Each pop-up has a button to switch to the other,
// carrying over a link already pasted.

// The same rules the server checks in server/server.js, so mistakes get a
// friendly message here before anything is sent.
function validate({ postingUrl, companyName, jobTitle, source }, { linkRequired }) {
  const errors = {}
  const url = postingUrl.trim()

  if (!url) {
    if (linkRequired) errors.postingUrl = 'Paste the job link.'
  } else if (!isWebLink(url)) {
    errors.postingUrl = "That doesn't look like a web link. It should start with https://"
  }

  if (source.trim().length > 120) {
    errors.source = 'Keep this under 120 characters.'
  }

  if (!companyName.trim()) {
    errors.companyName = 'Add the company name.'
  } else if (companyName.trim().length > 120) {
    errors.companyName = 'Keep the company name under 120 characters.'
  }

  if (jobTitle.trim().length > 160) {
    errors.jobTitle = 'Keep the job title under 160 characters.'
  }

  return errors
}

function isWebLink(text) {
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// The boxes: a thin border that turns blue (with a soft blue glow) while
// typing in it, and red when something needs fixing. The border and glow take
// the place of the usual focus outline.
const inputClass =
  'min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-muted transition-[border-color,box-shadow,background-color] focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus-visible:outline-none aria-invalid:border-error aria-invalid:focus:ring-error/15'
const labelClass = 'text-sm font-semibold text-ink'

export default function AddJobDialog({ manual = false }) {
  const dialog = useRef(null)
  const urlInput = useRef(null)
  const companyInput = useRef(null)
  // A link pasted in the other pop-up before switching to this one.
  const carriedLink = useLocation().state?.link ?? ''

  // The browser's <dialog> dims the page, keeps Tab inside the pop-up and
  // closes on Esc. showModal() is what switches all of that on. It also moves
  // focus to the first button (the ✕), so the link box is focused after it,
  // ready for a paste. Without a link, most people start with the company.
  useEffect(() => {
    dialog.current.showModal()
    ;(manual ? companyInput : urlInput).current.focus()
    // Only when the pop-up opens.
  }, [])

  const navigate = useNavigate()
  const { onJobSaved } = useOutletContext()
  const [postingUrl, setPostingUrl] = useState(carriedLink)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [source, setSource] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  // True while the closing animation plays (dialog[data-closing] in styles.css).
  const [closing, setClosing] = useState(false)
  const closed = useRef(false)

  // Reading the link: 'idle' (no link yet), 'looking', 'filled' or 'none'.
  const [lookup, setLookup] = useState('idle')
  // What was filled in automatically, so a new link can replace it but never
  // something the person typed.
  const autoFilled = useRef({ company: '', title: '' })
  // Only the newest link's answer counts, if links change quickly.
  const lookupId = useRef(0)
  // The fields as they are now, for the answer that arrives later.
  const current = useRef({ company: '', title: '' })
  current.current = { company: companyName, title: jobTitle }

  useEffect(() => {
    const id = ++lookupId.current
    const url = postingUrl.trim()
    if (manual || !isWebLink(url)) {
      setLookup('idle')
      return
    }
    setLookup('looking')
    // Wait until typing stops for half a second; a paste is one change.
    const timer = setTimeout(async () => {
      let found = {}
      try {
        found = await previewJob(url)
      } catch {
        // Offline, rate limited or the API asleep: the person types it instead.
      }
      if (id !== lookupId.current) return
      // Fill a field only if it's empty or still holds what was filled in
      // before; anything the person typed stays.
      const fill = (setValue, key, value = '') => {
        const now = current.current[key]
        if (now.trim() !== '' && now !== autoFilled.current[key]) return
        autoFilled.current[key] = value
        setValue(value)
      }
      fill(setCompanyName, 'company', found.company_name)
      fill(setJobTitle, 'title', found.job_title)
      setLookup(found.company_name || found.job_title ? 'filled' : 'none')
    }, 500)
    return () => clearTimeout(timer)
  }, [postingUrl, manual])

  // Open the other pop-up, taking the link along.
  function switchMode() {
    navigate(manual ? '/stash/add' : '/stash/add/manual', { replace: true, state: { link: postingUrl } })
  }

  // Start closing: play the animation first, then really close. People who
  // ask their device for less motion get no animation, so no wait either.
  function close() {
    setClosing(true)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(finishClosing, reduceMotion ? 0 : 150)
  }

  // Really close, once only: the timer above and the dialog's own close
  // event can both get here. Closing the dialog first puts keyboard focus
  // back on + Add Job, where it was before the pop-up opened.
  function finishClosing() {
    if (closed.current) return
    closed.current = true
    dialog.current?.close()
    navigate('/stash')
  }

  // Esc. The browser would close the pop-up straight away; stop that, so the
  // closing animation can play first.
  function handleCancel(event) {
    event.preventDefault()
    close()
  }

  // A click on the dimmed background lands on the <dialog> element itself;
  // a click on the white box lands on something inside it.
  //
  // Only close when the press also started on the background. Otherwise,
  // selecting text in a box and letting go outside the white box would count
  // as a click on the background and close the pop-up.
  const pressedOnBackdrop = useRef(false)
  function handleBackdropPress(event) {
    pressedOnBackdrop.current = event.target === dialog.current
  }
  function handleBackdropClick(event) {
    if (pressedOnBackdrop.current && event.target === dialog.current) close()
    pressedOnBackdrop.current = false
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate({ postingUrl, companyName, jobTitle, source }, { linkRequired: !manual })
    if (found.companyName && !companyName.trim() && lookup === 'looking') {
      found.companyName = 'Still reading the link. Wait a moment, or type the company name.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    setSaveError(null)
    try {
      const job = await createJob({
        // Empty means no link; the API stores it as none (null).
        posting_url: postingUrl.trim(),
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        // Only the pop-up without a link asks where the job was found.
        ...(manual && { source: source.trim() }),
      })
      onJobSaved(job)
      close()
    } catch (caught) {
      setSaveError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  // Filled in from the link and not changed since: shown with a light blue
  // tint, so it's clear which details JobStash filled in.
  const fromLink = (key, value) => value.trim() !== '' && value === autoFilled.current[key]

  return (
    <dialog
      ref={dialog}
      onCancel={handleCancel}
      // If the browser closes the pop-up by itself anyway (some do on a second
      // Esc press), still go back to /stash.
      onClose={finishClosing}
      data-closing={closing || undefined}
      onPointerDown={handleBackdropPress}
      onClick={handleBackdropClick}
      aria-labelledby="add-job-title"
      // A box with rounded corners and a little of the dimmed page showing
      // around it. 768px up: in the middle of the screen. Phones: resting near
      // the bottom edge (clear of the iPhone's home line), so Save stays in
      // the same place in both versions of the pop-up; the taller one just
      // reaches higher up. overscroll-contain: scrolling to the end of the
      // pop-up's own fields doesn't carry on into the page behind it.
      className="overscroll-contain m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 max-md:mb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {/* Top: what this pop-up is for, and ✕. */}
      <div className="px-6 pt-6 md:px-8 md:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              {manual ? 'No link needed' : 'New job'}
            </p>
            <h2 id="add-job-title" className="mt-1.5 text-2xl font-bold tracking-tight md:text-[1.75rem]">
              {manual ? 'Add Job Without Link' : 'Add Job'}
            </h2>
            <p className="mt-1 text-muted">
              {manual
                ? 'For jobs you saw offline, heard about, or are cold-emailing about.'
                : 'Paste a job link. JobStash fills in the company and position.'}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line text-muted hover:bg-subtle hover:text-ink"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <div className="flex flex-col gap-5 px-6 md:px-8">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <label htmlFor="posting-url" className={labelClass}>
                Job posting URL{' '}
                {manual ? (
                  <span className="font-normal text-muted">(optional)</span>
                ) : (
                  <span className="text-error" aria-hidden="true">*</span>
                )}
              </label>
              {/* Switch to the other pop-up, keeping the link. */}
              <button
                type="button"
                onClick={switchMode}
                className="-my-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-blue hover:bg-todo-bg"
              >
                {manual ? (
                  <>
                    <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M8 2l1.5 3.5L13 7l-3.5 1.5L8 12l-1.5-3.5L3 7l3.5-1.5z" />
                    </svg>
                    Fill in from a link
                  </>
                ) : (
                  <>
                    <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10.5 2.5l3 3L6 13H3v-3z" />
                    </svg>
                    Add job without link
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <svg className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M7 9a3 3 0 004.2.3l2-2a3 3 0 00-4.2-4.2l-.8.8M9 7a3 3 0 00-4.2-.3l-2 2a3 3 0 004.2 4.2l.8-.8" />
              </svg>
              <input
                id="posting-url"
                type="url"
                placeholder="https://"
                ref={urlInput}
                aria-required={manual ? undefined : 'true'}
                value={postingUrl}
                onChange={(event) => setPostingUrl(event.target.value)}
                aria-invalid={errors.postingUrl ? 'true' : undefined}
                aria-describedby={errors.postingUrl ? 'posting-url-error' : undefined}
                className={`${inputClass} pl-12`}
              />
            </div>
            {errors.postingUrl && (
              <p id="posting-url-error" className="mt-2 text-sm text-error">{errors.postingUrl}</p>
            )}
            {/* What reading the link is doing. Screen readers hear it too. */}
            {!manual && (
              <p role="status" className="mt-2 flex min-h-5 items-center gap-2 text-sm text-muted">
                {lookup === 'looking' && (
                  <>
                    <svg className="size-4 animate-spin text-brand-blue" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Reading the job page…
                  </>
                )}
                {lookup === 'filled' && (
                  <>
                    <svg className="size-4 text-done" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Filled in from the link. Check them before saving.
                  </>
                )}
                {lookup === 'none' && "Couldn't read the details from this link. Please type the company name."}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="company-name" className={`mb-2 block ${labelClass}`}>
              Company name <span className="text-error" aria-hidden="true">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              ref={companyInput}
              placeholder={manual ? 'e.g. NovaTech' : 'Filled in from the link, or type it'}
              aria-required="true"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              aria-invalid={errors.companyName ? 'true' : undefined}
              aria-describedby={errors.companyName ? 'company-name-error' : undefined}
              className={`${inputClass} ${fromLink('company', companyName) ? 'bg-todo-bg/70' : ''}`}
            />
            {errors.companyName && (
              <p id="company-name-error" className="mt-2 text-sm text-error">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label htmlFor="job-title" className={`mb-2 block ${labelClass}`}>
              Job title <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="job-title"
              type="text"
              placeholder={manual ? 'e.g. Data Analyst Intern' : 'Filled in from the link'}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              aria-invalid={errors.jobTitle ? 'true' : undefined}
              aria-describedby={errors.jobTitle ? 'job-title-error' : undefined}
              className={`${inputClass} ${fromLink('title', jobTitle) ? 'bg-todo-bg/70' : ''}`}
            />
            {errors.jobTitle && (
              <p id="job-title-error" className="mt-2 text-sm text-error">{errors.jobTitle}</p>
            )}
          </div>

          {/* Only without a link: where the job came from, shown on its card. */}
          {manual && (
            <div>
              <label htmlFor="job-source" className={`mb-2 block ${labelClass}`}>
                Where you found it <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="job-source"
                type="text"
                placeholder="e.g. Cold email, job fair, referral"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                aria-invalid={errors.source ? 'true' : undefined}
                aria-describedby={errors.source ? 'job-source-error' : undefined}
                className={inputClass}
              />
              {errors.source && (
                <p id="job-source-error" className="mt-2 text-sm text-error">{errors.source}</p>
              )}
            </div>
          )}

          {saveError && (
            <p role="alert" className="rounded-xl border border-error/30 bg-red-50 p-3 text-sm text-error">
              Couldn't save: {saveError}
            </p>
          )}
        </div>

        {/* Bottom: Cancel and Save, under a thin line. Phones: Save only, full
            width (the ✕ and the dimmed page close it). sticky: when the
            pop-up has to scroll (small phones), Save stays in sight. */}
        <div className="sticky bottom-0 mt-7 flex gap-3 border-t border-line bg-surface px-6 pt-4 pb-4 md:justify-end md:px-8 md:pb-5">
          <button
            type="button"
            onClick={close}
            className="hidden min-h-12 items-center rounded-xl border border-line bg-surface px-6 font-semibold text-ink hover:bg-subtle md:inline-flex"
          >
            Cancel
          </button>
          <button
            type="submit"
            // Also while closing, so a quick second click can't save it twice.
            disabled={saving || closing}
            className="press inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-brand-blue px-8 font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60 md:flex-none"
          >
            {saving ? 'Saving…' : 'Save Job'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
