import { createServerFn } from '@tanstack/react-start'

// Mapbox GL runs in the browser, so it needs a *public* token (starts with "pk.").
// Public tokens are designed to be exposed; restrict it to your site's URL in the Mapbox dashboard.
export const getMapboxToken = createServerFn({ method: 'GET' }).handler(async () => {
  const token = (process.env.MAPBOX_API_KEY || process.env.MAPBOX_TOKEN || '').trim()
  if (!token) return { token: '', problem: 'MAPBOX_API_KEY is not set on the server.' }
  if (!token.startsWith('pk.')) {
    return {
      token: '',
      problem: 'MAPBOX_API_KEY must be a public token (starts with "pk."). Secret tokens ("sk.") cannot be used in a browser map.',
    }
  }
  return { token, problem: '' }
})
