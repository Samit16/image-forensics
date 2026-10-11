import { app } from './app.js';
import { config } from './config.js';
import { connectToDatabase } from './db.js';

try {
  await connectToDatabase(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`Image Forensics API listening on port ${config.port}`);
  });
} catch (error) {
  console.error('Unable to start the API:', error.message);
  process.exitCode = 1;
}
