import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import RunsTable from '../components/RunsTable.jsx'
import { fetchJSON, figureURL, LINKS, CITATIONS, fmtDuration } from '../lib/data.js'

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
          The <b>UrbanEgo dataset</b> records urban environments from the viewpoint of a walking
          pedestrian wearing a Microsoft HoloLens&nbsp;2 and a backpack with an NVIDIA Jetson edge
          computer. Each run combines RGB video with stereo audio, long-throw depth and infrared
          frames, head pose and heading, orientation angles, and two independent GPS sources.
          An offline detection and tracking layer accompanies the sensor recordings.
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
          Collected in Aveiro, Portugal, the dataset comprises
          {summary ? ` ${summary.n_runs}` : ' 8'} runs recorded across the city
          between May and July&nbsp;2026: approximately
          {summary ? ` ${fmtDuration(summary.total_duration_s)}` : ' 2 h 14 min'} across the recording sessions.
          The exported RGB videos total
          {summary?.total_rgb_duration_s != null ? ` ${fmtDuration(summary.total_rgb_duration_s)}` : ' 2 h 08 min 11 s'}.
          The release contains {summary ? `${summary.total_size_gb} GB` : '7.8 GB'} of data in standard formats.
          The routes cover the University of Aveiro campus, the Rua da Pêga lakeside arterial,
          and the touristic city centre. One researcher recorded all runs during daytime and fair weather.
        </p>
        <p>
          The released RGB video is processed with automatic face and vehicle licence-plate blurring.
          This pass can miss identifiable content; residual identifiable content may remain.
        </p>

        <figure className="demo-fig">
          <img src={figureURL('snapshot.png')} alt="One synchronized instant: the egocentric RGB frame, the matching long-throw depth frame, and the wearer's position and heading on the map" />
          <figcaption>
            <b>Figure 2.</b> One synchronized instant from Run&nbsp;2 (Rua da Pêga): the egocentric
            RGB frame, the corresponding long-throw depth frame, and the wearer's position and
            heading on the route. Shared wall-clock timestamps support alignment across modalities
            where their recording periods overlap.
          </figcaption>
        </figure>

        <h3>Research uses</h3>
        <ul>
          <li>Pedestrian-view object detection, 3D scene understanding, and depth completion.</li>
          <li>Outdoor localization, route analysis, and map matching with GPS and head orientation.</li>
          <li>Wearable sensing and augmented reality for pedestrian safety.</li>
          <li>Exploring how pedestrian observations can contribute to cooperative perception.</li>
        </ul>
        <div className="btn-row">
          {LINKS.dataset && <a className="btn primary" href={LINKS.dataset} target="_blank" rel="noreferrer">Download the dataset</a>}
          {LINKS.paper && <a className="btn" href={LINKS.paper} target="_blank" rel="noreferrer">Read the paper</a>}
          <Link className="btn" to="/" state={{ scrollTo: 'cite' }}>About the paper</Link>
        </div>
      </section>

      <section id="demo" className="anchor">
        <h2>Demo</h2>
        <iframe
          className="demo-video"
          src="https://www.youtube-nocookie.com/embed/-RTJkzZOtU8"
          title="UrbanEgo dataset demo"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
        <p><a href={LINKS.demo} target="_blank" rel="noreferrer">Open the demo on YouTube</a></p>
      </section>

      <section id="data" className="anchor">
        <h2>Data included</h2>
        <p>
          The sensing platform combines internal perception (head orientation), external perception
          (RGB, depth, infrared, and audio), and localization (hardware GPS and smartphone GPS).
        </p>
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
              <tr><td className="mono">rgb.mp4</td><td>Egocentric video with audio</td><td>H.264 1280×720 + AAC 48&nbsp;kHz</td><td>fixed 20 fps</td></tr>
              <tr><td className="mono">rgb_frames.jsonl</td><td>Retained camera-frame timestamps, head pose &amp; camera intrinsics</td><td>JSON Lines</td><td>variable ~19–24 Hz</td></tr>
              <tr><td className="mono">depth/*.png</td><td>Long-throw depth (millimetres to surface)</td><td>16-bit PNG, 320×288</td><td>~5 fps</td></tr>
              <tr><td className="mono">ab/*.png</td><td>Active-brightness (infrared), same grid as depth</td><td>16-bit PNG, 320×288</td><td>~5 fps</td></tr>
              <tr><td className="mono">depth_frames.jsonl</td><td>Per-depth-frame head pose</td><td>JSON Lines</td><td>~5 fps</td></tr>
              <tr><td className="mono">calibration/</td><td>Depth intrinsics/extrinsics + per-pixel unit-ray table</td><td>JSON + CSV</td><td>per run</td></tr>
              <tr><td className="mono">gps_vam.jsonl</td><td>Hardware GPS receiver (on the Jetson)</td><td>JSON Lines</td><td>~0.8 Hz</td></tr>
              <tr><td className="mono">gps_phone.jsonl</td><td>Phone GPS (OwnTracks)</td><td>JSON Lines</td><td>~0.8 Hz</td></tr>
              <tr><td className="mono">heading.jsonl</td><td>Corrected head heading (degrees clockwise from North)</td><td>JSON Lines</td><td>~13 Hz</td></tr>
              <tr><td className="mono">imu.jsonl</td><td>Head orientation (yaw, pitch, roll)</td><td>JSON Lines</td><td>~13 Hz</td></tr>
              <tr><td className="mono">yolo/</td><td>Offline object detections (see below)</td><td>JSON Lines + JSON</td><td>per retained RGB metadata frame</td></tr>
              <tr><td className="mono">manifest.json</td><td>Run summary: identifiers, per-stream counts, layout</td><td>JSON</td><td>per run</td></tr>
            </tbody>
          </table>
        </div>

        <h3>One shared clock</h3>
        <p>
          Sensor JSON Lines records (one JSON object per line) use a shared wall-clock timestamp
          convention. To associate an RGB frame with depth, GPS, or heading samples, use the frame's
          timestamp in <span className="mono">rgb_frames.jsonl</span> and match the nearest
          <span className="mono"> ts_unix_ns</span> in the other sensor stream within their overlapping
          coverage. Retain the time difference and reject matches across large gaps. These common fields
          apply to sensor JSONL records; YOLO uses its own <span className="mono">frame</span>,
          <span className="mono"> t</span>, and <span className="mono"> ts_ns</span> fields:
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
          Video playback time and session time can have different starting points. Use the frame
          metadata for alignment rather than assuming every stream starts at video time zero.
          Streams can also end at different times. YOLO frame indices identify rows in the retained
          RGB metadata sequence, not encoded MP4 frame indices; join YOLO <span className="mono">ts_ns</span>
          to the matching RGB metadata <span className="mono">ts_unix_ns</span>.
        </p>
        <h3>Working with depth and GPS</h3>
        <p>
          Depth pixels store distances in millimetres; zero means no measurement. The accompanying
          infrared image shares the depth grid. The per-pixel ray table in
          <span className="mono"> calibration/</span> supports reconstruction of nearby 3D points
          from the rectified depth frames. The depth sensor covers only a few metres. Calibration
          matrices refer to local HoloLens tracking and sensor frames. The export's pose-frame and
          transform directions await confirmation; verify them before projecting points between frames.
        </p>
        <p>
          The hardware receiver's altitude is an unavailable-value sentinel and should be ignored.
          Discard out-of-range latitude or longitude values in both GPS sources, and filter GPS
          jumps that imply implausible walking speeds. A missing phone <span className="mono">speed_mps</span>
          value means that speed is unavailable. Check implausible reported speeds before use.
          The released heading values include a
          correction for a constant angular offset in each run.
        </p>
      </section>

      <section id="detections" className="anchor">
        <h2>Object-detection layer</h2>
        <p>
          Each run includes an offline object-detection layer computed from the recorded RGB camera
          stream with YOLO11x and BoT-SORT with appearance re-identification. Classes are grouped
          into <b>pedestrians</b>, <b>bicycles</b>, and <b>vehicles</b> (cars, motorcycles, buses, and
          trucks). These automatic outputs have not been human-verified and can contain detection
          and tracking errors. They are stored per run
          as two line-delimited JSON files plus a metadata file:
        </p>
        <div className="table-scroll">
          <table className="dtable">
            <thead><tr><th>File</th><th>Row = </th><th>Fields</th></tr></thead>
            <tbody>
              <tr><td className="mono">detections.jsonl</td><td>one tracked object per retained camera frame</td><td className="mono">t, ts_ns, frame, cls, name, id, conf, box</td></tr>
              <tr><td className="mono">frames.jsonl</td><td>one retained camera frame (incl. empty)</td><td className="mono">frame, t, ts_ns, n, counts, per_class</td></tr>
              <tr><td className="mono">meta.json</td><td>one object per run</td><td className="mono">run, frames_processed, duration_s, effective_fps, params, exported_video</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Detections are pixel bounding boxes, with no world-referenced object positions.
          Per-frame density measures detector output independently of track identities and remains
          subject to detection errors. Detection IDs can fragment or switch between observations,
          so unique-object counts and flow rates are approximate. Missed detections and repeated
          observations also affect the totals. The per-run heatmaps place
          observations at the wearer's GPS location and show relative density within each run.
        </p>
        <figure className="demo-fig">
          <img src={figureURL('fig_mean_density.png')} loading="lazy" alt="Mean detected objects per frame in all eight runs: vehicles dominate Runs 3, 4, and 6; pedestrians are most prevalent in Runs 7 and 8; bicycles are uncommon throughout" />
          <figcaption>
            <b>Figure 3.</b> Mean detected objects per frame by run and class, as reported in the
            paper. Averaging over frames allows comparisons between runs of different lengths;
            these counts describe automatic detector output.
          </figcaption>
        </figure>
        <h3>Pedestrian contributions to collective perception</h3>
        <p>
          GPS, heading, available phone speed, and tracked detections provide ingredients for experiments
          with Collective Perception Messages (CPMs). Generating object positions and velocities
          requires additional processing, including alignment of camera pose and depth for nearby
          objects. Objects beyond the depth range need further estimation. The dataset contains
          sensor recordings and detections; CPMs and world-referenced object positions are not included.
        </p>
      </section>

      <section id="runs" className="anchor">
        <h2>Recordings</h2>
        <p>
          {runs.length || 8} runs were recorded across five days between May and July&nbsp;2026,
          spanning campus, arterial, and city-centre settings. Select a run to open its synchronized
          RGB / depth / map viewer and its density heatmap.
        </p>
        <p>
          For pedestrian-rich scenes, start with Rossio and Praça do Peixe (Runs&nbsp;7 and&nbsp;8).
          For vehicle-rich scenes, choose Runs&nbsp;6, 4, and&nbsp;3. Run&nbsp;1 combines moderate
          pedestrian and vehicle traffic with the highest cycling activity. Runs&nbsp;2 and&nbsp;4
          repeat the lakeside route; Runs&nbsp;3 and&nbsp;5 repeat the campus and hospital route.
        </p>
        {runs.length ? <RunsTable runs={runs} /> : <div className="loading">Loading runs…</div>}
        <p className="muted">
          Session duration spans the earliest to latest sensor timestamp; RGB duration describes
          the exported MP4 video track. GPS can continue after the video ends. Sizes use decimal GB.
          Route thumbnails and distances are derived from GPS tracks. Distances are estimates
          affected by GPS accuracy. Each run page provides a short synchronized preview of the
          RGB / depth / map streams.
        </p>
      </section>

      <section id="limitations" className="anchor">
        <h2>Limitations</h2>
        <ul>
          <li><b>Collection scope.</b> Eight walks by one wearer in one city, during daytime and
            fair weather. Night-time, adverse weather, and systematically varied pedestrian
            behaviour are outside this collection.</li>
          <li><b>Automatic labels.</b> Detections are an automatic baseline, not human-verified
            ground truth. Small, distant, and occluded road users may be missed.</li>
          <li><b>Tracking identities.</b> Detection IDs can fragment or switch and should not be
            treated as verified persistent identities.</li>
          <li><b>Depth coverage.</b> Short-range, 320×288 depth at approximately 5 fps supports
            nearby scene structure but cannot locate most street objects.</li>
          <li><b>GPS coverage and accuracy.</b> The hardware receiver starts 45–70 seconds late
            in two early runs. The phone track can bridge those gaps, but both sources can have
            outliers; the phone track in Run&nbsp;3 is particularly affected. Stream end times
            also vary.</li>
          <li><b>Calibration.</b> Pose and calibration matrices use local sensor/tracking frames.
            The exported transform directions await confirmation before projecting points between frames.</li>
          <li><b>Image representation.</b> Depth and infrared frames are stored as lossless 16-bit
            PNG files; lossless PNG storage does not by itself establish bit-exact equality with the
            original sensor stream.</li>
          <li><b>Privacy.</b> Automatic face and licence-plate blurring may leave identifiable
            content in the released RGB video.</li>
        </ul>
      </section>

      <section id="download" className="anchor">
        <h2>Download</h2>
        <div className="callout">
          <p>
            The full dataset comprises all eight runs in MP4, PNG, JSON&nbsp;Lines, and CSV.
            The Zenodo record URL, DOI, and access instructions will be added when available.
            The clips on this website are
            short previews of the recordings.
          </p>
          {LINKS.dataset && <div className="btn-row">
            <a className="btn primary" href={LINKS.dataset} target="_blank" rel="noreferrer">Dataset repository</a>
          </div>}
        </div>
      </section>

      <section id="cite" className="anchor">
        <h2>Citations</h2>
        <p><b>UrbanEgo: A Multimodal First-Person Urban Perception Dataset</b></p>
        {LINKS.paper && <p><a href={LINKS.paper} target="_blank" rel="noreferrer">Read the paper</a></p>}
        <pre className="cite" aria-label="Paper citation placeholder">{CITATIONS.paper}</pre>
        <h3>Dataset citation (Zenodo)</h3>
        <pre className="cite" aria-label="Zenodo dataset citation placeholder">{CITATIONS.dataset}</pre>
        <h3>License</h3>
        <p>
          The UrbanEgo dataset and this website are licensed under the
          {' '}<a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noreferrer">
            GNU General Public License v3.0 (GPL-3.0)
          </a>.
        </p>
      </section>

    </div>
  )
}
