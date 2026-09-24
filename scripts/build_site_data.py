#!/usr/bin/env python3
"""
Build all static data + media for the UrbanEgo dataset website into
dataset-site/public/. Reuses the validation dashboard's HLP2 extractor and the
YOLO outputs; produces:

    public/data/index.json          catalogue (id, date, duration, distance, flags)
    public/data/<id>.json           per-run tracks/heading/imu + clip + distance
    public/data/<id>_heat.json      ego-observation density (pedestrian / vehicle)
    public/data/summary.json        dataset totals for the homepage
    public/clips/<id>_rgb.mp4        very short ~480p preview clip (drives map sync)
    public/clips/<id>_depth.mp4      matching depth preview clip

Run with the viewer venv python (has msgpack/numpy) and ffmpeg on PATH:
    hololens_pubsub/libs/.../viewer/venv/bin/python dataset-site/scripts/build_site_data.py
Options: --no-clips (skip ffmpeg), --clip-seconds N (default 20).
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]            # mobile_object_detector/
SITE = Path(__file__).resolve().parents[1]            # dataset-site/
RECORDINGS = REPO / "hololens_pubsub" / "recordings" / "validation"
YOLO_RESULTS = REPO / "yolo" / "results"
REPACKAGED = REPO / "dataset_repackaged"              # released, anonymized rgb.mp4 lives here
OUT_DATA = SITE / "public" / "data"
OUT_CLIPS = SITE / "public" / "clips"


def repackaged_rgb(rid):
    """The released, face/plate-anonymized rgb.mp4 for a run id (runN_<rid>/rgb.mp4).
    Preview clips are cut from this, never from the raw non-anonymized recording."""
    hits = sorted(REPACKAGED.glob(f"run*_{rid}/rgb.mp4"))
    return hits[0] if hits else None

# Reuse the proven HLP2 extractor and the YOLO GPS reader.
sys.path.insert(0, str(REPO / "hololens-pubsub-dataset-dashboard" / "scripts"))
sys.path.insert(0, str(REPO / "scripts"))
import extract_dashboard_data as E   # noqa: E402
import numpy as np                   # noqa: E402

GROUPS = ("person", "bicycle", "vehicle")


# ── distance ──────────────────────────────────────────────────────────────────

def thumb_polyline(track, n=48):
    """Downsample a [[lat,lon,t],...] track to ~n [lat,lon] points for a card thumbnail."""
    if not track:
        return []
    step = max(1, len(track) // n)
    pts = [[round(p[0], 6), round(p[1], 6)] for p in track[::step]]
    if pts and pts[-1] != [round(track[-1][0], 6), round(track[-1][1], 6)]:
        pts.append([round(track[-1][0], 6), round(track[-1][1], 6)])
    return pts


def route_distance_m(track, min_step_s=5.0):
    """Total route length (m) from a [[lat,lon,t],...] track, time-downsampled to
    ~min_step_s spacing so 1 Hz GPS jitter doesn't inflate the sum."""
    if not track or len(track) < 2:
        return 0.0
    kept = [track[0]]
    for p in track[1:]:
        if p[2] - kept[-1][2] >= min_step_s:
            kept.append(p)
    return round(sum(E.haversine_m(a[0], a[1], b[0], b[1])
                     for a, b in zip(kept, kept[1:])), 1)


# ── heatmap (ego-observation density) ─────────────────────────────────────────

def _first_ts(path):
    for ts in E.iter_ts_only(path):
        return ts
    return None


