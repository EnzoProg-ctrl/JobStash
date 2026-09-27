import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router'

export default function AddJobDialog(){
    const dialog = useRef(null)

    useEffect(()=> {
    dialog.current.showModal()
  }, [])

    const navigate = useNavigate()
    const [postingUrl, setPostingUrl] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [jobTitle, setJobTitle] = useState('')

    function close(){
        navigate ('/stash')
    }

    function handleSubmit(event){
        event.preventDefault()
        console.log({postingUrl, companyName, jobTitle})
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
        />

        <label htmlFor="company-name">Company name *</label>
        <input
          id="company-name"
          type="text"
          placeholder="e.g. NovaTech"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
        />

        <label htmlFor="job-title">Job Title *</label>
        <input
          id="job-title"
          type="text"
          placeholder="e.g. Data Analyst Intern"
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
        />


        <button type="button" onClick={close}>Cancel</button>
        <button type="submit">Save Job</button>
      </form>
    </dialog>
  )
}