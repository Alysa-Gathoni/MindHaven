const mongoose = require('mongoose');
const Sentiment = require('sentiment');

const sentiment = new Sentiment();

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000
  },
  moodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mood',
    default: null
  },
  visibility: {
    type: String,
    enum: ['private', 'shared'],
    default: 'private'
  },
  // Sentiment analysis results
  sentiment: {
    score: Number, // -5 to +5
    comparative: Number, // -1 to +1
    analysis: String // 'positive', 'negative', 'neutral'
  },
  // Crisis detection and flagging
  flagged: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    reason: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date,
    reviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    action: {
      type: String,
      enum: ['none', 'contact_user', 'escalate', 'archive']
    }
  },
  // Encryption for sensitive entries
  encrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
journalSchema.index({ userId: 1, createdAt: -1 });
journalSchema.index({ userId: 1, updatedAt: -1 });
journalSchema.index({ flagged: 1 });
journalSchema.index({ visibility: 1 });
journalSchema.index({ 'sentiment.score': 1 });

// Crisis detection keywords
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'not worth living',
  'better off dead', 'want to die', 'hurt myself', 'self harm',
  'cut myself', 'overdose', 'jump off', 'hang myself'
];

// Pre-save middleware for sentiment analysis and crisis detection
journalSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Perform sentiment analysis
    const sentimentResult = sentiment.analyze(this.body);
    this.sentiment = {
      score: sentimentResult.score,
      comparative: sentimentResult.comparative,
      analysis: sentimentResult.comparative > 0.1 ? 'positive' : 
                sentimentResult.comparative < -0.1 ? 'negative' : 'neutral'
    };
    
    // Crisis detection
    const text = this.body.toLowerCase();
    const hasCrisisLanguage = crisisKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    // Flag for crisis if detected
    if (hasCrisisLanguage && !this.flagged.isFlagged) {
      this.flagged = {
        isFlagged: true,
        reason: 'Crisis language detected',
        flaggedAt: new Date()
      };
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for word count
journalSchema.virtual('wordCount').get(function() {
  return this.body.split(/\s+/).length;
});

// Virtual for reading time (average 200 words per minute)
journalSchema.virtual('readingTime').get(function() {
  return Math.ceil(this.wordCount / 200);
});

// Method to check if entry contains crisis language
journalSchema.methods.checkCrisisLanguage = function() {
  const text = this.body.toLowerCase();
  return crisisKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
};

// Static method to get user's journal statistics
journalSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalWords: { $sum: { $size: { $split: ['$body', ' '] } } },
        averageSentiment: { $avg: '$sentiment.comparative' },
        positiveEntries: {
          $sum: { $cond: [{ $gt: ['$sentiment.comparative', 0.1] }, 1, 0] }
        },
        negativeEntries: {
          $sum: { $cond: [{ $lt: ['$sentiment.comparative', -0.1] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalEntries: 0,
    totalWords: 0,
    averageSentiment: 0,
    positiveEntries: 0,
    negativeEntries: 0
  };
};

// Static method to get sentiment trends
journalSchema.statics.getSentimentTrends = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        averageSentiment: { $avg: '$sentiment.comparative' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to get flagged entries for admin review
journalSchema.statics.getFlaggedEntries = async function(limit = 50, skip = 0) {
  return await this.find({ 'flagged.isFlagged': true })
    .populate('userId', 'displayName email')
    .populate('flagged.flaggedBy', 'displayName')
    .sort({ 'flagged.flaggedAt': -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Journal', journalSchema);
