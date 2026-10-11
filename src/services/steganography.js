import sharp from 'sharp';

const FLAG_THRESHOLD = 0.85;
const MIN_ANALYZED_CHANNELS = 1024;

export async function checkForSteganography(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const analyzedChannels = Math.min(data.length, 2_000_000);
  if (analyzedChannels < MIN_ANALYZED_CHANNELS) {
    return {
      flagged: false,
      score: 0,
      method: 'LSB parity distribution; image too small for a reliable sample'
    };
  }

  let oneBits = 0;
  for (let index = 0; index < analyzedChannels; index += 1) {
    oneBits += data[index] & 1;
  }

  const onesRatio = oneBits / analyzedChannels;
  const score = Number((1 - Math.abs(onesRatio - 0.5) * 2).toFixed(4));

  return {
    flagged: score >= FLAG_THRESHOLD,
    score,
    method: `LSB parity distribution across ${info.channels}-channel raw pixels; heuristic only`
  };
}
