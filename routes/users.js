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
      'notifications': req.body,
      updatedAt: new Date()
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 