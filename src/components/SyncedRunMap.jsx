import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { clipURL } from '../lib/data.js'
import { interpTrack, interpHeading, headingIconHtml } from '../lib/interp.js'

const MARKER_COLOR = '#0b5cad'
const CARTO = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

// Points of `track` (session-relative [lat,lon,t]) within [t0, t1] — the clip segment.
function segment(track, t0, t1) {
  return (track || []).filter((p) => p[2] >= t0 && p[2] <= t1).map((p) => [p[0], p[1]])
}

export default function SyncedRunMap({ run }) {
  const mapDiv = useRef(null)
  const rgbVideo = useRef(null)
  const depthVideo = useRef(null)
  const scrubber = useRef(null)
  const tReadout = useRef(null)
  const hReadout = useRef(null)

  const map = useRef(null)
  const marker = useRef(null)
  const vamLine = useRef(null)
  const phoneLine = useRef(null)
  const segLine = useRef(null)

  // live values read by the (non-React) timeupdate handler
  const live = useRef({
    track: run.vam.length ? run.vam : run.phone,
    hdgTrack: run.hdg,
    hdgOffset: run.heading_offset || 0,
  })

  const [gpsSource, setGpsSource] = useState(run.vam.length ? 'vam' : 'phone')
  const [showDepth, setShowDepth] = useState(false)
  const [playing, setPlaying] = useState(false)
  const clipDurRef = useRef(20)

  // ── init map once ──
  useEffect(() => {
    const m = L.map(mapDiv.current, { zoomControl: true })
    L.tileLayer(CARTO, { subdomains: 'abcd', maxZoom: 20, attribution: '© OpenStreetMap © CARTO' }).addTo(m)
    map.current = m
    marker.current = L.marker([0, 0], {
      icon: L.divIcon({ html: headingIconHtml(0, MARKER_COLOR), className: '', iconAnchor: [22, 22] }),
      zIndexOffset: 1000,
    }).addTo(m)
    const all = (run.phone.length ? run.phone : run.vam).map((p) => [p[0], p[1]])
    if (all.length) m.fitBounds(all, { padding: [24, 24] })
    return () => { m.remove(); map.current = null; marker.current = null }
  }, [run])

  // ── (re)draw polylines + clip segment when GPS source changes ──
  useEffect(() => {
    const m = map.current
    if (!m) return
    const vamPrim = gpsSource === 'vam'
    ;[vamLine, phoneLine, segLine].forEach((r) => { if (r.current) { m.removeLayer(r.current); r.current = null } })
    if (run.vam.length) vamLine.current = L.polyline(run.vam.map((p) => [p[0], p[1]]),
      { color: MARKER_COLOR, weight: vamPrim ? 3 : 1.5, opacity: vamPrim ? 0.85 : 0.4, dashArray: vamPrim ? null : '5 5' }).addTo(m)
    if (run.phone.length) phoneLine.current = L.polyline(run.phone.map((p) => [p[0], p[1]]),
      { color: '#f59e0b', weight: vamPrim ? 1.5 : 3, opacity: vamPrim ? 0.4 : 0.85, dashArray: vamPrim ? '5 5' : null }).addTo(m)
    const t0 = run.clip_start_s ?? 0
    const seg = segment(vamPrim ? run.vam : run.phone, t0, t0 + clipDurRef.current)
    if (seg.length > 1) segLine.current = L.polyline(seg, { color: '#d81e5b', weight: 5, opacity: 0.9 }).addTo(m)
    live.current.track = vamPrim ? run.vam : run.phone
  }, [gpsSource, run])

  // ── map size changes when depth toggles (moves from side to full-width) ──
  useEffect(() => {
    const m = map.current
    if (!m) return
    const id = requestAnimationFrame(() => m.invalidateSize())
    return () => cancelAnimationFrame(id)
  }, [showDepth])

  // ── per-frame sync (driven by the RGB clip's time) ──
  function syncTo(currentTime) {
    const gt = (run.clip_start_s ?? 0) + currentTime
    const pos = interpTrack(live.current.track, gt)
    const hdg = interpHeading(live.current.hdgTrack, gt) + live.current.hdgOffset
    if (pos && marker.current) {
      marker.current.setLatLng([pos.lat, pos.lon])
      const svg = marker.current.getElement()?.querySelector('svg')
      if (svg) svg.style.transform = `rotate(${hdg}deg)`
    }
    if (hReadout.current) hReadout.current.textContent = `${String(Math.round(((hdg % 360) + 360) % 360)).padStart(3, '0')}°`
    const dur = clipDurRef.current || 1
    if (scrubber.current) scrubber.current.value = String((currentTime / dur) * 1000)
    if (tReadout.current) tReadout.current.textContent = `${currentTime.toFixed(1)} / ${dur.toFixed(0)}s`
  }

  function onLoaded() { clipDurRef.current = rgbVideo.current?.duration || 20; syncTo(0) }
  function onTime() { syncTo(rgbVideo.current?.currentTime || 0) }

  function togglePlay() {
    const v = rgbVideo.current
    if (!v) return
    if (v.paused) { v.play(); depthVideo.current?.play(); setPlaying(true) }
    else { v.pause(); depthVideo.current?.pause(); setPlaying(false) }
  }
  function onScrub(e) {
    const t = (Number(e.target.value) / 1000) * (clipDurRef.current || 1)
    if (rgbVideo.current) rgbVideo.current.currentTime = t
    if (depthVideo.current) depthVideo.current.currentTime = t
    syncTo(t)
  }
  function onSpeed(e) {
    const r = Number(e.target.value)
    if (rgbVideo.current) rgbVideo.current.playbackRate = r
    if (depthVideo.current) depthVideo.current.playbackRate = r
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Synchronised stream &amp; map</h3>
        <div className="legend">
          <span><span className="dot" style={{ background: MARKER_COLOR }} />VAM GPS</span>
          <span><span className="dot" style={{ background: '#f59e0b' }} />phone GPS</span>
          <span><span className="dot" style={{ background: '#d81e5b' }} />clip segment</span>
        </div>
      </div>
      <div className="panel-body">
        <div className={`viewer2 ${showDepth ? 'd-on' : 'd-off'}`}>
          <div className="viewer-video va-rgb">
            {run.rgb_clip
              ? <video ref={rgbVideo} src={clipURL(run.rgb_clip.replace('clips/', ''))}
                       onLoadedMetadata={onLoaded} onTimeUpdate={onTime} muted playsInline preload="auto" />
              : <div className="notice">No preview clip for this run.</div>}
          </div>
          {showDepth && run.depth_clip &&
            <div className="viewer-video va-depth">
              <video ref={depthVideo} src={clipURL(run.depth_clip.replace('clips/', ''))} muted playsInline preload="auto" />
              <span className="video-tag">depth</span>
            </div>}
          <div className="leaflet-holder va-map"><div className="map" ref={mapDiv} /></div>
        </div>
        <div className="controls">
          <button className="iconbtn" onClick={togglePlay}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          <input ref={scrubber} className="scrub" type="range" min="0" max="1000" defaultValue="0" onInput={onScrub} aria-label="Seek" />
          <span ref={tReadout} className="tval">0.0 / 20s</span>
          <span className="tval">hdg <span ref={hReadout}>000°</span></span>
          <select className="iconbtn" onChange={onSpeed} defaultValue="1" aria-label="Speed">
            <option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option>
          </select>
          <div className="seg" role="group" aria-label="GPS source">
            <button className={gpsSource === 'vam' ? 'on' : ''} disabled={!run.vam.length} onClick={() => setGpsSource('vam')}>VAM</button>
            <button className={gpsSource === 'phone' ? 'on' : ''} disabled={!run.phone.length} onClick={() => setGpsSource('phone')}>Phone</button>
          </div>
          {run.depth_clip &&
            <button className="iconbtn" onClick={() => setShowDepth((s) => !s)}>
              {showDepth ? 'Hide depth' : 'Show depth'}
            </button>}
        </div>
        <div className="notice">
          The map marker and heading arrow are sampled at the clip's playback time
          (a ~20 s segment of the full route, highlighted in pink).
        </div>
      </div>
    </div>
  )
}
