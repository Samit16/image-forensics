# Product Requirements Document
## Image Forensics & Metadata Leak Detector — Pilot

**Author:** Sam
**Status:** Pilot / course deliverable
**Course:** Cloud Native App Development

---

## 1. Overview

A REST API that accepts an uploaded image and returns a forensic report: the EXIF metadata secretly embedded in the file (device, GPS location, timestamp), and a basic steganography check flagging images that statistically look like they contain hidden data. Built as a containerized, stateless service backed by an externally managed database, to demonstrate cloud-native deployment principles.

## 2. Problem Statement

Photos routinely leak more information than the person sharing them realizes — exact GPS coordinates, device identifiers, capture timestamps — all embedded invisibly in the file. Separately, steganography allows data to be hidden inside an otherwise normal-looking image, undetectable to the naked eye. Both are real, underserved forensic/privacy concerns with no simple, self-serve tool behind them.

## 3. Goals (Pilot Scope)

- Extract and surface EXIF metadata from an uploaded image
- Run a basic least-significant-bit (LSB) steganography anomaly check
- Persist every analysis as a retrievable report
- Demonstrate the assignment's required architecture: containerized REST API on a guest OS, HTTPS exposure via tunnel, externalized state in a managed cloud database

## 4. Non-Goals (explicitly out of scope for the pilot)

- Video or PDF metadata extraction
- Error Level Analysis (pinpointing *which region* of an image was edited)
- Perceptual hashing / duplicate-image detection
- Metadata redaction / "clean copy" download endpoint
- Authentication, API keys, or multi-tenant support
- Async job queue or batch upload
- Any frontend/dashboard UI

## 5. Users

- **Primary:** course evaluator assessing the cloud-native deployment
- **Secondary:** Sam — portfolio artifact demonstrating forensic tooling ability

## 6. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | `POST /analyze` accepts an image (multipart/form-data) and returns extracted EXIF fields plus a steganography flag and confidence score |
| FR2 | `GET /reports/:id` returns a previously generated report |
| FR3 | `GET /reports` returns all past analyses |
| FR4 | All report data is persisted in MongoDB Atlas — no local database |
| FR5 | The service runs as a Docker container on the guest OS (WSL2-Ubuntu) |
| FR6 | The service is reachable over HTTPS from the host OS via an ngrok or Tailscale tunnel |

## 7. Non-Functional Requirements

- Application container is stateless — all state lives in Atlas, so the container can be killed/restarted without data loss
- Pilot processes one image synchronously per request (no queue yet)
- Typical phone photo should return a report in under 5 seconds

## 8. Success Criteria

- All required architecture pieces are demonstrable live: host/guest split, HTTPS tunnel, Docker deployment, REST API, externalized DB
- Reports accurately reflect real EXIF fields on test images
- The steganography check correctly flags at least one deliberately crafted test image

## 9. Risks / Open Questions

- The steganography check is a statistical heuristic, not proof of hidden data — the report must communicate this as a flag, not a certainty
- Free-tier ngrok URLs change on restart; acceptable for a pilot demo, not for anything longer-lived

## 10. Future Roadmap (post-pilot, not required for this assignment)

- Error Level Analysis worker for edited-region detection
- Perceptual hashing for duplicate/re-upload detection
- Metadata redaction endpoint (returns a "cleaned" image)
- Job queue + worker split for batch/async processing
- Minimal dashboard (map view for geotagged photos, risk-flag gallery)
