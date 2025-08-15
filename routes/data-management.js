const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create backup
router.post('/backup', async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user._id;

    // Get user data
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's expenses
    const expenses = await db.collection('expenses').find({ userId: userId.toString() }).toArray();
    
    // Get user's budgets
    const budgets = await db.collection('budgets').find({ userId: userId.toString() }).toArray();
    
    // Get user's categories
    const categories = await db.collection('categories').find({ userId: userId.toString() }).toArray();
    
    // Get user's payment methods
    const paymentMethods = await db.collection('payment-methods').find({ userId: userId.toString() }).toArray();

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      user: {
        ...user,
        password: undefined // Don't include password in backup
      },
      expenses,
      budgets,
      categories,
      paymentMethods,
      metadata: {
        totalExpenses: expenses.length,
        totalBudgets: budgets.length,
        exportDate: new Date().toISOString()
      }
    };

    // Store backup in database
    await db.collection('backups').insertOne({
      userId: userId.toString(),
      backupData,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backupId: backupData.timestamp,
        totalExpenses: backupData.metadata.totalExpenses,
        totalBudgets: backupData.metadata.totalBudgets
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's backups
router.get('/backups', async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user._id;

    const backups = await db.collection('backups')
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const backupList = backups.map(backup => ({
      id: backup._id,
      timestamp: backup.backupData.timestamp,
      totalExpenses: backup.backupData.metadata.totalExpenses,
      totalBudgets: backup.backupData.metadata.totalBudgets,
      createdAt: backup.createdAt
    }));

    res.json({
      success: true,
      data: backupList
    });
  } catch (error) {
    console.error('Error getting backups:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Restore from backup
router.post('/restore/:backupId', async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user._id;
    const backupId = req.params.backupId;

    // Get backup
    const backup = await db.collection('backups').findOne({
      _id: new ObjectId(backupId),
      userId: userId.toString()
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    const backupData = backup.backupData;

    // Clear existing data
    await db.collection('expenses').deleteMany({ userId: userId.toString() });
    await db.collection('budgets').deleteMany({ userId: userId.toString() });
    await db.collection('categories').deleteMany({ userId: userId.toString() });
    await db.collection('payment-methods').deleteMany({ userId: userId.toString() });

    // Restore data
    if (backupData.expenses && backupData.expenses.length > 0) {
      const expensesToInsert = backupData.expenses.map(expense => ({
        ...expense,
        userId: userId.toString(),
        _id: new ObjectId()
      }));
      await db.collection('expenses').insertMany(expensesToInsert);
    }

    if (backupData.budgets && backupData.budgets.length > 0) {
      const budgetsToInsert = backupData.budgets.map(budget => ({
        ...budget,
        userId: userId.toString(),
        _id: new ObjectId()
      }));
      await db.collection('budgets').insertMany(budgetsToInsert);
    }

    if (backupData.categories && backupData.categories.length > 0) {
      const categoriesToInsert = backupData.categories.map(category => ({
        ...category,
        userId: userId.toString(),
        _id: new ObjectId()
      }));
      await db.collection('categories').insertMany(categoriesToInsert);
    }

    if (backupData.paymentMethods && backupData.paymentMethods.length > 0) {
      const paymentMethodsToInsert = backupData.paymentMethods.map(paymentMethod => ({
        ...paymentMethod,
        userId: userId.toString(),
        _id: new ObjectId()
      }));
      await db.collection('payment-methods').insertMany(paymentMethodsToInsert);
    }

    res.json({
      success: true,
      message: 'Data restored successfully',
      data: {
        totalExpenses: backupData.metadata.totalExpenses,
        totalBudgets: backupData.metadata.totalBudgets
      }
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete backup
router.delete('/backup/:backupId', async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user._id;
    const backupId = req.params.backupId;

    const result = await db.collection('backups').deleteOne({
      _id: new ObjectId(backupId),
      userId: userId.toString()
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
