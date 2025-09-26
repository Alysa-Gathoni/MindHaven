const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: {
      validator: Number.isInteger,
      message: 'Mood score must be an integer'
    }
  },
  emoji: {
    type: String,
    trim: true,
    maxlength: 10
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  note: {
    type: String,
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0) // Start of day
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // For analytics and insights
  metadata: {
    weather: String,
    location: String,
    activity: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
moodSchema.index({ userId: 1, date: -1 });
moodSchema.index({ userId: 1, createdAt: -1 });
moodSchema.index({ score: 1 });
moodSchema.index({ tags: 1 });

// Virtual for mood level description
moodSchema.virtual('level').get(function() {
  if (this.score <= 2) return 'Very Low';
  if (this.score <= 4) return 'Low';
  if (this.score <= 6) return 'Neutral';
  if (this.score <= 8) return 'Good';
  return 'Excellent';
});

// Virtual for mood color (for UI)
moodSchema.virtual('color').get(function() {
  if (this.score <= 2) return '#ff4444';
  if (this.score <= 4) return '#ff8800';
  if (this.score <= 6) return '#ffcc00';
  if (this.score <= 8) return '#88cc00';
  return '#44cc44';
});

// Static method to get user's mood statistics
moodSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        average: { $avg: '$score' },
        count: { $sum: 1 },
        min: { $min: '$score' },
        max: { $max: '$score' },
        lastWeek: {
          $avg: {
            $cond: [
              { $gte: ['$date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              '$score',
              null
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || { average: 0, count: 0, min: 0, max: 0, lastWeek: 0 };
};

// Static method to get mood trends
moodSchema.statics.getTrends = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        averageScore: { $avg: '$score' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to get popular tags
moodSchema.statics.getPopularTags = async function(userId, limit = 10) {
  return await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Pre-save middleware to ensure date is start of day
moodSchema.pre('save', function(next) {
  if (this.date) {
    this.date = new Date(this.date);
    this.date.setHours(0, 0, 0, 0);
  }
  next();
});

module.exports = mongoose.model('Mood', moodSchema);
