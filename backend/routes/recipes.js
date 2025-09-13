const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const recipeService = require('../services/recipeService');
const Inventory = require('../models/Inventory');

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

// Generate recipe from dish name (main feature) - ENHANCED
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { dishName, numPeople = 2, dietType = 'Veg', source = 'recipe-search' } = req.body;

    if (!dishName) {
      return res.status(400).json({ 
        message: 'Dish name is required' 
      });
    }

    console.log(`🔍 Generating recipe for: ${dishName} (${numPeople} people, ${dietType}) from ${source}`);

    // Use recipe service to process the request
    const result = await recipeService.processRecipeRequest(dishName, numPeople, dietType);

    // Enhanced response format for better integration
    const response = {
      success: true,
      message: 'Recipe generated successfully',
      source: source,
      query: dishName,
      recipe: result.recipe,
      availableItems: result.availableItems || [],
      missingItems: result.missingItems || [],
      totalIngredients: (result.availableItems?.length || 0) + (result.missingItems?.length || 0),
      availabilityPercentage: result.availableItems?.length > 0 ? 
        Math.round((result.availableItems.length / ((result.availableItems?.length || 0) + (result.missingItems?.length || 0))) * 100) : 0,
      hasIngredients: (result.availableItems?.length || 0) > 0,
      canMakeRecipe: (result.availableItems?.length || 0) > 0,
      servings: numPeople,
      dietType: dietType,
      generatedAt: new Date().toISOString(),
      ...result
    };

    // Log success metrics
    console.log(`✅ Recipe generated: ${result.availableItems?.length || 0} available, ${result.missingItems?.length || 0} missing ingredients`);

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      availableItems: [],
      missingItems: [],
      hasIngredients: false
    });
  }
});

