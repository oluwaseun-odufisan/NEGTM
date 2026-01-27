// backend/models/grokModel.js
import mongoose from 'mongoose';

const grokChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  toolId: {
    type: String,
    required: true
  },
  messages: [{
    role: { type: String, enum: ['system', 'user', 'assistant'] },
    content: { type: String }
  }],
  taskContext: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const GrokChat = mongoose.models.GrokChat || mongoose.model('GrokChat', grokChatSchema);

export default GrokChat;