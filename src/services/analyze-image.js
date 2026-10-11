import { extractExif } from './exif.js';
import { checkForSteganography } from './steganography.js';

export async function analyzeImage(file) {
  const [exif, steganography] = await Promise.all([
    extractExif(file.buffer),
    checkForSteganography(file.buffer)
  ]);

  return {
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    exif,
    steganography
  };
}
