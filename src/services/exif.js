import exifr from 'exifr';

export async function extractExif(buffer) {
  const parsed = await exifr.parse(buffer, { translateValues: true });

  if (!parsed) {
    return {};
  }

  return JSON.parse(JSON.stringify(parsed, (_key, value) => {
    if (value instanceof Uint8Array) {
      return Array.from(value);
    }
    return value;
  }));
}
