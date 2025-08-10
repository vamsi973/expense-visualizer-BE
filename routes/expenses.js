const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, expenseSchemas } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all expenses with filtering
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const {
      startDate, endDate, categories, minAmount, maxAmount,
      tags, paymentMethods, isShared, isRecurring, page = 1, limit = 20
    } = req.query;

    const filter = { userId: req.user._id.toString() };

    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) {
      filter.date = filter.date || {};
      filter.date.$lte = new Date(endDate);
    }
    if (categories) filter.category = { $in: categories.split(',') };
    if (minAmount) filter.amount = { $gte: parseFloat(minAmount) };
    if (maxAmount) {
      filter.amount = filter.amount || {};
      filter.amount.$lte = parseFloat(maxAmount);
    }
    if (tags) filter.tags = { $in: tags.split(',') };
    if (paymentMethods) filter.paymentMethod = { $in: paymentMethods.split(',') };
    if (isShared !== undefined) filter.isShared = isShared === 'true';
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await db.collection('expenses')
      .find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('expenses').countDocuments(filter);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.log(error, 67);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get expense by ID
// Important: define specific routes BEFORE parameterized ':id' route to avoid shadowing
router.get('/month/:year/:month', async (req, res) => {
  try {
    const db = getDB();
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    console.log("startData",startDate);
    console.log("endDate",endDate);
    const expenses = await db.collection('expenses')
      .find({
        userId: req.user._id.toString(),
        date: { $gte: startDate, $lte: endDate }
      })
      .sort({ date: -1 })
      .toArray();

    res.json({
      success: true,
      data: { expenses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get expense statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDB();
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user._id.toString() };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) {
      filter.date = filter.date || {};
      filter.date.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          averageExpense: { $avg: '$amount' },
          count: { $sum: 1 },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ];

    const stats = await db.collection('expenses').aggregate(pipeline).toArray();

    res.json({
      success: true,
      data: { stats: stats[0] || {} }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const expense = await db.collection('expenses').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new expense
router.post('/', validate(expenseSchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const expenseData = {
      ...req.body,
      userId: req.user._id.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('expenses').insertOne(expenseData);
    const newExpense = await db.collection('expenses').findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense: newExpense }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update expense
router.put('/:id', validate(expenseSchemas.update), async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const expense = await db.collection('expenses').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updatedExpense = await db.collection('expenses').findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense: updatedExpense }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const expense = await db.collection('expenses').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await db.collection('expenses').deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 