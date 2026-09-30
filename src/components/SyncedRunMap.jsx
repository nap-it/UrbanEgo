import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { clipURL } from '../lib/data.js'
import { interpTrack, interpHeading, headingIconHtml } from '../lib/interp.js'

const MARKER_COLOR = '#0b5cad'
const BASEMAP = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'

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
  const receiverLine = useRef(null)
  const phoneLine = useRef(null)
  const segLine = useRef(null)

  // live values read by the (non-React) timeupdate handler
  const live = useRef({
    track: run.receiver.length ? run.receiver : run.phone,
    hdgTrack: run.hdg,
    hdgOffset: run.heading_offset || 0,
  })

  const [gpsSource, setGpsSource] = useState(run.receiver.length ? 'receiver' : 'phone')
  const [showDepth, setShowDepth] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [videoAspects, setVideoAspects] = useState({ rgb: 16 / 9, depth: 10 / 9 })
  const clipDurRef = useRef(20)

  // ── init map once ──
  useEffect(() => {
    const m = L.map(mapDiv.current, { zoomControl: true })
    L.tileLayer(BASEMAP, { maxZoom: 18, maxNativeZoom: 16, attribution: 'Tiles © Esri' }).addTo(m)
    map.current = m
    marker.current = L.marker([0, 0], {
      icon: L.divIcon({ html: headingIconHtml(0, MARKER_COLOR), className: '', iconAnchor: [22, 22] }),
      zIndexOffset: 1000,
    }).addTo(m)
    const all = (run.phone.length ? run.phone : run.receiver).map((p) => [p[0], p[1]])
    if (all.length) m.fitBounds(all, { padding: [24, 24] })
    return () => { m.remove(); map.current = null; marker.current = null }
  }, [run])

  // ── (re)draw polylines + clip segment when GPS source changes ──
  useEffect(() => {
    const m = map.current
    if (!m) return
    const receiverPrimary = gpsSource === 'receiver'
    ;[receiverLine, phoneLine, segLine].forEach((r) => { if (r.current) { m.removeLayer(r.current); r.current = null } })
    if (run.receiver.length) receiverLine.current = L.polyline(run.receiver.map((p) => [p[0], p[1]]),
      { color: MARKER_COLOR, weight: receiverPrimary ? 3 : 1.5, opacity: receiverPrimary ? 0.85 : 0.4, dashArray: receiverPrimary ? null : '5 5' }).addTo(m)
    if (run.phone.length) phoneLine.current = L.polyline(run.phone.map((p) => [p[0], p[1]]),
      { color: '#f59e0b', weight: receiverPrimary ? 1.5 : 3, opacity: receiverPrimary ? 0.4 : 0.85, dashArray: receiverPrimary ? '5 5' : null }).addTo(m)
    const t0 = run.clip_start_s ?? 0
    const seg = segment(receiverPrimary ? run.receiver : run.phone, t0, t0 + clipDurRef.current)
    if (seg.length > 1) segLine.current = L.polyline(seg, { color: '#d81e5b', weight: 5, opacity: 0.9 }).addTo(m)
    live.current.track = receiverPrimary ? run.receiver : run.phone
  }, [gpsSource, run])

  // ── depth toggle: when depth is shown, restart the RGB clip, the depth clip,
  //    and the map marker to the clip start so all three stay synchronized (the
  //    depth video mounts fresh at t=0, so the RGB clip must rewind to match).
  //    ──
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (showDepth) {
      const rv = rgbVideo.current, dv = depthVideo.current
      if (rv) { rv.pause(); rv.currentTime = 0 }
      if (dv) { dv.pause(); dv.currentTime = 0 }
      setPlaying(false)
      syncTo(0)
    }
  }, [showDepth])

  // Resize after the video dimensions load or the map moves below both streams.
  useEffect(() => {
    const m = map.current
    if (!m) return
    const id = requestAnimationFrame(() => m.invalidateSize())
    return () => cancelAnimationFrame(id)
  }, [showDepth, videoAspects])

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
    if (hReadout.current) hReadout.current.textContent = `${Math.round(((hdg % 360) + 360) % 360) % 360}°`
    const dur = clipDurRef.current || 1
    if (scrubber.current) scrubber.current.value = String((currentTime / dur) * 1000)
    if (tReadout.current) tReadout.current.textContent = `${currentTime.toFixed(1)} / ${dur.toFixed(0)}s`
  }

  function updateVideoAspect(kind, video) {
    if (video?.videoWidth && video.videoHeight) {
      setVideoAspects((aspects) => ({ ...aspects, [kind]: video.videoWidth / video.videoHeight }))
    }
  }
  function onLoaded() {
    clipDurRef.current = rgbVideo.current?.duration || 20
    updateVideoAspect('rgb', rgbVideo.current)
    syncTo(0)
  }
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

  return (
    <div className="panel stream-panel">
      <div className="panel-head">
        <h3>Synchronised stream &amp; map</h3>
        <div className="legend">
          <span><span className="dot" style={{ background: MARKER_COLOR }} />Receiver GPS</span>
          <span><span className="dot" style={{ background: '#f59e0b' }} />Phone GPS</span>
          <span><span className="dot" style={{ background: '#d81e5b' }} />Clip Segment</span>
        </div>
      </div>
      <div className="panel-body">
        <div className={`viewer2 ${showDepth ? 'd-on' : 'd-off'}`} style={{ '--rgb-column': `${videoAspects.rgb}fr`, '--depth-column': `${videoAspects.depth}fr` }}>
          <div className="viewer-video va-rgb">
            {run.rgb_clip
              ? <video ref={rgbVideo} src={clipURL(run.rgb_clip.replace('clips/', ''))}
                       onLoadedMetadata={onLoaded} onTimeUpdate={onTime} muted playsInline preload="auto" />
              : <div className="notice">No preview clip for this run.</div>}
          </div>
          {showDepth && run.depth_clip &&
            <div className="viewer-video va-depth">
              <video ref={depthVideo} src={clipURL(run.depth_clip.replace('clips/', ''))}
                     onLoadedMetadata={(event) => updateVideoAspect('depth', event.currentTarget)} muted playsInline preload="auto" />
              <span className="video-tag">depth</span>
            </div>}
          <div className="leaflet-holder va-map"><div className="map" ref={mapDiv} /></div>
        </div>
        <div className="player-controls">
          <div className="player-timeline">
            <button type="button" className="iconbtn play-button" onClick={togglePlay} disabled={!run.rgb_clip}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                {playing ? <path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor" /> : <path d="M4 2.5v11l9-5.5z" fill="currentColor" />}
              </svg>
              {playing ? 'Pause' : 'Play'}
            </button>
            <input ref={scrubber} className="scrub" type="range" min="0" max="1000" defaultValue="0" onInput={onScrub} aria-label="Seek" disabled={!run.rgb_clip} />
            <span ref={tReadout} className="tval playback-time">0.0 / 20s</span>
          </div>
          <div className="player-settings">
            <div className="player-setting heading-readout">
              <span className="control-label">Heading</span>
              <span ref={hReadout} className="tval">0°</span>
            </div>
            <div className="player-setting">
              <span className="control-label">GPS source</span>
              <div className="seg" role="group" aria-label="GPS source">
                <button type="button" className={gpsSource === 'receiver' ? 'on' : ''} aria-pressed={gpsSource === 'receiver'} disabled={!run.receiver.length} onClick={() => setGpsSource('receiver')}>Receiver</button>
                <button type="button" className={gpsSource === 'phone' ? 'on' : ''} aria-pressed={gpsSource === 'phone'} disabled={!run.phone.length} onClick={() => setGpsSource('phone')}>Phone</button>
              </div>
            </div>
            {run.depth_clip &&
              <button type="button" className="iconbtn depth-toggle" aria-pressed={showDepth} onClick={() => setShowDepth((s) => !s)}>
                {showDepth ? 'Hide depth' : 'Show depth'}
              </button>}
          </div>
        </div>
        <div className="notice">
          This synchronized preview covers a ~20 s segment of the full route, highlighted in pink.
          The marker uses the selected GPS source; the arrow uses the head-heading stream.
          GPS coverage and accuracy vary between sources and runs.
        </div>
      </div>
    </div>
  )
}
