const mongoose = require('mongoose');

const SwipeMasterCardSchema = new mongoose.Schema({
  statement: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
SwipeMasterCardSchema.index({ category: 1 });
SwipeMasterCardSchema.index({ difficulty: 1 });

module.exports = mongoose.model('SwipeMasterCard', SwipeMasterCardSchema); 