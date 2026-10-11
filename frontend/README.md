# Reveal frontend

React + Vite interface for the Image Forensics API.

1. Start the API in the repository root. The supplied Docker setup exposes it on `http://localhost:3001`.
2. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the API or its ngrok HTTPS URL.
3. Run `npm install` and `npm run dev`.

The app uses the API's `image` multipart field and loads saved reports from `/reports`.

Run `npm run lint` and `npm run build` before deployment.