// Quick ingredient check for recipes
router.post('/check-availability', authenticateToken, async (req, res) => {
  try {
    const { dishName, numPeople = 2, dietType = 'Veg' } = req.body;

    if (!dishName) {
      return res.status(400).json({ 
        success: false,
        message: 'Dish name is required' 
      });
    }

    console.log(`🔍 Checking ingredient availability for: ${dishName}`);

    try {
      const result = await recipeService.processRecipeRequest(dishName, numPeople, dietType);
      
      res.status(200).json({
        success: true,
        dishName: dishName,
        hasIngredients: (result.availableItems?.length || 0) > 0,
        availableCount: result.availableItems?.length || 0,
        missingCount: result.missingItems?.length || 0,
        totalIngredients: (result.availableItems?.length || 0) + (result.missingItems?.length || 0),
        availabilityPercentage: result.availableItems?.length > 0 ? 
          Math.round((result.availableItems.length / ((result.availableItems?.length || 0) + (result.missingItems?.length || 0))) * 100) : 0,
        canMakeRecipe: (result.availableItems?.length || 0) > 0,
        availableItems: result.availableItems?.map(item => ({
          name: item.name || item.ingredient,
          quantity: item.requiredQuantity || item.quantity,
          unit: item.unit,
          price: item.price
        })) || [],
        missingItems: result.missingItems || []
      });

    } catch (recipeError) {
      res.status(200).json({
        success: false,
        dishName: dishName,
        hasIngredients: false,
        availableCount: 0,
        missingCount: 0,
        totalIngredients: 0,
        availabilityPercentage: 0,
        canMakeRecipe: false,
        message: 'Recipe not found or no ingredients available'
      });
    }

  } catch (error) {
    console.error('Error checking recipe availability:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking ingredient availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Batch ingredient availability check
router.post('/batch-check', authenticateToken, async (req, res) => {
  try {
    const { recipes = [], numPeople = 2, dietType = 'Veg' } = req.body;

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipes array is required' 
      });
    }

    console.log(`🔍 Batch checking ${recipes.length} recipes`);

    const results = await Promise.allSettled(
      recipes.map(async (dishName) => {
        try {
          const result = await recipeService.processRecipeRequest(dishName, numPeople, dietType);
          return {
            dishName,
            success: true,
            hasIngredients: (result.availableItems?.length || 0) > 0,
            availableCount: result.availableItems?.length || 0,
            missingCount: result.missingItems?.length || 0,
            availabilityPercentage: result.availableItems?.length > 0 ? 
              Math.round((result.availableItems.length / ((result.availableItems?.length || 0) + (result.missingItems?.length || 0))) * 100) : 0
          };
        } catch (error) {
          return {
            dishName,
            success: false,
            hasIngredients: false,
            availableCount: 0,
            missingCount: 0,
            availabilityPercentage: 0,
            error: error.message
          };
        }
      })
    );

    const processedResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );

    res.status(200).json({
      success: true,
      results: processedResults,
      totalChecked: recipes.length,
      availableRecipes: processedResults.filter(r => r.hasIngredients).length
    });

  } catch (error) {
    console.error('Error in batch check:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error in batch ingredient check',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search recipes with ingredient availability
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query = '', 
      filters = {},
      page = 1,
      limit = 20,
      checkAvailability = false,
      numPeople = 2,
      dietType = 'Veg'
    } = req.body;

    const recipes = await Recipe.searchRecipes(query, {
      ...filters,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // Add ingredient availability if requested
    if (checkAvailability) {
      for (let recipe of recipes) {
        try {
          const availabilityResult = await recipeService.processRecipeRequest(
            recipe.name, 
            numPeople, 
            dietType
          );
          
          recipe.ingredientAvailability = {
            hasIngredients: (availabilityResult.availableItems?.length || 0) > 0,
            availableCount: availabilityResult.availableItems?.length || 0,
            missingCount: availabilityResult.missingItems?.length || 0,
            availabilityPercentage: availabilityResult.availableItems?.length > 0 ? 
              Math.round((availabilityResult.availableItems.length / ((availabilityResult.availableItems?.length || 0) + (availabilityResult.missingItems?.length || 0))) * 100) : 0
          };
        } catch (error) {
          recipe.ingredientAvailability = {
            hasIngredients: false,
            availableCount: 0,
            missingCount: 0,
            availabilityPercentage: 0
          };
        }
      }
    }

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
      },
      checkAvailability: checkAvailability
    });

  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ 
      message: 'Error searching recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recipe suggestions based on available ingredients
router.post('/suggest-by-ingredients', authenticateToken, async (req, res) => {
  try {
    const { availableIngredients = [], dietType = 'Veg', limit = 10 } = req.body;

    if (!Array.isArray(availableIngredients) || availableIngredients.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Available ingredients array is required' 
      });
    }

    console.log(`🔍 Finding recipes for ingredients: ${availableIngredients.join(', ')}`);

    // Get available inventory items
    const inventoryItems = await Inventory.find({
      inStock: true,
      name: { $in: availableIngredients.map(ing => new RegExp(ing, 'i')) }
    });

    // Find recipes that can be made with available ingredients
    const recipes = await Recipe.find({
      isActive: true,
      isPublic: true,
      'ingredients.ingredient': { 
        $in: availableIngredients.map(ing => new RegExp(ing, 'i')) 
      }
    }).limit(parseInt(limit));

    // Calculate match percentage for each recipe
    const recipesWithMatch = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(ing => ing.ingredient.toLowerCase());
      const availableInRecipe = availableIngredients.filter(available => 
        recipeIngredients.some(recipeIng => 
          recipeIng.includes(available.toLowerCase()) || available.toLowerCase().includes(recipeIng)
        )
      );
      
      const matchPercentage = Math.round((availableInRecipe.length / recipe.ingredients.length) * 100);
      
      return {
        ...recipe.toObject(),
        matchPercentage,
        availableIngredients: availableInRecipe,
        missingIngredients: recipe.ingredients.filter(ing => 
          !availableInRecipe.some(available => 
            ing.ingredient.toLowerCase().includes(available.toLowerCase()) || 
            available.toLowerCase().includes(ing.ingredient.toLowerCase())
          )
        ).map(ing => ing.ingredient)
      };
    });

    // Sort by match percentage
    recipesWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      success: true,
      recipes: recipesWithMatch,
      totalFound: recipesWithMatch.length,
      availableIngredients: availableIngredients,
      message: `Found ${recipesWithMatch.length} recipes matching your ingredients`
    });

  } catch (error) {
    console.error('Error suggesting recipes by ingredients:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error suggesting recipes',
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

// Get recipe by ID with ingredient availability
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { checkAvailability = false, numPeople, dietType = 'Veg' } = req .query;
    const recipe = await Recipe.findById(req.params.id)
      .populate('reviews.userId', 'name profile.avatar');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Increment view count
    await recipe.incrementViews();

    if (checkAvailability) {
      const availabilityResult = await recipeService.processRecipeRequest(
        recipe.name, 
        numPeople, 
        dietType
      );
      recipe.ingredientAvailability = {
        hasIngredients: (availabilityResult.availableItems?.length || 0) > 0,
        availableCount: availabilityResult.availableItems?.length || 0,
        missingCount: availabilityResult.missingItems?.length || 0,
        availabilityPercentage: availabilityResult.availableItems?.length > 0 ? 
          Math.round((availabilityResult.availableItems.length / ((availabilityResult.availableItems?.length || 0) + (availabilityResult.missingItems?.length || 0))) * 100) : 0
      };
    }

    res.status(200).json(recipe);

  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ 
      message: 'Error fetching recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get popular recipes with ingredient availability
router.get('/featured/popular', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, numPeople = 2, dietType = 'Veg' } = req.query;
    const recipes = await Recipe.getPopularRecipes(parseInt(limit));
    
    for (let recipe of recipes) {
      const availabilityResult = await recipeService.processRecipeRequest(
        recipe.name, 
        numPeople, 
        dietType
      );
      recipe.ingredientAvailability = {
        hasIngredients: (availabilityResult.availableItems?.length || 0) > 0,
        availableCount: availabilityResult.availableItems?.length || 0,
        missingCount: availabilityResult.missingItems?.length || 0,
        availabilityPercentage: availabilityResult.availableItems?.length > 0 ? 
          Math.round((availabilityResult.availableItems.length / ((availabilityResult.availableItems?.length || 0) + (availabilityResult.missingItems?.length || 0))) * 100) : 0
      };
    }

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

// Get trending recipes with ingredient availability
router.get('/featured/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, numPeople = 2, dietType = 'Veg' } = req.query;
    const recipes = await Recipe.getTrendingRecipes(parseInt(limit));
    
    for (let recipe of recipes) {
      const availabilityResult = await recipeService.processRecipeRequest(
        recipe.name, 
        numPeople, 
        dietType
      );
      recipe.ingredientAvailability = {
        hasIngredients: (availabilityResult.availableItems?.length || 0) > 0,
        availableCount: availabilityResult.availableItems?.length || 0,
        missingCount: availabilityResult.missingItems?.length || 0,
        availabilityPercentage: availabilityResult.availableItems?.length > 0 ? 
          Math.round((availabilityResult.availableItems.length / ((availabilityResult.availableItems?.length || 0) + (availabilityResult.missingItems?.length || 0))) * 100) : 0
      };
    }

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

// Get quick recipes with ingredient availability
router.get('/featured/quick', authenticateToken, async (req, res) => {
  try {
    const { maxTime = 30, limit = 10, numPeople = 2, dietType = 'Veg' } = req.query;
    const recipes = await Recipe.getQuickRecipes(parseInt(maxTime), parseInt(limit));
    
    for (let recipe of recipes) {
      const availabilityResult = await recipeService.processRecipeRequest(
        recipe.name, 
        numPeople, 
        dietType
      );
      recipe.ingredientAvailability = {
        hasIngredients: (availabilityResult.availableItems?.length || 0) > 0,
        availableCount: availabilityResult.availableItems?.length || 0,
        missingCount: availabilityResult.missingItems?.length || 0,
        availabilityPercentage: availabilityResult.availableItems?.length > 0 ? 
          Math.round((availabilityResult.availableItems.length / ((availabilityResult.availableItems?.length || 0) + (availabilityResult.missingItems?.length || 0))) * 100) : 0
      };
    }

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

// Get recipes by category with ingredient availability
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, numPeople = 2, dietType = 'Veg' } = req.query;
    
    const recipes = await Recipe.findByCategory(category, { limit: parseInt(limit) });
    
    for (let recipe of recipes) {
      const availabilityResult = await recipeService.processRecipeRequest(
        recipe.name, 
        numPeople, 
        dietType
      );
      recipe.ingredientAvailability = {
        hasIngredients: (availabilityResult.availableItems?.length || 0) > 0,
        availableCount: availabilityResult.availableItems?.length || 0,
        missingCount: availabilityResult.missingItems?.length || 0,
        availabilityPercentage: availabilityResult.availableItems?.length > 0 ? 
          Math.round((availabilityResult.availableItems.length / ((availabilityResult.availableItems?.length || 0) + (availabilityResult.missingItems?.length || 0))) * 100) : 0
      };
    }

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

// Scale recipe with ingredient availability
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

// Get recipe shopping list with ingredient availability
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