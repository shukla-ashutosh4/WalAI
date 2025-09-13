const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
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

// Generate recipe from dish name (main feature)
router.post('/generate', authenticateToken, async (req, res) => {
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

// Search recipes
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query = '', 
      filters = {},
      page = 1,
      limit = 20 
    } = req.body;

    const recipes = await Recipe.searchRecipes(query, {
      ...filters,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const totalRecipes = await Recipe.countDocuments({
      $and: [
        { isActive: true, isPublic: true },
        query ? {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } },
            { cuisine: { $regex: query, $options: 'i' } }
          ]
        } : {}
      ]
    });

    res.status(200).json({
      recipes,
      pagination: {
        currentPage: parseInt(page),
        totalItems: totalRecipes,
        totalPages: Math.ceil(totalRecipes / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ 
      message: 'Error searching recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all recipes with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      difficulty, 
      cuisine,
      maxPrepTime,
      maxCookTime,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true, isPublic: true };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (cuisine) filter.cuisine = cuisine;
    if (maxPrepTime) filter.prepTime = { $lte: parseInt(maxPrepTime) };
    if (maxCookTime) filter.cookTime = { $lte: parseInt(maxCookTime) };
    if (minRating) filter['ratings.average'] = { $gte: parseFloat(minRating) };

    const recipes = await Recipe.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('reviews.userId', 'name');

    const totalRecipes = await Recipe.countDocuments(filter);

    res.status(200).json({
      recipes,
      pagination: {
        currentPage: parseInt(page),
        totalItems: totalRecipes,
        totalPages: Math.ceil(totalRecipes / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ 
      message: 'Error fetching recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recipe by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('reviews.userId', 'name profile.avatar');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Increment view count
    await recipe.incrementViews();

    res.status(200).json(recipe);

  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ 
      message: 'Error fetching recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get popular recipes
router.get('/featured/popular', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recipes = await Recipe.getPopularRecipes(parseInt(limit));
    
    res.status(200).json({
      recipes,
      message: 'Popular recipes fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching popular recipes:', error);
    res.status(500).json({ 
      message: 'Error fetching popular recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get trending recipes
router.get('/featured/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recipes = await Recipe.getTrendingRecipes(parseInt(limit));
    
    res.status(200).json({
      recipes,
      message: 'Trending recipes fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching trending recipes:', error);
    res.status(500).json({ 
      message: 'Error fetching trending recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get quick recipes
router.get('/featured/quick', authenticateToken, async (req, res) => {
  try {
    const { maxTime = 30, limit = 10 } = req.query;
    const recipes = await Recipe.getQuickRecipes(parseInt(maxTime), parseInt(limit));
    
    res.status(200).json({
      recipes,
      message: 'Quick recipes fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching quick recipes:', error);
    res.status(500).json({ 
      message: 'Error fetching quick recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recipes by category
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    const recipes = await Recipe.findByCategory(category, { limit: parseInt(limit) });
    
    res.status(200).json({
      recipes,
      category,
      message: `Recipes for ${category} category fetched successfully`
    });

  } catch (error) {
    console.error('Error fetching recipes by category:', error);
    res.status(500).json({ 
      message: 'Error fetching recipes by category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Scale recipe
router.post('/:id/scale', authenticateToken, async (req, res) => {
  try {
    const { servings } = req.body;
    
    if (!servings || servings < 1) {
      return res.status(400).json({ 
        message: 'Valid servings number is required' 
      });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const scaledRecipe = recipe.scaleRecipe(parseInt(servings));
    
    res.status(200).json({
      scaledRecipe,
      message: `Recipe scaled to ${servings} servings`
    });

  } catch (error) {
    console.error('Error scaling recipe:', error);
    res.status(500).json({ 
      message: 'Error scaling recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add review to recipe
router.post('/:id/review', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { rating, comment = '', images = [], modifications = '' } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    await recipe.addReview(req.user.userId, rating, comment, images, modifications);
    
    res.status(200).json({
      message: 'Review added successfully',
      ratings: recipe.ratings
    });

  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ 
      message: 'Error adding review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark recipe as cooked
router.post('/:id/cooked', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    await recipe.markAsCooked();
    
    res.status(200).json({
      message: 'Recipe marked as cooked',
      statistics: recipe.statistics
    });

  } catch (error) {
    console.error('Error marking recipe as cooked:', error);
    res.status(500).json({ 
      message: 'Error marking recipe as cooked',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recipe shopping list
router.get('/:id/shopping-list', authenticateToken, async (req, res) => {
  try {
    const { servings } = req.query;
    
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    let shoppingList;
    if (servings && servings != recipe.servings) {
      const scaledRecipe = recipe.scaleRecipe(parseInt(servings));
      shoppingList = scaledRecipe.ingredients.filter(ing => ing.isEssential);
    } else {
      shoppingList = recipe.getShoppingList();
    }
    
    res.status(200).json({
      shoppingList,
      recipeName: recipe.name,
      servings: servings || recipe.servings
    });

  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ 
      message: 'Error generating shopping list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;