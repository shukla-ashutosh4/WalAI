const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Recipe name is required'],
    trim: true,
    minlength: [2, 'Recipe name must be at least 2 characters'],
    maxlength: [100, 'Recipe name cannot exceed 100 characters'],
    index: true
  },
  category: { 
    type: String, 
    enum: ['Veg', 'Non-Veg', 'Vegan'], 
    required: [true, 'Category is required'],
    index: true
  },
  servings: { 
    type: Number, 
    default: 1,
    min: [1, 'Servings must be at least 1'],
    max: [50, 'Servings cannot exceed 50']
  },
  ingredients: [{
    name: { 
      type: String, 
      required: [true, 'Ingredient name is required'],
      trim: true
    },
    quantity: { 
      type: Number, 
      required: [true, 'Ingredient quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: { 
      type: String, 
      required: [true, 'Ingredient unit is required'],
      enum: ['g', 'kg', 'ml', 'liter', 'cup', 'tbsp', 'tsp', 'pieces', 'cloves', 'pinch']
    },
    category: { 
      type: String, 
      enum: ['Veg', 'Non-Veg', 'Vegan', 'Common'],
      default: 'Common'
    },
    isEssential: { 
      type: Boolean, 
      default: true 
    },
    alternatives: [{
      name: String,
      quantity: Number,
      unit: String,
      notes: String
    }],
    preparationNotes: String // e.g., "finely chopped", "grated", "sliced"
  }],
  instructions: [{
    stepNumber: {
      type: Number,
      required: true
    },
    instruction: {
      type: String,
      required: [true, 'Instruction text is required'],
      trim: true
    },
    estimatedTime: Number, // in minutes
    temperature: String, // e.g., "medium heat", "350°F"
    equipment: [String], // e.g., ["large pan", "wooden spoon"]
    tips: String
  }],
  prepTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [0, 'Prep time cannot be negative']
  },
  cookTime: {
    type: Number,
    required: [true, 'Cooking time is required'],
    min: [0, 'Cook time cannot be negative']
  },
  totalTime: Number, // Will be calculated automatically
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  cuisine: {
    type: String,
    enum: ['italian', 'indian', 'chinese', 'mexican', 'american', 'french', 'thai', 'mediterranean', 'other'],
    default: 'other'
  },
  mealType: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert', 'beverage']
  }],
  nutritionInfo: {
    calories: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    sugar: {
      type: Number,
      min: 0
    },
    sodium: {
      type: Number,
      min: 0
    },
    perServing: {
      type: Boolean,
      default: true
    }
  },
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame']
  }],
  createdBy: { 
    type: String, 
    enum: ['AI', 'Manual', 'User'], 
    default: 'AI',
    index: true
  },
  source: { 
    type: String, 
    enum: ['Spoonacular', 'OpenAI', 'Groq', 'Manual', 'User'], 
    default: 'Groq'
  },
  originalUrl: String, // If imported from external source
  images: [{
    url: String,
    caption: String,
    step: Number, // Which step this image relates to
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  video: {
    url: String,
    thumbnail: String,
    duration: Number // in seconds
  },
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    images: [String], // User uploaded images of their cooking
    modifications: String, // What they changed in the recipe
    date: {
      type: Date,
      default: Date.now
    },
    helpful: {
      type: Number,
      default: 0
    }
  }],
  variations: [{
    name: String,
    description: String,
    ingredientChanges: [{
      original: String,
      replacement: String,
      reason: String
    }],
    instructionChanges: String
  }],
  equipment: [{
    name: String,
    essential: {
      type: Boolean,
      default: true
    },
    alternatives: [String]
  }],
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    cooks: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    lastCooked: Date
  },
  cost: {
    estimated: Number, // Estimated cost per serving
    currency: {
      type: String,
      default: 'USD'
    },
    calculatedAt: Date
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  approvalStatus: {
    type: String,
        enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  moderationNotes: String,
  featuredUntil: Date, // For promoting certain recipes
  seasonality: [{
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter']
    },
    isRecommended: Boolean
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
recipeSchema.index({ category: 1, difficulty: 1, isActive: 1 });
recipeSchema.index({ tags: 1, cuisine: 1 });
recipeSchema.index({ 'ratings.average': -1, 'statistics.views': -1 });
recipeSchema.index({ createdBy: 1, source: 1 });
recipeSchema.index({ name: 'text', tags: 'text' });

// Virtuals
recipeSchema.virtual('totalTimeCalculated').get(function() {
  return this.prepTime + this.cookTime;
});

recipeSchema.virtual('primaryImage').get(function() {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }
  return null;
});

recipeSchema.virtual('difficultyScore').get(function() {
  const difficultyMap = { easy: 1, medium: 2, hard: 3 };
  return difficultyMap[this.difficulty] || 2;
});

recipeSchema.virtual('popularityScore').get(function() {
  return (this.statistics.views * 0.1) + 
         (this.statistics.bookmarks * 0.3) + 
         (this.statistics.cooks * 0.4) + 
         (this.ratings.average * this.ratings.count * 0.2);
});

recipeSchema.virtual('estimatedCostPerServing').get(function() {
  if (this.cost.estimated && this.servings > 0) {
    return (this.cost.estimated / this.servings).toFixed(2);
  }
  return 0;
});

// Pre-save middleware
recipeSchema.pre('save', function(next) {
  // Calculate total time
  this.totalTime = this.prepTime + this.cookTime;
  
  // Sort instructions by step number
  if (this.instructions && this.instructions.length > 0) {
    this.instructions = this.instructions.sort((a, b) => a.stepNumber - b.stepNumber);
  }
  
  // Update cost calculation timestamp if cost was modified
  if (this.isModified('cost.estimated')) {
    this.cost.calculatedAt = new Date();
  }
  
  next();
});

// Instance methods
recipeSchema.methods.scaleRecipe = function(newServings) {
  const scaleFactor = newServings / this.servings;
  
  const scaledRecipe = this.toObject();
  scaledRecipe.servings = newServings;
  scaledRecipe.ingredients = scaledRecipe.ingredients.map(ingredient => ({
    ...ingredient,
    quantity: Math.round(ingredient.quantity * scaleFactor * 100) / 100
  }));
  
  // Scale nutrition info if it's per total recipe
  if (scaledRecipe.nutritionInfo && !scaledRecipe.nutritionInfo.perServing) {
    Object.keys(scaledRecipe.nutritionInfo).forEach(key => {
      if (typeof scaledRecipe.nutritionInfo[key] === 'number') {
        scaledRecipe.nutritionInfo[key] = Math.round(scaledRecipe.nutritionInfo[key] * scaleFactor * 100) / 100;
      }
    });
  }
  
  return scaledRecipe;
};

recipeSchema.methods.addReview = function(userId, rating, comment = '', images = [], modifications = '') {
  this.reviews.push({
    userId,
    rating,
    comment,
    images,
    modifications,
    date: new Date()
  });
  
  this.updateRatings();
  this.statistics.cooks += 1;
  
  return this.save();
};

recipeSchema.methods.updateRatings = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
  this.ratings.count = this.reviews.length;
  
  // Update breakdown
  this.ratings.breakdown = {
    five: this.reviews.filter(r => r.rating === 5).length,
    four: this.reviews.filter(r => r.rating === 4).length,
    three: this.reviews.filter(r => r.rating === 3).length,
    two: this.reviews.filter(r => r.rating === 2).length,
    one: this.reviews.filter(r => r.rating === 1).length
  };
};

recipeSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

recipeSchema.methods.incrementBookmarks = function() {
  this.statistics.bookmarks += 1;
  return this.save();
};

recipeSchema.methods.incrementShares = function() {
  this.statistics.shares += 1;
  return this.save();
};

recipeSchema.methods.markAsCooked = function() {
  this.statistics.cooks += 1;
  this.statistics.lastCooked = new Date();
  return this.save();
};

recipeSchema.methods.calculateIngredientCost = async function() {
  try {
    const Inventory = mongoose.model('Inventory');
    let totalCost = 0;
    
    for (const ingredient of this.ingredients) {
      const inventoryItem = await Inventory.findOne({
        name: { $regex: new RegExp(ingredient.name, 'i') }
      });
      
      if (inventoryItem) {
        // Convert units if needed and calculate cost
        const cost = (ingredient.quantity / 1000) * inventoryItem.price; // Simplified conversion
        totalCost += cost;
      }
    }
    
    this.cost.estimated = Math.round(totalCost * 100) / 100;
    this.cost.calculatedAt = new Date();
    
    return this.save();
  } catch (error) {
    console.error('Error calculating recipe cost:', error);
    return this;
  }
};

recipeSchema.methods.getCompatibleRecipes = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    category: this.category,
    cuisine: this.cuisine,
    isActive: true,
    isPublic: true
  })
  .sort({ 'ratings.average': -1, 'statistics.views': -1 })
  .limit(limit);
};

