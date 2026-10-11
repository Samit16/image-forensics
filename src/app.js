import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { config } from './config.js';
import { Report } from './models/report.js';
import { analyzeImage } from './services/analyze-image.js';

export const app = express();

// The Vite frontend runs on a separate origin in development. Keep browser
// access explicit rather than exposing this upload API to arbitrary websites.
app.use((request, response, next) => {
  const origin = request.get('origin');
  if (origin && config.allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }
    callback(new Error('Only image uploads are supported'));
  }
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/analyze', upload.single('image'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'An image file is required in the "image" field' });
      return;
    }

    const analysis = await analyzeImage(request.file);
    const report = await Report.create(analysis);
    response.status(201).json({
      id: report.id,
      ...report.toObject()
    });
  } catch (error) {
    next(error);
  }
});

app.get('/reports', async (_request, response, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).lean();
    response.json(reports.map(({ _id, ...report }) => ({ id: _id.toString(), ...report })));
  } catch (error) {
    next(error);
  }
});

app.get('/reports/:id', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ error: 'Report id is invalid' });
      return;
    }

    const report = await Report.findById(request.params.id).lean();
    if (!report) {
      response.status(404).json({ error: 'Report not found' });
      return;
    }

    const { _id, ...reportData } = report;
    response.json({ id: _id.toString(), ...reportData });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    response.status(413).json({ error: `Image exceeds the ${config.maxUploadBytes}-byte upload limit` });
    return;
  }

  if (error.message === 'Only image uploads are supported') {
    response.status(415).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Unable to analyze image' });
});
