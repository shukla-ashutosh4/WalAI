  //  const mongoose = require('mongoose');
  //  const bcrypt = require('bcryptjs');

  //  const userSchema = new mongoose.Schema({
  //    email: {
  //      type: String,
  //      required: true,
  //      unique: true,
  //    },
  //    password: {
  //      type: String,
  //      required: true,
  //    },
  //    name: {
  //      type: String,
  //      required: true,
  //    },
  //  }, { timestamps: true });

  //  userSchema.pre('save', async function(next) {
  //    if (!this.isModified('password')) return next();
  //    this.password = await bcrypt.hash(this.password, 12);
  //    next();
  //  });

  //  userSchema.methods.comparePassword = async function(password) {
  //    return bcrypt.compare(password, this.password);
  //  };

  //  module.exports = mongoose.model('User ', userSchema);
   

  const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  preferences: {
    dietType: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Vegan'],
      default: 'Veg'
    },
    allergies: {
      type: [String],
      default: []
    },
    cuisinePreferences: {
      type: [String],
      default: []
    },
    servingSize: {
      type: Number,
      default: 2,
      min: [1, 'Serving size must be at least 1'],
      max: [20, 'Serving size cannot exceed 20']
    },
    budgetRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 1000
      }
    },
    cookingTime: {
      type: String,
      enum: ['quick', 'medium', 'long', 'any'],
      default: 'any'
    }
  },
  purchaseHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      quantity: Number,
      price: Number,
      category: String,
      dietType: String
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'digital_wallet'],
      default: 'card'
    },
    deliveryType: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'pickup'
    }
  }],
  favoriteRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  savedMealPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan'
  }],
  profile: {
    avatar: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'USA'
      }
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  activityLog: [{
    action: {
      type: String,
      enum: ['login', 'recipe_search', 'cart_add', 'purchase', 'meal_plan_create']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      promotions: {
        type: Boolean,
        default: true
      },
      mealPlanReminders: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      shareData: {
        type: Boolean,
        default: false
      },
      publicProfile: {
        type: Boolean,
        default: false
      }
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'family'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
//userSchema.index({ email: 1 });
userSchema.index({ 'preferences.dietType': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastLogin: -1 });

// Virtual for user's age
userSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  return Math.floor((Date.now() - this.profile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for total purchases
userSchema.virtual('totalPurchases').get(function() {
  return this.purchaseHistory.length;
});

// Virtual for total spent
userSchema.virtual('totalSpent').get(function() {
  return this.purchaseHistory.reduce((total, purchase) => total + purchase.totalAmount, 0);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update lastLogin
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.lastLogin = new Date();
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user preferences for recommendations
userSchema.methods.getRecommendationProfile = function() {
  return {
    dietType: this.preferences.dietType,
    allergies: this.preferences.allergies,
    cuisinePreferences: this.preferences.cuisinePreferences,
    budgetRange: this.preferences.budgetRange,
    recentPurchases: this.purchaseHistory.slice(-10),
    favoriteCategories: this.getFavoriteCategories()
  };
};

// Instance method to get favorite categories based on purchase history
userSchema.methods.getFavoriteCategories = function() {
  const categoryCount = {};
  
  this.purchaseHistory.forEach(purchase => {
    purchase.items.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
    });
  });

  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);
};

// Instance method to log activity
userSchema.methods.logActivity = function(action, details = {}) {
  this.activityLog.push({
    action,
    details,
    timestamp: new Date()
  });
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
};

// Static method to find users by diet preference
userSchema.statics.findByDietType = function(dietType) {
  return this.find({ 'preferences.dietType': dietType, isActive: true });
};

// Static method to get active users count
userSchema.statics.getActiveUsersCount = function() {
  return this.countDocuments({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);