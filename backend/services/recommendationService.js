const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');
const User = require('../models/User');

class RecommendationService {
  constructor() {
    this.similarityThreshold = 0.6;
  }

  async getCartRecommendations(cartItems, dietType = 'Veg') {
    try {
      const recommendations = [];
      
      // Get ingredient-based recommendations
      for (const item of cartItems) {
        const ingredientRecs = await this.getIngredientBasedRecommendations(item, dietType);
        recommendations.push(...ingredientRecs);
      }

      // Get category-based recommendations
      const categoryRecs = await this.getCategoryBasedRecommendations(cartItems, dietType);
      recommendations.push(...categoryRecs);

      // Get complementary item recommendations
      const complementaryRecs = await this.getComplementaryRecommendations(cartItems, dietType);
      recommendations.push(...complementaryRecs);

      // Remove duplicates and sort by relevance score
      const uniqueRecommendations = this.removeDuplicatesAndSort(recommendations);
      
      return uniqueRecommendations.slice(0, 8); // Return top 8 recommendations
    } catch (error) {
      console.error('Error getting cart recommendations:', error);
      throw error;
    }
  }

  async getIngredientBasedRecommendations(item, dietType) {
    try {
      const recommendations = [];
      
      // Find similar ingredients based on tags and categories
      const similarItems = await Inventory.find({
        $and: [
          { _id: { $ne: item._id } }, // Exclude the current item
          { inStock: true },
          {
            $or: [
              { category: item.category },
              { tags: { $in: item.tags || [] } },
              { name: { $regex: this.generateSimilarityPattern(item.name), $options: 'i' } }
            ]
          }
        ]
      }).populate('productId').limit(5);

      similarItems.forEach(similarItem => {
        const relevanceScore = this.calculateRelevanceScore(item, similarItem);
        if (relevanceScore > this.similarityThreshold) {
          recommendations.push({
            type: 'ingredient_similarity',
            item: similarItem,
            relevanceScore,
            reason: `Similar to ${item.name}`
          });
        }
      });

      return recommendations;
    } catch (error) {
      console.error('Error getting ingredient-based recommendations:', error);
      return [];
    }
  }

