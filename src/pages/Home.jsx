import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import RunsTable from '../components/RunsTable.jsx'
import { fetchJSON, figureURL, LINKS, fmtDuration } from '../lib/data.js'

export default function Home() {
  const [summary, setSummary] = useState(null)
  const [runs, setRuns] = useState([])
  const loc = useLocation()

  useEffect(() => {
    fetchJSON('data/summary.json').then(setSummary).catch(() => {})
    fetchJSON('data/index.json').then((d) => setRuns(d.runs || [])).catch(() => {})
  }, [])

  // scroll to a section when navigated here from another page
  useEffect(() => {
    const id = loc.state?.scrollTo
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60)
  }, [loc.state])

  return (
    <div className="page doc">

      <section id="overview" className="anchor">
        <p className="lead-p">
          The <b>SafeXCity dataset</b> is a first-person (egocentric) recording of urban pedestrian
          routes captured with a wearable Microsoft HoloLens&nbsp;2. Each run bundles synchronized
          RGB video, structured-light depth, spatial audio, and two independent GPS sources, together
          with the wearer's head orientation. It is intended for research on vulnerable-road-user
          (VRU) safety, egocentric perception, outdoor localization, and multimodal sensing.
        </p>
        <p>
          The dataset was collected in the context of the SafeXCity project through the Aveiro Tech
          City Living Lab. It comprises {summary ? summary.n_runs : 8} runs recorded across the city
          of Aveiro, Portugal ({summary ? fmtDuration(summary.total_duration_s) : '~2 h'} of footage,
          {summary ? ` ${(summary.total_distance_m / 1000).toFixed(1)} km walked` : ''},
          {summary ? ` ${summary.total_size_gb} GB` : ' ~61 GB'} of raw data). Every recording is
          also accompanied by an offline object-detection layer for road-user analysis.
        </p>
        <div className="btn-row">
          <a className="btn primary" href={LINKS.dataset} target="_blank" rel="noreferrer">Download the dataset</a>
          <a className="btn" href={LINKS.paper} target="_blank" rel="noreferrer">Read the paper</a>
        </div>

        <figure className="figrow">
          <div className="imgs">
            <figure>
              <img src={figureURL('snap_rgb.png')} alt="Egocentric RGB frame" />
              <div className="cap">RGB · egocentric frame</div>
            </figure>
            <figure>
              <img src={figureURL('snap_depth.png')} alt="Long-throw depth frame" />
              <div className="cap">Depth · long-throw</div>
            </figure>
            <figure>
              <img src={figureURL('snap_map.png')} alt="Position and heading on the map" />
              <div className="cap">Position &amp; heading</div>
            </figure>
          </div>
          <figcaption>
            <b>Figure 1.</b> One synchronized instant from Run&nbsp;2 (Rua da Pêga): the egocentric
            RGB frame, the corresponding long-throw depth frame, and the wearer's position and
            heading on the route. All streams share a single wall-clock timeline, so any moment can
            be reconstructed across modalities.
          </figcaption>
        </figure>
      </section>

      <section id="data" className="anchor">
        <h2>Data included</h2>
        <p>
          The dataset is organized into one top-level folder per run, named
          <span className="mono"> hololens_recording_YYYYMMDD_HHMMSS</span>. Each folder contains
          seven binary sensor-stream files plus a small JSON manifest:
        </p>
        <div className="table-scroll">
          <table className="dtable">
            <thead>
              <tr><th>Stream file</th><th>Sensor</th><th>Format</th><th>Rate</th><th>Metadata keys</th></tr>
            </thead>
            <tbody>
              <tr><td className="mono">HololensCamera_1.hlp2</td><td>HoloLens&nbsp;2 PV camera</td><td>H.265, 1280×720</td><td>30 fps</td><td>focal_length, principal_point, exposure_time, iso_speed, white_balance</td></tr>
              <tr><td className="mono">HololensDepth_1.hlp2</td><td>RM_DEPTH_LONGTHROW</td><td>uint16, 320×288</td><td>5 fps</td><td>depth_sensor_ticks</td></tr>
              <tr><td className="mono">HololensMicrophone_1.hlp2</td><td>Microphone array</td><td>AAC (ADTS), 48 kHz stereo</td><td>streaming</td><td>—</td></tr>
              <tr><td className="mono">vam_location_1.hlp2</td><td>GPS receiver (ETSI VAM)</td><td>JSON</td><td>1–5 Hz</td><td>latitude, longitude, altitude, speed_mps</td></tr>
              <tr><td className="mono">phone_location_1.hlp2</td><td>Mobile phone (OwnTracks)</td><td>JSON</td><td>~1 Hz</td><td>latitude, longitude, altitude, speed_mps</td></tr>
              <tr><td className="mono">unity_heading_1.hlp2</td><td>HoloLens&nbsp;2 (SafeARCross)</td><td>ASCII float</td><td>~30 Hz</td><td>heading (degrees from North)</td></tr>
              <tr><td className="mono">unity_imu_1.hlp2</td><td>HoloLens&nbsp;2 (SafeARCross)</td><td>JSON</td><td>~30 Hz</td><td>yaw, pitch, roll (degrees)</td></tr>
              <tr><td className="mono">session_manifest.json</td><td>—</td><td>JSON</td><td>—</td><td>session UUID, start times, active streams</td></tr>
            </tbody>
          </table>
        </div>

        <h3>HLP2 record format</h3>
        <p>
          All <span className="mono">.hlp2</span> files share one binary container: a sequence of
          length-prefixed records, each
          <span className="mono"> [size][&quot;HLP2&quot;][header_len][payload_len][msgpack header][payload]</span>.
          The msgpack header carries a common envelope; the payload format depends on the sensor.
        </p>
        <div className="table-scroll">
          <table className="dtable">
            <thead><tr><th>Header field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="mono">schema_version</td><td>int</td><td>Always 1</td></tr>
              <tr><td className="mono">sensor_type</td><td>string</td><td>Stream type identifier</td></tr>
              <tr><td className="mono">session_id</td><td>string</td><td>UUID shared by all streams of a run</td></tr>
              <tr><td className="mono">seq</td><td>int</td><td>Per-stream frame sequence number</td></tr>
              <tr><td className="mono">ts_unix_ns</td><td>int</td><td>Wall-clock receipt time (ns since Unix epoch)</td></tr>
              <tr><td className="mono">ts_mono_ns</td><td>int</td><td>Monotonic receipt time (ns)</td></tr>
              <tr><td className="mono">source_timestamp</td><td>int</td><td>HoloLens device timestamp; 0 for MQTT streams</td></tr>
              <tr><td className="mono">metadata</td><td>dict</td><td>Sensor-specific key–value pairs</td></tr>
              <tr><td className="mono">calibration</td><td>dict</td><td>Mode-2 calibration (intrinsics, extrinsics, lookup tables)</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          All streams of a run share the same <span className="mono">session_id</span> and wall-clock
          timestamps, so any instant can be reconstructed across modalities without an external sync
          signal — as demonstrated in the synchronized viewer on each run's page.
        </p>
      </section>

      <section id="detections" className="anchor">
        <h2>Object-detection layer</h2>
        <p>
          Alongside the raw streams, each run ships an offline object-detection layer derived from the
          RGB video with a YOLO11x detector and a BoT-SORT tracker (appearance re-identification),
          grouped into <b>pedestrians</b>, <b>bicycles</b>, and <b>vehicles</b>. It is stored per run
          as two line-delimited JSON files plus a metadata file:
        </p>
        <div className="table-scroll">
          <table className="dtable">
            <thead><tr><th>File</th><th>Row = </th><th>Fields</th></tr></thead>
            <tbody>
              <tr><td className="mono">detections.jsonl</td><td>one tracked object per frame</td><td className="mono">t, ts_ns, frame, cls, name, id, conf, box</td></tr>
              <tr><td className="mono">frames.jsonl</td><td>one frame (incl. empty)</td><td className="mono">frame, t, ts_ns, n, counts, per_class</td></tr>
              <tr><td className="mono">meta.json</td><td>one object per run</td><td className="mono">run, frames_processed, duration_s, effective_fps, params</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Detections are in image space (pixel bounding boxes). Per-frame density (how many objects
          are in view) is the reliable, tracking-free metric; unique object counts and flow rates are
          tracking-based estimates. The per-run pages show an observation-density heatmap built from
          this layer.
        </p>
      </section>

      <section id="runs" className="anchor">
        <h2>Recordings</h2>
        <p>
          {runs.length || 8} runs were recorded across five days between May and July&nbsp;2026,
          spanning campus, arterial, and city-centre settings. Select a run to open its synchronized
          RGB / depth / map viewer and its density heatmap.
        </p>
        {runs.length ? <RunsTable runs={runs} /> : <div className="loading">Loading runs…</div>}
      </section>

      <section id="download" className="anchor">
        <h2>Download</h2>
        <div className="callout">
          <p>
            The full dataset (raw <span className="mono">.hlp2</span> streams for all runs) will be
            published with a permanent DOI. A download link will appear here once released.
          </p>
          <div className="btn-row">
            <a className="btn primary" href={LINKS.dataset} target="_blank" rel="noreferrer">Dataset repository</a>
            <a className="btn" href={LINKS.code} target="_blank" rel="noreferrer">Acquisition &amp; processing code</a>
          </div>
        </div>
      </section>

      <section id="cite" className="anchor">
        <h2>Citation &amp; license</h2>
        <p>If you use this dataset, please cite the accompanying article:</p>
        <div className="cite">{`@article{safexcity_vru_dataset,
  title   = {Experimental Dataset for Mobile User-Based Cooperative
             Perception in Urban Environments},
  author  = {Abreu, Rodrigo and others},
  journal = {[to appear]},
  year    = {2026}
}`}</div>
        <p className="muted">Released under a Creative Commons license (to be confirmed on publication).</p>
      </section>

    </div>
  )
}
