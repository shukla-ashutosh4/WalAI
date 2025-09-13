const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Meal plan name is required'],
    trim: true,
    maxlength: [100, 'Meal plan name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  weekStartDate: { 
    type: Date, 
    required: [true, 'Week start date is required'],
    index: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  meals: [{
    day: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    breakfast: {
      recipeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe' 
      },
      customMeal: {
        name: String,
        ingredients: [String],
        notes: String
      },
      servings: {
        type: Number,
        default: 1,
        min: 1
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    },
    lunch: {
      recipeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe' 
      },
      customMeal: {
        name: String,
        ingredients: [String],
        notes: String
      },
      servings: {
        type: Number,
        default: 1,
        min: 1
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    },
    dinner: {
      recipeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe' 
      },
      customMeal: {
        name: String,
        ingredients: [String],
        notes: String
      },
      servings: {
        type: Number,
        default: 1,
        min: 1
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    },
    snacks: [{
      recipeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe' 
      },
      customMeal: {
        name: String,
        ingredients: [String],
        notes: String
      },
      servings: {
        type: Number,
        default: 1,
        min: 1
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    }]
  }],
  preferences: {
    dietType: { 
      type: String, 
      enum: ['Veg', 'Non-Veg', 'Vegan', 'Mixed'], 
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
    budgetLimit: {
      type: Number,
      min: 0
    },
    calorieTarget: {
      daily: {
        type: Number,
                min: 0
      },
      weekly: {
        type: Number,
        min: 0
      }
    },
    nutritionGoals: {
      protein: Number, // grams per day
      carbs: Number,
      fat: Number,
      fiber: Number
    },
    mealTiming: {
      breakfast: String, // e.g., "07:00"
      lunch: String,     // e.g., "12:30"
      dinner: String,    // e.g., "19:00"
      timezone: {
        type: String,
        default: 'UTC'
      }
    },
    cookingTime: {
      maxPrepTime: {
        type: Number,
        default: 60 // minutes
      },
      preferQuickMeals: {
        type: Boolean,
        default: false
      }
    },
    variety: {
      avoidRepetition: {
        type: Boolean,
        default: true
      },
      maxSameIngredient: {
        type: Number,
        default: 3 // max times same ingredient can appear per week
      }
    }
  },
  generatedBy: { 
    type: String, 
    enum: ['AI', 'Manual', 'Template'], 
    default: 'Manual',
    index: true
  },
  generationSettings: {
    aiModel: String, // 'GPT-4', 'Groq', etc.
    prompt: String,
    parameters: mongoose.Schema.Types.Mixed,
    generatedAt: Date
  },
  totalCost: { 
    type: Number, 
    default: 0,
    min: 0
  },
  estimatedNutrition: {
    daily: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number
    },
    weekly: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number
    }
  },
  shoppingList: [{
    ingredient: {
      name: String,
      category: String,
      quantity: Number,
      unit: String
    },
    recipes: [String], // Which recipes need this ingredient
    isPurchased: {
      type: Boolean,
      default: false
    },
    estimatedCost: Number,
    alternatives: [String],
    priority: {
      type: String,
      enum: ['essential', 'important', 'optional'],
      default: 'important'
    }
  }],
  progress: {
    totalMeals: {
      type: Number,
      default: 0
    },
    completedMeals: {
      type: Number,
      default: 0
    },
    adherencePercentage: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['prep', 'cook', 'shop', 'custom']
    },
    message: String,
    scheduledFor: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    sentAt: Date
  }],
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    publicStats: {
      views: {
        type: Number,
        default: 0
      },
      copies: {
        type: Number,
        default: 0
      },
      ratings: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comment: String,
        date: {
          type: Date,
          default: Date.now
        }
      }]
    }
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateCategory: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'family', 'quick-meals', 'budget-friendly', 'gourmet', 'custom']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused', 'archived'],
    default: 'draft',
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  history: [{
    version: Number,
    changes: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
mealPlanSchema.index({ userId: 1, weekStartDate: -1 });
mealPlanSchema.index({ userId: 1, status: 1, isActive: 1 });
mealPlanSchema.index({ isTemplate: 1, templateCategory: 1 });
mealPlanSchema.index({ 'sharing.isPublic': 1, status: 1 });

// Virtuals
mealPlanSchema.virtual('weekDuration').get(function() {
  if (this.weekStartDate && this.weekEndDate) {
    return Math.ceil((this.weekEndDate - this.weekStartDate) / (1000 * 60 * 60 * 24));
  }
  return 7; // Default to 7 days
});

mealPlanSchema.virtual('completionPercentage').get(function() {
  if (this.progress.totalMeals === 0) return 0;
  return Math.round((this.progress.completedMeals / this.progress.totalMeals) * 100);
});

mealPlanSchema.virtual('averageRating').get(function() {
  const ratings = this.sharing.publicStats.ratings;
  if (!ratings || ratings.length === 0) return 0;
  
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

mealPlanSchema.virtual('totalShoppingListCost').get(function() {
  return this.shoppingList.reduce((total, item) => {
    return total + (item.estimatedCost || 0);
  }, 0);
});

mealPlanSchema.virtual('daysRemaining').get(function() {
  if (this.weekEndDate) {
    const today = new Date();
    const remaining = Math.ceil((this.weekEndDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  }
  return 0;
});

// Pre-save middleware
mealPlanSchema.pre('save', function(next) {
  // Set week end date if not provided
  if (this.weekStartDate && !this.weekEndDate) {
    this.weekEndDate = new Date(this.weekStartDate);
    this.weekEndDate.setDate(this.weekEndDate.getDate() + 6);
  }
  
  // Update total meals count
  this.updateMealCounts();
  
  // Update progress
  this.updateProgress();
  
  // Generate shopping list if meals have recipes
  if (this.isModified('meals')) {
    this.generateShoppingList();
  }
  
  next();
});

// Instance methods
mealPlanSchema.methods.updateMealCounts = function() {
  let totalMeals = 0;
  let completedMeals = 0;
  
  this.meals.forEach(day => {
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (day[mealType] && (day[mealType].recipeId || day[mealType].customMeal)) {
        totalMeals++;
        if (day[mealType].isCompleted) {
          completedMeals++;
        }
      }
    });
    
    // Count snacks
    if (day.snacks && day.snacks.length > 0) {
      day.snacks.forEach(snack => {
        if (snack.recipeId || snack.customMeal) {
          totalMeals++;
          if (snack.isCompleted) {
            completedMeals++;
          }
        }
      });
    }
  });
  
  this.progress.totalMeals = totalMeals;
  this.progress.completedMeals = completedMeals;
};

mealPlanSchema.methods.updateProgress = function() {
  if (this.progress.totalMeals > 0) {
    this.progress.adherencePercentage = Math.round(
      (this.progress.completedMeals / this.progress.totalMeals) * 100
    );
  } else {
    this.progress.adherencePercentage = 0;
  }
  
  this.progress.lastUpdated = new Date();
};

mealPlanSchema.methods.generateShoppingList = async function() {
  try {
    const Recipe = mongoose.model('Recipe');
    const consolidatedIngredients = new Map();
    
    for (const day of this.meals) {
      const mealTypes = ['breakfast', 'lunch', 'dinner'];
      
      for (const mealType of mealTypes) {
        const meal = day[mealType];
        if (meal && meal.recipeId) {
          const recipe = await Recipe.findById(meal.recipeId);
          if (recipe) {
            const scaledRecipe = recipe.scaleRecipe(meal.servings || 1);
            
            scaledRecipe.ingredients.forEach(ingredient => {
              const key = `${ingredient.name}_${ingredient.unit}`;
              
              if (consolidatedIngredients.has(key)) {
                const existing = consolidatedIngredients.get(key);
                existing.quantity += ingredient.quantity;
                existing.recipes.push(`${day.day} ${mealType}`);
              } else {
                consolidatedIngredients.set(key, {
                  ingredient: {
                    name: ingredient.name,
                    category: ingredient.category,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit
                  },
                  recipes: [`${day.day} ${mealType}`],
                  isPurchased: false,
                  priority: ingredient.isEssential ? 'essential' : 'important'
                });
              }
            });
          }
        }
      }
      
      // Process snacks
      if (day.snacks) {
        for (const snack of day.snacks) {
          if (snack.recipeId) {
            const recipe = await Recipe.findById(snack.recipeId);
            if (recipe) {
              const scaledRecipe = recipe.scaleRecipe(snack.servings || 1);
              
              scaledRecipe.ingredients.forEach(ingredient => {
                const key = `${ingredient.name}_${ingredient.unit}`;
                
                if (consolidatedIngredients.has(key)) {
                  const existing = consolidatedIngredients.get(key);
                  existing.quantity += ingredient.quantity;
                  existing.recipes.push(`${day.day} snack`);
                } else {
                  consolidatedIngredients.set(key, {
                    ingredient: {
                      name: ingredient.name,
                      category: ingredient.category,
                      quantity: ingredient.quantity,
                      unit: ingredient.unit
                    },
                    recipes: [`${day.day} snack`],
                    isPurchased: false,
                    priority: ingredient.isEssential ? 'essential' : 'important'
                  });
                }
              });
            }
          }
        }
      }
    }
    
    this.shoppingList = Array.from(consolidatedIngredients.values());
    
  } catch (error) {
    console.error('Error generating shopping list:', error);
  }
};

mealPlanSchema.methods.markMealCompleted = function(day, mealType, isSnack = false, snackIndex = null) {
  const dayMeal = this.meals.find(m => m.day === day);
  if (!dayMeal) return false;
  
  if (isSnack && snackIndex !== null && dayMeal.snacks[snackIndex]) {
    dayMeal.snacks[snackIndex].isCompleted = true;
    dayMeal.snacks[snackIndex].completedAt = new Date();
  } else if (dayMeal[mealType]) {
    dayMeal[mealType].isCompleted = true;
    dayMeal[mealType].completedAt = new Date();
  }
  
  this.updateMealCounts();
  this.updateProgress();
  
  return this.save();
};

mealPlanSchema.methods.addReminder = function(type, message, scheduledFor) {
  this.reminders.push({
    type,
    message,
    scheduledFor,
    isActive: true
  });
  
  return this.save();
};

mealPlanSchema.methods.shareWith = function(userId, permission = 'view') {
  // Remove existing share with same user
  this.sharing.sharedWith = this.sharing.sharedWith.filter(
    share => !share.userId.equals(userId)
  );
  
  // Add new share
  this.sharing.sharedWith.push({
    userId,
    permission,
    sharedAt: new Date()
  });
  
  return this.save();
};

mealPlanSchema.methods.createTemplate = function(templateCategory, name) {
  const template = this.toObject();
  delete template._id;
  delete template.userId;
  delete template.weekStartDate;
  delete template.weekEndDate;
  delete template.progress;
  delete template.createdAt;
  delete template.updatedAt;
  
  template.isTemplate = true;
  template.templateCategory = templateCategory;
  template.name = name || `${this.name} Template`;
  template.status = 'active';
  
  // Clear specific dates from meals
  template.meals.forEach(meal => {
    delete meal.date;
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (meal[mealType]) {
        meal[mealType].isCompleted = false;
        delete meal[mealType].completedAt;
      }
    });
    if (meal.snacks) {
      meal.snacks.forEach(snack => {
        snack.isCompleted = false;
        delete snack.completedAt;
      });
    }
  });
  
  return new this.constructor(template);
};

mealPlanSchema.methods.calculateNutrition = async function() {
  try {
    const Recipe = mongoose.model('Recipe');
    let dailyNutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0
    };
    
    for (const day of this.meals) {
      const mealTypes = ['breakfast', 'lunch', 'dinner'];
      
      for (const mealType of mealTypes) {
        const meal = day[mealType];
        if (meal && meal.recipeId) {
          const recipe = await Recipe.findById(meal.recipeId);
                    if (recipe && recipe.nutritionInfo) {
            const servings = meal.servings || 1;
            const nutrition = recipe.nutritionInfo;
            
            if (nutrition.perServing) {
              dailyNutrition.calories += (nutrition.calories || 0) * servings;
              dailyNutrition.protein += (nutrition.protein || 0) * servings;
              dailyNutrition.carbs += (nutrition.carbs || 0) * servings;
              dailyNutrition.fat += (nutrition.fat || 0) * servings;
              dailyNutrition.fiber += (nutrition.fiber || 0) * servings;
            } else {
              // If nutrition is for total recipe, calculate per serving
              const recipeServings = recipe.servings || 1;
              dailyNutrition.calories += ((nutrition.calories || 0) / recipeServings) * servings;
              dailyNutrition.protein += ((nutrition.protein || 0) / recipeServings) * servings;
              dailyNutrition.carbs += ((nutrition.carbs || 0) / recipeServings) * servings;
              dailyNutrition.fat += ((nutrition.fat || 0) / recipeServings) * servings;
              dailyNutrition.fiber += ((nutrition.fiber || 0) / recipeServings) * servings;
            }
          }
        }
      }
      
      // Process snacks
      if (day.snacks) {
        for (const snack of day.snacks) {
          if (snack.recipeId) {
            const recipe = await Recipe.findById(snack.recipeId);
            if (recipe && recipe.nutritionInfo) {
              const servings = snack.servings || 1;
              const nutrition = recipe.nutritionInfo;
              
              if (nutrition.perServing) {
                dailyNutrition.calories += (nutrition.calories || 0) * servings;
                dailyNutrition.protein += (nutrition.protein || 0) * servings;
                dailyNutrition.carbs += (nutrition.carbs || 0) * servings;
                dailyNutrition.fat += (nutrition.fat || 0) * servings;
                dailyNutrition.fiber += (nutrition.fiber || 0) * servings;
              } else {
                const recipeServings = recipe.servings || 1;
                dailyNutrition.calories += ((nutrition.calories || 0) / recipeServings) * servings;
                dailyNutrition.protein += ((nutrition.protein || 0) / recipeServings) * servings;
                dailyNutrition.carbs += ((nutrition.carbs || 0) / recipeServings) * servings;
                dailyNutrition.fat += ((nutrition.fat || 0) / recipeServings) * servings;
                dailyNutrition.fiber += ((nutrition.fiber || 0) / recipeServings) * servings;
              }
            }
          }
        }
      }
    }
    
    // Average daily nutrition (divide by number of days)
    const numDays = this.meals.length || 7;
    Object.keys(dailyNutrition).forEach(key => {
      dailyNutrition[key] = Math.round((dailyNutrition[key] / numDays) * 100) / 100;
    });
    
    // Calculate weekly nutrition
    const weeklyNutrition = {};
    Object.keys(dailyNutrition).forEach(key => {
      weeklyNutrition[key] = Math.round((dailyNutrition[key] * numDays) * 100) / 100;
    });
    
    this.estimatedNutrition = {
      daily: dailyNutrition,
      weekly: weeklyNutrition
    };
    
    return this.save();
  } catch (error) {
    console.error('Error calculating nutrition:', error);
    return this;
  }
};

mealPlanSchema.methods.addRating = function(userId, rating, comment = '') {
  // Remove existing rating from same user
  this.sharing.publicStats.ratings = this.sharing.publicStats.ratings.filter(
    r => !r.userId.equals(userId)
  );
  
  // Add new rating
  this.sharing.publicStats.ratings.push({
    userId,
    rating,
    comment,
    date: new Date()
  });
  
  return this.save();
};

mealPlanSchema.methods.incrementViews = function() {
  this.sharing.publicStats.views += 1;
  return this.save();
};

mealPlanSchema.methods.incrementCopies = function() {
  this.sharing.publicStats.copies += 1;
  return this.save();
};

mealPlanSchema.methods.createVersion = function(changes, modifiedBy) {
  this.version += 1;
  this.history.push({
    version: this.version - 1,
    changes: changes,
    modifiedBy: modifiedBy,
    modifiedAt: new Date()
  });
  
  return this.save();
};

// Static methods
mealPlanSchema.statics.findByUser = function(userId, options = {}) {
  const query = { 
    userId,
    isActive: true
  };
  
  if (options.status) query.status = options.status;
  if (options.isTemplate !== undefined) query.isTemplate = options.isTemplate;
  
  return this.find(query)
    .sort(options.sort || { weekStartDate: -1 })
    .limit(options.limit || 50);
};

mealPlanSchema.statics.findCurrentWeekPlans = function(userId) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return this.find({
    userId,
    weekStartDate: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $in: ['active', 'draft'] },
    isActive: true
  });
};

