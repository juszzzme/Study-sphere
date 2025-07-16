const mongoose = require('mongoose');

const PomodoroSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 25 // Default to 25 minutes
  },
  completed: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['focus', 'break', 'long-break'],
    default: 'focus'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: Date.now
  },
  sharedWithGroup: {
    type: Boolean,
    default: false
  },
  groupId: {
    type: String,
    default: null
  },
  tags: [{
    type: String
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Virtual field for calculating actual duration
PomodoroSessionSchema.virtual('actualDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / 60000); // Duration in minutes
  }
  return this.duration;
});

// Index for efficient queries
PomodoroSessionSchema.index({ userId: 1, createdAt: -1 });
PomodoroSessionSchema.index({ groupId: 1, createdAt: -1 });

// Static method to get user stats
PomodoroSessionSchema.statics.getUserStats = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [totalSessions, todaySessions, totalFocusTime] = await Promise.all([
    this.countDocuments({ userId, completed: true }),
    this.countDocuments({ 
      userId, 
      completed: true,
      createdAt: { $gte: today, $lt: tomorrow }
    }),
    this.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(userId),
          completed: true,
          type: 'focus'
        } 
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' }
        }
      }
    ])
  ]);
  
  return {
    totalSessions,
    todaySessions,
    totalFocusTimeMinutes: totalFocusTime[0]?.totalMinutes || 0,
    totalFocusTimeHours: Math.round((totalFocusTime[0]?.totalMinutes || 0) / 60 * 10) / 10 // Round to 1 decimal place
  };
};

// Static method to check for streak
PomodoroSessionSchema.statics.getUserStreak = async function(userId) {
  const sessions = await this.find({ 
    userId, 
    completed: true,
    type: 'focus'
  }).sort({ createdAt: -1 });
  
  if (sessions.length === 0) return 0;
  
  let streak = 1;
  let currentDate = new Date(sessions[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);
  
  let prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  
  // Create a set of dates with sessions
  const datesWithSessions = new Set();
  sessions.forEach(session => {
    const sessionDate = new Date(session.createdAt);
    sessionDate.setHours(0, 0, 0, 0);
    datesWithSessions.add(sessionDate.getTime());
  });
  
  // Check consecutive days
  while (datesWithSessions.has(prevDate.getTime())) {
    streak++;
    prevDate.setDate(prevDate.getDate() - 1);
  }
  
  return streak;
};

module.exports = mongoose.model('PomodoroSession', PomodoroSessionSchema);