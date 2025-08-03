# Expense Tracker Backend API

A Node.js backend API for the Expense Tracker mobile application built with Express.js and MongoDB.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Expense Management**: CRUD operations for expenses with filtering and analytics
- **Shared Expenses**: Group expense sharing with settlements
- **Categories & Payment Methods**: Customizable categories and payment methods
- **File Uploads**: Receipt image uploads with image processing
- **User Management**: Profile and preferences management
- **Security**: Rate limiting, CORS, helmet security headers
- **Validation**: Request validation using Joi
- **Error Handling**: Comprehensive error handling middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (native driver, no Mongoose)
- **Authentication**: JWT + bcryptjs
- **Validation**: Joi
- **File Upload**: Multer + Sharp
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses (with filtering)
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/month/:year/:month` - Get expenses by month
- `GET /api/expenses/stats/summary` - Get expense statistics

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Payment Methods
- `GET /api/payment-methods` - Get all payment methods
- `POST /api/payment-methods` - Create payment method
- `PUT /api/payment-methods/:id` - Update payment method
- `DELETE /api/payment-methods/:id` - Delete payment method

### Shared Expenses
- `GET /api/shared-expenses` - Get all shared expenses
- `POST /api/shared-expenses` - Create shared expense
- `PUT /api/shared-expenses/:id/status` - Update status
- `PUT /api/shared-expenses/:id/participants/:participantId/pay` - Mark as paid
- `GET /api/shared-expenses/settlements` - Get settlements
- `POST /api/shared-expenses/settlements` - Create settlement

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update preferences
- `PUT /api/users/notifications` - Update notification settings

### File Uploads
- `POST /api/uploads/receipt` - Upload receipt image
- `POST /api/uploads/profile-picture` - Upload profile picture
- `DELETE /api/uploads/:filename` - Delete uploaded file

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Port and other settings

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas

5. **Run the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/expense-tracker
MONGODB_URI_PROD=mongodb://your-production-mongodb-uri

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:8100,capacitor://localhost
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  displayName: String,
  photoURL: String,
  currency: String,
  timezone: String,
  language: String,
  theme: String,
  notifications: {
    billReminders: Boolean,
    budgetAlerts: Boolean,
    sharedExpenses: Boolean,
    systemNotifications: Boolean,
    reminderTime: String,
    frequency: String
  },
  preferences: {
    defaultCurrency: String,
    defaultPaymentMethod: String,
    defaultCategories: Array,
    autoCategorization: Boolean,
    locationTracking: Boolean,
    biometricAuth: Boolean,
    dataSync: Boolean,
    backupFrequency: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Expenses Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  amount: Number,
  category: String,
  description: String,
  date: Date,
  tags: Array,
  paymentMethod: String,
  isRecurring: Boolean,
  recurringType: String,
  reminderDate: Date,
  isShared: Boolean,
  sharedWith: Array,
  splitAmount: Number,
  currency: String,
  vendor: String,
  notes: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  receiptImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Testing

```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Set strong JWT secret
4. Configure proper CORS origins
5. Set up proper logging
6. Use PM2 or similar process manager

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- File upload restrictions
- Error handling without exposing internals

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 