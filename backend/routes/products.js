const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const recipeService = require('../services/recipeService');

// Middleware to authenticate token (optional for some endpoints)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Search products - MAIN SEARCH ENDPOINT
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query = '', filters = {} } = req.body;
    
    console.log(`🔍 Searching for: "${query}"`);
    
    if (!query.trim()) {
      return res.status(400).json({ 
        message: 'Search query is required',
        products: []
      });
    }

    // Search in both Product and Inventory collections
    const searchRegex = new RegExp(query, 'i');
    
    // Search products first
    const products = await Product.find({
      $and: [
        { 'availability.isActive': true },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } },
            { searchKeywords: { $in: [searchRegex] } }
          ]
        }
      ]
    }).limit(20);

    // Search inventory items
    const inventoryItems = await Inventory.find({
      $and: [
        { inStock: true },
        {
          $or: [
            { name: searchRegex },
            { tags: { $in: [searchRegex] } },
            { searchKeywords: { $in: [searchRegex] } }
          ]
        }
      ]
    }).populate('productId').limit(20);

    // Combine results and remove duplicates
    const allResults = [];
    const seenIds = new Set();

    // Add products
    products.forEach(product => {
      if (!seenIds.has(product._id.toString())) {
        allResults.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          image: product.image,
          category: product.category,
          tags: product.tags,
          dietaryTypes: product.dietaryTypes,
          isIngredient: product.isIngredient,
          source: 'product'
        });
        seenIds.add(product._id.toString());
      }
    });

    // Add inventory items
    inventoryItems.forEach(item => {
      const productId = item.productId?._id?.toString() || item._id.toString();
      if (!seenIds.has(productId)) {
        allResults.push({
          _id: item._id,
          productId: item.productId?._id,
          name: item.name,
          price: item.price,
          description: item.productId?.description || '',
          image: item.productId?.image || '',
          category: item.category,
          tags: item.tags,
          quantity: item.quantity,
          unit: item.unit,
          inStock: item.inStock,
          source: 'inventory'
        });
        seenIds.add(productId);
      }
    });

    console.log(`✅ Found ${allResults.length} results for "${query}"`);

    res.status(200).json({
      products: allResults,
      total: allResults.length,
      query: query,
      message: allResults.length > 0 ? 'Products found successfully' : `No products found for "${query}"`
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      products: []
    });
  }
});

// Get all products with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      dietType, 
      minPrice, 
      maxPrice, 
      minRating, 
      sortBy = 'name',
      sortOrder = 'asc',
      isActive = true
    } = req.query;

    // Build filter object
    const filter = { 'availability.isActive': isActive === 'true' };
    
    if (category) filter.category = category;
    if (dietType) filter.dietaryTypes = dietType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (minRating) filter['ratings.average'] = { $gte: parseFloat(minRating) };

    const products = await Product.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalItems: totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Recipe generation endpoint
router.post('/recipe', authenticateToken, async (req, res) => {
  try {
    const { dishName, numPeople = 2, dietType = 'Veg' } = req.body;

    if (!dishName) {
      return res.status(400).json({ 
        message: 'Dish name is required' 
      });
    }

    console.log(`🔍 Generating recipe for: ${dishName} (${numPeople} people, ${dietType})`);

    // Use recipe service to process the request
    const result = await recipeService.processRecipeRequest(dishName, numPeople, dietType);

    res.status(200).json({
      message: 'Recipe generated successfully',
      ...result
    });

  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ 
      message: 'Error generating recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;