recipeSchema.methods.getShoppingList = function() {
  return this.ingredients
    .filter(ingredient => ingredient.isEssential)
    .map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category,
      notes: ingredient.preparationNotes
    }));
};

// Static methods
recipeSchema.statics.findByCategory = function(category, options = {}) {
  const query = { 
    category,
    isActive: true,
    isPublic: true
  };
  
  return this.find(query)
    .sort(options.sort || { 'ratings.average': -1 })
    .limit(options.limit || 20);
};

recipeSchema.statics.findByDifficulty = function(difficulty, options = {}) {
  const query = {
    difficulty,
    isActive: true,
    isPublic: true
  };
  
  return this.find(query)
    .sort(options.sort || { 'ratings.average': -1 })
    .limit(options.limit || 20);
};

recipeSchema.statics.searchRecipes = function(searchTerm, filters = {}) {
  const query = {
    $and: [
      { isActive: true, isPublic: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          { cuisine: { $regex: searchTerm, $options: 'i' } },
          { 'ingredients.name': { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  };
  
  // Apply filters
  if (filters.category) query.category = filters.category;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.cuisine) query.cuisine = filters.cuisine;
  if (filters.maxPrepTime) query.prepTime = { $lte: filters.maxPrepTime };
  if (filters.maxCookTime) query.cookTime = { $lte: filters.maxCookTime };
  if (filters.maxTotalTime) query.totalTime = { $lte: filters.maxTotalTime };
  if (filters.minRating) query['ratings.average'] = { $gte: filters.minRating };
  if (filters.mealType) query.mealType = { $in: [filters.mealType] };
  
  return this.find(query)
    .sort({ 'ratings.average': -1, 'statistics.views': -1 })
    .limit(filters.limit || 20);
};

recipeSchema.statics.getPopularRecipes = function(limit = 10) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ 
      'ratings.average': -1, 
      'statistics.views': -1,
      'statistics.cooks': -1 
    })
    .limit(limit);
};

recipeSchema.statics.getTrendingRecipes = function(limit = 10) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return this.find({ 
    isActive: true, 
    isPublic: true,
    createdAt: { $gte: oneWeekAgo }
  })
  .sort({ 'statistics.views': -1, 'statistics.cooks': -1 })
  .limit(limit);
};

recipeSchema.statics.getRecipesByIngredients = function(ingredients, limit = 10) {
  const ingredientRegex = ingredients.map(ing => new RegExp(ing, 'i'));
  
  return this.find({
    'ingredients.name': { $in: ingredientRegex },
    isActive: true,
    isPublic: true
  })
  .sort({ 'ratings.average': -1 })
  .limit(limit);
};

recipeSchema.statics.getSeasonalRecipes = function(season, limit = 10) {
  return this.find({
    'seasonality.season': season,
    'seasonality.isRecommended': true,
    isActive: true,
    isPublic: true
  })
  .sort({ 'ratings.average': -1 })
  .limit(limit);
};

recipeSchema.statics.getQuickRecipes = function(maxTime = 30, limit = 10) {
  return this.find({
    totalTime: { $lte: maxTime },
    isActive: true,
    isPublic: true
  })
  .sort({ 'ratings.average': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Recipe', recipeSchema);