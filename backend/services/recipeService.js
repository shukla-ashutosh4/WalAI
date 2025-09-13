const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const groqService = require('./groqService');

class RecipeService {
  async processRecipeRequest(dishName, numPeople, dietType = 'Veg') {
    try {
      console.log(`🔍 Processing recipe request: ${dishName} for ${numPeople} people (${dietType})`);
      
      // Step 1: Generate recipe using Groq
      const recipeData = await groqService.generateIngredients(dishName, numPeople, dietType);
      
      // Step 2: Match ingredients with inventory (RAG functionality)
      const inventoryCheck = await this.matchInventoryWithRAG(recipeData.ingredients);
      
      // Step 3: Separate available and missing items
      const availableItems = inventoryCheck.filter(item => item.inStock && item.hasEnoughStock);
      const missingItems = inventoryCheck.filter(item => !item.inStock || !item.hasEnoughStock);
      
      // Step 4: Get recommendations
      const recommendations = await groqService.getRecommendations(dishName);
      
      // Step 5: Find recommendation products in inventory
      const recommendationProducts = await this.findRecommendationProducts(recommendations);
      
      // Step 6: Save recipe to database
      const savedRecipe = await this.saveRecipe(recipeData);
      
      // Step 7: Calculate statistics
      const totalCost = this.calculateTotalCost(availableItems);
      const availabilityPercentage = Math.round((availableItems.length / inventoryCheck.length) * 100);
      
      console.log(`✅ Recipe processed: ${availableItems.length}/${inventoryCheck.length} ingredients available (${availabilityPercentage}%)`);
      
      return {
        success: true,
        recipe: savedRecipe,
        inventoryCheck,
        recommendations: recommendationProducts,
        availableItems: availableItems.map(item => ({
          name: item.name || item.ingredient,
          ingredient: item.ingredient,
          requiredQuantity: item.quantity,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          totalPrice: item.totalPrice,
          inventoryId: item.inventoryId,
          productId: item.productId,
          category: item.category,
          isEssential: item.isEssential,
          availableQuantity: item.availableQuantity,
          image: item.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(item.name || item.ingredient)}`
        })),
        missingItems: missingItems.map(item => ({
          name: item.name || item.ingredient,
          ingredient: item.ingredient,
          requiredQuantity: item.quantity,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          isEssential: item.isEssential,
          alternatives: item.alternatives || [],
          reason: item.inStock ? 'Insufficient quantity' : 'Not in stock'
        })),
        totalCost: totalCost,
        availabilityPercentage: availabilityPercentage,
        canMakeRecipe: availableItems.length > 0,
        hasAllIngredients: missingItems.length === 0,
        dishName: dishName,
        servings: numPeople,
        dietType: dietType,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Recipe processing error:', error);
      
      // Return a structured error response
      return {
        success: false,
        recipe: null,
        availableItems: [],
        missingItems: [],
        totalCost: 0,
        availabilityPercentage: 0,
        canMakeRecipe: false,
        hasAllIngredients: false,
        error: error.message,
        dishName: dishName,
        servings: numPeople,
        dietType: dietType
      };
    }
  }

  // Enhanced inventory matching with RAG (Retrieval-Augmented Generation)
  async matchInventoryWithRAG(ingredients) {
    const results = [];
    
    for (const ingredient of ingredients) {
      try {
        console.log(`🔍 Searching for: ${ingredient.ingredient}`);
        
        // Step 1: Exact name match
        let inventoryItem = await Inventory.findOne({
          name: { $regex: new RegExp(`^${ingredient.ingredient}$`, 'i') },
          inStock: true
        }).populate('productId');

        // Step 2: Partial name match
        if (!inventoryItem) {
          inventoryItem = await Inventory.findOne({
            name: { $regex: new RegExp(ingredient.ingredient, 'i') },
            inStock: true
          }).populate('productId');
        }

        // Step 3: Search in keywords and tags
        if (!inventoryItem) {
          inventoryItem = await Inventory.findOne({
            $or: [
              { searchKeywords: { $in: [new RegExp(ingredient.ingredient, 'i')] } },
              { tags: { $in: [new RegExp(ingredient.ingredient, 'i')] } }
            ],
            inStock: true
          }).populate('productId');
        }

        // Step 4: Advanced semantic search
        if (!inventoryItem) {
          inventoryItem = await this.semanticSearch(ingredient.ingredient);
        }

        if (inventoryItem) {
          const requiredQuantity = ingredient.quantity || 1;
          const availableQuantity = inventoryItem.quantity || 0;
          const hasEnoughStock = availableQuantity >= requiredQuantity;
          
          results.push({
            ingredient: ingredient.ingredient,
            name: inventoryItem.name,
            quantity: requiredQuantity,
            unit: ingredient.unit || inventoryItem.unit || 'pieces',
            category: ingredient.category || inventoryItem.category,
            isEssential: ingredient.isEssential !== false,
            inStock: true,
            availableQuantity: availableQuantity,
            price: inventoryItem.price || 2.99,
            productId: inventoryItem.productId?._id || inventoryItem._id,
            inventoryId: inventoryItem._id,
            totalPrice: ((inventoryItem.price || 2.99) * requiredQuantity).toFixed(2),
            hasEnoughStock: hasEnoughStock,
            image: inventoryItem.productId?.image || inventoryItem.image,
            description: inventoryItem.productId?.description || `Fresh ${inventoryItem.name}`,
            stockStatus: hasEnoughStock ? 'available' : 'insufficient'
          });
          console.log(`✅ Found: ${inventoryItem.name} (${availableQuantity} ${ingredient.unit || 'pieces'} available)`);
        } else {
          // Find alternatives
          const alternatives = await this.findAlternatives(ingredient.ingredient, ingredient.category);
          results.push({
            ingredient: ingredient.ingredient,
            name: ingredient.ingredient,
            quantity: ingredient.quantity || 1,
            unit: ingredient.unit || 'pieces',
            category: ingredient.category || 'Common',
            isEssential: ingredient.isEssential !== false,
            inStock: false,
            availableQuantity: 0,
            price: 0,
            productId: null,
            inventoryId: null,
            totalPrice: 0,
            hasEnoughStock: false,
            alternatives: alternatives,
            stockStatus: 'unavailable'
          });
          console.log(`❌ Not found: ${ingredient.ingredient}`);
        }
      } catch (error) {
        console.error(`Error matching ingredient ${ingredient.ingredient}:`, error);
        results.push({
          ingredient: ingredient.ingredient,
          name: ingredient.ingredient,
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || 'pieces',
          category: ingredient.category || 'Common',
          isEssential: ingredient.isEssential !== false,
          inStock: false,
          availableQuantity: 0,
          price: 0,
          productId: null,
          inventoryId: null,
          totalPrice: 0,
          hasEnoughStock: false,
          alternatives: [],
          stockStatus: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  // Enhanced semantic search for better ingredient matching
  async semanticSearch(ingredientName) {
    const synonyms = {
      'pasta': ['spaghetti', 'penne', 'fusilli', 'noodles', 'macaroni', 'linguine'],
      'cheese': ['mozzarella', 'parmesan', 'cheddar', 'swiss', 'gouda', 'feta'],
      'sauce': ['tomato sauce', 'white sauce', 'marinara', 'alfredo', 'pesto'],
      'oil': ['olive oil', 'cooking oil', 'vegetable oil', 'canola oil', 'sunflower oil'],
      'meat': ['chicken', 'beef', 'ground beef', 'chicken breast', 'pork', 'turkey'],
      'vegetables': ['onions', 'garlic', 'bell peppers', 'spinach', 'tomatoes', 'carrots'],
      'herbs': ['basil', 'oregano', 'thyme', 'parsley', 'cilantro', 'rosemary'],
      'spices': ['salt', 'pepper', 'paprika', 'cumin', 'turmeric', 'chili powder'],
      'dairy': ['milk', 'butter', 'cream', 'yogurt', 'sour cream'],
      'grains': ['rice', 'quinoa', 'barley', 'oats', 'wheat', 'flour'],
      'legumes': ['beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans']
    };

    // Find synonyms and related terms
    let searchTerms = [ingredientName];
    const ingredientLower = ingredientName.toLowerCase();
    
    for (const [category, items] of Object.entries(synonyms)) {
      if (items.some(item => ingredientLower.includes(item.toLowerCase()) || item.toLowerCase().includes(ingredientLower))) {
        searchTerms.push(...items);
      }
      if (ingredientLower.includes(category)) {
        searchTerms.push(...items);
      }
    }

    // Remove duplicates and search
    searchTerms = [...new Set(searchTerms)];
    
    for (const term of searchTerms) {
      const item = await Inventory.findOne({
        $or: [
          { name: { $regex: new RegExp(term, 'i') } },
          { searchKeywords: { $in: [new RegExp(term, 'i')] } },
          { tags: { $in: [new RegExp(term, 'i')] } }
        ],
        inStock: true
      }).populate('productId');

      if (item) {
        console.log(`🔍 Semantic match found: ${term} -> ${item.name}`);
        return item;
      }
    }

    return null;
  }

  // Enhanced alternatives finder
  async findAlternatives(ingredientName, category) {
    try {
      const alternatives = await Inventory.find({
        $and: [
          {
            $or: [
              { category: category },
              { tags: { $in: [new RegExp(ingredientName, 'i')] } },
              { searchKeywords: { $in: [new RegExp(ingredientName, 'i')] } },
              { name: { $regex: new RegExp(ingredientName.split(' ')[0], 'i') } } // First word match
            ]
          },
          { inStock: true },
          { quantity: { $gt: 0 } }
        ]
      }).populate('productId').limit(5);

      return alternatives.map(alt => ({
        name: alt.name,
        price: alt.price,
        productId: alt.productId?._id || alt._id,
        inventoryId: alt._id,
        quantity: alt.quantity,
        unit: alt.unit,
        category: alt.category,
        similarity: this.calculateSimilarity(ingredientName, alt.name),
        reason: `Alternative for ${ingredientName}`
      })).sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Error finding alternatives:', error);
      return [];
    }
  }

  // Calculate similarity between ingredient names
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Simple similarity calculation
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Enhanced recommendation products finder
  async findRecommendationProducts(recommendations) {
    const products = [];
    
    for (const rec of recommendations) {
      try {
        const product = await Inventory.findOne({
          $or: [
            { name: { $regex: new RegExp(rec, 'i') } },
            { searchKeywords: { $in: [new RegExp(rec, 'i')] } },
            { tags: { $in: [new RegExp(rec, 'i')] } }
          ],
          inStock: true,
          quantity: { $gt: 0 }
        }).populate('productId');

        if (product) {
          products.push({
            name: product.name,
            price: product.price,
            productId: product.productId?._id || product._id,
            inventoryId: product._id,
            originalRecommendation: rec,
            reason: 'Complements your recipe',
            category: product.category,
            image: product.productId?.image || product.image,
            description: product.productId?.description || `Great addition to your recipe`,
            quantity: product.quantity,
            unit: product.unit
          });
        }
      } catch (error) {
        console.error(`Error finding recommendation ${rec}:`, error);
      }
    }

    return products;
  }

  // Enhanced recipe saving with better error handling
  async saveRecipe(recipeData) {
    try {
      const existingRecipe = await Recipe.findOne({ 
        name: { $regex: new RegExp(`^${recipeData.dish}$`, 'i') }
      });
      
      if (existingRecipe) {
        // Update view count and return existing recipe
        existingRecipe.statistics = existingRecipe.statistics || {};
        existingRecipe.statistics.views = (existingRecipe.statistics.views || 0) + 1;
        await existingRecipe.save();
        return existingRecipe;
      }

      const newRecipe = new Recipe({
        name: recipeData.dish,
        category: recipeData.dietType || 'General',
        servings: recipeData.servings || 2,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        prepTime: recipeData.prepTime || 30,
        cookTime: recipeData.cookTime || 30,
        nutritionInfo: recipeData.nutritionInfo || {},
        createdBy: 'AI',
        source: 'Groq',
        isActive: true,
        isPublic: true,
        tags: [recipeData.dietType, 'AI-generated'],
        statistics: {
          views:  0,
          likes: 0,
          saves: 0
        }
      });
      
      return await newRecipe.save();
    } catch (error) {
      console.error('Error saving recipe:', error);
      return {
        name: recipeData.dish,
        category: recipeData.dietType || 'General',
        servings: recipeData.servings || 2,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        prepTime: recipeData.prepTime || 30,
        cookTime: recipeData.cookTime || 30,
        error: error.message
      };
    }
  }

  calculateTotalCost(availableItems) {
    return availableItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0).toFixed(2);
  }

  // Get recipe by ID
  async getRecipeById(recipeId) {
    try {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) throw new Error('Recipe not found');
      return recipe;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  }

  // Search recipes
  async searchRecipes(query, filters = {}) {
    try {
      const searchCriteria = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };

      if (filters.category) {
        searchCriteria.category = filters.category;
      }

      if (filters.maxPrepTime) {
        searchCriteria.prepTime = { $lte: filters.maxPrepTime };
      }

      const recipes = await Recipe.find(searchCriteria).limit(10);
      return recipes;
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }
}

module.exports = new RecipeService();