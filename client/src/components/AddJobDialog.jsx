import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { createJob, previewJob } from '../api'

// The Add Job pop-up. It is shown while the address is /stash/add, on top of
// My Stash, and closing it just goes back to /stash.
//
// Pasting the link is enough: JobStash reads the job's page and fills in the
// company and position (server/linkPreview.js). They stay editable, and when
// nothing can be read, the person types the company as before.

// The same rules the server checks in server/server.js, so mistakes get a
// friendly message here before anything is sent.
function validate({ postingUrl, companyName, jobTitle }) {
  const errors = {}
  const url = postingUrl.trim()

  if (!url) {
    errors.postingUrl = 'Paste the job link.'
  } else if (!isWebLink(url)) {
    errors.postingUrl = "That doesn't look like a web link. It should start with https://"
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

const inputClass =
  'min-h-12 w-full rounded-lg border border-line bg-surface px-4 text-base placeholder:text-muted aria-invalid:border-error'

export default function AddJobDialog() {
  const dialog = useRef(null)
  const urlInput = useRef(null)

  // The browser's <dialog> dims the page, keeps Tab inside the pop-up and
  // closes on Esc. showModal() is what switches all of that on. It also moves
  // focus to the first button (the ✕), so the link box is focused after it,
  // ready for a paste.
  useEffect(() => {
    dialog.current.showModal()
    urlInput.current.focus()
  }, [])

  const navigate = useNavigate()
  const { onJobSaved } = useOutletContext()
  const [postingUrl, setPostingUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
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
    if (!isWebLink(url)) {
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
  }, [postingUrl])

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
  function handleBackdropClick(event) {
    if (event.target === dialog.current) close()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate({ postingUrl, companyName, jobTitle })
    if (found.companyName && !companyName.trim() && lookup === 'looking') {
      found.companyName = 'Still reading the link. Wait a moment, or type the company name.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    setSaveError(null)
    try {
      const job = await createJob({
        posting_url: postingUrl.trim(),
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
      })
      onJobSaved(job)
      close()
    } catch (caught) {
      setSaveError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      onCancel={handleCancel}
      // If the browser closes the pop-up by itself anyway (some do on a second
      // Esc press), still go back to /stash.
      onClose={finishClosing}
      data-closing={closing || undefined}
      onClick={handleBackdropClick}
      aria-labelledby="add-job-title"
      className="mt-auto mb-0 w-full max-w-none max-h-[90dvh] rounded-t-3xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 
  md:m-auto md:w-[calc(100%-2rem)] md:max-w-xl md:max-h-[calc(100%-2rem)] md:rounded-2xl"
    >
      <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:p-8">
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden="true"/>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-job-title" className="text-3xl font-bold">Add Job</h2>
            <p className="mt-1 text-muted">Paste a job link. JobStash fills in the company and position.</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-subtle text-ink hover:bg-line"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
          <div>
            <label htmlFor="posting-url" className="mb-2 block text-sm font-semibold">
              Job posting URL <span className="text-error" aria-hidden="true">*</span>
            </label>  
            <div className="relative">
              <svg className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M7 9a3 3 0 004.2.3l2-2a3 3 0 00-4.2-4.2l-.8.8M9 7a3 3 0 00-4.2-.3l-2 2a3 3 0 004.2 4.2l.8-.8" />
              </svg>
              <input
                id="posting-url"
                type="url"
                placeholder="https://"
                ref={urlInput}
                aria-required="true"
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
          </div>

          <div>
            <label htmlFor="company-name" className="mb-2 block text-sm font-semibold">
              Company name <span className="text-error" aria-hidden="true">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              placeholder="Filled in from the link, or type it"
              aria-required="true"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              aria-invalid={errors.companyName ? 'true' : undefined}
              aria-describedby={errors.companyName ? 'company-name-error' : undefined}
              className={inputClass}
            />
            {errors.companyName && (
              <p id="company-name-error" className="mt-2 text-sm text-error">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label htmlFor="job-title" className="mb-2 block text-sm font-semibold">Job title</label>
            <input
              id="job-title"
              type="text"
              placeholder="Filled in from the link (optional)"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              aria-invalid={errors.jobTitle ? 'true' : undefined}
              aria-describedby={errors.jobTitle ? 'job-title-error' : undefined}
              className={inputClass}
            />
            {errors.jobTitle && (
              <p id="job-title-error" className="mt-2 text-sm text-error">{errors.jobTitle}</p>
            )}
          </div>

          {saveError && (
            <p role="alert" className="rounded-lg border border-line bg-subtle p-3 text-sm text-error">
              Couldn't save: {saveError}
            </p>
          )}

          <div className="mt-2 flex gap-3 md:justify-between">
            <button
              type="button"
              onClick={close}
              className="hidden min-h-12 flex-1 rounded-lg bg-subtle px-8 font-semibold text-ink hover:bg-line md:block md:flex-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              // Also while closing, so a quick second click can't save it twice.
              disabled={saving || closing}
              className="min-h-12 flex-1 rounded-lg bg-brand-blue px-10 font-semibold text-white hover:bg-todo disabled:opacity-60 md:flex-none"
            >
              {saving ? 'Saving…' : 'Save Job'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
