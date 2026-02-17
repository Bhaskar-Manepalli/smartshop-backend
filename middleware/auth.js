const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  console.log('\n🔐 AUTH MIDDLEWARE CALLED');
  console.log('Headers:', req.headers.authorization);
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      console.log('🔐 Token received:', token.substring(0, 20) + '...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded, userId:', decoded.userId);

      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        console.log('❌ User not found');
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ User authenticated:', req.user.email);
      next();
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, token failed' 
      });
    }
  } else {
    console.log('❌ No token found');
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }
};

// Check if user is admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Check if user is seller
exports.seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as seller' });
  }
};
