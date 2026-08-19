// Data + asset URL helpers. All site data lives under public/ and is fetched
// relative to the built base (works from any GitHub Pages subpath).

const BASE = import.meta.env.BASE_URL // e.g. "./" or "/repo/"

export function asset(path) {
  return `${BASE}${path.replace(/^\//, '')}`
}

export async function fetchJSON(path) {
  const res = await fetch(asset(path))
  if (!res.ok) throw new Error(`fetch ${path} -> ${res.status}`)
  return res.json()
}

export const dataURL = (name) => asset(`data/${name}`)
export const clipURL = (name) => asset(`clips/${name}`)
export const figureURL = (name) => asset(`figures/${name}`)

// External link targets (placeholders until the paper/dataset are published).
export const LINKS = {
  paper: '#', // arXiv / DOI
  dataset: '#', // Zenodo
  code: 'https://code.nap.av.it.pt/ar_vr/mobile-cooperative-perception',
}

// Format helpers
export function fmtDuration(s) {
  s = Math.round(s)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

export function fmtDistance(m) {
  if (m == null) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}
