const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, categorySchemas } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('categories')
      .find({ userId: req.user._id.toString() })
      .sort({ name: 1 })
      .toArray();

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create category
router.post('/', validate(categorySchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const categoryData = {
      ...req.body,
      userId: req.user._id.toString(),
      createdAt: new Date()
    };

    const result = await db.collection('categories').insertOne(categoryData);
    const newCategory = await db.collection('categories').findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: newCategory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update category
router.put('/:id', validate(categorySchemas.create), async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const category = await db.collection('categories').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );

    const updatedCategory = await db.collection('categories').findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const category = await db.collection('categories').findOne({
      _id: new ObjectId(id),
      userId: req.user._id.toString()
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await db.collection('categories').deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 