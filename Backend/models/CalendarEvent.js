const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  start: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: props => `${props.value} is not a valid date`
    }
  },
  end: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // End date is optional
        if (!(v instanceof Date) || isNaN(v)) return false;
        return v > this.start;
      },
      message: 'End date must be after start date'
    }
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters'],
    default: ''
  },
  color: {
    type: String,
    default: '#4285F4', // Default blue color
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} is not a valid color code`
    }
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  recurrenceEndDate: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!this.recurring) return true;
        return v > this.start;
      },
      message: 'Recurrence end date must be after start date'
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'both'],
      required: true
    },
    minutesBefore: {
      type: Number,
      required: true,
      min: 0
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  attachments: [{
    url: String,
    name: String,
    type: String,
    size: Number
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
CalendarEventSchema.index({ user: 1, start: 1 });
CalendarEventSchema.index({ user: 1, end: 1 });
CalendarEventSchema.index({ 'attendees.user': 1 });
CalendarEventSchema.index({ start: 1, end: 1 });

// Virtual for event duration in minutes
CalendarEventSchema.virtual('duration').get(function() {
  if (!this.end || !this.start) return 0;
  return (this.end - this.start) / (1000 * 60);
});

// Pre-save hook to handle recurring events
CalendarEventSchema.pre('save', function(next) {
  // If this is a new recurring event, set up the recurrence pattern
  if (this.isNew && this.recurring && this.recurrencePattern !== 'none') {
    // Set default recurrence end date to 1 year from start if not provided
    if (!this.recurrenceEndDate) {
      const oneYearLater = new Date(this.start);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      this.recurrenceEndDate = oneYearLater;
    }
  }
  
  // Set updatedBy to the current user
  if (this.isModified() && !this.isNew) {
    this.updatedBy = this.user;
  }
  
  next();
});

// Static method to get events in a date range
CalendarEventSchema.statics.findInDateRange = async function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    $or: [
      // Events that start within the range
      { start: { $gte: startDate, $lte: endDate } },
      // Events that end within the range
      { end: { $gte: startDate, $lte: endDate } },
      // Events that span the entire range
      { 
        $and: [
          { start: { $lte: startDate } },
          { end: { $gte: endDate } }
        ]
      }
    ]
  }).sort({ start: 1 });
};

// Instance method to check if an event is happening now
CalendarEventSchema.methods.isHappeningNow = function() {
  const now = new Date();
  return this.start <= now && (!this.end || this.end >= now);
};

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);