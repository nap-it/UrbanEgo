import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet.heat'

const BASEMAP = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
const GRADIENTS = {
  ped: { 0.2: '#dbeafe', 0.5: '#60a5fa', 1.0: '#1d4ed8' },
  veh: { 0.2: '#d1fae5', 0.5: '#34d399', 1.0: '#047857' },
}

export default function HeatMap({ run, heat }) {
  const mapDiv = useRef(null)
  const map = useRef(null)
  const heatLayer = useRef(null)
  const [cls, setCls] = useState('veh')

  useEffect(() => {
    const m = L.map(mapDiv.current, { zoomControl: true })
    L.tileLayer(BASEMAP, { maxZoom: 18, maxNativeZoom: 16, attribution: 'Tiles © Esri' }).addTo(m)
    const route = (run.phone.length ? run.phone : run.receiver).map((p) => [p[0], p[1]])
    if (route.length) {
      L.polyline(route, { color: '#8a887f', weight: 1.5, opacity: 0.6 }).addTo(m)
      m.fitBounds(route, { padding: [24, 24] })
    }
    map.current = m
    return () => { m.remove(); map.current = null; heatLayer.current = null }
  }, [run])

  useEffect(() => {
    const m = map.current
    if (!m || !heat) return
    if (heatLayer.current) { m.removeLayer(heatLayer.current); heatLayer.current = null }
    const pts = heat[cls] || []
    heatLayer.current = L.heatLayer(pts, {
      radius: 20, blur: 16, max: 1.0, maxZoom: 18, minOpacity: 0.25, gradient: GRADIENTS[cls],
    }).addTo(m)
  }, [cls, heat])

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Observation density heatmap</h3>
        <div className="seg" role="group" aria-label="Class">
          <button className={cls === 'ped' ? 'on' : ''} onClick={() => setCls('ped')}>Pedestrians</button>
          <button className={cls === 'veh' ? 'on' : ''} onClick={() => setCls('veh')}>Vehicles</button>
        </div>
      </div>
      <div className="panel-body">
        <div className="leaflet-holder"><div className="map" ref={mapDiv} style={{ minHeight: 380 }} /></div>
        <div className="notice">
          Colour intensity represents relative mean detector counts of {cls === 'ped' ? 'pedestrians' : 'vehicles'}
          {' '}at the wearer's GPS positions, grouped into ~{heat?.bin_m ?? 11} m bins.
          Each class is normalized within this run, so colours cannot be used to compare absolute
          counts across runs or classes. The map locates the wearer during observations;
          object locations are not included. Detection errors and GPS outliers affect the result.
        </div>
      </div>
    </div>
  )
}
