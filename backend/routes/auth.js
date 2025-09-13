const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, preferences = {} } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      preferences: {
        dietType: preferences.dietType || 'Veg',
        servingSize: preferences.servingSize || 2,
        allergies: preferences.allergies || [],
        cuisinePreferences: preferences.cuisinePreferences || []
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log registration activity
    user.logActivity('register', { 
      registrationMethod: 'email',
      preferences: user.preferences 
    });
    await user.save();

    // Return success response (exclude password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error during registration' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last login and log activity
    user.lastLogin = new Date();
    user.logActivity('login', { 
      loginMethod: 'email',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await user.save();

    // Return success response (exclude password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error during login' 
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('favoriteRecipes', 'name category prepTime cookTime ratings')
      .populate('savedMealPlans', 'name weekStartDate status');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, preferences, profile, settings } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    if (name) user.name = name.trim();
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    // Log activity
    user.logActivity('profile_update', { 
      updatedFields: Object.keys(req.body) 
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }

    res.status(500).json({ 
      message: 'Error updating profile' 
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    user.logActivity('password_change');
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      message: 'Error changing password' 
    });
  }
});

// Get user activity log
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sort activities by timestamp (newest first) and paginate
    const activities = user.activityLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit);

    res.status(200).json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalItems: user.activityLog.length,
        totalPages: Math.ceil(user.activityLog.length / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching user activity' 
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      totalPurchases: user.totalPurchases,
      totalSpent: user.totalSpent,
      favoriteCategories: user.getFavoriteCategories(),
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      lastLogin: user.lastLogin,
      activityCount: user.activityLog.length,
      preferences: user.preferences
    };

    res.status(200).json({ stats });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching user statistics' 
    });
  }
});

// Refresh token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      message: 'Error refreshing token' 
    });
  }
});

// Logout (optional - mainly for logging)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.logActivity('logout');
      await user.save();
    }

    res.status(200).json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Error during logout' 
    });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'Password is required to delete account' 
      });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Password is incorrect' 
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.logActivity('account_deletion');
    await user.save();

    res.status(200).json({
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting account' 
    });
  }
});

// Middleware export for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router;