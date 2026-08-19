// Lightweight route thumbnail: an SVG polyline projected from [lat,lon] points,
// with equirectangular aspect correction. No map tiles — cheap and offline.
export default function RouteThumb({ points, w = 320, h = 200, pad = 14 }) {
  if (!points || points.length < 2) {
    return <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" />
  }
  const lat0 = points.reduce((s, p) => s + p[0], 0) / points.length
  const k = Math.cos((lat0 * Math.PI) / 180)
  const xs = points.map((p) => p[1] * k)
  const ys = points.map((p) => p[0])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = maxX - minX || 1e-6
  const spanY = maxY - minY || 1e-6
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY)
  const offX = (w - spanX * scale) / 2
  const offY = (h - spanY * scale) / 2
  const px = (x) => offX + (x - minX) * scale
  const py = (y) => h - (offY + (y - minY) * scale) // flip Y (north up)

  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(p[1] * k).toFixed(1)},${py(p[0]).toFixed(1)}`).join(' ')
  const start = points[0], end = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Route shape">
      <path d={d} fill="none" stroke="var(--marker)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
      <circle cx={px(start[1] * k)} cy={py(start[0])} r="3.4" fill="var(--marker)" stroke="#fff" strokeWidth="1.2" />
      <circle cx={px(end[1] * k)} cy={py(end[0])} r="2.8" fill="#555" stroke="#fff" strokeWidth="1.2" />
    </svg>
  )
}
