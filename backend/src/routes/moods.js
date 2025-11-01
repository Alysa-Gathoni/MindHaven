const express = require('express');
const Joi = require('joi');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { requireAdmin } = require('../middleware/firebaseAuth');
const Mood = require('../models/Mood');
const User = require('../models/User');

const router = express.Router();

// Validation schemas
const createMoodSchema = Joi.object({
  score: Joi.number().integer().min(1).max(10).required(),
  emoji: Joi.string().max(10).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  note: Joi.string().max(500).optional(),
  date: Joi.date().optional()
});

const getMoodsSchema = Joi.object({
  userId: Joi.string().optional(),
  from: Joi.date().optional(),
  to: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * POST /api/moods
 * Create a new mood entry
 */
router.post('/', firebaseAuth, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createMoodSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Check if mood entry already exists for this date
    const existingMood = await Mood.findOne({
      userId: user._id,
      date: value.date || new Date().setHours(0, 0, 0, 0)
    });

    if (existingMood) {
      return res.status(409).json({
        error: 'Mood entry exists',
        message: 'A mood entry already exists for this date'
      });
    }

    // Create mood entry
    const mood = new Mood({
      ...value,
      userId: user._id,
      date: value.date || new Date().setHours(0, 0, 0, 0)
    });

    await mood.save();
    await mood.populate('userId', 'displayName email');

    res.status(201).json({
      success: true,
      mood: {
        id: mood._id,
        score: mood.score,
        emoji: mood.emoji,
        tags: mood.tags,
        note: mood.note,
        date: mood.date,
        level: mood.level,
        color: mood.color,
        createdAt: mood.createdAt
      }
    });
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({
      error: 'Failed to create mood',
      message: 'Unable to create mood entry'
    });
  }
});

/**
 * GET /api/moods
 * Get mood entries for user
 */
router.get('/', firebaseAuth, async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = getMoodsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Build query
    const query = { userId: user._id };
    
    // Admin can view other users' moods
    if (value.userId && user.role === 'admin') {
      query.userId = value.userId;
    }
    
    if (value.from) {
      query.date = { ...query.date, $gte: value.from };
    }
    
    if (value.to) {
      query.date = { ...query.date, $lte: value.to };
    }

    // Get moods with pagination
    const moods = await Mood.find(query)
      .sort({ date: -1 })
      .limit(value.limit)
      .skip(value.offset)
      .populate('userId', 'displayName email');

    // Get total count for pagination
    const total = await Mood.countDocuments(query);

    res.json({
      success: true,
      moods: moods.map(mood => ({
        id: mood._id,
        score: mood.score,
        emoji: mood.emoji,
        tags: mood.tags,
        note: mood.note,
        date: mood.date,
        level: mood.level,
        color: mood.color,
        createdAt: mood.createdAt
      })),
      pagination: {
        total,
        limit: value.limit,
        offset: value.offset,
        hasMore: value.offset + value.limit < total
      }
    });
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({
      error: 'Failed to get moods',
      message: 'Unable to retrieve mood entries'
    });
  }
});

/**
 * GET /api/moods/stats
 * Get mood statistics for user
 */
router.get('/stats', firebaseAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Get user's mood statistics
    const stats = await Mood.getUserStats(user._id, parseInt(days));
    const trends = await Mood.getTrends(user._id, parseInt(days));
    const popularTags = await Mood.getPopularTags(user._id, 10);

    res.json({
      success: true,
      stats: {
        ...stats,
        days: parseInt(days)
      },
      trends,
      popularTags: popularTags.map(tag => ({
        tag: tag._id,
        count: tag.count
      }))
    });
  } catch (error) {
    console.error('Get mood stats error:', error);
    res.status(500).json({
      error: 'Failed to get mood statistics',
      message: 'Unable to retrieve mood statistics'
    });
  }
});

/**
 * GET /api/moods/:id
 * Get specific mood entry
 */
router.get('/:id', firebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const mood = await Mood.findById(id).populate('userId', 'displayName email');
    
    if (!mood) {
      return res.status(404).json({
        error: 'Mood not found',
        message: 'Mood entry not found'
      });
    }

    // Check if user can access this mood
    if (!user.canAccess(mood.userId._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this mood entry'
      });
    }

    res.json({
      success: true,
      mood: {
        id: mood._id,
        score: mood.score,
        emoji: mood.emoji,
        tags: mood.tags,
        note: mood.note,
        date: mood.date,
        level: mood.level,
        color: mood.color,
        createdAt: mood.createdAt
      }
    });
  } catch (error) {
    console.error('Get mood error:', error);
    res.status(500).json({
      error: 'Failed to get mood',
      message: 'Unable to retrieve mood entry'
    });
  }
});

/**
 * DELETE /api/moods/:id
 * Delete mood entry
 */
router.delete('/:id', firebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const mood = await Mood.findById(id);
    
    if (!mood) {
      return res.status(404).json({
        error: 'Mood not found',
        message: 'Mood entry not found'
      });
    }

    // Check if user can delete this mood
    if (!user.canAccess(mood.userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this mood entry'
      });
    }

    await Mood.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Mood entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({
      error: 'Failed to delete mood',
      message: 'Unable to delete mood entry'
    });
  }
});

module.exports = router;



