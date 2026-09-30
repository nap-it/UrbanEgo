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

// Public links. Leave unavailable release links null to avoid dead actions.
export const LINKS = {
  demo: 'https://youtu.be/-RTJkzZOtU8',
  paper: null, // Add the public manuscript or published article URL when available.
  dataset: null, // Add the dataset repository URL when available.
}

// Citations; bracketed paper fields await publication metadata.
export const CITATIONS = {
  paper: `@article{urbanego_paper,
  title   = {UrbanEgo: A Multimodal First-Person Urban Perception Dataset},
  author  = {Abreu, Rodrigo and Clérigo, André and Silva, Gonçalo and Rito, Pedro and Sargento, Susana},
  journal = {[JOURNAL]},
  year    = {[PUBLICATION_YEAR]},
  doi     = {[PAPER_DOI]}
}`,
  dataset: `@dataset{rodrigo_2026_23062929,
  author    = {Rodrigo, Abreu and Clérigo, André and Silva, Gonçalo Lourenço and Rito, Pedro and Sargento, Susana},
  title     = {UrbanEgo: A Multimodal First-Person Urban Perception Dataset},
  month     = sep,
  year      = 2026,
  publisher = {Zenodo},
  version   = {1.0},
  doi       = {10.5281/zenodo.23062929},
  url       = {https://doi.org/10.5281/zenodo.23062929}
}`,
}

// Format helpers
export function fmtDuration(s) {
  s = Math.round(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

export function fmtDistance(m) {
  if (m == null) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}
