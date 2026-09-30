import { createClient } from '@supabase/supabase-js'

// The one connection to Supabase Auth that the whole website shares. It only
// handles signing in: all job data still goes through the Express API.
//
// Sign-in only exists in the full version. In demo mode (the default, and the
// GitHub Pages site) there are no Supabase settings, so there is no client.
//
// This reads the setting itself instead of importing USING_MOCK_API from
// ../api, because api/httpApi.js imports this file, and the two importing each
// other would be a circle.
const demoMode = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const supabase = demoMode
  ? null
  : createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          // Google sends back a one-time code (not the sign-in pass itself),
          // which this client swaps for the pass. The pass never appears in
          // the address bar or the browser history.
          flowType: 'pkce',
        },
      }
    )
