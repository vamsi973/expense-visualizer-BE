const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// Update user profile
router.put('/profile', validate(userSchemas.updateProfile), async (req, res) => {
  try {
    const db = getDB();
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateData }
    );

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user preferences
router.put('/preferences', validate(userSchemas.updatePreferences), async (req, res) => {
  try {
    const db = getDB();
    const updateData = {
      'preferences': req.body,
      updatedAt: new Date()
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update notification settings
router.put('/notifications', validate(userSchemas.updateNotifications), async (req, res) => {
  try {
    const db = getDB();
    const updateData = {
      'notifications': {
        ...req.body,
        updatedAt: new Date()
      },
      updatedAt: new Date()
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateData }
    );

    // Get updated user to return current notification settings
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
    const notifications = updatedUser.notifications || {};

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: notifications
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get notification settings
router.get('/notifications', async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
    
    const notifications = user.notifications || {
      billReminders: true,
      budgetAlerts: true,
      sharedExpenses: true,
      systemNotifications: true,
      reminderTime: '09:00',
      frequency: 'daily'
    };

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete account
router.post('/delete-account', async (req, res) => {
  try {
    const db = getDB();
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Get user with password to verify
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete user's expenses
    await db.collection('expenses').deleteMany({ userId: req.user._id });
    
    // Delete user's budgets
    await db.collection('budgets').deleteMany({ userId: req.user._id });
    
    // Delete user's categories
    await db.collection('categories').deleteMany({ userId: req.user._id });
    
    // Delete user's payment methods
    await db.collection('payment-methods').deleteMany({ userId: req.user._id });
    
    // Finally, delete the user
    await db.collection('users').deleteOne({ _id: new ObjectId(req.user._id) });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 