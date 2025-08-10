const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, budgetSchemas } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all budgets for a user
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const budgets = await db.collection('budgets')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Populate categories
    const populatedBudgets = await Promise.all(budgets.map(async (budget) => {
      if (budget.categories && budget.categories.length > 0) {
        const categories = await db.collection('categories')
          .find({ id: { $in: budget.categories.map(id => id) } })
          .toArray();
        return { ...budget, categories };
      }
      return budget;
    }));

    res.json({
      success: true,
      message: 'Budgets retrieved successfully',
      data: { budgets: populatedBudgets }
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets',
      error: error.message
    });
  }
});

// Get a specific budget
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const budget = await db.collection('budgets').findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user._id.toString()
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Populate categories
    if (budget.categories && budget.categories.length > 0) {
      const categories = await db.collection('categories')
        .find({ _id: { $in: budget.categories.map(id => new ObjectId(id)) } })
        .toArray();
      budget.categories = categories;
    }

    res.json({
      success: true,
      message: 'Budget retrieved successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget',
      error: error.message
    });
  }
});

// Create a new budget
router.post('/', validate(budgetSchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const budgetData = {
      ...req.body,
      userId: req.user._id.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('budgets').insertOne(budgetData);
    const budget = await db.collection('budgets').findOne({ _id: result.insertedId });

    // Populate categories
    if (budget.categories && budget.categories.length > 0) {
      // console.log(budget.categories.map(cat => new ObjectId(cat.categoryId)));
      const categories = await db.collection('categories')
        .find({ id: { $in: budget.categories.map(cat => cat.categoryId) } })
        .toArray();
      budget.categories = categories;
    }

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating budget',
      error: error.message
    });
  }
});

// Update a budget
router.put('/:id', validate(budgetSchemas.update), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('budgets').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.user._id.toString() },
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const budget = result.value;

    // Populate categories
    if (budget.categories && budget.categories.length > 0) {
      const categories = await db.collection('categories')
        .find({ _id: { $in: budget.categories.map(id => new ObjectId(id)) } })
        .toArray();
      budget.categories = categories;
    }

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating budget',
      error: error.message
    });
  }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    console.log("payloea", {_id: new ObjectId(req.params.id),})
    const result = await db.collection('budgets').findOneAndDelete({
      _id: new ObjectId(req.params.id),
      // userId: req.user._id.toString()
    });

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting budget',
      error: error.message
    });
  }
});

// Get budget progress
router.get('/:id/progress', async (req, res) => {
  try {
    const db = getDB();
    const budget = await db.collection('budgets').findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user._id.toString()
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Calculate budget period
    const startDate = new Date(budget.startDate);
    let endDate;

    if (budget.endDate) {
      endDate = new Date(budget.endDate);
    } else {
      endDate = new Date(startDate);
      switch (budget.period) {
        case 'daily':
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
    }

    // Get expenses for this budget period and categories
    const expenses = await db.collection('expenses').find({
      userId: req.user._id.toString(),
      date: { $gte: startDate, $lte: endDate },
      category: { $in: budget.categories }
    }).toArray();

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingAmount = budget.amount - totalSpent;
    const percentageUsed = (totalSpent / budget.amount) * 100;

    const progress = {
      budgetId: budget._id,
      budgetName: budget.name,
      totalBudget: budget.amount,
      totalSpent,
      remainingAmount,
      percentageUsed,
      isOverBudget: totalSpent > budget.amount,
      startDate,
      endDate,
      period: budget.period,
      expenses: expenses.length,
      dailyAverage: expenses.length > 0 ? totalSpent / expenses.length : 0
    };

    res.json({
      success: true,
      message: 'Budget progress retrieved successfully',
      data: { progress }
    });
  } catch (error) {
    console.error('Error fetching budget progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget progress',
      error: error.message
    });
  }
});

// Get budget alerts
router.get('/:id/alerts', async (req, res) => {
  try {
    const db = getDB();
    const budget = await db.collection('budgets').findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user._id.toString()
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Get budget progress
    const startDate = new Date(budget.startDate);
    let endDate;

    if (budget.endDate) {
      endDate = new Date(budget.endDate);
    } else {
      endDate = new Date(startDate);
      switch (budget.period) {
        case 'daily':
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
    }

    const expenses = await db.collection('expenses').find({
      userId: req.user._id.toString(),
      date: { $gte: startDate, $lte: endDate },
      category: { $in: budget.categories }
    }).toArray();

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentageUsed = (totalSpent / budget.amount) * 100;

    const alerts = [];

    // Check if budget threshold is exceeded
    if (percentageUsed >= budget.notifications.alertThreshold) {
      alerts.push({
        id: `alert_${budget._id}_threshold`,
        budgetId: budget._id,
        type: percentageUsed >= 100 ? 'over-budget' : 'near-limit',
        title: percentageUsed >= 100 ? 'Budget Exceeded' : 'Budget Alert',
        message: percentageUsed >= 100
          ? `You have exceeded your ${budget.name} budget by ${(percentageUsed - 100).toFixed(1)}%`
          : `You have used ${percentageUsed.toFixed(1)}% of your ${budget.name} budget`,
        severity: percentageUsed >= 100 ? 'high' : 'medium',
        createdAt: new Date(),
        isRead: false
      });
    }

    res.json({
      success: true,
      message: 'Budget alerts retrieved successfully',
      data: { alerts }
    });
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget alerts',
      error: error.message
    });
  }
});

module.exports = router;
