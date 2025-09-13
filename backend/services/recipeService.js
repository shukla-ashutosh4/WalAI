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
      
      // Step 3: Get recommendations
      const recommendations = groqService.getRecommendations(dishName);
      
      // Step 4: Find recommendation products in inventory
      const recommendationProducts = await this.findRecommendationProducts(recommendations);
      
      // Step 5: Save recipe to database
      const savedRecipe = await this.saveRecipe(recipeData);
      
      return {
        recipe: savedRecipe,
        inventoryCheck,
        recommendations: recommendationProducts,
        availableItems: inventoryCheck.filter(item => item.inStock && item.availableQuantity >= item.quantity),
        missingItems: inventoryCheck.filter(item => !item.inStock || item.availableQuantity < item.quantity),
        totalCost: this.calculateTotalCost(inventoryCheck.filter(item => item.inStock && item.availableQuantity >= item.quantity))
      };
    } catch (error) {
      console.error('Recipe processing error:', error);
      throw error;
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
          const isAvailableQuantity = inventoryItem.quantity >= ingredient.quantity;
          results.push({
            ingredient: ingredient.ingredient,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category,
            isEssential: ingredient.isEssential,
            inStock: true,
            availableQuantity: inventoryItem.quantity,
            price: inventoryItem.price,
            productId: inventoryItem.productId._id,
            inventoryId: inventoryItem._id,
            totalPrice: (inventoryItem.price * ingredient.quantity).toFixed(2),
            hasEnoughStock: isAvailableQuantity,
            name: inventoryItem.name
          });
          console.log(`✅ Found: ${inventoryItem.name}`);
        } else {
          // Find alternatives
          const alternatives = await this.findAlternatives(ingredient.ingredient, ingredient.category);
          results.push({
            ingredient: ingredient.ingredient,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category,
            isEssential: ingredient.isEssential,
            inStock: false,
            availableQuantity: 0,
            price: 0,
            productId: null,
            inventoryId: null,
            totalPrice: 0,
            hasEnoughStock: false,
            alternatives: alternatives
          });
                   console.log(`❌ Not found: ${ingredient.ingredient}`);
        }
      } catch (error) {
        console.error(`Error matching ingredient ${ingredient.ingredient}:`, error);
        results.push({
          ingredient: ingredient.ingredient,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category,
          isEssential: ingredient.isEssential,
          inStock: false,
          availableQuantity: 0,
          price: 0,
          productId: null,
          inventoryId: null,
          totalPrice: 0,
          hasEnoughStock: false,
          alternatives: []
        });
      }
    }

    return results;
  }

  // Semantic search for better ingredient matching
  async semanticSearch(ingredientName) {
    const synonyms = {
      'pasta': ['spaghetti', 'penne', 'fusilli', 'noodles'],
      'cheese': ['mozzarella', 'parmesan', 'cheddar'],
      'sauce': ['tomato sauce', 'white sauce', 'marinara', 'alfredo'],
      'oil': ['olive oil', 'cooking oil', 'vegetable oil'],
      'meat': ['chicken', 'beef', 'ground beef', 'chicken breast'],
      'vegetables': ['onions', 'garlic', 'bell peppers', 'spinach'],
      'herbs': ['basil', 'oregano', 'thyme', 'parsley']
    };

    // Find synonyms
    let searchTerms = [ingredientName];
    for (const [category, items] of Object.entries(synonyms)) {
      if (items.some(item => ingredientName.toLowerCase().includes(item.toLowerCase()))) {
        searchTerms.push(...items);
      }
    }

    // Search with synonyms
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
        return item;
      }
    }

    return null;
  }

  // Find alternatives for missing ingredients
  async findAlternatives(ingredientName, category) {
    try {
      const alternatives = await Inventory.find({
        $and: [
          {
            $or: [
              { category: category },
              { tags: { $in: [new RegExp(ingredientName, 'i')] } },
              { searchKeywords: { $in: [new RegExp(ingredientName, 'i')] } }
            ]
          },
          { inStock: true }
        ]
      }).populate('productId').limit(3);

      return alternatives.map(alt => ({
        name: alt.name,
        price: alt.price,
        productId: alt.productId._id,
        inventoryId: alt._id,
        quantity: alt.quantity,
        unit: alt.unit
      }));
    } catch (error) {
      console.error('Error finding alternatives:', error);
      return [];
    }
  }

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
          inStock: true
        }).populate('productId');

        if (product) {
          products.push({
            name: product.name,
            price: product.price,
            productId: product.productId._id,
            inventoryId: product._id,
            originalRecommendation: rec,
            reason: 'Complements your recipe'
          });
        }
      } catch (error) {
        console.error(`Error finding recommendation ${rec}:`, error);
      }
    }

    return products;
  }

  async saveRecipe(recipeData) {
    try {
      const existingRecipe = await Recipe.findOne({ name: recipeData.dish });
      
      if (existingRecipe) {
        return existingRecipe;
      }

      const newRecipe = new Recipe({
        name: recipeData.dish,
        category: recipeData.dietType,
        servings: recipeData.servings,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        nutritionInfo: recipeData.nutritionInfo,
        createdBy: 'AI',
        source: 'Groq'
      });
      
      return await newRecipe.save();
    } catch (error) {
      console.error('Error saving recipe:', error);
      return {
        name: recipeData.dish,
        category: recipeData.dietType,
        servings: recipeData.servings,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime
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