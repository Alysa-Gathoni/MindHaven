const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and attaches user info to request
 */
const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split('Bearer ')[1] 
      : null;

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Authorization header with Bearer token required'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user information to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      firebase: decodedToken
    };

    next();
  } catch (error) {
    console.error('Firebase auth error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please sign in again'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Please sign in again'
      });
    }

    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Admin role middleware - must be used after firebaseAuth
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role in database
    const User = require('../models/User');
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'This action requires administrator privileges'
      });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    console.error('Admin check error:', error.message);
    return res.status(500).json({ 
      error: 'Authorization check failed',
      message: 'Unable to verify admin privileges'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split('Bearer ')[1] 
      : null;

    if (!token) {
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      firebase: decodedToken
    };

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    next();
  }
};

module.exports = {
  firebaseAuth,
  requireAdmin,
  optionalAuth
};


