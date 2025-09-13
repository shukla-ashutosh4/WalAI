const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: [true, 'Product ID is required'],
    index: true
  },
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  category: { 
    type: String, 
    enum: ['Veg', 'Non-Veg', 'Vegan', 'Common'],
    required: true,
    index: true
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: { 
    type: String, 
    required: [true, 'Unit is required'],
    enum: ['kg', 'g', 'liter', 'ml', 'pieces', 'bottles', 'cans', 'packets', 'boxes']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    get: v => Math.round(v * 100) / 100
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  inStock: { 
    type: Boolean, 
    default: true,
    index: true
  },
  stockThreshold: {
    low: {
      type: Number,
      default: 10
    },
    critical: {
      type: Number,
      default: 5
    }
  },
  alternatives: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  tags: {
    type: [String],
    default: [],
    index: true
  },
  searchKeywords: {
    type: [String],
    default: [],
    index: true
  },
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    servingSize: String
  },
  storage: {
    location: {
      warehouse: String,
      aisle: String,
      shelf: String,
      position: String
    },
    conditions: {
      temperature: {
        min: Number,
        max: Number,
        unit: {
          type: String,
          enum: ['celsius', 'fahrenheit'],
          default: 'celsius'
        }
      },
      humidity: {
        min: Number,
        max: Number
      },
      requirements: [{
        type: String,
        enum: ['refrigerated', 'frozen', 'dry', 'dark', 'ventilated']
      }]
    }
  },
  supplier: {
    name: String,
    contactInfo: {
      email: String,
      phone: String,
      address: String
    },
    leadTime: Number, // in days
    minimumOrder: Number
  },
  expiryTracking: {
    hasExpiry: {
      type: Boolean,
      default: false
    },
    expiryDate: Date,
    shelfLife: Number, // in days
    batchNumber: String,
    manufacturingDate: Date
  },
  pricing: {
    basePrice: Number,
    markup: {
      type: Number,
      default: 0 // percentage
    },
    discountRules: [{
      type: {
        type: String,
        enum: ['bulk', 'clearance', 'seasonal', 'promotional']
      },
      minQuantity: Number,
      discountPercentage: Number,
      validUntil: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },
  stockMovements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'return', 'damage'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    reference: String, // Order ID, Return ID, etc.
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'expiry_warning', 'overstock', 'quality_issue']
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  lastRestocked: { 
    type: Date, 
    default: Date.now 
  },
  lastSold: Date,
  metrics: {
    totalSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageSaleFrequency: Number, // items per day
    turnoverRate: Number,
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
inventorySchema.index({ productId: 1, inStock: 1 });
inventorySchema.index({ category: 1, inStock: 1 });
inventorySchema.index({ name: 'text', searchKeywords: 'text', tags: 'text' });
inventorySchema.index({ quantity: 1, 'stockThreshold.low': 1 });
inventorySchema.index({ 'expiryTracking.expiryDate': 1 });

// Virtuals
inventorySchema.virtual('stockStatus').get(function() {
  if (!this.inStock || this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.stockThreshold.critical) return 'critical';
  if (this.quantity <= this.stockThreshold.low) return 'low';
  return 'in_stock';
});

inventorySchema.virtual('profitMargin').get(function() {
  if (!this.costPrice || this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
});

inventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryTracking.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryTracking.expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
});

inventorySchema.virtual('totalValue').get(function() {
  return (this.quantity * this.price).toFixed(2);
});

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Update inStock status based on quantity
  this.inStock = this.quantity > 0;
  
  // Generate alerts for low stock
  this.checkAndGenerateAlerts();
  
  next();
});

// Instance methods
inventorySchema.methods.adjustStock = function(quantity, type, reason, performedBy, reference = '') {
  const oldQuantity = this.quantity;
  
  if (type === 'in') {
    this.quantity += Math.abs(quantity);
    if (quantity > 0) this.lastRestocked = new Date();
  } else if (type === 'out') {
    this.quantity = Math.max(0, this.quantity - Math.abs(quantity));
    if (quantity > 0) this.lastSold = new Date();
  } else if (type === 'adjustment') {
    this.quantity = Math.max(0, quantity);
  }
  
  // Record stock movement
  this.stockMovements.push({
    type,
    quantity: type === 'adjustment' ? (quantity - oldQuantity) : 
             type === 'out' ? -Math.abs(quantity) : Math.abs(quantity),
    reason,
    reference,
    performedBy,
    date: new Date(),
    notes: `Stock ${type}: ${oldQuantity} → ${this.quantity}`
  });
    
  // Update metrics if it's a sale
  if (type === 'out' && reason === 'sale') {
    this.metrics.totalSold += Math.abs(quantity);
    this.metrics.totalRevenue += (Math.abs(quantity) * this.price);
    this.updateMetrics();
  }
  
  return this.save();
};

