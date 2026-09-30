# UrbanEgo: A Multimodal First-Person Urban Perception Dataset

**UrbanEgo** records urban environments from the viewpoint of a walking pedestrian wearing a Microsoft HoloLens 2 and a backpack containing an NVIDIA Jetson edge computer. It combines egocentric RGB video with stereo audio, long-throw depth and infrared frames, head pose and heading, orientation angles, and two independent GPS sources. An offline road-user detection and tracking layer accompanies the sensor recordings.

The collection consists of **eight runs**, approximately **2 h 14 min** of recordings and **7.8 GB** of data, collected in **Aveiro, Portugal**, between May and July 2026. All runs were recorded by one researcher during daytime and fair weather.

![UrbanEgo acquisition setup and recorded modalities](public/figures/Demo.png)

[Watch the acquisition and data-collection demo on YouTube](https://youtu.be/-RTJkzZOtU8).

## Research uses

UrbanEgo provides a pedestrian perspective for research on:

- Egocentric object detection, 3D scene understanding, and depth completion.
- Outdoor localization, pedestrian route analysis, and map matching.
- Wearable sensing and augmented reality for pedestrian safety.
- Pedestrian contributions to cooperative perception.

The GPS, heading, phone speed, and detection streams provide ingredients for experiments with Collective Perception Messages (CPMs). Generating object positions and velocities requires additional processing. Depth can support nearby objects; objects beyond its range require further estimation. The dataset does not include generated CPMs or world-referenced object positions.

## Recording routes

The runs cover three types of urban environment: the University of Aveiro campus and adjacent streets, the Rua da Pêga lakeside arterial, and the touristic city centre.

| Run | Date | Route |
|---|---|---|
| 1 | 2026-05-06 | University campus loop, five marked crossings and a roundabout |
| 2 | 2026-05-06 | Rua da Pêga, a quieter out-and-back lakeside route |
| 3 | 2026-05-07 | Campus, surrounding streets, and hospital roundabout |
| 4 | 2026-07-01 | Repeat of the Run 2 lakeside route |
| 5 | 2026-07-13 | Repeat of the Run 3 campus and hospital route |
| 6 | 2026-07-14 | Ponte dos Botirões, with dense vehicle traffic |
| 7 | 2026-07-14 | Rossio, beside the canal, with the highest pedestrian density |
| 8 | 2026-07-14 | Praça do Peixe, a pedestrian-dense historic square |

For pedestrian-rich scenes, start with **Runs 7 and 8**. Vehicle-rich scenes are found in **Runs 6, 4, and 3**. **Run 1** combines moderate pedestrian and vehicle traffic with the highest cycling activity. Repeated routes allow comparisons between recordings made on different days.

## Data included

Each run is self-contained in a folder named `runN_YYYYMMDD_HHMMSS`, where `N` identifies Run 1 through Run 8. The release uses standard formats that can be read with common libraries.

| File or folder | Content | Format and approximate rate |
|---|---|---|
| `rgb.mp4` | Egocentric RGB video with stereo audio | H.264, 1280×720, 20 fps; AAC, 48 kHz |
| `rgb_frames.jsonl` | Frame timestamps, head pose, camera intrinsics, and capture settings | JSON Lines, per RGB frame |
| `depth/` | Distance to surfaces in millimetres; zero indicates no measurement | 16-bit PNG, 320×288, 5 fps |
| `ab/` | Active-brightness infrared images matching the depth frames | 16-bit PNG, 320×288, 5 fps |
| `depth_frames.jsonl` | Depth-frame timestamps and head pose | JSON Lines, per depth frame |
| `calibration/` | Depth intrinsics, extrinsics, and per-pixel ray table | JSON and CSV, per run |
| `gps_vam.jsonl` | Hardware GPS receiver positions | JSON Lines, 0.8 Hz |
| `gps_phone.jsonl` | OwnTracks smartphone positions, altitude, and speed | JSON Lines, 0.8 Hz |
| `heading.jsonl` | Corrected head heading, degrees clockwise from North | JSON Lines, 13 Hz |
| `imu.jsonl` | Head orientation: yaw, pitch, and roll in degrees | JSON Lines, 13 Hz |
| `yolo/` | Automatic road-user detections, frame counts, and processing metadata | JSON Lines and JSON |
| `manifest.json` | Run identifiers, stream counts, and file layout | JSON, per run |

### Aligning the streams

Sensor records carry a per-stream sequence number (`seq`), a wall-clock timestamp (`ts_unix_ns`, nanoseconds since the Unix epoch), and a monotonic timestamp (`ts_mono_ns`). Match samples by their wall-clock timestamps, using the camera sidecar files to associate RGB and depth frames with GPS and orientation samples. The detection files provide frame indices and `ts_ns` timestamps for association with RGB metadata.

Video playback time and session time can have different starting points. The streams also have different rates and may start or end at different times, so alignment should use the recorded timestamps rather than a shared time-zero assumption.

### Object detections

The detection layer is computed offline from the recorded camera stream using **YOLO11x** and **BoT-SORT with appearance re-identification**. It groups road users into pedestrians, bicycles, and vehicles (cars, motorcycles, buses, and trucks).

- `detections.jsonl`: one tracked-object record per frame, including class, confidence, track identifier, and a pixel bounding box.
- `frames.jsonl`: one record per frame, including empty frames, with group and class counts.
- `meta.json`: processing parameters and run-level metadata.

Per-frame density measures detector output independently of tracking identities. Unique-object counts and flow rates are upper-bound estimates because track fragmentation and repeated observations can inflate them.

## Limitations and privacy

- **Collection scope:** one wearer, eight walks, one city, daytime and fair weather. The collection does not cover night-time, adverse weather, or systematically varied pedestrian behaviour.
- **Automatic labels:** detections and tracks have not been human-verified. They are an automatic baseline and can contain errors, especially for small, distant, or occluded road users.
- **Depth range:** the depth stream covers only a few metres at low resolution and rate, limiting its use for locating street objects.
- **GPS coverage:** the hardware receiver starts 45–70 seconds late in two early runs. The phone track can bridge those gaps, but stream end times also vary.
- **GPS quality:** discard invalid latitude/longitude values and implausible jumps. The phone track in Run 3 has particularly frequent outliers. The hardware receiver's altitude field is an unavailable-value sentinel and should be ignored.
- **Privacy:** released RGB video is processed with automatic face and vehicle licence-plate blurring. The process can miss identifiable content, so residual identifiable content may remain.

## Dataset access and previews

The dataset will be hosted on Zenodo. The record URL, DOI, and access instructions will be added when available.

This repository contains the dataset website, derived route data, heatmaps, and short RGB/depth preview clips. It does not contain the full dataset release. The website provides an overview and a synchronized video, map, and head-heading preview for each run. Route distances are GPS-derived estimates. Heatmap colours show relative observation density normalized within each run and class; they do not provide absolute comparisons across runs or object locations.

## Accompanying paper

**UrbanEgo: A Multimodal First-Person Urban Perception Dataset**

Rodrigo Abreu, André Clérigo, Gonçalo Silva, Pedro Rito, and Susana Sargento.

Universidade de Aveiro and Instituto de Telecomunicações, Aveiro, Portugal.

A public paper link and the final citation metadata will be added when available.

Corresponding author: [Rodrigo Abreu](mailto:rodrigo.abreu@ua.pt).

## Citations

Please cite both the accompanying paper and the Zenodo dataset record when using UrbanEgo. These are **placeholder templates**: replace every bracketed field with the final publication metadata before use.

### Paper

```bibtex
@article{urbanego_paper,
  title   = {UrbanEgo: A Multimodal First-Person Urban Perception Dataset},
  author  = {Abreu, Rodrigo and Clérigo, André and Silva, Gonçalo and Rito, Pedro and Sargento, Susana},
  journal = {[JOURNAL]},
  year    = {[PUBLICATION_YEAR]},
  doi     = {[PAPER_DOI]}
}
```

### Dataset (Zenodo)

Use the title, creators, version, and DOI from the Zenodo record for the dataset release used.

```bibtex
@dataset{urbanego_dataset,
  title     = {[ZENODO_RECORD_TITLE]},
  author    = {[ZENODO_RECORD_CREATORS]},
  year      = {[DATASET_PUBLICATION_YEAR]},
  publisher = {Zenodo},
  version   = {[DATASET_VERSION]},
  doi       = {[ZENODO_DATASET_DOI]},
  url       = {https://doi.org/[ZENODO_DATASET_DOI]}
}
```

## Licence

The UrbanEgo dataset and this website are licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).
