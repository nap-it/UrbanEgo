// Time-interpolation of GPS / heading / IMU, ported from the SafeXCity validation
// dashboard (validate_gps.html). All track times are in seconds since session start;
// the caller samples at gt = clip_start_s + video.currentTime.

const lerp = (a, b, t) => a + (b - a) * t

// track: [[lat, lon, t_s], ...] -> {lat, lon} | null
export function interpTrack(tr, t) {
  if (!tr || !tr.length) return null
  if (t <= tr[0][2]) return { lat: tr[0][0], lon: tr[0][1] }
  const last = tr[tr.length - 1]
  if (t >= last[2]) return { lat: last[0], lon: last[1] }
  for (let i = 0; i < tr.length - 1; i++) {
    const [la, lo, ta] = tr[i]
    const [lb, ob, tb] = tr[i + 1]
    if (t >= ta && t <= tb) {
      const f = (t - ta) / (tb - ta)
      return { lat: lerp(la, lb, f), lon: lerp(lo, ob, f) }
    }
  }
  return null
}

// heading: [[t_s, deg], ...] -> deg (shortest-path angular blend)
export function interpHeading(h, t) {
  if (!h || !h.length) return 0
  if (t <= h[0][0]) return h[0][1]
  if (t >= h[h.length - 1][0]) return h[h.length - 1][1]
  for (let i = 0; i < h.length - 1; i++) {
    const [ta, ha] = h[i]
    const [tb, hb] = h[i + 1]
    if (t >= ta && t <= tb) {
      const f = (t - ta) / (tb - ta)
      return ha + (((hb - ha + 540) % 360) - 180) * f
    }
  }
  return 0
}

// imu: [[t_s, pitch, roll], ...] -> {pitch, roll} | null
export function interpImu(m, t) {
  if (!m || !m.length) return null
  if (t <= m[0][0]) return { pitch: m[0][1], roll: m[0][2] }
  const last = m[m.length - 1]
  if (t >= last[0]) return { pitch: last[1], roll: last[2] }
  for (let i = 0; i < m.length - 1; i++) {
    const a = m[i]
    const b = m[i + 1]
    if (t >= a[0] && t <= b[0]) {
      const f = (t - a[0]) / (b[0] - a[0])
      return { pitch: a[1] + (b[1] - a[1]) * f, roll: a[2] + (b[2] - a[2]) * f }
    }
  }
  return null
}

// Rotated arrow marker (SVG) as a Leaflet divIcon HTML string.
export function headingIconHtml(deg, color) {
  return `<svg viewBox="-14 -14 28 28" width="44" height="44" style="transform:rotate(${deg}deg)">
    <polygon points="0,-11 7,9 0,5 -7,9" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`
}

// Effective heading offset: the 'corr' stream already has it baked in.
export function effectiveHeadingOffset(run, headingSource) {
  if (headingSource === 'corr' && run.hdg_corr && run.hdg_corr.length) return 0
  return run.heading_offset || 0
}

export function activeHeadingTrack(run, headingSource) {
  return headingSource === 'corr' && run.hdg_corr && run.hdg_corr.length
    ? run.hdg_corr
    : run.hdg
}
