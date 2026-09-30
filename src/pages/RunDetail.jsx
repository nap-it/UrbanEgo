import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SyncedRunMap from '../components/SyncedRunMap.jsx'
import HeatMap from '../components/HeatMap.jsx'
import { fetchJSON, fmtDuration, fmtDistance } from '../lib/data.js'
import { zoneOf, noteOf } from '../lib/runs.js'

export default function RunDetail() {
  const { id } = useParams()
  const [run, setRun] = useState(null)
  const [heat, setHeat] = useState(null)
  const [num, setNum] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setRun(null); setHeat(null); setError(false)
    fetchJSON(`data/${id}.json`).then(setRun).catch(() => setError(true))
    fetchJSON(`data/${id}_heat.json`).then(setHeat).catch(() => setHeat(null))
    fetchJSON('data/index.json').then((d) => {
      const order = [...(d.runs || [])].sort((a, b) => a.id.localeCompare(b.id))
      setNum(order.findIndex((r) => r.id === id) + 1 || null)
    }).catch(() => {})
  }, [id])

  if (error) return <div className="page" style={{ padding: '22px 20px' }}><p>Run not found. <Link to="/">Back to overview</Link>.</p></div>
  if (!run) return <div className="loading">Loading run…</div>

  return (
    <div className="page" style={{ padding: '18px 20px 44px' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Overview</Link>
        <span className="sep">›</span>
        <Link to="/" state={{ scrollTo: 'runs' }}>Recordings</Link>
        <span className="sep">›</span>
        <span className="current">Run {num ?? ''} · {zoneOf(id)}</span>
      </nav>
      <h2 className="detail-title">{zoneOf(id)}</h2>
      <div className="detail-sub">Run {num ?? ''} · <span className="mono">{run.id}</span> · {noteOf(id)}</div>

      <div className="detail-meta">
        <div className="m"><span className="k">Date</span><span className="v">{run.date}</span></div>
        <div className="m"><span className="k">Start (UTC)</span><span className="v">{run.session_start_utc?.split(' ')[1] ?? '—'}</span></div>
        <div className="m"><span className="k">Session duration</span><span className="v">{fmtDuration(run.duration)}</span></div>
        <div className="m"><span className="k">RGB video duration</span><span className="v">{run.rgb_duration_s != null ? fmtDuration(run.rgb_duration_s) : '—'}</span></div>
        <div className="m"><span className="k">Size (decimal GB)</span><span className="v">{run.size_gb != null ? run.size_gb.toFixed(3) : '—'}</span></div>
        <div className="m"><span className="k">GPS distance estimate</span><span className="v">{fmtDistance(run.distance_m)}</span></div>
        <div className="m"><span className="k">GPS samples (receiver + phone)</span><span className="v">{run.receiver.length + run.phone.length}</span></div>
        <div className="m"><span className="k">Heading samples</span><span className="v">{run.hdg.length}</span></div>
      </div>

      <SyncedRunMap run={run} />
      {heat && <HeatMap run={run} heat={heat} />}
    </div>
  )
}
