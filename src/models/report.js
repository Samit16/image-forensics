import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    originalFilename: { 
      type: String, 
      required: true 
    },
    mimeType: { 
      type: String, 
      required: true 
    },
    fileSizeBytes: { type: Number, required: true },
    exif: { type: mongoose.Schema.Types.Mixed, required: true },
    steganography: {
      flagged: { type: Boolean, required: true },
      score: { type: Number, required: true, min: 0, max: 1 },
      method: { type: String, required: true }
    }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export const Report = mongoose.model('Report', reportSchema);
