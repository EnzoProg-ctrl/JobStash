import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router'

function validate({ postingUrl, companyName, jobTitle }) {
  const errors = {}
  const url = postingUrl.trim()

  if (!url) {
    errors.postingUrl = 'Paste the job link.'
  } else if (!isWebLink(url)) {
    errors.postingUrl = "That doesn't look like a web link. It should start with https://"
  }

  if (!companyName.trim()){
    errors.companyName = 'Add the company name.'
  }else if (companyName.trim().length > 120){
    errors.companyName = 'Keep the company name under 120 characters.'
  }

  if (jobTitle.trim().length > 160){
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

export default function AddJobDialog(){
    const dialog = useRef(null)

    useEffect(()=> {
    dialog.current.showModal()
  }, [])

    const navigate = useNavigate()
    const [postingUrl, setPostingUrl] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [errors, setErrors] = useState({})

    function close(){
        navigate ('/stash')
    }

    function handleSubmit(event){
        event.preventDefault()
        const found = validate({ postingUrl, companyName, jobTitle })
        setErrors(found)
        if (Object.keys(found).length > 0) return
        console.log('All good, ready to save:', { postingUrl, companyName, jobTitle })
    }

    return (
    <dialog ref={dialog} onCancel={close}>
      <h2>Add Job</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="posting-url">Job posting URL *</label>
        <input
          id="posting-url"
          type="url"
          placeholder="https://"
          value={postingUrl}
          onChange={(event) => setPostingUrl(event.target.value)}
          aria-invalid={errors.postingUrl ? 'true' : undefined}
          aria-describedby={errors.postingUrl ? 'posting-url-error' : undefined}
        />

        {errors.postingUrl && (
          <p id="posting-url-error" className="text-sm text-error">{errors.postingUrl}</p>
        )}

        <label htmlFor="company-name">Company name *</label>
        <input
          id="company-name"
          type="text"
          placeholder="e.g. NovaTech"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          aria-invalid={errors.companyName ? 'true' : undefined}
          aria-describedby={errors.companyName ? 'company-name-error' : undefined}
        />

        {errors.companyName && (
          <p id="company-name-error" className="text-sm text-error">{errors.companyName}</p>
        )}

        <label htmlFor="job-title">Job title</label>
        <input
          id="job-title"
          type="text"
          placeholder="e.g. Data Analyst Intern"
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          aria-invalid={errors.jobTitle ? 'true' : undefined}
          aria-describedby={errors.jobTitle ? 'job-title-error' : undefined}
        />

        {errors.jobTitle && (
          <p id="job-title-error" className="text-sm text-error">{errors.jobTitle}</p>
        )}


        <button type="button" onClick={close}>Cancel</button>
        <button type="submit">Save Job</button>
      </form>
    </dialog>
  )
}