import { Link } from 'react-router-dom'
import RouteThumb from './RouteThumb.jsx'
import { fmtDuration, fmtDistance } from '../lib/data.js'
import { zoneOf } from '../lib/runs.js'

export default function RunsTable({ runs }) {
  const order = [...runs].sort((a, b) => a.id.localeCompare(b.id)) // chronological = Run 1..N
  return (
    <div className="table-scroll">
      <table className="dtable runs-table">
        <thead>
          <tr>
            <th>Route</th><th>Run</th><th>Zone</th><th>Date</th>
            <th className="num">Duration</th><th className="num">GPS distance estimate</th><th></th>
          </tr>
        </thead>
        <tbody>
          {order.map((r, i) => (
            <tr key={r.id}>
              <td><span className="thumb-cell"><RouteThumb points={r.thumb} w={88} h={54} pad={6} /></span></td>
              <td className="mono">{i + 1}</td>
              <td className="z">{zoneOf(r.id)}</td>
              <td>{r.date}</td>
              <td className="num">{fmtDuration(r.duration)}</td>
              <td className="num">{fmtDistance(r.distance_m)}</td>
              <td><Link to={`/runs/${r.id}`}>View details</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
