import { useEffect } from 'react'

// The name in the browser tab. index.html has the same name in its <title>,
// which is what shows before the app has loaded: change both together.
export const SITE_NAME = 'JobStash-ph'

// Sets the browser tab's title for a page:
//   usePageTitle('My Stash')  ->  "My Stash · JobStash-ph"
//   usePageTitle()            ->  "JobStash-ph"
export function usePageTitle(page) {
  useEffect(() => {
    document.title = page ? `${page} · ${SITE_NAME}` : SITE_NAME
  }, [page])
}
