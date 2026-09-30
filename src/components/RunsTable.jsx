import { Link } from 'react-router-dom'
import RouteThumb from './RouteThumb.jsx'
import { fmtDuration, fmtDistance } from '../lib/data.js'
import { zoneOf } from '../lib/runs.js'

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
})

function recordingDate(date) {
  if (!date) return '—'
  const value = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(value.getTime()) ? date : dateFormat.format(value)
}

export default function RunsTable({ runs }) {
  const order = [...runs].sort((a, b) => a.id.localeCompare(b.id))
  return (
    <div className="site-table-wrap recordings-table-wrap">
      <table className="site-table runs-table" role="table" aria-label="Recordings">
        <colgroup>
          <col className="recording-column" />
          <col className="recorded-column" />
          <col span="2" className="duration-column" />
          <col className="size-column" />
          <col className="distance-column" />
          <col className="details-column" />
        </colgroup>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col">Recording<span className="header-unit" aria-hidden="true" /></th>
            <th scope="col">Recorded <span className="header-unit">(UTC)</span></th>
            <th scope="col" className="num">Session <span className="header-unit">duration</span></th>
            <th scope="col" className="num">RGB <span className="header-unit">duration</span></th>
            <th scope="col" className="num">Size <span className="header-unit">(GB)</span></th>
            <th scope="col" className="num">GPS distance <span className="header-unit">estimate</span></th>
            <th scope="col" className="details-header">Details<span className="header-unit" aria-hidden="true" /></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {order.map((r, i) => {
            const zone = zoneOf(r.id)
            const start = r.session_start_utc?.split(' ')[1]
            return (
              <tr key={r.id} role="row">
                <th scope="row" role="rowheader" className="recording-cell">
                  <div className="recording-identity">
                    <span className="recording-thumb" aria-hidden="true"><RouteThumb points={r.thumb} w={76} h={54} pad={7} /></span>
                    <div>
                      <span className="recording-number">Run {i + 1}</span>
                      <span className="recording-zone">{zone}</span>
                    </div>
                  </div>
                </th>
                <td role="cell" className="recorded-cell">
                  <span className="mobile-column-label" aria-hidden="true">Recorded (UTC)</span>
                  <div className="recorded-value">
                    <time dateTime={r.date}>{recordingDate(r.date)}</time>
                    <span className="recording-start">{start ? <time dateTime={`${r.session_start_utc.replace(' ', 'T')}Z`}>{start}</time> : '—'}</span>
                  </div>
                </td>
                <td role="cell" className="num recording-metric">
                  <span className="mobile-column-label" aria-hidden="true">Session duration</span>
                  <span>{r.duration != null ? fmtDuration(r.duration) : '—'}</span>
                </td>
                <td role="cell" className="num recording-metric">
                  <span className="mobile-column-label" aria-hidden="true">RGB duration</span>
                  <span>{r.rgb_duration_s != null ? fmtDuration(r.rgb_duration_s) : '—'}</span>
                </td>
                <td role="cell" className="num recording-metric">
                  <span className="mobile-column-label" aria-hidden="true">Size (GB)</span>
                  <span>{r.size_gb != null ? r.size_gb.toFixed(3) : '—'}</span>
                </td>
                <td role="cell" className="num recording-metric">
                  <span className="mobile-column-label" aria-hidden="true">GPS distance estimate</span>
                  <span>{fmtDistance(r.distance_m)}</span>
                </td>
                <td role="cell" className="recording-details">
                  <Link className="recording-detail-link" to={`/runs/${r.id}`} aria-label={`View details: Run ${i + 1}, ${zone}`}>
                    View details <span aria-hidden="true">→</span>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
