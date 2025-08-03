const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    db = client.db('expenses-tracker');

    console.log('✅ MongoDB connected successfully');

    // Create indexes for better performance
    await createIndexes();

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });

    // Expenses collection indexes
    await db.collection('expenses').createIndex({ userId: 1 });
    await db.collection('expenses').createIndex({ date: -1 });
    await db.collection('expenses').createIndex({ category: 1 });
    await db.collection('expenses').createIndex({ userId: 1, date: -1 });
    await db.collection('expenses').createIndex({ userId: 1, category: 1 });

    // Shared expenses collection indexes
    await db.collection('sharedExpenses').createIndex({ createdBy: 1 });
    await db.collection('sharedExpenses').createIndex({ 'participants.userId': 1 });
    await db.collection('sharedExpenses').createIndex({ status: 1 });

    // Categories collection indexes
    await db.collection('categories').createIndex({ userId: 1 });
    await db.collection('categories').createIndex({ isDefault: 1 });

    // Payment methods collection indexes
    await db.collection('paymentMethods').createIndex({ userId: 1 });
    await db.collection('paymentMethods').createIndex({ isDefault: 1 });

    // Groups collection indexes
    await db.collection('groups').createIndex({ 'members.userId': 1 });
    await db.collection('groups').createIndex({ createdBy: 1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

module.exports = { connectDB, getDB }; 