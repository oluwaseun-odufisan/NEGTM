// backend/models/performanceInteractionModel.js
import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cheer', 'endorse', 'comment', 'challenge'],
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  content: String,
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const PerformanceInteraction = mongoose.models.PerformanceInteraction || mongoose.model('PerformanceInteraction', interactionSchema);
export default PerformanceInteraction;