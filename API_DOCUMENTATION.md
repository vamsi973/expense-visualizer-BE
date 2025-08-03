# Expense Tracker API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe",
  "currency": "USD",
  "timezone": "UTC",
  "language": "en",
  "theme": "light"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "user@example.com",
      "displayName": "John Doe",
      "currency": "USD",
      "timezone": "UTC",
      "language": "en",
      "theme": "light",
      "notifications": {
        "billReminders": true,
        "budgetAlerts": true,
        "sharedExpenses": true,
        "systemNotifications": true,
        "reminderTime": "09:00",
        "frequency": "daily"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "user@example.com",
      "displayName": "John Doe",
      "currency": "USD",
      "timezone": "UTC",
      "language": "en",
      "theme": "light"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Expenses

#### Get All Expenses
```http
GET /expenses?startDate=2024-01-01&endDate=2024-12-31&categories=food,transport&minAmount=10&maxAmount=100&page=1&limit=20
Authorization: Bearer <token>
```

#### Create Expense
```http
POST /expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 25.50,
  "category": "Food & Dining",
  "description": "Lunch at restaurant",
  "date": "2024-01-15T12:00:00.000Z",
  "tags": ["lunch", "restaurant"],
  "paymentMethod": "Credit Card",
  "isRecurring": false,
  "isShared": false,
  "currency": "USD",
  "vendor": "Restaurant Name",
  "notes": "Business lunch"
}
```

#### Update Expense
```http
PUT /expenses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 30.00,
  "description": "Updated description"
}
```

#### Delete Expense
```http
DELETE /expenses/:id
Authorization: Bearer <token>
```

#### Get Expenses by Month
```http
GET /expenses/month/2024/1
Authorization: Bearer <token>
```

#### Get Expense Statistics
```http
GET /expenses/stats/summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### Categories

#### Get All Categories
```http
GET /categories
Authorization: Bearer <token>
```

#### Create Category
```http
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Entertainment",
  "icon": "game-controller",
  "color": "#FF6B6B",
  "budget": 200,
  "isDefault": false
}
```

### Payment Methods

#### Get All Payment Methods
```http
GET /payment-methods
Authorization: Bearer <token>
```

#### Create Payment Method
```http
POST /payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Chase Credit Card",
  "type": "card",
  "icon": "card",
  "isDefault": true
}
```

### Shared Expenses

#### Get All Shared Expenses
```http
GET /shared-expenses?status=pending
Authorization: Bearer <token>
```

#### Create Shared Expense
```http
POST /shared-expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "expenseId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "participants": [
    {
      "userId": "60f7b3b3b3b3b3b3b3b3b3b4",
      "displayName": "Jane Doe",
      "email": "jane@example.com",
      "amount": 25.00,
      "percentage": 50
    }
  ],
  "totalAmount": 50.00,
  "splitType": "equal",
  "dueDate": "2024-01-20T00:00:00.000Z",
  "notes": "Split dinner bill"
}
```

#### Update Shared Expense Status
```http
PUT /shared-expenses/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "settled"
}
```

### File Uploads

#### Upload Receipt Image
```http
POST /uploads/receipt
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: [file]
```

#### Upload Profile Picture
```http
POST /uploads/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: [file]
```

### Users

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "John Smith",
  "currency": "EUR",
  "timezone": "Europe/London",
  "theme": "dark"
}
```

#### Update User Preferences
```http
PUT /users/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "defaultCurrency": "EUR",
  "defaultCategories": ["Food", "Transport", "Shopping"],
  "autoCategorization": true,
  "locationTracking": false,
  "dataSync": true
}
```

#### Update Notification Settings
```http
PUT /users/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "billReminders": true,
  "budgetAlerts": true,
  "sharedExpenses": false,
  "systemNotifications": true,
  "reminderTime": "18:00",
  "frequency": "daily"
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

## Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Filtering
- `startDate`: Start date for date range filtering
- `endDate`: End date for date range filtering
- `categories`: Comma-separated list of categories
- `minAmount`: Minimum amount filter
- `maxAmount`: Maximum amount filter
- `tags`: Comma-separated list of tags
- `paymentMethods`: Comma-separated list of payment methods
- `isShared`: Boolean filter for shared expenses
- `isRecurring`: Boolean filter for recurring expenses
- `status`: Status filter for shared expenses

## File Upload Limits

- **Maximum file size**: 5MB
- **Allowed formats**: JPEG, JPG, PNG, WebP
- **Image processing**: Automatic resizing and WebP conversion
- **Receipt images**: Resized to max 800x800px
- **Profile pictures**: Resized to 200x200px with cover fit

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information included in response headers 