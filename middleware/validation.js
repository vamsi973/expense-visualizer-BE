const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.log(error,89);
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};

// Validation schemas
const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    displayName: Joi.string().min(2).max(50).required(),
    currency: Joi.string().default('USD'),
    timezone: Joi.string().default('UTC'),
    language: Joi.string().default('en'),
    theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
    notifications: Joi.object().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const expenseSchemas = {
  create: Joi.object({
    id: Joi.string().optional(),
    amount: Joi.number().positive().optional(),
    category: Joi.string().optional(),
    description: Joi.string().allow(null,'').optional(),
    date: Joi.date().default(Date.now),
    tags: Joi.array().items(Joi.string()).optional(),
    paymentMethod: Joi.string().optional(),
    isRecurring: Joi.boolean().default(false),
    recurringType: Joi.string().valid('weekly', 'monthly', 'yearly').optional(),
    reminderDate: Joi.date().valid(null,"").optional(),  // Optional field, if provided, must be a valid date
    isShared: Joi.boolean().default(false),
    sharedWith: Joi.array().items(Joi.string()).optional(),
    splitAmount: Joi.number().positive().optional(),
    currency: Joi.string().default('INR'),
    vendor: Joi.string().allow(null, '').optional(),
    notes: Joi.string().allow(null, '').optional(),
    location: Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      address: Joi.string().optional()
    }).optional().allow(null,""),
    receiptImage: Joi.string().allow(null, '').optional(),
  }).unknown(true),

  update: Joi.object({
    amount: Joi.number().positive(),
    category: Joi.string(),
    description: Joi.string(),
    date: Joi.date(),
    tags: Joi.array().items(Joi.string()),
    paymentMethod: Joi.string(),
    isRecurring: Joi.boolean(),
    recurringType: Joi.string().valid('weekly', 'monthly', 'yearly'),
    reminderDate: Joi.date(),
    isShared: Joi.boolean(),
    sharedWith: Joi.array().items(Joi.string()),
    splitAmount: Joi.number().positive(),
    currency: Joi.string(),
    vendor: Joi.string(),
    notes: Joi.string(),
    location: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number(),
      address: Joi.string()
    })
  })
};

const userSchemas = {
  updateProfile: Joi.object({
    displayName: Joi.string().min(2).max(50),
    photoURL: Joi.string().uri(),
    currency: Joi.string(),
    timezone: Joi.string(),
    language: Joi.string(),
    theme: Joi.string().valid('light', 'dark', 'auto')
  }),

  updatePreferences: Joi.object({
    defaultCurrency: Joi.string(),
    defaultPaymentMethod: Joi.string(),
    defaultCategories: Joi.array().items(Joi.string()),
    autoCategorization: Joi.boolean(),
    locationTracking: Joi.boolean(),
    biometricAuth: Joi.boolean(),
    dataSync: Joi.boolean(),
    backupFrequency: Joi.string().valid('daily', 'weekly', 'monthly')
  }),

  updateNotifications: Joi.object({
    billReminders: Joi.boolean(),
    budgetAlerts: Joi.boolean(),
    sharedExpenses: Joi.boolean(),
    systemNotifications: Joi.boolean(),
    reminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    frequency: Joi.string().valid('immediate', 'daily', 'weekly')
  })
};

const sharedExpenseSchemas = {
  create: Joi.object({
    expenseId: Joi.string().required(),
    participants: Joi.array().items(Joi.object({
      userId: Joi.string().required(),
      displayName: Joi.string().required(),
      email: Joi.string().email().required(),
      amount: Joi.number().positive().required(),
      percentage: Joi.number().min(0).max(100)
    })).min(1).required(),
    totalAmount: Joi.number().positive().required(),
    splitType: Joi.string().valid('equal', 'percentage', 'custom').required(),
    dueDate: Joi.date(),
    notes: Joi.string()
  })
};

const categorySchemas = {
  create: Joi.object({
    name: Joi.string().required(),
    icon: Joi.string().required(),
    color: Joi.string().required(),
    budget: Joi.number().positive(),
    isDefault: Joi.boolean().default(false)
  })
};

const paymentMethodSchemas = {
  create: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('cash', 'card', 'bank', 'digital').required(),
    icon: Joi.string().required(),
    isDefault: Joi.boolean().default(false)
  })
};

const budgetSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(100),
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('USD'),
    period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').default('monthly'),
    startDate: Joi.date().default(Date.now),
    endDate: Joi.date().allow(null),
    categories: Joi.array().items(
      Joi.object({
        categoryId: Joi.string().required(),
        categoryName: Joi.string().required(),
        allocatedAmount: Joi.number().min(0).required(),
        spentAmount: Joi.number().min(0).required(),
        color: Joi.string().required(),
        icon: Joi.string().required()
      })
    ).min(1).required(),
    isActive: Joi.boolean().default(true),
    notifications: Joi.object({
      alertThreshold: Joi.number().min(0).max(100).default(80),
      alertEnabled: Joi.boolean().default(true),
      dailyUpdates: Joi.boolean().default(false),
      weeklyReports: Joi.boolean().default(true)
    }).default({
      alertThreshold: 80,
      alertEnabled: true,
      dailyUpdates: false,
      weeklyReports: true
    }),
    description: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string())
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    amount: Joi.number().positive(),
    currency: Joi.string(),
    period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
    startDate: Joi.date(),
    endDate: Joi.date().allow(null),
    categories: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
    notifications: Joi.object({
      alertThreshold: Joi.number().min(0).max(100),
      alertEnabled: Joi.boolean(),
      dailyUpdates: Joi.boolean(),
      weeklyReports: Joi.boolean()
    }),
    description: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string())
  })
};

module.exports = {
  validate,
  authSchemas,
  expenseSchemas,
  userSchemas,
  sharedExpenseSchemas,
  categorySchemas,
  paymentMethodSchemas,
  budgetSchemas
}; 