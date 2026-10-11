# Image Forensics & Metadata Leak Detector

A small REST API that scans an uploaded image and reports what it secretly reveals: embedded EXIF metadata (device, GPS location, timestamp) and a basic check for hidden steganographic data. Built as a cloud-native pilot — containerized, stateless, backed by a managed cloud database.

## Features (pilot)

- Extracts EXIF metadata (camera/device, GPS coordinates, capture timestamp, and other embedded fields)
- Runs a least-significant-bit (LSB) statistical check to flag images that likely contain hidden data
- Persists every analysis as a report you can retrieve later

## Architecture

```
Host OS (Windows)                  Guest OS (WSL2-Ubuntu)
┌───────────────────┐   HTTPS      ┌───────────────────────┐
│ Postman / curl /   │  ──────────▶│  ngrok / Tailscale     │
│ wget                │  (tunnel)   │  tunnel                │
└───────────────────┘              └───────────┬───────────┘
                                                 │
                                    ┌────────────▼────────────┐
                                    │  Express REST API        │
                                    │  (Docker container)      │
                                    └────────────┬────────────┘
                                                 │
                                    ┌────────────▼────────────┐
                                    │   MongoDB Atlas           │
                                    │   (reports)               │
                                    └───────────────────────────┘
```

## Tech stack

- Node.js + Express
- Docker
- MongoDB Atlas
- ngrok or Tailscale (HTTPS tunnel — no NGINX/Let's Encrypt needed for the pilot)

## Prerequisites

- Node.js 18+
- Docker (running inside WSL2)
- A MongoDB Atlas cluster and connection string
- An ngrok account, or Tailscale installed with Funnel enabled

## Setup

### 1. Install and configure

```bash
npm install
npm test
```

Copy `.env.example` to `.env` and replace the MongoDB Atlas placeholder values:

```dotenv
MONGO_URI=your_mongodb_atlas_connection_string
PORT=3000
```

In Atlas, allow the guest OS IP address in **Network Access**, create a database user, and copy the connection string into `MONGO_URI`. The API creates the `reports` collection automatically on the first analysis.

### 2. Build and run with Docker

```bash
docker build -t image-forensics .
docker run -p 3000:3000 --env-file .env image-forensics
```

The container does not write reports or uploaded images to disk. MongoDB Atlas is the only persistence layer, so restarting the container does not lose reports.

### 3. Expose it over HTTPS

```bash
ngrok http 3000
# or
tailscale funnel 3000
```

Use the HTTPS URL it gives you from the host machine.

Check the service from WSL2 before opening the tunnel:

```bash
curl http://localhost:3000/health
```

## API reference

### `POST /analyze`

Upload an image, get back a forensic report.

- **Body:** `multipart/form-data`, field name `image`
- **Response:**

```json
{
  "id": "665f...",
  "exif": {
    "device": "...",
    "gps": { "lat": 0.0, "lng": 0.0 },
    "timestamp": "..."
  },
  "steganography": {
    "flagged": true,
    "score": 0.82
  },
  "createdAt": "2026-09-26T10:00:00Z"
}
```

The `steganography.flagged` value is a statistical warning, not proof that hidden data exists. `score` is between `0` and `1`; higher values mean the sampled RGB least-significant bits are closer to an even split of zeroes and ones.

### `GET /reports/:id`

Returns a single previously generated report by its ID.

### `GET /reports`

Returns all past analyses.

## Testing it

```bash
curl -X POST https://<your-tunnel-url>/analyze \
  -F "image=@sample.jpg"

curl https://<your-tunnel-url>/reports
```

Or import into Postman and hit the same endpoints with file upload set on the `image` field.

In Postman, choose `Body` → `form-data`, add a field named `image`, change its type from `Text` to `File`, and select a JPG or PNG. The response includes the generated report `id`, which can be passed to `GET /reports/:id`.

The health endpoint is also available at `GET /health` and reports whether the API process currently has an active Atlas connection.

## Frontend

The `frontend/` directory contains the Reveal React + Vite interface. It provides image drag-and-drop, clear loading and error states, plain-language findings, metadata review, and report history.

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env.local` to `http://localhost:3001` for the current Docker host mapping or to the current ngrok HTTPS URL. The API only permits browser calls from origins in `ALLOWED_ORIGINS`; add the Vite site's exact origin there if you change its address.

## Project structure

```
.
├── src/
│   ├── services/      # EXIF parsing and LSB heuristic
│   ├── models/        # Mongoose schema for reports
│   ├── app.js         # Express routes and error handling
│   └── server.js      # Atlas connection and HTTP listener
├── test/              # focused image-analysis tests
├── Dockerfile
├── .env.example
└── README.md
```

## Roadmap

See `Image Forensics PRD.md` for what this pilot deliberately leaves out and where it would go next (edited-region detection, redaction endpoint, async job queue, dashboard).

## License

MIT
