// backend/models/challengeModel.js
import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'team', 'individual'],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  startDate: Date,
  endDate: Date,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  completedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    date: Date,
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);
export default Challenge;