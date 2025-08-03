const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, paymentMethodSchemas } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// Get all payment methods
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const paymentMethods = await db.collection('paymentMethods')
      .find({ userId: req.user._id.toString() })
      .sort({ name: 1 })
      .toArray();

    res.json({
      success: true,
      data: { paymentMethods }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create payment method
router.post('/', validate(paymentMethodSchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const paymentMethodData = {
      ...req.body,
      userId: req.user._id.toString(),
      createdAt: new Date()
    };

    const result = await db.collection('paymentMethods').insertOne(paymentMethodData);
    const newPaymentMethod = await db.collection('paymentMethods').findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: { paymentMethod: newPaymentMethod }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update payment method
router.put('/:id', validate(paymentMethodSchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const paymentMethod = await db.collection('paymentMethods').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    await db.collection('paymentMethods').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );

    const updatedPaymentMethod = await db.collection('paymentMethods').findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: { paymentMethod: updatedPaymentMethod }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete payment method
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const paymentMethod = await db.collection('paymentMethods').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    await db.collection('paymentMethods').deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 