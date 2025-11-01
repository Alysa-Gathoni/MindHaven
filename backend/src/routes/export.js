const express = require('express');
const Joi = require('joi');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const User = require('../models/User');
const Mood = require('../models/Mood');
const Journal = require('../models/Journal');
const { Parser } = require('json2csv');

const router = express.Router();

/**
 * POST /api/export/data
 * Export user's data (GDPR compliance)
 */
router.post('/data', firebaseAuth, async (req, res) => {
  try {
    const { format = 'json' } = req.body;
    
    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Format must be json or csv'
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

    // Get all user data
    const moods = await Mood.find({ userId: user._id }).sort({ date: -1 });
    const journals = await Journal.find({ userId: user._id }).sort({ createdAt: -1 });

    // Prepare export data
    const exportData = {
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen
      },
      moods: moods.map(mood => ({
        id: mood._id,
        score: mood.score,
        emoji: mood.emoji,
        tags: mood.tags,
        note: mood.note,
        date: mood.date,
        createdAt: mood.createdAt
      })),
      journals: journals.map(journal => ({
        id: journal._id,
        title: journal.title,
        body: journal.body,
        visibility: journal.visibility,
        sentiment: journal.sentiment,
        wordCount: journal.wordCount,
        readingTime: journal.readingTime,
        flagged: journal.flagged.isFlagged,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt
      })),
      exportInfo: {
        exportedAt: new Date().toISOString(),
        totalMoods: moods.length,
        totalJournals: journals.length,
        format: format
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mindhaven-export-${user._id}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = {
        user: [exportData.user],
        moods: exportData.moods,
        journals: exportData.journals.map(journal => ({
          ...journal,
          body: journal.body.substring(0, 1000) // Truncate long entries for CSV
        }))
      };

      // Create CSV files for each data type
      const userCsv = new Parser({ fields: Object.keys(csvData.user[0]) }).parse(csvData.user);
      const moodsCsv = new Parser({ fields: Object.keys(csvData.moods[0]) }).parse(csvData.moods);
      const journalsCsv = new Parser({ fields: Object.keys(csvData.journals[0]) }).parse(csvData.journals);

      const combinedCsv = `# User Data\n${userCsv}\n\n# Moods Data\n${moodsCsv}\n\n# Journals Data\n${journalsCsv}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="mindhaven-export-${user._id}.csv"`);
      res.send(combinedCsv);
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      error: 'Failed to export data',
      message: 'Unable to export user data'
    });
  }
});

/**
 * DELETE /api/export/delete-account
 * Delete user account and all data (GDPR compliance)
 */
router.delete('/delete-account', firebaseAuth, async (req, res) => {
  try {
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Please confirm account deletion by providing confirmation: "DELETE_MY_ACCOUNT"'
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

    // Delete all user data
    await Promise.all([
      Mood.deleteMany({ userId: user._id }),
      Journal.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({
      success: true,
      message: 'Account and all data deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: 'Unable to delete account and data'
    });
  }
});

/**
 * GET /api/export/status
 * Get export status and history
 */
router.get('/status', firebaseAuth, async (req, res) => {
  try {
    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Get data counts
    const moodCount = await Mood.countDocuments({ userId: user._id });
    const journalCount = await Journal.countDocuments({ userId: user._id });
    const flaggedCount = await Journal.countDocuments({ 
      userId: user._id, 
      'flagged.isFlagged': true 
    });

    res.json({
      success: true,
      status: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt
        },
        dataCounts: {
          moods: moodCount,
          journals: journalCount,
          flagged: flaggedCount
        },
        lastExport: null, // TODO: Implement export history tracking
        canExport: true
      }
    });
  } catch (error) {
    console.error('Get export status error:', error);
    res.status(500).json({
      error: 'Failed to get export status',
      message: 'Unable to retrieve export status'
    });
  }
});

module.exports = router;