mealPlanSchema.statics.findPublicTemplates = function(category = null, limit = 20) {
  const query = {
    isTemplate: true,
    'sharing.isPublic': true,
    status: 'active'
  };
  
  if (category) query.templateCategory = category;
  
  return this.find(query)
    .sort({ 'sharing.publicStats.copies': -1, 'sharing.publicStats.views': -1 })
    .limit(limit);
};

mealPlanSchema.statics.findPopularMealPlans = function(limit = 10) {
  return this.find({
    'sharing.isPublic': true,
    status: 'active',
    isActive: true
  })
  .sort({
    'sharing.publicStats.views': -1,
    'sharing.publicStats.copies': -1
  })
  .limit(limit);
};

mealPlanSchema.statics.searchMealPlans = function(searchTerm, filters = {}) {
  const query = {
    $and: [
      { 
        'sharing.isPublic': true,
        status: 'active',
        isActive: true
      },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { templateCategory: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  };
  
  if (filters.dietType) query['preferences.dietType'] = filters.dietType;
  if (filters.templateCategory) query.templateCategory = filters.templateCategory;
  if (filters.maxCost) query.totalCost = { $lte: filters.maxCost };
  
  return this.find(query)
    .sort({ 'sharing.publicStats.views': -1 })
    .limit(filters.limit || 20);
};

mealPlanSchema.statics.getWeeklyStats = function(userId) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        weekStartDate: { $gte: startOfWeek },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalPlans: { $sum: 1 },
        averageCompletion: { $avg: '$progress.adherencePercentage' },
        totalCost: { $sum: '$totalCost' },
        totalMeals: { $sum: '$progress.totalMeals' },
        completedMeals: { $sum: '$progress.completedMeals' }
      }
    }
  ]);
};

mealPlanSchema.statics.getNutritionTrends = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    weekStartDate: { $gte: startDate },
    isActive: true
  })
  .select('weekStartDate estimatedNutrition')
  .sort({ weekStartDate: 1 });
};

module.exports = mongoose.model('MealPlan', mealPlanSchema);