def build_heat(run_dir, bin_deg=1e-4):
    """Join per-frame YOLO counts with the ego GPS position → grid-binned mean
    per-frame density for pedestrians and vehicles. Semantics: where the wearer
    OBSERVED more of a class (ego position), not object geolocation."""
    frames_path = YOLO_RESULTS / run_dir.name.replace("hololens_recording_", "") / "frames.jsonl"
    if not frames_path.exists():
        return None
    # ego track (phone GPS, denser): absolute seconds
    gt, glat, glon = [], [], []
    for ts, payload in E.iter_hlp2(run_dir / "phone_location_1.hlp2"):
        d = E.decode_msgpack_payload(payload)
        if not d or "latitude" not in d:
            continue
        gt.append(E._event_ts(d, ts) / 1e9); glat.append(float(d["latitude"])); glon.append(float(d["longitude"]))
    if len(gt) < 2:
        return None
    gt = np.asarray(gt); glat = np.asarray(glat); glon = np.asarray(glon)

    bins = {}   # (ilat, ilon) -> [sum_ped, sum_veh, n]
    with open(frames_path) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            t = r.get("ts_ns", 0) / 1e9
            if t < gt[0] or t > gt[-1]:
                continue
            lat = float(np.interp(t, gt, glat)); lon = float(np.interp(t, gt, glon))
            c = r.get("counts", {})
            key = (round(lat / bin_deg), round(lon / bin_deg))
            b = bins.setdefault(key, [0, 0, 0])
            b[0] += int(c.get("person", 0)); b[1] += int(c.get("vehicle", 0)); b[2] += 1

    ped, veh = [], []
    for (ilat, ilon), (sp, sv, n) in bins.items():
        lat = ilat * bin_deg; lon = ilon * bin_deg
        if n:
            ped.append([round(lat, 6), round(lon, 6), round(sp / n, 4)])
            veh.append([round(lat, 6), round(lon, 6), round(sv / n, 4)])
    # normalise each layer to [0,1] for consistent heat intensity
    for layer in (ped, veh):
        mx = max((p[2] for p in layer), default=0.0)
        if mx > 0:
            for p in layer:
                p[2] = round(p[2] / mx, 4)
    return {"bin_m": round(bin_deg * 111000, 1), "ped": ped, "veh": veh}


# ── preview clips ─────────────────────────────────────────────────────────────

def pick_window(run_dir, video_offset_s, vam, duration, clip_s):
    """Choose a clip window (session-relative start) with GPS coverage, preferring
    the busiest segment from the YOLO frame counts."""
    lo = (vam[0][2] if vam else 0.0) + 2.0
    hi = (vam[-1][2] if vam else duration) - clip_s - 2.0
    lo = max(lo, video_offset_s + 2.0)
    if hi <= lo:
        return max(lo, video_offset_s)
    frames_path = YOLO_RESULTS / run_dir.name.replace("hololens_recording_", "") / "frames.jsonl"
    if not frames_path.exists():
        return (lo + hi) / 2
    # frame t is camera-relative (video time); session time = t + video_offset_s
    ft, fn = [], []
    with open(frames_path) as fh:
        for line in fh:
            line = line.strip()
            if line:
                r = json.loads(line)
                ft.append(r["t"] + video_offset_s); fn.append(r.get("n", 0))
    ft = np.asarray(ft); fn = np.asarray(fn)
    best_s, best_sum = (lo + hi) / 2, -1
    for s in np.arange(lo, hi, 2.0):
        m = (ft >= s) & (ft < s + clip_s)
        tot = int(fn[m].sum())
        if tot > best_sum:
            best_sum, best_s = tot, float(s)
    return round(best_s, 2)


