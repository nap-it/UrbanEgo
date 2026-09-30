import { Link, useLocation } from 'react-router-dom'
import DataTable from '../components/DataTable.jsx'
import { figureURL } from '../lib/data.js'
import { useActiveSection } from '../lib/useActiveSection.js'

export default function DataGuide() {
  const loc = useLocation()
  const requested = new URLSearchParams(loc.search).get('section')
  const activeSection = useActiveSection(['data', 'detections', 'limitations'], requested || 'data')
  return (
    <div className="page doc guide-page">
      <div className="guide-heading">
        <Link className="backlink" to="/">← Overview</Link>
        <h2 className="detail-title">Data guide</h2>
      </div>
      <nav className="guide-nav" aria-label="Data guide sections">
        <ul className="guide-nav-list">
          <li><Link className={activeSection === 'data' ? 'is-active' : undefined} to="/data-guide?section=data" aria-current={activeSection === 'data' ? 'location' : undefined}>Data included</Link></li>
          <li><Link className={activeSection === 'detections' ? 'is-active' : undefined} to="/data-guide?section=detections" aria-current={activeSection === 'detections' ? 'location' : undefined}>Object-detection layer</Link></li>
          <li><Link className={activeSection === 'limitations' ? 'is-active' : undefined} to="/data-guide?section=limitations" aria-current={activeSection === 'limitations' ? 'location' : undefined}>Limitations</Link></li>
        </ul>
      </nav>

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
        <DataTable
          label="Data included"
          columns={[
            {"label": "File / folder", "width": "23%", "mono": true},
            {"label": "Content", "width": "42%"},
            {"label": "Format", "width": "23%"},
            {"label": "Rate", "width": "12%"},
          ]}
          rows={[
            ["rgb.mp4", "Egocentric video with audio", "H.264 1280×720 + AAC 48 kHz", "fixed 20 fps"],
            ["rgb_frames.jsonl", "Retained camera-frame timestamps, head pose & camera intrinsics", "JSON Lines", "variable ~19–24 Hz"],
            ["depth/*.png", "Long-throw depth (millimetres to surface)", "16-bit PNG, 320×288", "~5 fps"],
            ["ab/*.png", "Active-brightness (infrared), same grid as depth", "16-bit PNG, 320×288", "~5 fps"],
            ["depth_frames.jsonl", "Per-depth-frame head pose", "JSON Lines", "~5 fps"],
            ["calibration/", "Depth intrinsics/extrinsics + per-pixel unit-ray table", "JSON + CSV", "per run"],
            ["gps_receiver.jsonl", "External GPS receiver connected to the Jetson via USB", "JSON Lines", "~0.8 Hz"],
            ["gps_phone.jsonl", "Phone GPS (OwnTracks)", "JSON Lines", "~0.8 Hz"],
            ["heading.jsonl", "Corrected head heading (degrees clockwise from North)", "JSON Lines", "~13 Hz"],
            ["imu.jsonl", "Head orientation (yaw, pitch, roll)", "JSON Lines", "~13 Hz"],
            ["yolo/", "Offline object detections (see below)", "JSON Lines + JSON", "per retained RGB metadata frame"],
            ["manifest.json", "Run summary: identifiers, per-stream counts, layout", "JSON", "per run"],
          ]}
        />

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
        <DataTable
          label="Shared timestamp fields"
          columns={[
            {"label": "Field", "width": "22%", "mono": true},
            {"label": "Type", "width": "12%"},
            {"label": "Description", "width": "66%"},
          ]}
          rows={[
            ["seq", "int", "Per-stream counter (the sample's index within its own stream)"],
            ["ts_unix_ns", "int", "Wall-clock time, nanoseconds since the Unix epoch, the alignment key"],
            ["ts_mono_ns", "int", "Monotonic clock (ns); steady elapsed time that never jumps backward"],
          ]}
        />
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
        <DataTable
          label="Object-detection files"
          columns={[
            {"label": "File", "width": "22%", "mono": true},
            {"label": "Row = ", "width": "32%"},
            {"label": "Fields", "width": "46%", "mono": true},
          ]}
          rows={[
            ["detections.jsonl", "one tracked object per retained camera frame", "t, ts_ns, frame, cls, name, id, conf, box"],
            ["frames.jsonl", "one retained camera frame (incl. empty)", "frame, t, ts_ns, n, counts, per_class"],
            ["meta.json", "one object per run", "run, frames_processed, duration_s, effective_fps, params, exported_video"],
          ]}
        />
        <p>
          Detections are pixel bounding boxes, with no world-referenced object positions.
          Per-frame density measures detector output independently of track identities and remains
          subject to detection errors. Detection IDs can fragment or switch between observations,
          so unique-object counts and flow rates are approximate. Missed detections and repeated
          observations also affect the totals. The per-run heatmaps place
          observations at the wearer's GPS location and show relative density within each run.
        </p>
        <figure className="demo-fig">
          <img src={figureURL('fig_mean_density.png')} width="1309" height="499" loading="lazy" alt="Mean detected objects per frame in all eight runs: vehicles dominate Runs 3, 4, and 6; pedestrians are most prevalent in Runs 7 and 8; bicycles are uncommon throughout" />
          <figcaption>
            Mean detected objects per frame by run and class, as reported in the
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
    </div>
  )
}
