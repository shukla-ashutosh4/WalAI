const Recipe = require('../models/Recipe');

class RecipeParser {
  static parseIngredients(ingredients) {
    return ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category || 'Common',
      isEssential: ingredient.isEssential !== undefined ? ingredient.isEssential : true
    }));
  }

  static parseInstructions(instructions) {
    return instructions.map((instruction, index) => ({
      step: index + 1,
      instruction: instruction
    }));
  }

  static async saveRecipe(recipeData) {
    const parsedIngredients = this.parseIngredients(recipeData.ingredients);
    const parsedInstructions = this.parseInstructions(recipeData.instructions);

    const recipe = new Recipe({
      name: recipeData.name,
      servings: recipeData.servings,
      category: recipeData.category,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      tags: recipeData.tags,
      nutritionInfo: recipeData.nutritionInfo
    });

    return await recipe.save();
  }
}

module.exports = RecipeParser;