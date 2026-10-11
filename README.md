# Image Forensics & Metadata Leak Detector

A web application that analyzes uploaded images, extracts available metadata, identifies potential anomalies, and stores analysis reports for later review.

## Features

- **Metadata Extraction:** Inspect available EXIF metadata, including timestamps, device information, and GPS coordinates.
- **Image Analysis:** Process images using Sharp and the project's configured analysis routines.
- **Report History:** Retrieve and review previously saved analysis reports.
- **Persistent Storage:** Store reports in MongoDB Atlas.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express.js
- **Image Processing:** Sharp, exifr
- **Database:** MongoDB Atlas, Mongoose
- **Deployment:** Docker

## Prerequisites

Install the following before getting started:

- Node.js and npm
- Docker Desktop
- MongoDB Atlas account
- ngrok account and CLI

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd image-forensics
```

Replace `<repository-url>` with the repository's Git URL.

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
MONGO_URI=your_mongodb_connection_string
```

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Use the API's actual reachable base URL. If the frontend runs in a browser and the API is exposed through ngrok, configure the corresponding HTTPS URL instead.

### 3. Start the Backend

Build the Docker image from the directory containing the backend's `Dockerfile`:

```bash
docker build -t image-forensics .
```

Start the container:

```bash
docker run -d \
  --name image-forensics-api \
  -p 3001:3000 \
  --env-file .env \
  image-forensics
```

Verify the API:

```bash
curl http://localhost:3001/health
```

The health endpoint reports API and database status.

### 4. Start the Frontend

Open a terminal in the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

### 5. Configure Remote API Access (Optional)

If the frontend cannot reach the backend directly, expose the API using ngrok:

```bash
ngrok http 3001
```

Set `VITE_API_BASE_URL` to the HTTPS forwarding URL provided by ngrok, then restart the frontend development server.

## API Reference

| Method   | Endpoint         | Description                         |
| -------- | ---------------- | ----------------------------------- |
| `GET`  | `/health`      | Check API and database connectivity |
| `POST` | `/analyze`     | Analyze an uploaded image           |
| `GET`  | `/reports`     | Retrieve saved reports              |
| `GET`  | `/reports/:id` | Retrieve a report by ID             |

### Analyze an Image

Send a `multipart/form-data` request to `/analyze` with the image in the `image` field.

```bash
curl -X POST http://localhost:3001/analyze \
  -F "image=@sample.jpg"
```

## Security Notes

- Keep database credentials and environment files out of version control.
- Restrict database network access to trusted sources.
- Validate uploaded files and apply appropriate size limits.
- Metadata and anomaly findings are indicators for investigation, not definitive proof of image manipulation.
