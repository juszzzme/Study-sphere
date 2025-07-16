const mongoose = require('mongoose');

const SwipeMasterScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  highScore: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
SwipeMasterScoreSchema.index({ userId: 1 });
SwipeMasterScoreSchema.index({ highScore: -1 });

module.exports = mongoose.model('SwipeMasterScore', SwipeMasterScoreSchema); 