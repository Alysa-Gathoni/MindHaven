const express = require('express');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify Firebase token and return user profile
 */
router.post('/verify', firebaseAuth, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    
    // Find or create user in database
    const user = await User.findOrCreateFromFirebase({
      uid,
      email,
      name
    });
    
    res.json({
      success: true,
      user: user.profile
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Unable to verify user'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', firebaseAuth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    res.json({
      success: true,
      user: user.profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Unable to retrieve user profile'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh user session and update last seen
 */
router.post('/refresh', firebaseAuth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    // Update last seen
    await user.updateLastSeen();
    
    res.json({
      success: true,
      user: user.profile
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh session',
      message: 'Unable to refresh user session'
    });
  }
});

module.exports = router;
