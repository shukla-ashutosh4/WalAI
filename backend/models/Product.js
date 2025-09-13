const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['food-grocery', 'kitchen-items', 'beverages', 'snacks', 'dairy', 'meat', 'vegetables', 'pantry'],
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    get: v => Math.round(v * 100) / 100 // Round to 2 decimal places
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 20;
      },
      message: 'Cannot have more than 20 tags'
    }
  },
  dietaryTypes: {
    type: [String],
    enum: ['Veg', 'Non-Veg', 'Vegan'],
    default: ['Veg'],
    required: true
  },
  searchKeywords: {
    type: [String],
    default: [],
    index: true
  },
  isIngredient: {
    type: Boolean,
    default: false,
    index: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
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
    servingSize: String,
    servingUnit: String
  },
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame']
  }],
  certifications: [{
    type: String,
    enum: ['organic', 'non-gmo', 'kosher', 'halal', 'gluten-free', 'fair-trade']
  }],
  suggestedIngredients: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    quantity: String,
    unit: String,
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  complementaryProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  alternatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  pricing: {
    originalPrice: Number,
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    salePrice: Number,
    onSale: {
      type: Boolean,
      default: false
    },
    saleStartDate: Date,
    saleEndDate: Date
  },
  availability: {
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isDiscontinued: {
      type: Boolean,
      default: false
    },
    seasonalAvailability: [{
      season: {
        type: String,
        enum: ['spring', 'summer', 'fall', 'winter']
      },
      available: Boolean
    }]
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
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    },
    helpful: {
      type: Number,
      default: 0
    }
  }],
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    addedToCart: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    trending: {
      type: Boolean,
      default: false
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
productSchema.index({ category: 1, 'availability.isActive': 1 });
productSchema.index({ dietaryTypes: 1, category: 1 });
productSchema.index({ price: 1, category: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text', searchKeywords: 'text' });

// Virtual for display price (considers sale price)
productSchema.virtual('displayPrice').get(function() {
  if (this.pricing?.onSale && this.pricing?.salePrice) {
    return this.pricing.salePrice;
  }
  return this.price;
});

// Virtual for discount amount
productSchema.virtual('discountAmount').get(function() {
  if (this.pricing?.onSale && this.pricing?.salePrice) {
    return this.price - this.pricing.salePrice;
  }
  return 0;
});

// Virtual for effective discount percentage
productSchema.virtual('effectiveDiscountPercentage').get(function() {
  if (this.pricing?.onSale && this.pricing?.salePrice) {
    return Math.round(((this.price - this.pricing.salePrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }
  return this.image;
});

// Virtual for stock status (will be populated from Inventory)
productSchema.virtual('stockStatus').get(function() {
  return 'in-stock'; // This should be populated from Inventory model in practice
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Update lastUpdated timestamp
  this.metadata.lastUpdated = new Date();
  
  // Generate SKU if not provided
  if (!this.sku) {
    this.sku = this.generateSKU();
  }
  
  // Calculate sale price if discount percentage is provided
  if (this.pricing?.discountPercentage && !this.pricing?.salePrice) {
    this.pricing.salePrice = this.price * (1 - this.pricing.discountPercentage / 100);
    this.pricing.onSale = true;
  }
  
  next();
});

// Instance methods
productSchema.methods.generateSKU = function() {
  const prefix = this.category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

productSchema.methods.addReview = function(userId, rating, comment = '') {
  // Add the review
  this.reviews.push({
    userId,
    rating,
    comment,
    date: new Date()
  });
  
  // Update ratings
  this.updateRatings();
  return this.save();
};

productSchema.methods.updateRatings = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }
  
  // Calculate average rating
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

productSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

productSchema.methods.incrementCartAdds = function() {
  this.metadata.addedToCart += 1;
  return this.save();
};

productSchema.methods.incrementPurchases = function() {
  this.metadata.purchases += 1;
  return this.save();
};

// Static methods
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { 
    category,
    'availability.isActive': true
  };
  
  return this.find(query)
    .sort(options.sort || { 'ratings.average': -1 })
    .limit(options.limit || 20);
};

productSchema.statics.findByDietType = function(dietType, options = {}) {
  const query = {
    dietaryTypes: dietType,
    'availability.isActive': true
  };
  
  return this.find(query)
    .sort(options.sort || { 'ratings.average': -1 })
    .limit(options.limit || 20);
};

productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    $and: [
      { 'availability.isActive': true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          { searchKeywords: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };
  
  // Apply filters
  if (filters.category) query.category = filters.category;
  if (filters.dietType) query.dietaryTypes = filters.dietType;
  if (filters.minPrice) query.price = { ...query.price, $gte: filters.minPrice };
  if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };
  if (filters.minRating) query['ratings.average'] = { $gte: filters.minRating };
  
  return this.find(query)
    .sort({ 'ratings.average': -1, 'metadata.purchases': -1 })
    .limit(filters.limit || 20);
};

productSchema.statics.getTrendingProducts = function(limit = 10) {
  return this.find({ 
    'availability.isActive': true,
    'metadata.trending': true 
  })
  .sort({ 'metadata.purchases': -1, 'metadata.views': -1 })
  .limit(limit);
};

productSchema.statics.getPopularProducts = function(limit = 10) {
  return this.find({ 'availability.isActive': true })
    .sort({ 
      'ratings.average': -1, 
      'metadata.purchases': -1,
      'ratings.count': -1 
    })
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);