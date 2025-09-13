const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const recipeService = require('../services/recipeService');

// Middleware to authenticate token (assuming it's available)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    // If token exists, verify it, but don't require it for public endpoints
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

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
    if (minRating) filter[' rating'] = { $gte: parseFloat(minRating) };

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

// Create a new product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, dietaryTypes, description, availability } = req.body;

    const newProduct = new Product({
      name,
      category,
      price,
      dietaryTypes,
      description,
      availability
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, dietaryTypes, description, availability } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
      name,
      category,
      price,
      dietaryTypes,
      description,
      availability
    }, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get product inventory
router.get('/:id/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ productId: req.params.id });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update product inventory
router.put('/:id/inventory', authenticateToken, async (req, res) => {
  try {
    const { quantity, threshold } = req.body;

    const updatedInventory = await Inventory.findOneAndUpdate(
      { productId: req.params.id },
      { quantity, threshold },
      { new: true }
    );

    if (!updatedInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    res.status(200).json({ message: 'Inventory updated successfully', inventory: updatedInventory });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;