inventorySchema.methods.checkAndGenerateAlerts = function() {
  const now = new Date();
  
  // Clear existing active alerts of the same type
  this.alerts = this.alerts.filter(alert => !alert.isActive);
  
  // Low stock alert
  if (this.quantity <= this.stockThreshold.critical && this.quantity > 0) {
    this.alerts.push({
      type: 'low_stock',
      message: `Critical stock level: Only ${this.quantity} ${this.unit} remaining`,
      severity: 'critical',
      isActive: true,
      createdAt: now
    });
  } else if (this.quantity <= this.stockThreshold.low && this.quantity > this.stockThreshold.critical) {
    this.alerts.push({
      type: 'low_stock',
      message: `Low stock level: ${this.quantity} ${this.unit} remaining`,
      severity: 'medium',
      isActive: true,
      createdAt: now
    });
  }
  
  // Out of stock alert
  if (this.quantity === 0) {
    this.alerts.push({
      type: 'out_of_stock',
      message: 'Product is out of stock',
      severity: 'high',
      isActive: true,
      createdAt: now
    });
  }
  
  // Expiry warning alerts
  if (this.expiryTracking.hasExpiry && this.expiryTracking.expiryDate) {
    const daysUntilExpiry = this.daysUntilExpiry;
    
    if (daysUntilExpiry <= 1 && daysUntilExpiry >= 0) {
      this.alerts.push({
        type: 'expiry_warning',
        message: `Product expires in ${daysUntilExpiry} day(s)`,
        severity: 'critical',
        isActive: true,
        createdAt: now
      });
    } else if (daysUntilExpiry <= 7 && daysUntilExpiry > 1) {
      this.alerts.push({
        type: 'expiry_warning',
        message: `Product expires in ${daysUntilExpiry} days`,
        severity: 'medium',
        isActive: true,
        createdAt: now
      });
    } else if (daysUntilExpiry < 0) {
      this.alerts.push({
        type: 'expiry_warning',
        message: 'Product has expired',
        severity: 'critical',
        isActive: true,
        createdAt: now
      });
    }
  }
};

inventorySchema.methods.updateMetrics = function() {
  // Calculate turnover rate (sales per day)
  const daysSinceFirstSale = this.stockMovements
    .filter(movement => movement.type === 'out' && movement.reason === 'sale')
    .reduce((earliest, movement) => {
      return movement.date < earliest ? movement.date : earliest;
    }, new Date());
  
  const daysSinceStart = Math.max(1, (new Date() - daysSinceFirstSale) / (1000 * 60 * 60 * 24));
  this.metrics.averageSaleFrequency = this.metrics.totalSold / daysSinceStart;
  
  // Simple turnover rate calculation
  if (this.costPrice && this.quantity > 0) {
    this.metrics.turnoverRate = this.metrics.totalSold / (this.quantity + this.metrics.totalSold);
  }
  
  this.metrics.lastCalculated = new Date();
};

inventorySchema.methods.getReorderSuggestion = function() {
  const avgDailySales = this.metrics.averageSaleFrequency || 1;
  const leadTime = this.supplier?.leadTime || 7;
  const safetyStock = avgDailySales * 3; // 3 days safety stock
  const reorderPoint = (avgDailySales * leadTime) + safetyStock;
  
  return {
    shouldReorder: this.quantity <= reorderPoint,
    suggestedQuantity: Math.max(0, reorderPoint - this.quantity + (avgDailySales * 14)), // 2 weeks supply
    reorderPoint: reorderPoint,
    currentStock: this.quantity,
    projectedStockout: this.quantity / avgDailySales // days until stockout
  };
};

inventorySchema.methods.resolveAlert = function(alertId, resolvedBy) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.isActive = false;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    return this.save();
  }
  return Promise.reject(new Error('Alert not found'));
};

// Static methods
inventorySchema.statics.findLowStock = function(threshold = null) {
  const query = threshold 
    ? { quantity: { $lte: threshold }, inStock: true }
    : { $where: 'this.quantity <= this.stockThreshold.low', inStock: true };
  
  return this.find(query).populate('productId');
};

inventorySchema.statics.findOutOfStock = function() {
  return this.find({ quantity: 0 }).populate('productId');
};

inventorySchema.statics.findExpiringItems = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    'expiryTracking.hasExpiry': true,
    'expiryTracking.expiryDate': { $lte: futureDate },
    quantity: { $gt: 0 }
  }).populate('productId');
};

inventorySchema.statics.getInventoryByCategory = function(category) {
  return this.find({ category, isActive: true }).populate('productId');
};

inventorySchema.statics.searchInventory = function(searchTerm, filters = {}) {
  const query = {
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { searchKeywords: { $in: [new RegExp(searchTerm, 'i')] } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };
  
  if (filters.category) query.category = filters.category;
  if (filters.inStock !== undefined) query.inStock = filters.inStock;
  if (filters.minQuantity) query.quantity = { $gte: filters.minQuantity };
  
  return this.find(query).populate('productId');
};

inventorySchema.statics.getInventoryReport = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        inStockItems: {
          $sum: { $cond: [{ $gt: ['$quantity', 0] }, 1, 0] }
        },
        outOfStockItems: {
          $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
        },
        lowStockItems: {
          $sum: {
            $cond: [
              { $lte: ['$quantity', '$stockThreshold.low'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { totalValue: -1 }
    }
  ]);
};

module.exports = mongoose.model('Inventory', inventorySchema);