def make_clip(src_mp4, out_mp4, ss, dur, height=480, fps=15):
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{ss:.2f}", "-i", str(src_mp4),
           "-t", f"{dur:.2f}", "-vf", f"scale=-2:{height}", "-r", str(fps), "-an",
           "-c:v", "libx264", "-crf", "30", "-preset", "veryfast",
           "-movflags", "+faststart", str(out_mp4)]
    subprocess.run(cmd, check=True)
    return out_mp4.stat().st_size


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Build static data + media for the site")
    ap.add_argument("--no-clips", action="store_true", help="skip ffmpeg clip generation")
    ap.add_argument("--clip-seconds", type=float, default=20.0)
    args = ap.parse_args()

    OUT_DATA.mkdir(parents=True, exist_ok=True)
    OUT_CLIPS.mkdir(parents=True, exist_ok=True)

    run_dirs = sorted(d for d in RECORDINGS.iterdir()
                      if d.is_dir() and d.name.startswith("hololens_recording_"))
    print(f"{len(run_dirs)} runs in {RECORDINGS}")

    index = []
    tot_dur = tot_dist = 0.0
    for run_dir in run_dirs:
        run = E.extract_run(run_dir)                 # reuse proven extraction
        rid = run["id"]
        track = run["phone"] if len(run["phone"]) >= len(run["vam"]) else run["vam"]
        run["distance_m"] = route_distance_m(track)

        # preview clips + clip_start_s (session-relative)
        run["clip_start_s"] = None
        run["rgb_clip"] = run["depth_clip"] = ""
        rgb_src = repackaged_rgb(rid)              # anonymized released video (not the raw recording)
        depth_src = run_dir / "validation_depth.mp4"
        if not args.no_clips and rgb_src and rgb_src.exists():
            ss_sess = pick_window(run_dir, run["video_offset_s"], run["vam"],
                                  run["duration"], args.clip_seconds)
            run["clip_start_s"] = ss_sess
            rgb_out = OUT_CLIPS / f"{rid}_rgb.mp4"
            kb = make_clip(rgb_src, rgb_out, ss_sess - run["video_offset_s"], args.clip_seconds) // 1024
            run["rgb_clip"] = f"clips/{rgb_out.name}"
            print(f"    clip rgb  @ {ss_sess:.1f}s  ({kb} KB)")
            if depth_src.exists():
                depth_off = ((_first_ts(depth_src.parent / 'HololensDepth_1.hlp2') or run['start_ts_ns'])
                             - run["start_ts_ns"]) / 1e9
                depth_out = OUT_CLIPS / f"{rid}_depth.mp4"
                make_clip(depth_src, depth_out, max(0, ss_sess - depth_off), args.clip_seconds, height=360)
                run["depth_clip"] = f"clips/{depth_out.name}"

        # drop the old server-relative video urls (site uses committed clips)
        run.pop("rgb_video", None); run.pop("depth_video", None)
        (OUT_DATA / f"{rid}.json").write_text(json.dumps(run, separators=(",", ":")))

        heat = build_heat(run_dir)
        if heat:
            (OUT_DATA / f"{rid}_heat.json").write_text(json.dumps(heat, separators=(",", ":")))

        tot_dur += run["duration"]; tot_dist += run["distance_m"]
        index.append({"id": rid, "label": run["label"], "date": run["date"],
                      "duration": run["duration"], "distance_m": run["distance_m"],
                      "has_clip": bool(run["rgb_clip"]), "has_depth": bool(run["depth_clip"]),
                      "has_heat": bool(heat),
                      "thumb": thumb_polyline(track)})   # small route polyline for the card

    index.sort(key=lambda r: r["id"], reverse=True)
    (OUT_DATA / "index.json").write_text(json.dumps({"runs": index}, separators=(",", ":")))

    summary = {
        "n_runs": len(index),
        "total_duration_s": round(tot_dur, 1),
        "total_distance_m": round(tot_dist, 1),
        "total_size_gb": 7.4,
        "streams": ["RGB video", "audio", "depth", "infrared", "VAM GPS", "phone GPS", "heading", "IMU"],
        "detection": {"model": "YOLO11x", "tracker": "BoT-SORT + ReID",
                      "classes": ["pedestrians", "bicycles", "vehicles"]},
    }
    (OUT_DATA / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"\nwrote {len(index)} runs → {OUT_DATA}")
    print(f"totals: {tot_dur/60:.0f} min, {tot_dist/1000:.1f} km")


if __name__ == "__main__":
    main()
