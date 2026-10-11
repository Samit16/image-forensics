import 'dotenv/config';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const maxUploadBytes = Number.parseInt(process.env.MAX_UPLOAD_BYTES ?? '10485760', 10);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

if (!Number.isInteger(maxUploadBytes) || maxUploadBytes < 1) {
  throw new Error('MAX_UPLOAD_BYTES must be a positive integer');
}

export const config = {
  port,
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
  maxUploadBytes,
  allowedOrigins
};
