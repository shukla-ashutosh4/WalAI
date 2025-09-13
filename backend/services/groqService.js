const axios = require('axios');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async generateIngredients(dishName, numPeople, dietType = 'Veg') {
    const systemPrompt = `You are a professional chef assistant. Given a dish name, number of people, and dietary preference, respond only with valid JSON:
{
  "dish": "<dish_name>",
  "servings": <number>,
  "dietType": "<diet_type>",
  "ingredients": [
    {
      "ingredient": "<ingredient_name>",
      "quantity": <number>,
      "unit": "<unit>",
      "category": "<Veg/Non-Veg/Vegan/Common>",
      "isEssential": <boolean>,
      "preparationNotes": "<optional preparation instructions>"
    }
  ],
  "instructions": [
    {
      "stepNumber": <number>,
      "instruction": "<detailed step>",
      "estimatedTime": <minutes>,
      "tips": "<optional cooking tips>"
    }
  ],
  "prepTime": <minutes>,
  "cookTime": <minutes>,
  "difficulty": "<easy/medium/hard>",
  "cuisine": "<cuisine_type>",
  "nutritionInfo": {
    "calories": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>,
    "fiber": <number>,
    "perServing": true
  },
  "tags": ["<tag1>", "<tag2>"],
  "equipment": ["<equipment1>", "<equipment2>"],
  "allergens": ["<allergen1>", "<allergen2>"]
}`;

    try {
      if (!this.apiKey) {
        console.log('⚠️  No Groq API key found, using fallback recipe');
        return this.getFallbackRecipe(dishName, numPeople, dietType);
      }

      const userPrompt = `Generate a detailed recipe for: ${dishName} for ${numPeople} people, ${dietType} diet. 
      Make sure the recipe is authentic, practical, and includes proper measurements. 
      Consider dietary restrictions for ${dietType} diet type.`;

      let lastError;
      
      // Retry mechanism
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(`🔄 Attempting Groq API call (${attempt}/${this.maxRetries}) for: ${dishName}`);
          
          const response = await axios.post(`${this.baseURL}/chat/completions`, {
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            stream: false,
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 0.9
          }, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          });

          if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response structure from Groq API');
          }

          const result = JSON.parse(response.data.choices[0].message.content);
          
          // Validate the response structure
          if (!this.validateRecipeResponse(result)) {
            throw new Error('Invalid recipe structure from API');
          }

          console.log('✅ Successfully generated recipe from Groq API');
          
          return this.formatRecipeResponse(result, dishName, numPeople, dietType);

        } catch (error) {
          lastError = error;
          console.error(`❌ Groq API attempt ${attempt} failed:`, error.message);
          
          // If it's a rate limit error, wait longer
          if (error.response?.status === 429) {
            const waitTime = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
            await this.sleep(waitTime);
            continue;
          }
          
          // If it's the last attempt or a non-retryable error, break
          if (attempt === this.maxRetries || error.response?.status === 401) {
            break;
          }
          
          // Wait before retry
          await this.sleep(this.retryDelay);
        }
      }

      console.log('⚠️  All Groq API attempts failed, using fallback recipe');
      return this.getFallbackRecipe(dishName, numPeople, dietType);

    } catch (error) {
      console.error('Groq API error:', error);
      return this.getFallbackRecipe(dishName, numPeople, dietType);
    }
  }

  validateRecipeResponse(result) {
    return (
      result &&
      typeof result === 'object' &&
      result.dish &&
      Array.isArray(result.ingredients) &&
      Array.isArray(result.instructions) &&
      result.ingredients.length > 0 &&
      result.instructions.length > 0
    );
  }

  formatRecipeResponse(result, dishName, numPeople, dietType) {
    return {
      dish: result.dish || dishName,
      servings: result.servings || numPeople,
      dietType: result.dietType || dietType,
      ingredients: result.ingredients.map((ing, index) => ({
        ingredient: ing.ingredient || ing.name || `Ingredient ${index + 1}`,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'pieces',
        category: ing.category || 'Common',
        isEssential: ing.isEssential !== false, // Default to true
        preparationNotes: ing.preparationNotes || ''
      })),
      instructions: result.instructions.map((inst, index) => {
        if (typeof inst === 'string') {
          return {
            stepNumber: index + 1,
            instruction: inst,
            estimatedTime: 5,
            tips: ''
          };
        }
        return {
          stepNumber: inst.stepNumber || index + 1,
          instruction: inst.instruction || inst,
          estimatedTime: inst.estimatedTime || 5,
          tips: inst.tips || ''
        };
      }),
      prepTime: result.prepTime || 15,
      cookTime: result.cookTime || 30,
      difficulty: result.difficulty || 'medium',
      cuisine: result.cuisine || 'international',
      nutritionInfo: {
        calories: result.nutritionInfo?.calories || 350,
        protein: result.nutritionInfo?.protein || 15,
        carbs: result.nutritionInfo?.carbs || 45,
        fat: result.nutritionInfo?.fat || 12,
        fiber: result.nutritionInfo?.fiber || 3,
        perServing: result.nutritionInfo?.perServing !== false
      },
      tags: result.tags || this.generateDefaultTags(dishName, dietType),
      equipment: result.equipment || ['stove', 'pan', 'pot'],
      allergens: result.allergens || []
    };
  }

  generateDefaultTags(dishName, dietType) {
    const tags = [dietType.toLowerCase()];
    
    if (dishName.toLowerCase().includes('pasta')) {
      tags.push('pasta', 'italian', 'comfort-food');
    }
    if (dishName.toLowerCase().includes('chicken')) {
      tags.push('protein', 'main-course');
    }
    if (dishName.toLowerCase().includes('quick') || dishName.toLowerCase().includes('easy')) {
      tags.push('quick', 'easy');
    }
    
    return tags;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getFallbackRecipe(dishName, numPeople, dietType) {
    const dishKey = dishName.toLowerCase();
    
    // Enhanced recipe database with more variety
    const recipes = {
      'chicken pasta': {
        ingredients: [
          { ingredient: "penne pasta", quantity: 200 * numPeople, unit: "g", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "chicken breast", quantity: 150 * numPeople, unit: "g", category: "Non-Veg", isEssential: true, preparationNotes: "cut into bite-sized pieces" },
          { ingredient: "tomato sauce", quantity: 100 * numPeople, unit: "ml", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "olive oil", quantity: 2 * numPeople, unit: "tbsp", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "garlic", quantity: 2 * numPeople, unit: "cloves", category: "Veg", isEssential: true, preparationNotes: "minced" },
          { ingredient: "onions", quantity: 1 * numPeople, unit: "medium", category: "Veg", isEssential: false, preparationNotes: "diced" },
          { ingredient: "parmesan cheese", quantity: 50 * numPeople, unit: "g", category: "Veg", isEssential: false, preparationNotes: "grated" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Heat olive oil in a large pan over medium heat", estimatedTime: 2, tips: "Use a pan large enough to hold all ingredients" },
          { stepNumber: 2, instruction: "Sauté diced onions and minced garlic until fragrant and translucent", estimatedTime: 3, tips: "Don't let garlic burn" },
          { stepNumber: 3, instruction: "Add chicken breast pieces and cook until golden brown on all sides", estimatedTime: 8, tips: "Ensure chicken is cooked through" },
          { stepNumber: 4, instruction: "Add tomato sauce and simmer for 10 minutes", estimatedTime: 10, tips: "Stir occasionally to prevent sticking" },
          { stepNumber: 5, instruction: "Meanwhile, boil pasta according to package instructions until al dente", estimatedTime: 10, tips: "Salt the pasta water generously" },
          { stepNumber: 6, instruction: "Drain pasta and mix with the chicken sauce", estimatedTime: 2, tips: "Reserve some pasta water if sauce is too thick" },
          { stepNumber: 7, instruction: "Garnish with grated parmesan cheese and serve hot", estimatedTime: 1, tips: "Add fresh herbs if available" }
        ],
        difficulty: 'medium',
        cuisine: 'italian',
        tags: ['pasta', 'chicken', 'italian', 'main-course'],
        equipment: ['large pan', 'pot', 'colander', 'wooden spoon'],
        allergens: ['wheat', 'dairy']
      },
      'red pasta': {
        ingredients: [
          { ingredient: "spaghetti pasta", quantity: 200 * numPeople, unit: "g", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "tomato sauce", quantity: 150 * numPeople, unit: "ml", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "olive oil", quantity: 3 * numPeople, unit: "tbsp", category: "Veg", isEssential: true, preparationNotes: "extra virgin" },
          { ingredient: "garlic", quantity: 3 * numPeople, unit: "cloves", category: "Veg", isEssential: true, preparationNotes: "minced" },
          { ingredient: "onions", quantity: 1 * numPeople, unit: "medium", category: "Veg", isEssential: true, preparationNotes: "diced" },
          { ingredient: "bell peppers", quantity: 1 * numPeople, unit: "piece", category: "Veg", isEssential: false, preparationNotes: "sliced" },
          { ingredient: "mozzarella cheese", quantity: 100 * numPeople, unit: "g", category: "Veg", isEssential: false, preparationNotes: "shredded" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Heat olive oil in a large pan over medium heat", estimatedTime: 2, tips: "Use good quality olive oil for best flavor" },
          { stepNumber: 2, instruction: "Sauté diced onions, minced garlic, and sliced bell peppers until softened", estimatedTime: 5, tips: "Cook vegetables until they release their aroma" },
          { stepNumber: 3, instruction: "Add tomato sauce and simmer for 15 minutes", estimatedTime: 15, tips: "Let sauce reduce and thicken" },
          { stepNumber: 4, instruction: "Season with salt, pepper, and Italian herbs to taste", estimatedTime: 1, tips: "Taste and adjust seasoning" },
          { stepNumber: 5, instruction: "Cook spaghetti in salted boiling water until al dente", estimatedTime: 10, tips: "Follow package instructions for timing" },
          { stepNumber: 6, instruction: "Drain pasta and toss with the red sauce", estimatedTime: 2, tips: "Mix thoroughly to coat all pasta" },
          { stepNumber: 7, instruction: "Top with shredded mozzarella and serve immediately", estimatedTime: 1, tips: "Serve while hot for best taste" }
        ],
        difficulty: 'easy',
        cuisine: 'italian',
        tags: ['pasta', 'vegetarian', 'italian', 'easy'],
        equipment: ['large pan', 'pot', 'colander'],
        allergens: ['wheat', 'dairy']
      },
      'white pasta': {
        ingredients: [
          { ingredient: "penne pasta", quantity: 200 * numPeople, unit: "g", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "white sauce", quantity: 150 * numPeople, unit: "ml", category: "Veg", isEssential: true, preparationNotes: "alfredo or bechamel" },
          { ingredient: "olive oil", quantity: 2 * numPeople, unit: "tbsp", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "garlic", quantity: 2 * numPeople, unit: "cloves", category: "Veg", isEssential: true, preparationNotes: "minced" },
          { ingredient: "spinach", quantity: 100 * numPeople, unit: "g", category: "Veg", isEssential: false, preparationNotes: "fresh leaves" },
          { ingredient: "parmesan cheese", quantity: 75 * numPeople, unit: "g", category: "Veg", isEssential: true, preparationNotes: "grated" },
          { ingredient: "mozzarella cheese", quantity: 50 * numPeople, unit: "g", category: "Veg", isEssential: false, preparationNotes: "shredded" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Cook penne pasta according to package directions until al dente", estimatedTime: 10, tips: "Don't overcook the pasta" },
          { stepNumber: 2, instruction: "Heat olive oil in a large pan and sauté minced garlic until fragrant", estimatedTime:  3, tips: "Be careful not to burn the garlic" },
          { stepNumber: 3, instruction: "Add spinach and cook until wilted", estimatedTime: 2, tips: "Stir frequently" },
          { stepNumber: 4, instruction: "Pour in white sauce and heat through", estimatedTime: 5, tips: "Stir to combine" },
          { stepNumber: 5, instruction: "Add cooked pasta to the sauce and mix well", estimatedTime: 2, tips: "Add reserved pasta water if needed" },
          { stepNumber: 6, instruction: "Stir in grated parmesan cheese until melted", estimatedTime: 1, tips: "Serve immediately for best flavor" }
        ],
        difficulty: 'medium',
        cuisine: 'italian',
        tags: ['pasta', 'vegetarian', 'creamy', 'main-course'],
        equipment: ['large pan', 'pot', 'colander'],
        allergens: ['wheat', 'dairy']
      },
      'baked spaghetti': {
        ingredients: [
          { ingredient: "spaghetti pasta", quantity: 300 * numPeople, unit: "g", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "tomato sauce", quantity: 200 * numPeople, unit: "ml", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "ground beef", quantity: 200 * numPeople, unit: "g", category: "Non-Veg", isEssential: true, preparationNotes: "or ground turkey" },
          { ingredient: "mozzarella cheese", quantity: 200 * numPeople, unit: "g", category: "Veg", isEssential: true, preparationNotes: "shredded" },
          { ingredient: "olive oil", quantity: 2 * numPeople, unit: "tbsp", category: "Veg", isEssential: true, preparationNotes: "" },
          { ingredient: "garlic", quantity: 3 * numPeople, unit: "cloves", category: "Veg", isEssential: true, preparationNotes: "minced" },
          { ingredient: "onions", quantity: 1 * numPeople, unit: "large", category: "Veg", isEssential: true, preparationNotes: "diced" }
        ],
        instructions: [
          { stepNumber: 1, instruction: "Cook spaghetti until al dente according to package instructions", estimatedTime: 10, tips: "Salt the water generously" },
          { stepNumber: 2, instruction: "In a large pan, heat olive oil and sauté onions and garlic until fragrant", estimatedTime: 3, tips: "Use medium heat" },
          { stepNumber: 3, instruction: "Add ground beef and cook until browned", estimatedTime: 5, tips: "Break up meat as it cooks" },
          { stepNumber: 4, instruction: "Stir in tomato sauce and simmer for 10 minutes", estimatedTime: 10, tips: "Add herbs for extra flavor" },
          { stepNumber: 5, instruction: "Layer cooked spaghetti and meat sauce in a baking dish", estimatedTime: 5, tips: "Mix well" },
          { stepNumber: 6, instruction: "Top with shredded mozzarella cheese", estimatedTime: 1, tips: "Cover evenly" },
          { stepNumber: 7, instruction: "Bake at 350°F for 25-30 minutes until cheese is bubbly", estimatedTime: 30, tips: "Let cool for 5 minutes before serving" }
        ],
        difficulty: 'medium',
        cuisine: 'italian',
        tags: ['pasta', 'baked', 'comfort-food', 'main-course'],
        equipment: ['large pan', 'baking dish', 'pot', 'colander'],
        allergens: ['wheat', 'dairy']
      }
    };

    // Find matching recipe
    let selectedRecipe = recipes['red pasta']; // default
    for (const [key, recipe] of Object.entries(recipes)) {
      if (dishKey.includes(key.replace(' ', '')) || dishKey.includes(key)) {
        selectedRecipe = recipe;
        break;
      }
    }

    return {
      dish: dishName,
      servings: numPeople,
      dietType: dietType,
      ingredients: selectedRecipe.ingredients,
      instructions: selectedRecipe.instructions,
      prepTime: 15,
      cookTime: 25,
      nutritionInfo: {
        calories: 400 * numPeople,
        protein: 15 * numPeople,
        carbs: 55 * numPeople,
        fat: 12 * numPeople
      }
    };
  }

  getRecommendations(dishName) {
    const recommendations = {
      "chicken pasta": ["Garlic bread", "Caesar salad", "Parmesan cheese", "Italian herbs"],
      "red pasta": ["Focaccia bread", "Caprese salad", "Mozzarella sticks", "Basil leaves"],
      "white pasta": ["Herb bread", "Spinach salad", "Alfredo sauce", "Black pepper"],
      "baked spaghetti": ["Garlic knots", "Greek salad", "Italian seasoning", "Red wine"],
      "pasta": ["Bread", "Salad", "Cheese", "Herbs"], // default
      "spaghetti": ["Garlic bread", "Garden salad", "Parmesan", "Italian seasoning"]
    };

    const dishKey = dishName.toLowerCase();
    for (const [key, recs] of Object.entries(recommendations)) {
      if (dishKey.includes(key)) {
        return recs;
      }
    }

    return ["Bread", "Salad", "Cheese", "Herbs"];
  }
}

module.exports = new GroqService();