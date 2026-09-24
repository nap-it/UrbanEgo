# UrbanEgo Dataset Website

Public presentation site for the **UrbanEgo** wearable-HoloLens VRU dataset and its
article. It has an academic, text-forward landing page (description, data & format
tables, object-detection layer, recordings, download, citation) and an interactive
per-run viewer: a synchronized **video ↔ map ↔ heading** player plus a
pedestrian/vehicle **observation-density heatmap**.

Built with **Vite + React**, fully static, deployed to **GitLab Pages**.

Developed at the Instituto de Telecomunicações & Universidade de Aveiro (Aveiro Tech
City Living Lab). Companion to
[hololens-pubsub-dataset-dashboard](../hololens-pubsub-dataset-dashboard) (the internal
validation dashboard this site's sync logic is derived from).

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # -> dist/  (static, base = "./")
npm run preview      # serve the build locally
```

Node 18+ required.

## Deployment (later)

Deployment (GitLab Pages) is not configured yet — it will be added when ready. The
build is static and `base` is relative (`./` in `vite.config.js`), so it will serve
from a project subpath (`https://<group>.<pages-domain>/hololens-pubsub-dataset-website/`)
without extra configuration. A GitLab Pages `pages` job only needs to run
`npm run build` and publish the output (Vite builds into `dist/`, which GitLab Pages
expects renamed to `public/`).

## Site data & media

All data and media are **precomputed and committed** under `public/`, so the site
builds and deploys on its own:

| Path | Purpose |
|---|---|
| `public/data/index.json` | run catalogue (id, date, duration, distance, route thumbnail) |
| `public/data/<id>.json` | per-run GPS / heading / IMU tracks + `clip_start_s` |
| `public/data/<id>_heat.json` | ego-observation density (pedestrian / vehicle) |
| `public/data/summary.json` | homepage totals |
| `public/clips/<id>_{rgb,depth}.mp4` | very short ~480p preview clips (drive the map sync); RGB cut from the **anonymized** released video |
| `public/figures/*.png` | banner + snapshot figures |
| `public/banner2.jpg` | header banner image |

**Regenerating the data** (only needed when recordings/detections change) requires the
full workspace, since `scripts/build_site_data.py` reads the sibling
`../hololens-pubsub-dataset-dashboard` extractor, the `../yolo` / `../hololens_pubsub`
outputs, and the anonymized `../dataset_repackaged` videos (RGB preview clips are cut
from those, never from the raw recording). It is **not** needed to build or deploy the
site from the committed `public/`.

```bash
<viewer-venv>/bin/python scripts/build_site_data.py            # data + preview clips
<viewer-venv>/bin/python scripts/build_site_data.py --no-clips # data only
```

## Structure

```
src/
  App.jsx, main.jsx          banner masthead + nav, HashRouter
  pages/Home.jsx             academic landing (description, tables, runs, download, citation)
  pages/RunDetail.jsx        per-run: synced viewer + density heatmap
  components/RunsTable.jsx   runs table with route thumbnails
  components/RouteThumb.jsx  SVG route thumbnail (no tiles)
  components/SyncedRunMap.jsx video + Leaflet map + heading marker (sync ported from the dashboard)
  components/HeatMap.jsx     Leaflet + leaflet.heat density overlay
  lib/interp.js              GPS/heading/IMU interpolation
  lib/data.js, lib/runs.js   fetch/URL/format helpers, run zone names & notes
scripts/build_site_data.py   data + clip build (needs the parent workspace)
public/                      committed data, clips, figures, banner
```

## TODO before publishing

- Fill the real **paper** and **dataset** links in `src/lib/data.js` (`LINKS`).
- Enable Pages for the project in GitLab (Settings → Pages) if not already on.
