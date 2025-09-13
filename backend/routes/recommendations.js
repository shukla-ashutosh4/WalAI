const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');

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

// Get cart-based recommendations
router.post('/cart', authenticateToken, async (req, res) => {
  try {
    const { cartItems = [], dietType = 'Veg' } = req.body;

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ 
        message: 'Cart items must be an array' 
      });
    }

    console.log(`🔍 Getting recommendations for ${cartItems.length} cart items`);

    const recommendations = await recommendationService.getCartRecommendations(cartItems, dietType);

    res.status(200).json({
      recommendations,
      count: recommendations.length,
      message: 'Cart recommendations fetched successfully'
    });

  } catch (error) {
    console.error('Error getting cart recommendations:', error);
    res.status(500).json({ 
      message: 'Error getting cart recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get meal plan recommendations
router.post('/meal-plan', authenticateToken, async (req, res) => {
  try {
    const { preferences = {}, currentMeals = [] } = req.body;
    const userId = req.user?.userId;

    console.log('🔍 Getting meal plan recommendations');

    const recommendations = await recommendationService.getMealPlanRecommendations(userId, preferences);

    res.status(200).json({
      recommendations,
      message: 'Meal plan recommendations fetched successfully'
    });

  } catch (error) {
    console.error('Error getting meal plan recommendations:', error);
    res.status(500).json({ 
      message: 'Error getting meal plan recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get trending items - FIXED TYPO HERE
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const trendingItems = await recommendationService.getTrendingItems(parseInt(limit));
    
    res.status(200).json({
      trendingItems,
      count: trendingItems.length,
      message: 'Trending items fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching trending items:', error);
    res.status(500).json({ 
      message: 'Error fetching trending items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get seasonal recommendations
router.get('/seasonal', authenticateToken, async (req, res) => {
  try {
    const { season = 'all', limit = 6 } = req.query;
    const seasonalItems = await recommendationService.getSeasonalRecommendations(season);
    
    res.status(200).json({
      seasonalItems,
      season,
      count: seasonalItems.length,
      message: 'Seasonal recommendations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching seasonal recommendations:', error);
    res.status(500).json({ 
      message: 'Error fetching seasonal recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get personalized recommendations for user
router.get('/personalized', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required for personalized recommendations' });
    }

    const { limit = 10 } = req.query;
    const userId = req.user.userId;

    // This would use user's purchase history and preferences
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, parseInt(limit));

    res.status(200).json({
      recommendations,
      count: recommendations.length,
      message: 'Personalized recommendations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    res.status(500).json({ 
      message: 'Error fetching personalized recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recommendations based on specific product
router.get('/product/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    const product = await Inventory.findById(productId).populate('productId');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const recommendations = await recommendationService.getProductRecommendations(product, parseInt(limit));

    res.status(200).json({
      recommendations,
      baseProduct: product.name,
      count: recommendations.length,
      message: 'Product recommendations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    res.status(500).json({ 
      message: 'Error fetching product recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recipe-based ingredient recommendations
router.post('/recipe-ingredients', authenticateToken, async (req, res) => {
  try {
    const { recipeId, excludeItems = [] } = req.body;

    if (!recipeId) {
      return res.status(400).json({ message: 'Recipe ID is required' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recommendations = await recommendationService.getRecipeIngredientRecommendations(recipe, excludeItems);

    res.status(200).json({
      recommendations,
      recipeName: recipe.name,
      count: recommendations.length,
      message: 'Recipe ingredient recommendations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching recipe ingredient recommendations:', error);
    res.status(500).json({ 
      message: 'Error fetching recipe ingredient recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;