const express = require('express');
const Joi = require('joi');
const { firebaseAuth, requireAdmin } = require('../middleware/firebaseAuth');
const User = require('../models/User');

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
  role: Joi.string().valid('user', 'admin').optional(),
  disabled: Joi.boolean().optional(),
  displayName: Joi.string().max(100).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    relationship: Joi.string().max(50).optional()
  }).optional()
});

const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  role: Joi.string().valid('user', 'admin').optional()
});

/**
 * GET /api/users/:id
 * Get user by ID (admin or owner)
 */
router.get('/:id', firebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user from database
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Current user profile not found'
      });
    }

    // Get target user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check if current user can access this user's data
    if (!currentUser.canAccess(user._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this user'
      });
    }

    res.json({
      success: true,
      user: user.profile
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Unable to retrieve user information'
    });
  }
});

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', firebaseAuth, requireAdmin, async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = getUsersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // Build query
    const query = {};
    
    if (value.search) {
      query.$or = [
        { displayName: { $regex: value.search, $options: 'i' } },
        { email: { $regex: value.search, $options: 'i' } }
      ];
    }
    
    if (value.role) {
      query.role = value.role;
    }

    // Calculate pagination
    const skip = (value.page - 1) * value.limit;

    // Get users with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(value.limit)
      .skip(skip)
      .select('-firebaseUid'); // Exclude sensitive data

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users: users.map(user => user.profile),
      pagination: {
        total,
        page: value.page,
        limit: value.limit,
        pages: Math.ceil(total / value.limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'Unable to retrieve users'
    });
  }
});

/**
 * PATCH /api/users/:id
 * Update user (admin only)
 */
router.patch('/:id', firebaseAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // Get user to update
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Update user
    Object.assign(user, value);
    await user.save();

    res.json({
      success: true,
      user: user.profile
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'Unable to update user information'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', firebaseAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    // Prevent admin from deleting themselves
    if (currentUser._id.toString() === id) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // Get user to delete
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Delete user and all associated data
    await User.findByIdAndDelete(id);
    
    // TODO: Delete associated moods and journals
    // This would require additional cleanup logic

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Unable to delete user'
    });
  }
});

/**
 * GET /api/users/me
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
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch('/me', firebaseAuth, async (req, res) => {
  try {
    // Validate request body (limited fields for self-update)
    const updateSchema = Joi.object({
      displayName: Joi.string().max(100).optional(),
      emergencyContact: Joi.object({
        name: Joi.string().max(100).optional(),
        phone: Joi.string().max(20).optional(),
        relationship: Joi.string().max(50).optional()
      }).optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Update user
    Object.assign(user, value);
    await user.save();

    res.json({
      success: true,
      user: user.profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Unable to update user profile'
    });
  }
});

module.exports = router;



