import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import RunsTable from '../components/RunsTable.jsx'
import CitationBlock from '../components/CitationBlock.jsx'
import { fetchJSON, figureURL, LINKS, CITATIONS, fmtDuration } from '../lib/data.js'

export default function Home() {
  const [summary, setSummary] = useState(null)
  const [runs, setRuns] = useState([])
  const loc = useLocation()

  useEffect(() => {
    fetchJSON('data/summary.json').then(setSummary).catch(() => {})
    fetchJSON('data/index.json').then((d) => setRuns(d.runs || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const id = new URLSearchParams(loc.search).get('section') || loc.state?.scrollTo
    if (!id || !runs.length) return
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [runs.length, loc.search, loc.state])

  return (
    <div className="page doc home-page">
      <section id="overview" className="anchor overview-section">
        <p className="lead-p">
          The <b>UrbanEgo dataset</b> records urban environments from the viewpoint of a walking pedestrian. Each run combines RGB video with stereo audio, long-throw depth and infrared frames, head pose and heading, orientation angles, and two independent GPS sources.
        </p>
        <dl className="dataset-facts">
          <div><dt>Recordings</dt><dd>{summary?.n_runs ?? 8}</dd></div>
          <div><dt>RGB video</dt><dd>{fmtDuration(summary?.total_rgb_duration_s ?? 7691.2)}</dd></div>
          <div><dt>Dataset size</dt><dd>{summary?.total_size_gb ?? 7.8} GB</dd></div>
          <div><dt>Location</dt><dd>Aveiro, Portugal</dd></div>
        </dl>
        <div className="btn-row overview-actions">
          <Link className="btn primary" to="/?section=runs">Explore recordings</Link>
          <Link className="btn" to="/?section=demo">Watch demo</Link>
          {LINKS.dataset && <a className="btn" href={LINKS.dataset} target="_blank" rel="noreferrer">Download the dataset</a>}
          {LINKS.paper && <a className="btn" href={LINKS.paper} target="_blank" rel="noreferrer">Read the paper</a>}
        </div>

        <figure className="demo-fig featured-preview">
          <img src={figureURL('snapshot.png')} width="1440" height="389" alt="One synchronized instant: the egocentric RGB frame, the matching long-throw depth frame, and the wearer's position and heading on the map" />
          <figcaption>
            One synchronized instant from Run&nbsp;2 (Rua da Pêga): the egocentric RGB frame, the corresponding long-throw depth frame, and the wearer's position and heading on the route.
          </figcaption>
        </figure>
      </section>

      <section className="research-uses">
        <h2>Research uses</h2>
        <ul>
          <li>Pedestrian-view object detection, 3D scene understanding, and depth completion.</li>
          <li>Outdoor localization, route analysis, and map matching with GPS and head orientation.</li>
          <li>Wearable sensing and augmented reality for pedestrian safety.</li>
          <li>Exploring how pedestrian observations can contribute to cooperative perception.</li>
        </ul>
      </section>

      <section id="runs" className="anchor">
        <h2>Recordings</h2>
        <p>
          {runs.length || 8} runs were recorded across five days between May and July&nbsp;2026, spanning campus, arterial, and city-centre settings. Select a run to open its synchronized RGB / depth / map viewer and its density heatmap.
        </p>
        <p>
          For pedestrian-rich scenes, start with Rossio and Praça do Peixe (Runs&nbsp;7 and&nbsp;8). For vehicle-rich scenes, choose Runs&nbsp;3, 4, and&nbsp;6. Run&nbsp;1 combines moderate pedestrian and vehicle traffic with the highest cycling activity. Runs&nbsp;2 and&nbsp;4 repeat the lakeside route; Runs&nbsp;3 and&nbsp;5 repeat the campus and hospital route.
        </p>
        {runs.length ? <RunsTable runs={runs} /> : <div className="loading">Loading runs…</div>}
        <p className="muted">
          Session duration spans the earliest to latest sensor timestamp; RGB duration describes the exported MP4 video track. GPS can continue after the video ends. Sizes use decimal GB. Route thumbnails and distances are derived from GPS tracks. Distances are estimates affected by GPS accuracy. Each run page provides a short synchronized preview of the RGB / depth / map streams.
        </p>
      </section>

      <section id="demo" className="anchor">
        <h2>Demonstration Video</h2>
        <iframe
          className="demo-video"
          src="https://www.youtube-nocookie.com/embed/-RTJkzZOtU8"
          title="UrbanEgo dataset demo"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </section>

      <section id="data" className="anchor collection-section">
        <div className="section-heading">
          <h2>Data included</h2>
          <Link className="guide-link" to="/data-guide">Data guide →</Link>
        </div>
        <p>
          The sensing platform combines internal perception (head orientation), external perception (RGB, depth, infrared, and audio), and localization (hardware GPS and smartphone GPS).
        </p>
        <p>Everything is stored in standard, widely readable formats (MP4, PNG, JSON&nbsp;Lines, CSV) so no project-specific tools are needed.</p>
        <p>
          Each run includes an offline object-detection layer computed from the recorded RGB camera stream with YOLO11x and BoT-SORT with appearance re-identification. Classes are grouped into <b>pedestrians</b>, <b>bicycles</b>, and <b>vehicles</b> (cars, motorcycles, buses, and trucks). These automatic outputs have not been human-verified and can contain detection and tracking errors.
        </p>
        <h3>The acquisition setup</h3>
        <figure className="demo-fig">
          <img loading="lazy" src={figureURL('Demo.png')} width="2483" height="860" alt="UrbanEgo acquisition setup: a pedestrian wearing a HoloLens 2 and a backpack of recording hardware, with the sensed modalities labelled" />
          <figcaption>
            The acquisition setup. The sensing pedestrian (VRU) wears a HoloLens&nbsp;2 and a backpack of recording hardware (inset: Jetson edge computer, Wi-Fi router, power banks, and smartphone), and records RGB video, depth, audio, head rotation, and location while walking the route.
          </figcaption>
        </figure>
        <p>
          Collected in Aveiro, Portugal, the dataset comprises {summary ? ` ${summary.n_runs}` : ' 8'} runs recorded across the city between May and July&nbsp;2026: approximately {summary ? ` ${fmtDuration(summary.total_duration_s)}` : ' 2 h 14 min'} across the recording sessions.
          The exported RGB videos total {summary?.total_rgb_duration_s != null ? ` ${fmtDuration(summary.total_rgb_duration_s)}` : ' 2 h 08 min 11 s'}.
          The release contains {summary ? `${summary.total_size_gb} GB` : '7.8 GB'} of data in standard formats.
          The routes cover the University of Aveiro campus, the Rua da Pêga lakeside arterial, and the touristic city centre. One researcher recorded all runs during daytime and fair weather.
        </p>
      </section>

      <section id="limitations" className="anchor">
        <h2>Limitations</h2>
        <ul>
          <li><b>Collection scope.</b> Night-time, adverse weather, and systematically varied pedestrian behaviour are outside this collection.</li>
          <li><b>Automatic labels.</b> Detections are an automatic baseline, not human-verified ground truth.</li>
          <li><b>Image representation.</b> Depth and infrared frames are stored as lossless 16-bit PNG files; lossless PNG storage does not by itself establish bit-exact equality with the original sensor stream.</li>
          <li><b>Privacy.</b> Automatic face and licence-plate blurring may leave identifiable content in the released RGB video.</li>
        </ul>
      </section>

      <section id="download" className="anchor">
        <h2>Data guide</h2>
        <p>The data guide describes the data included in each run, including the file formats, shared timestamp fields, and object-detection outputs.</p>
        <p><Link className="guide-link" to="/data-guide">Read the data guide →</Link></p>
      </section>

      <section id="cite" className="anchor">
        <h2>Citations</h2>
        {LINKS.paper && <p><a href={LINKS.paper} target="_blank" rel="noreferrer">Read the paper</a></p>}
        <CitationBlock title="Paper citation" label="Paper citation placeholder" citation={CITATIONS.paper} />
        <CitationBlock title="Dataset citation (Zenodo)" label="Zenodo dataset citation" citation={CITATIONS.dataset} />
      </section>

      <section id="license" className="anchor">
        <h2>License</h2>
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
