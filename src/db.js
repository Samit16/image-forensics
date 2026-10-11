import mongoose from 'mongoose';

export async function connectToDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(mongoUri);
}

export async function disconnectFromDatabase() {
  await mongoose.disconnect();
}
