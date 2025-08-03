const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, sharedExpenseSchemas } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// Get all shared expenses
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.query;

    const filter = {
      $or: [
        { createdBy: req.user._id.toString() },
        { 'participants.userId': req.user._id.toString() }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const sharedExpenses = await db.collection('sharedExpenses')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: { sharedExpenses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create shared expense
router.post('/', validate(sharedExpenseSchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const sharedExpenseData = {
      ...req.body,
      createdBy: req.user._id.toString(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('sharedExpenses').insertOne(sharedExpenseData);
    const newSharedExpense = await db.collection('sharedExpenses').findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Shared expense created successfully',
      data: { sharedExpense: newSharedExpense }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update shared expense status
router.put('/:id/status', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { status } = req.body;

    const sharedExpense = await db.collection('sharedExpenses').findOne({
      _id: new ObjectId(id),
      $or: [
        { createdBy: req.user._id.toString() },
        { 'participants.userId': req.user._id.toString() }
      ]
    });

    if (!sharedExpense) {
      return res.status(404).json({
        success: false,
        message: 'Shared expense not found'
      });
    }

    await db.collection('sharedExpenses').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'Shared expense status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark participant as paid
router.put('/:id/participants/:participantId/pay', async (req, res) => {
  try {
    const db = getDB();
    const { id, participantId } = req.params;

    const sharedExpense = await db.collection('sharedExpenses').findOne({
      _id: new ObjectId(id),
      'participants.userId': participantId
    });

    if (!sharedExpense) {
      return res.status(404).json({
        success: false,
        message: 'Shared expense or participant not found'
      });
    }

    await db.collection('sharedExpenses').updateOne(
      {
        _id: new ObjectId(id),
        'participants.userId': participantId
      },
      {
        $set: {
          'participants.$.status': 'paid',
          'participants.$.paidAt': new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Payment marked as completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get settlements
router.get('/settlements', async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.query;

    const filter = {
      $or: [
        { fromUserId: req.user._id.toString() },
        { toUserId: req.user._id.toString() }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const settlements = await db.collection('settlements')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: { settlements }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create settlement
router.post('/settlements', async (req, res) => {
  try {
    const db = getDB();
    const { fromUserId, toUserId, amount, sharedExpenseId, notes } = req.body;

    const settlementData = {
      fromUserId,
      toUserId,
      amount: parseFloat(amount),
      sharedExpenseId,
      status: 'pending',
      notes,
      createdAt: new Date()
    };

    const result = await db.collection('settlements').insertOne(settlementData);
    const newSettlement = await db.collection('settlements').findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Settlement created successfully',
      data: { settlement: newSettlement }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 