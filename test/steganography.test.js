import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { checkForSteganography } from '../src/services/steganography.js';

test('flags a sufficiently large balanced LSB sample', async () => {
  const pixels = Buffer.alloc(64 * 64 * 3);
  for (let index = 0; index < pixels.length; index += 1) {
    pixels[index] = index % 2;
  }

  const image = await sharp(pixels, { raw: { width: 64, height: 64, channels: 3 } })
    .png()
    .toBuffer();
  const result = await checkForSteganography(image);

  assert.equal(result.flagged, true);
  assert.equal(result.score, 1);
});

test('does not flag a uniform image', async () => {
  const pixels = Buffer.alloc(64 * 64 * 3, 0);
  const image = await sharp(pixels, { raw: { width: 64, height: 64, channels: 3 } })
    .png()
    .toBuffer();
  const result = await checkForSteganography(image);

  assert.equal(result.flagged, false);
  assert.equal(result.score, 0);
});
