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
          The <b>UrbanEgo dataset</b> is a first-person (egocentric) recording of urban pedestrian
          routes captured with a wearable Microsoft HoloLens&nbsp;2. Each run bundles synchronized
          RGB video with audio, time-of-flight depth, and two independent GPS sources, together
          with the wearer's head orientation. It is intended for research on vulnerable-road-user
          (VRU) safety, egocentric perception, outdoor localization, and multimodal sensing.
        </p>

        <figure className="demo-fig">
          <img src={figureURL('Demo.png')} alt="UrbanEgo acquisition setup: a pedestrian wearing a HoloLens 2 and a backpack of recording hardware, with the sensed modalities labelled" />
          <figcaption>
            <b>Figure 1.</b> The acquisition setup. The sensing pedestrian (VRU) wears a
            HoloLens&nbsp;2 and a backpack of recording hardware (inset: Jetson edge computer,
            Wi-Fi router, power banks, and smartphone), and records RGB video, depth, audio, head
            rotation, and location while walking the route.
          </figcaption>
        </figure>

        <p>
          The dataset was collected through the Aveiro Tech City Living Lab. It comprises
          {summary ? ` ${summary.n_runs}` : ' 8'} runs recorded across the city
          of Aveiro, Portugal ({summary ? fmtDuration(summary.total_duration_s) : '~2 h'} of footage,
          {summary ? ` ${(summary.total_distance_m / 1000).toFixed(1)} km walked` : ''},
          {summary ? ` ${summary.total_size_gb} GB` : ' ~7.8 GB'} in standard open formats). Every
          recording is also accompanied by an offline object-detection layer for road-user analysis.
        </p>

        <figure className="demo-fig">
          <img src={figureURL('snapshot.png')} alt="One synchronized instant: the egocentric RGB frame, the matching long-throw depth frame, and the wearer's position and heading on the map" />
          <figcaption>
            <b>Figure 2.</b> One synchronized instant from Run&nbsp;2 (Rua da Pêga): the egocentric
            RGB frame, the corresponding long-throw depth frame, and the wearer's position and
            heading on the route. All streams share a single wall-clock timeline, so any moment can
            be reconstructed across modalities.
          </figcaption>
        </figure>

        <div className="btn-row">
          <a className="btn primary" href={LINKS.dataset} target="_blank" rel="noreferrer">Download the dataset</a>
          <a className="btn" href={LINKS.paper} target="_blank" rel="noreferrer">Read the paper</a>
        </div>
      </section>

      <section id="demo" className="anchor">
        <h2>Demo</h2>
        <div className="video-wip" role="img" aria-label="UrbanEgo demo video placeholder">
          <div className="vw-title">UrbanEgo demo</div>
        </div>
      </section>

      <section id="data" className="anchor">
        <h2>Data included</h2>
        <p>
          The dataset is organized into one top-level folder per run, named
          <span className="mono"> runN_YYYYMMDD_HHMMSS</span> (where <span className="mono">N</span> is
          the chronological order, 1–8). Everything is stored in standard, widely readable formats
          (MP4, PNG, JSON&nbsp;Lines, CSV) so no project-specific tools are needed:
        </p>
        <div className="table-scroll">
          <table className="dtable">
            <thead>
              <tr><th>File / folder</th><th>Content</th><th>Format</th><th>Rate</th></tr>
            </thead>
            <tbody>
              <tr><td className="mono">rgb.mp4</td><td>Egocentric video with audio</td><td>H.264 1280×720 + AAC 48&nbsp;kHz</td><td>20 fps (real time)</td></tr>
              <tr><td className="mono">rgb_frames.jsonl</td><td>Per-frame head pose &amp; camera intrinsics</td><td>JSON Lines</td><td>~20 fps</td></tr>
              <tr><td className="mono">depth/*.png</td><td>Long-throw depth (millimetres to surface)</td><td>16-bit PNG, 320×288</td><td>~5 fps</td></tr>
              <tr><td className="mono">ab/*.png</td><td>Active-brightness (infrared), same grid as depth</td><td>16-bit PNG, 320×288</td><td>~5 fps</td></tr>
              <tr><td className="mono">depth_frames.jsonl</td><td>Per-depth-frame head pose</td><td>JSON Lines</td><td>~5 fps</td></tr>
              <tr><td className="mono">calibration/</td><td>Depth intrinsics/extrinsics + per-pixel unit-ray table</td><td>JSON + CSV</td><td>per run</td></tr>
              <tr><td className="mono">gps_vam.jsonl</td><td>Hardware GPS receiver (on the Jetson)</td><td>JSON Lines</td><td>~0.8 Hz</td></tr>
              <tr><td className="mono">gps_phone.jsonl</td><td>Phone GPS (OwnTracks)</td><td>JSON Lines</td><td>~0.8 Hz</td></tr>
              <tr><td className="mono">heading.jsonl</td><td>Head heading (degrees from North)</td><td>JSON Lines</td><td>~13 Hz</td></tr>
              <tr><td className="mono">imu.jsonl</td><td>Head orientation (yaw, pitch, roll)</td><td>JSON Lines</td><td>~13 Hz</td></tr>
              <tr><td className="mono">yolo/</td><td>Offline object detections (see below)</td><td>JSON Lines + JSON</td><td>per run</td></tr>
              <tr><td className="mono">manifest.json</td><td>Run summary: identifiers, per-stream counts, layout</td><td>JSON</td><td>per run</td></tr>
            </tbody>
          </table>
        </div>

        <h3>One shared clock</h3>
        <p>
          Every record in every <span className="mono">.jsonl</span> file (one JSON object per line)
          carries the same wall-clock timestamp, so any instant can be reconstructed across
          modalities without an external sync signal. To find the depth frame, GPS fix, or heading
          for a given video moment, match the nearest <span className="mono">ts_unix_ns</span>. These
          fields are common to every stream:
        </p>
        <div className="table-scroll">
          <table className="dtable">
            <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="mono">seq</td><td>int</td><td>Per-stream counter (the sample's index within its own stream)</td></tr>
              <tr><td className="mono">ts_unix_ns</td><td>int</td><td>Wall-clock time, nanoseconds since the Unix epoch, the alignment key</td></tr>
              <tr><td className="mono">ts_mono_ns</td><td>int</td><td>Monotonic clock (ns); steady elapsed time that never jumps backward</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          The per-stream files add their own fields on top of these (for example
          <span className="mono"> rgb_frames.jsonl</span> adds the head pose and camera intrinsics),
          and <span className="mono">rgb.mp4</span> plays in real time so a moment at video time
          <span className="mono"> t</span> is the instant <span className="mono">t</span> seconds after
          the run started, as demonstrated in the synchronized viewer on each run's page.
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
            The full dataset (standard-format files: MP4, PNG, JSON&nbsp;Lines, and CSV, for all runs)
            will be published with a permanent DOI. A download link will appear here once released.
          </p>
          <div className="btn-row">
            <a className="btn primary" href={LINKS.dataset} target="_blank" rel="noreferrer">Dataset repository</a>
          </div>
        </div>
      </section>

      <section id="cite" className="anchor">
        <h2>Citation &amp; license</h2>
        <p>If you use this dataset, please cite the accompanying article:</p>
        <div className="cite">{`@article{urbanego_dataset,
  title   = {UrbanEgo: A Multimodal First-Person Urban
             Perception Dataset},
  author  = {Abreu, Rodrigo and Clérigo, André and Silva, Gonçalo
             and Rito, Pedro and Sargento, Susana},
  journal = {Data in Brief [to appear]},
  year    = {2026}
}`}</div>
        <p className="muted">Released under a Creative Commons license (to be confirmed on publication).</p>
      </section>

    </div>
  )
}
