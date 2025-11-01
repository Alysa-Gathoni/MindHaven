const express = require('express');
const Joi = require('joi');
const { firebaseAuth, requireAdmin } = require('../middleware/firebaseAuth');
const User = require('../models/User');
const Mood = require('../models/Mood');
const Journal = require('../models/Journal');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(firebaseAuth, requireAdmin);

/**
 * GET /api/admin/analytics
 * Get anonymized analytics for admin dashboard
 */
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ['$lastSeen', startDate] },
                1,
                0
              ]
            }
          },
          newUsers: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startDate] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get mood analytics
    const moodAnalytics = await Mood.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalMoods: { $sum: 1 },
          averageMood: { $avg: '$score' },
          moodDistribution: {
            $push: '$score'
          }
        }
      }
    ]);

    // Get journal analytics
    const journalAnalytics = await Journal.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalJournals: { $sum: 1 },
          averageSentiment: { $avg: '$sentiment.comparative' },
          flaggedJournals: {
            $sum: {
              $cond: ['$flagged.isFlagged', 1, 0]
            }
          }
        }
      }
    ]);

    // Get mood trends over time
    const moodTrends = await Mood.aggregate([
      {
        $match: {
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
          averageMood: { $avg: '$score' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get popular tags
    const popularTags = await Mood.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        period: parseInt(days),
        users: userStats[0] || { totalUsers: 0, activeUsers: 0, newUsers: 0 },
        moods: moodAnalytics[0] || { totalMoods: 0, averageMood: 0, moodDistribution: [] },
        journals: journalAnalytics[0] || { totalJournals: 0, averageSentiment: 0, flaggedJournals: 0 },
        trends: moodTrends,
        popularTags: popularTags.map(tag => ({
          tag: tag._id,
          count: tag.count
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: 'Unable to retrieve analytics data'
    });
  }
});

/**
 * GET /api/admin/flagged
 * Get flagged entries for review
 */
router.get('/flagged', async (req, res) => {
  try {
    const { limit = 50, skip = 0, reviewed = false } = req.query;
    
    const query = { 'flagged.isFlagged': true };
    if (reviewed === 'true') {
      query['flagged.reviewed'] = true;
    } else if (reviewed === 'false') {
      query['flagged.reviewed'] = false;
    }

    const flaggedEntries = await Journal.find(query)
      .populate('userId', 'displayName email')
      .populate('flagged.flaggedBy', 'displayName')
      .populate('flagged.reviewedBy', 'displayName')
      .sort({ 'flagged.flaggedAt': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Journal.countDocuments(query);

    res.json({
      success: true,
      flaggedEntries: flaggedEntries.map(entry => ({
        id: entry._id,
        title: entry.title,
        body: entry.body.substring(0, 200) + '...', // Truncate for admin view
        userId: {
          id: entry.userId._id,
          displayName: entry.userId.displayName,
          email: entry.userId.email
        },
        flagged: {
          reason: entry.flagged.reason,
          flaggedAt: entry.flagged.flaggedAt,
          flaggedBy: entry.flagged.flaggedBy?.displayName,
          reviewed: entry.flagged.reviewed,
          reviewedBy: entry.flagged.reviewedBy?.displayName,
          reviewedAt: entry.flagged.reviewedAt,
          action: entry.flagged.action
        },
        createdAt: entry.createdAt
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Get flagged entries error:', error);
    res.status(500).json({
      error: 'Failed to get flagged entries',
      message: 'Unable to retrieve flagged entries'
    });
  }
});

/**
 * PATCH /api/admin/flagged/:id
 * Review and take action on flagged entry
 */
router.patch('/flagged/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    // Validate action
    const validActions = ['none', 'contact_user', 'escalate', 'archive'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Action must be one of: ' + validActions.join(', ')
      });
    }

    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({
        error: 'Journal not found',
        message: 'Flagged entry not found'
      });
    }

    if (!journal.flagged.isFlagged) {
      return res.status(400).json({
        error: 'Not flagged',
        message: 'This entry is not flagged'
      });
    }

    // Get current admin user
    const adminUser = await User.findOne({ firebaseUid: req.user.uid });

    // Update flagged status
    journal.flagged.reviewed = true;
    journal.flagged.reviewedBy = adminUser._id;
    journal.flagged.reviewedAt = new Date();
    journal.flagged.action = action;
    
    if (comment) {
      journal.flagged.comment = comment;
    }

    await journal.save();

    res.json({
      success: true,
      message: 'Flagged entry reviewed successfully',
      action: action
    });
  } catch (error) {
    console.error('Review flagged entry error:', error);
    res.status(500).json({
      error: 'Failed to review flagged entry',
      message: 'Unable to review flagged entry'
    });
  }
});

/**
 * GET /api/admin/users/:id/activity
 * Get user activity summary (admin only)
 */
router.get('/users/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user's mood statistics
    const moodStats = await Mood.getUserStats(id, parseInt(days));
    
    // Get user's journal statistics
    const journalStats = await Journal.getUserStats(id, parseInt(days));

    // Get recent activity
    const recentMoods = await Mood.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('score date createdAt');

    const recentJournals = await Journal.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt flagged');

    res.json({
      success: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen
      },
      activity: {
        period: parseInt(days),
        moods: moodStats,
        journals: journalStats,
        recentMoods,
        recentJournals
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      error: 'Failed to get user activity',
      message: 'Unable to retrieve user activity'
    });
  }
});

/**
 * GET /api/admin/system/health
 * Get system health and statistics
 */
router.get('/system/health', async (req, res) => {
  try {
    // Get database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get collection counts
    const userCount = await User.countDocuments();
    const moodCount = await Mood.countDocuments();
    const journalCount = await Journal.countDocuments();
    const flaggedCount = await Journal.countDocuments({ 'flagged.isFlagged': true });

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActivity = {
      newUsers: await User.countDocuments({ createdAt: { $gte: yesterday } }),
      newMoods: await Mood.countDocuments({ createdAt: { $gte: yesterday } }),
      newJournals: await Journal.countDocuments({ createdAt: { $gte: yesterday } }),
      newFlagged: await Journal.countDocuments({ 
        'flagged.isFlagged': true,
        'flagged.flaggedAt': { $gte: yesterday }
      })
    };

    res.json({
      success: true,
      system: {
        status: 'healthy',
        database: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        counts: {
          users: userCount,
          moods: moodCount,
          journals: journalCount,
          flagged: flaggedCount
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      error: 'Failed to get system health',
      message: 'Unable to retrieve system health information'
    });
  }
});

module.exports = router;



