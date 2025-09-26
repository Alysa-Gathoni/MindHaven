const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // Privacy settings
  dataRetention: {
    type: Number,
    default: 365 // days
  },
  allowAnalytics: {
    type: Boolean,
    default: true
  },
  // Emergency contact info (optional)
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
    role: this.role,
    createdAt: this.createdAt,
    lastSeen: this.lastSeen
  };
});

// Method to update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Method to check if user can access resource
userSchema.methods.canAccess = function(resourceUserId) {
  return this._id.toString() === resourceUserId.toString() || this.role === 'admin';
};

// Static method to find or create user from Firebase token
userSchema.statics.findOrCreateFromFirebase = async function(firebaseUser) {
  let user = await this.findOne({ firebaseUid: firebaseUser.uid });
  
  if (!user) {
    user = new this({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.name || firebaseUser.email.split('@')[0]
    });
    await user.save();
  } else {
    // Update last seen and any changed info
    user.lastSeen = new Date();
    if (firebaseUser.email && user.email !== firebaseUser.email) {
      user.email = firebaseUser.email;
    }
    if (firebaseUser.name && user.displayName !== firebaseUser.name) {
      user.displayName = firebaseUser.name;
    }
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
