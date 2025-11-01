const express = require('express');
const Joi = require('joi');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { requireAdmin } = require('../middleware/firebaseAuth');
const Journal = require('../models/Journal');
const User = require('../models/User');

const router = express.Router();

// Validation schemas
const createJournalSchema = Joi.object({
  title: Joi.string().max(200).required(),
  body: Joi.string().max(10000).required(),
  moodId: Joi.string().optional(),
  visibility: Joi.string().valid('private', 'shared').default('private')
});

const updateJournalSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  body: Joi.string().max(10000).optional(),
  visibility: Joi.string().valid('private', 'shared').optional()
});

const getJournalsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  visibility: Joi.string().valid('private', 'shared').optional()
});

/**
 * POST /api/journals
 * Create a new journal entry
 */
router.post('/', firebaseAuth, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createJournalSchema.validate(req.body);
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

    // Create journal entry
    const journal = new Journal({
      ...value,
      userId: user._id
    });

    await journal.save();
    await journal.populate('userId', 'displayName email');

    // Check for crisis language and provide resources if needed
    const crisisResources = journal.checkCrisisLanguage() ? {
      message: 'We noticed your entry contains concerning language. Please reach out to someone you trust or contact emergency services if you need immediate help.',
      resources: [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Emergency Services: 911'
      ]
    } : null;

    res.status(201).json({
      success: true,
      journal: {
        id: journal._id,
        title: journal.title,
        body: journal.body,
        moodId: journal.moodId,
        visibility: journal.visibility,
        sentiment: journal.sentiment,
        wordCount: journal.wordCount,
        readingTime: journal.readingTime,
        flagged: journal.flagged.isFlagged,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt
      },
      crisisResources
    });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({
      error: 'Failed to create journal',
      message: 'Unable to create journal entry'
    });
  }
});

/**
 * GET /api/journals
 * Get journal entries for user
 */
router.get('/', firebaseAuth, async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = getJournalsSchema.validate(req.query);
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
    
    if (value.visibility) {
      query.visibility = value.visibility;
    }

    // Get journals with pagination
    const journals = await Journal.find(query)
      .sort({ createdAt: -1 })
      .limit(value.limit)
      .skip(value.offset)
      .populate('userId', 'displayName email')
      .populate('moodId', 'score emoji date');

    // Get total count for pagination
    const total = await Journal.countDocuments(query);

    res.json({
      success: true,
      journals: journals.map(journal => ({
        id: journal._id,
        title: journal.title,
        body: journal.body,
        moodId: journal.moodId,
        visibility: journal.visibility,
        sentiment: journal.sentiment,
        wordCount: journal.wordCount,
        readingTime: journal.readingTime,
        flagged: journal.flagged.isFlagged,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt
      })),
      pagination: {
        total,
        limit: value.limit,
        offset: value.offset,
        hasMore: value.offset + value.limit < total
      }
    });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({
      error: 'Failed to get journals',
      message: 'Unable to retrieve journal entries'
    });
  }
});

/**
 * GET /api/journals/:id
 * Get specific journal entry
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

    const journal = await Journal.findById(id)
      .populate('userId', 'displayName email')
      .populate('moodId', 'score emoji date');
    
    if (!journal) {
      return res.status(404).json({
        error: 'Journal not found',
        message: 'Journal entry not found'
      });
    }

    // Check if user can access this journal
    if (!user.canAccess(journal.userId._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this journal entry'
      });
    }

    res.json({
      success: true,
      journal: {
        id: journal._id,
        title: journal.title,
        body: journal.body,
        moodId: journal.moodId,
        visibility: journal.visibility,
        sentiment: journal.sentiment,
        wordCount: journal.wordCount,
        readingTime: journal.readingTime,
        flagged: journal.flagged.isFlagged,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt
      }
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({
      error: 'Failed to get journal',
      message: 'Unable to retrieve journal entry'
    });
  }
});

/**
 * PUT /api/journals/:id
 * Update journal entry
 */
router.put('/:id', firebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = updateJournalSchema.validate(req.body);
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

    const journal = await Journal.findById(id);
    
    if (!journal) {
      return res.status(404).json({
        error: 'Journal not found',
        message: 'Journal entry not found'
      });
    }

    // Check if user can update this journal
    if (!user.canAccess(journal.userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update this journal entry'
      });
    }

    // Update journal
    Object.assign(journal, value);
    await journal.save();

    res.json({
      success: true,
      journal: {
        id: journal._id,
        title: journal.title,
        body: journal.body,
        moodId: journal.moodId,
        visibility: journal.visibility,
        sentiment: journal.sentiment,
        wordCount: journal.wordCount,
        readingTime: journal.readingTime,
        flagged: journal.flagged.isFlagged,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt
      }
    });
  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({
      error: 'Failed to update journal',
      message: 'Unable to update journal entry'
    });
  }
});

/**
 * DELETE /api/journals/:id
 * Delete journal entry
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

    const journal = await Journal.findById(id);
    
    if (!journal) {
      return res.status(404).json({
        error: 'Journal not found',
        message: 'Journal entry not found'
      });
    }

    // Check if user can delete this journal
    if (!user.canAccess(journal.userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this journal entry'
      });
    }

    await Journal.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({
      error: 'Failed to delete journal',
      message: 'Unable to delete journal entry'
    });
  }
});

/**
 * GET /api/journals/stats
 * Get journal statistics for user
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

    // Get user's journal statistics
    const stats = await Journal.getUserStats(user._id, parseInt(days));
    const sentimentTrends = await Journal.getSentimentTrends(user._id, parseInt(days));

    res.json({
      success: true,
      stats: {
        ...stats,
        days: parseInt(days)
      },
      sentimentTrends
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      error: 'Failed to get journal statistics',
      message: 'Unable to retrieve journal statistics'
    });
  }
});

module.exports = router;



