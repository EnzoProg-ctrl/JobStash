import { useEffect, useState } from 'react'
import { listJobs } from '../api'

// Loads the signed-in person's jobs, for any page that needs them (My Stash,
// Overview).
//
//   const { status, jobs, setJobs, error, slow, retry } = useJobs()
//
// status is 'loading', 'ready' or 'error'. slow turns true after 5 seconds of
// loading: on a free host the API sleeps when nobody uses it, and waking up
// takes up to a minute, so the page can explain the wait. retry() loads again,
// for a Try again button. setJobs lets a page change the list after loading
// (marking done, deleting, adding).
export function useJobs() {
  const [status, setStatus] = useState('loading')
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Only the latest load may change the page: one that finishes after the
    // visitor left, or after they clicked Try again, is ignored.
    let latest = true
    setStatus('loading')
    setSlow(false)
    const timer = setTimeout(() => setSlow(true), 5000)

    listJobs()
      .then((rows) => {
        if (!latest) return
        setJobs(rows)
        setStatus('ready')
      })
      .catch((caught) => {
        if (!latest) return
        setError(caught)
        setStatus('error')
      })
      .finally(() => clearTimeout(timer))

    return () => {
      latest = false
      clearTimeout(timer)
    }
  }, [attempt])

  const retry = () => setAttempt((count) => count + 1)

  return { status, jobs, setJobs, error, slow, retry }
}