  async getCategoryBasedRecommendations(cartItems, dietType) {
    try {
      const recommendations = [];
      const cartCategories = [...new Set(cartItems.map(item => item.category))];
      const cartItemIds = cartItems.map(item => item._id);

      // Find popular items in the same categories
      const categoryItems = await Inventory.find({
        $and: [
          { _id: { $nin: cartItemIds } },
          { inStock: true },
          { category: { $in: cartCategories } }
        ]
      }).populate('productId').limit(6);

      categoryItems.forEach(categoryItem => {
        recommendations.push({
          type: 'category_match',
          item: categoryItem,
          relevanceScore: 0.7,
          reason: `Popular in ${categoryItem.category} category`
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Error getting category-based recommendations:', error);
      return [];
    }
  }

  async getComplementaryRecommendations(cartItems, dietType) {
    try {
      const recommendations = [];
      const complementaryMap = this.getComplementaryItemsMap();
      
      for (const item of cartItems) {
        const itemType = this.getItemType(item.name);
        const complementaryTypes = complementaryMap[itemType] || [];
        
        for (const compType of complementaryTypes) {
          const complementaryItems = await this.findItemsByType(compType, dietType, cartItems.map(i => i._id));
          
          complementaryItems.forEach(compItem => {
            recommendations.push({
              type: 'complementary',
              item: compItem,
              relevanceScore: 0.8,
              reason: `Goes well with ${item.name}`
            });
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting complementary recommendations:', error);
      return [];
    }
  }

  async getMealPlanRecommendations(userId, preferences = {}) {
    try {
      const user = await User.findById(userId);
      const userPurchaseHistory = user?.purchaseHistory || [];
      
      // Analyze user's previous purchases
      const preferredCategories = this.analyzePreferences(userPurchaseHistory);
      
      // Get popular recipes based on user preferences
      const recommendedRecipes = await Recipe.find({
        $and: [
          { category: { $in: preferences.dietTypes || ['Veg'] } },
          { tags: { $in: preferredCategories } }
        ]
      }).limit(14); // 2 weeks worth of meals

      // Generate weekly meal plan
      const weeklyPlan = this.generateWeeklyMealPlan(recommendedRecipes, preferences);
      
      return weeklyPlan;
    } catch (error) {
      console.error('Error getting meal plan recommendations:', error);
      throw error;
    }
  }

  // Helper methods
  generateSimilarityPattern(itemName) {
    const keywords = this.extractKeywords(itemName);
    return keywords.join('|');
  }

  extractKeywords(text) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  calculateRelevanceScore(item1, item2) {
    let score = 0;
    
    // Category match
    if (item1.category === item2.category) score += 0.3;
    
    // Tag similarity
    const commonTags = (item1.tags || []).filter(tag => (item2.tags || []).includes(tag));
    score += commonTags.length * 0.1;
    
    // Name similarity
    const nameSimilarity = this.calculateStringSimilarity(item1.name, item2.name);
    score += nameSimilarity * 0.4;
    
    // Price range similarity
    const priceDiff = Math.abs((item1.price || 0) - (item2.price || 0));
    const maxPrice = Math.max(item1.price || 0, item2.price || 0);
    if (maxPrice > 0) {
      const priceScore = 1 - (priceDiff / maxPrice);
      score += priceScore * 0.2;
    }
    
    return Math.min(score, 1);
  }

  calculateStringSimilarity(str1, str2) {
    const words1 = new Set(this.extractKeywords(str1));
    const words2 = new Set(this.extractKeywords(str2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  getComplementaryItemsMap() {
    return {
      pasta: ['cheese', 'sauce', 'herbs', 'garlic', 'olive oil', 'bread'],
      cheese: ['bread', 'crackers', 'pasta', 'sauce'],
      sauce: ['pasta', 'bread', 'cheese', 'herbs'],
      bread: ['butter', 'cheese', 'spreads'],
      meat: ['vegetables', 'spices', 'sauce', 'pasta'],
      vegetables: ['spices', 'oil', 'garlic', 'onions'],
      spices: ['oil', 'garlic', 'vegetables', 'meat'],
      oil: ['spices', 'garlic', 'vegetables', 'pasta']
    };
  }

  getItemType(itemName) {
    const typeMap = {
      pasta: ['pasta', 'spaghetti', 'penne', 'fusilli', 'noodles'],
      cheese: ['cheese', 'mozzarella', 'parmesan', 'cheddar'],
      sauce: ['sauce', 'tomato sauce', 'white sauce', 'pesto', 'marinara'],
      bread: ['bread', 'baguette', 'focaccia'],
      meat: ['chicken', 'beef', 'ground beef', 'meat'],
      vegetables: ['vegetables', 'onions', 'garlic', 'spinach', 'bell peppers'],
      spices: ['spice', 'herbs', 'basil', 'oregano', 'thyme', 'salt', 'pepper'],
      oil: ['oil', 'olive oil', 'cooking oil']
    };

    const lowerName = itemName.toLowerCase();
    
    for (const [type, keywords] of Object.entries(typeMap)) {
      if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        return type;
      }
    }
    
    return 'other';
  }

  async findItemsByType(itemType, dietType, excludeIds = []) {
    const keywords = this.getKeywordsForType(itemType);
    
    const items = await Inventory.find({
      $and: [
        { _id: { $nin: excludeIds } },
        { inStock: true },
        { category: { $in: [dietType, 'Common'] } },
        { 
          $or: [
            { name: { $regex: keywords.join('|'), $options: 'i' } },
            { tags: { $in: keywords.map(k => new RegExp(k, 'i')) } }
          ]
        }
      ]
    }).populate('productId').limit(3);

    return items;
  }

  getKeywordsForType(itemType) {
    const keywordMap = {
      pasta: ['pasta', 'spaghetti', 'penne'],
      cheese: ['cheese', 'mozzarella', 'parmesan'],
      sauce: ['sauce', 'tomato', 'marinara'],
      bread: ['bread', 'focaccia', 'garlic bread'],
      meat: ['chicken', 'beef', 'protein'],
      vegetables: ['onion', 'garlic', 'spinach'],
      spices: ['herbs', 'basil', 'oregano'],
      oil: ['oil', 'olive']
    };

    return keywordMap[itemType] || [itemType];
  }

  analyzePreferences(purchaseHistory) {
    const categories = {};
    purchaseHistory.forEach(purchase => {
      purchase.items?.forEach(item => {
        const category = item.category || 'other';
        categories[category] = (categories[category] || 0) + 1;
      });
    });

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  generateWeeklyMealPlan(recipes, preferences) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    
    const weeklyPlan = {};
    
    days.forEach(day => {
      weeklyPlan[day] = {};
      mealTypes.forEach(mealType => {
        const suitableRecipes = recipes.filter(recipe => 
          this.isSuitableForMealType(recipe, mealType)
        );
        
        if (suitableRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * suitableRecipes.length);
          weeklyPlan[day][mealType] = suitableRecipes[randomIndex];
        }
      });
    });
    
    return weeklyPlan;
  }

  isSuitableForMealType(recipe, mealType) {
    const breakfastKeywords = ['breakfast', 'cereal', 'oats', 'pancake', 'toast', 'egg'];
    const lunchKeywords = ['lunch', 'salad', 'sandwich', 'soup', 'pasta', 'light'];
    const dinnerKeywords = ['dinner', 'pasta', 'chicken', 'beef', 'baked', 'heavy'];
    
    const recipeName = recipe.name.toLowerCase();
    const recipeTags = (recipe.tags || []).join(' ').toLowerCase();
    const searchText = `${recipeName} ${recipeTags}`;
    
    switch (mealType) {
      case 'breakfast':
        return breakfastKeywords.some(keyword => searchText.includes(keyword)) || recipe.prepTime <= 20;
      case 'lunch':
        return lunchKeywords.some(keyword => searchText.includes(keyword)) || (recipe.prepTime <= 45 && recipe.cookTime <= 30);
      case 'dinner':
        return dinnerKeywords.some(keyword => searchText.includes(keyword)) || true; // Most recipes work for dinner
      default:
        return true;
    }
  }

  removeDuplicatesAndSort(recommendations) {
    const uniqueMap = new Map();
    
    recommendations.forEach(rec => {
      const itemId = rec.item._id.toString();
      if (!uniqueMap.has(itemId) || uniqueMap.get(itemId).relevanceScore < rec.relevanceScore) {
        uniqueMap.set(itemId, rec);
      }
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Get trending recommendations
  async getTrendingItems(limit = 5) {
    try {
      // Simple trending logic - can be enhanced with actual purchase data
      const trendingItems = await Inventory.find({
        inStock: true,
        quantity: { $gte: 5 }
      }).sort({ createdAt: -1 }).limit(limit).populate('productId');

      return trendingItems.map(item => ({
        type: 'trending',
        item: item,
        relevanceScore: 0.9,
        reason: 'Trending now'
      }));
    } catch (error) {
      console.error('Error getting trending items:', error);
      return [];
    }
  }

  // Get seasonal recommendations
  async getSeasonalRecommendations(season = 'all') {
    try {
      const seasonalTags = {
        spring: ['fresh', 'light', 'salad', 'vegetables'],
        summer: ['cold', 'fresh', 'light', 'fruits'],
        fall: ['warm', 'comfort', 'pasta', 'soup'],
        winter: ['warm', 'comfort', 'hearty', 'baked']
      };

      const currentSeason = season === 'all' ? this.getCurrentSeason() : season;
      const tags = seasonalTags[currentSeason] || seasonalTags.fall;

      const seasonalItems = await Inventory.find({
        $and: [
          { inStock: true },
          { tags: { $in: tags.map(tag => new RegExp(tag, 'i')) } }
        ]
      }).populate('productId').limit(6);

      return seasonalItems.map(item => ({
        type: 'seasonal',
        item: item,
        relevanceScore: 0.8,
        reason: `Perfect for ${currentSeason}`
      }));
    } catch (error) {
      console.error('Error getting seasonal recommendations:', error);
      return [];
    }
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

module.exports = new RecommendationService();