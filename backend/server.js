const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import models
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const MealPlan = require('./models/MealPlan');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection - FIXED: Removed deprecated options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartgrocer');

// Import routes with graceful error handling
const loadRoutes = () => {
  const routes = {};
  
  try {
    routes.auth = require('./routes/auth');
    console.log('✅ Auth routes loaded');
  } catch (error) {
    console.log('⚠️  Auth routes not found, creating placeholder...');
    routes.auth = express.Router();
    routes.auth.post('/login', (req, res) => {
      res.status(501).json({ message: 'Auth service not implemented yet' });
    });
    routes.auth.post('/register', (req, res) => {
      res.status(501).json({ message: 'Auth service not implemented yet' });
    });
  }

  try {
    routes.products = require('./routes/products');
    console.log('✅ Product routes loaded');
  } catch (error) {
    console.log('⚠️  Product routes not found, creating placeholder...');
    routes.products = express.Router();
    routes.products.get('/', async (req, res) => {
      try {
        const products = await Product.find();
        res.json(products);
      } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
      }
    });
    routes.products.post('/search', async (req, res) => {
      try {
        const { query } = req.body;
        const products = await Product.find({
          name: { $regex: query, $options: 'i' }
        });
        res.json({ products });
      } catch (err) {
        res.status(500).json({ message: 'Search failed' });
      }
    });
  }

  try {
    routes.recipes = require('./routes/recipes');
    console.log('✅ Recipe routes loaded');
  } catch (error) {
    console.log('⚠️  Recipe routes not found, creating placeholder...');
    routes.recipes = express.Router();
    routes.recipes.post('/generate', async (req, res) => {
      try {
        const { dishName, numPeople, dietType } = req.body;
        
        // Simple fallback recipe generation
        const fallbackRecipe = {
          recipe: {
            name: dishName,
            servings: numPeople,
            dietType: dietType,
            ingredients: [
              { ingredient: "pasta", quantity: 200 * numPeople, unit: "g" },
              { ingredient: "sauce", quantity: 100 * numPeople, unit: "ml" },
              { ingredient: "olive oil", quantity: 2 * numPeople, unit: "tbsp" }
            ],
            instructions: ["Boil pasta", "Heat sauce", "Mix and serve"],
            prepTime: 10,
            cookTime: 15
          },
          availableItems: [],
          missingItems: [],
          totalCost: "0.00"
        };
        
        res.json(fallbackRecipe);
      } catch (err) {
        res.status(500).json({ message: 'Recipe generation failed', error: err.message });
      }
    });
  }

  try {
    routes.mealPlans = require('./routes/mealPlans');
    console.log('✅ Meal plan routes loaded');
  } catch (error) {
    console.log('⚠️  Meal plan routes not found, creating placeholder...');
    routes.mealPlans = express.Router();
    routes.mealPlans.get('/:userId', (req, res) => {
      res.json([]);
    });
    routes.mealPlans.post('/', (req, res) => {
      res.status(501).json({ message: 'Meal plan service not implemented yet' });
    });
  }

  try {
    routes.recommendations = require('./routes/recommendations');
    console.log('✅ Recommendation routes loaded');
  } catch (error) {
    console.log('⚠️  Recommendation routes not found, creating placeholder...');
    routes.recommendations = express.Router();
    routes.recommendations.post('/cart', (req, res) => {
      res.json({ recommendations: [], message: 'Recommendation service not implemented yet' });
    });
    routes.recommendations.post('/meal-plan', (req, res) => {
      res.json({ recommendations: [], message: 'Meal plan recommendation service not implemented yet' });
    });
    routes.recommendations.get('/trending', (req, res) => {
      res.json({ trendingItems: [], message: 'Trending service not implemented yet' });
    });
    routes.recommendations.get('/seasonal', (req, res) => {
      res.json({ seasonalItems: [], message: 'Seasonal recommendation service not implemented yet' });
    });
  }

  return routes;
};

// Enhanced sample data seeding with more variety
const seedSampleData = async () => {
  try {
    const existingProducts = await Product.countDocuments();
    const existingInventory = await Inventory.countDocuments();
    
    if (existingProducts === 0) {
      console.log('🌱 Seeding sample products...');
      
      const sampleProducts = [
        // Pasta varieties
        {
          name: 'Spaghetti Pasta',
          category: 'food-grocery',
          price: 2.99,
          description: 'Premium Italian spaghetti pasta made from durum wheat',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/b2e47318-0c9f-4e5b-82b6-ff88fe15d58f.png',
          tags: ['pasta', 'italian', 'wheat', 'dinner'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['spaghetti', 'pasta', 'noodles', 'italian'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Penne Pasta',
          category: 'food-grocery',
          price: 3.19,
          description: 'Classic penne pasta perfect for various sauces',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/b2e47318-0c9f-4e5b-82b6-ff88fe15d58f.png',
          tags: ['pasta', 'italian', 'wheat', 'dinner'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['penne', 'pasta', 'noodles', 'italian'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Fusilli Pasta',
          category: 'food-grocery',
          price: 3.29,
          description: 'Spiral-shaped pasta that holds sauce perfectly',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/b2e47318-0c9f-4e5b-82b6-ff88fe15d58f.png',
          tags: ['pasta', 'italian', 'spiral', 'dinner'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['fusilli', 'pasta', 'spiral', 'italian'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        
        // Sauces
        {
          name: 'White Sauce',
          category: 'food-grocery',
          price: 3.49,
          description: 'Creamy white sauce perfect for pasta dishes',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f7f0ac0c-da1c-4e10-88bf-72243799fac4.png',
          tags: ['sauce', 'cream', 'pasta', 'italian'],
          dietaryTypes: ['Veg'],
          searchKeywords: ['white sauce', 'cream sauce', 'alfredo', 'bechamel'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Tomato Sauce',
          category: 'food-grocery',
          price: 2.99,
          description: 'Rich tomato sauce for pasta and pizza',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f7f0ac0c-da1c-4e10-88bf-72243799fac4.png',
          tags: ['sauce', 'tomato', 'pasta', 'italian'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['tomato sauce', 'marinara', 'red sauce', 'pasta sauce'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Pesto Sauce',
          category: 'food-grocery',
          price: 4.99,
          description: 'Fresh basil pesto sauce with pine nuts',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f7f0ac0c-da1c-4e10-88bf-72243799fac4.png',
          tags: ['sauce', 'basil', 'pesto', 'italian'],
          dietaryTypes: ['Veg'],
          searchKeywords: ['pesto', 'basil sauce', 'green sauce'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },

        // Proteins
        {
          name: 'Chicken Breast',
          category: 'food-grocery',
          price: 12.99,
          description: 'Fresh chicken breast for protein-rich meals',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['meat', 'protein', 'chicken', 'fresh'],
          dietaryTypes: ['Non-Veg'],
          searchKeywords: ['chicken', 'breast', 'meat', 'protein'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Ground Beef',
          category: 'food-grocery',
          price: 8.99,
          description: 'Fresh ground beef for pasta and other dishes',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['meat', 'protein', 'beef', 'ground'],
          dietaryTypes: ['Non-Veg'],
          searchKeywords: ['beef', 'ground beef', 'meat', 'protein'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },

        // Dairy & Cheese
        {
          name: 'Mozzarella Cheese',
          category: 'food-grocery',
          price: 5.99,
          description: 'Fresh mozzarella cheese perfect for pasta and pizza',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/7aa82969-1459-4587-a1cc-21c604a4745a.png',
          tags: ['cheese', 'dairy', 'italian', 'pasta'],
          dietaryTypes: ['Veg'],
          searchKeywords: ['mozzarella', 'cheese', 'dairy', 'italian cheese'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Parmesan Cheese',
          category: 'food-grocery',
          price: 8.99,
          description: 'Aged parmesan cheese for authentic Italian flavor',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/7aa82969-1459-4587-a1cc-21c604a4745a.png',
          tags: ['cheese', 'dairy', 'italian', 'aged'],
          dietaryTypes: ['Veg'],
          searchKeywords: ['parmesan', 'parmigiano', 'cheese', 'hard cheese'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },

        // Vegetables & Seasonings
        {
          name: 'Garlic',
          category: 'food-grocery',
          price: 1.99,
          description: 'Fresh garlic bulbs for cooking',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['vegetable', 'seasoning', 'fresh', 'aromatic'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['garlic', 'cloves', 'seasoning', 'vegetable'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Onions',
          category: 'food-grocery',
          price: 1.49,
          description: 'Fresh yellow onions for cooking',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['vegetable', 'fresh', 'cooking'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['onions', 'yellow onions', 'vegetable'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Bell Peppers',
          category: 'food-grocery',
          price: 3.99,
          description: 'Colorful bell peppers for cooking',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['vegetable', 'fresh', 'colorful'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['bell peppers', 'peppers', 'vegetable', 'fresh'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Spinach',
          category: 'food-grocery',
          price: 2.49,
          description: 'Fresh spinach leaves for salads and cooking',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['vegetable', 'fresh', 'leafy'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['spinach', 'leafy greens', 'vegetable'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Olive Oil',
          category: 'food-grocery',
          price: 7.99,
          description: 'Extra virgin olive oil for cooking and dressing',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png',
          tags: ['oil', 'cooking', 'healthy', 'mediterranean'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['olive oil', 'extra virgin', 'cooking oil', 'oil'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        },
        {
          name: 'Whole Wheat Bread',
          category: 'food-grocery',
          price: 2.49,
          description: 'Fresh whole wheat bread perfect for sandwiches',
          image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/14f49fd9-3401-461f-a905-56bdc9c75ed4.png',
          tags: ['bread', 'wheat', 'bakery', 'breakfast'],
          dietaryTypes: ['Veg', 'Vegan'],
          searchKeywords: ['bread', 'whole wheat', 'bakery', 'sandwich'],
          isIngredient: true,
          suggestedIngredients: [],
          availability: { isActive: true }
        }
      ];

      const createdProducts = await Product.insertMany(sampleProducts);
      console.log('✅ Sample products seeded successfully!');

      // Seed inventory data
      if (existingInventory === 0) {
        console.log('🏪 Seeding inventory data...');
        
        const inventoryData = createdProducts.map(product => ({
          productId: product._id,
          name: product.name,
          category: product.dietaryTypes[0] || 'Common',
          quantity: product.isIngredient ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 20) + 5,
          unit: product.isIngredient ? (product.name.includes('Pasta') ? 'kg' : 
                                      product.name.includes('Sauce') ? 'liter' : 
                                      product.name.includes('Cheese') ? 'kg' : 
                                      product.name.includes('Oil') ? 'liter' : 'pieces') : 'pieces',
          price: product.price,
          inStock: true,
          searchKeywords: product.searchKeywords || [],
          tags: product.tags || []
        }));

        await Inventory.insertMany(inventoryData);
        console.log('✅ Inventory data seeded successfully!');
      }

      // Add suggested ingredients with proper references
      const pastaProduct = createdProducts.find(p => p.name === 'Spaghetti Pasta');
      const whiteSauce = createdProducts.find(p => p.name === 'White Sauce');
      const cheese = createdProducts.find(p => p.name === 'Mozzarella Cheese');

      if (pastaProduct && whiteSauce && cheese) {
        pastaProduct.suggestedIngredients = [
          { productId: whiteSauce._id, name: 'White Sauce', quantity: '1', unit: 'jar' },
          { productId: cheese._id, name: 'Mozzarella Cheese', quantity: '200', unit: 'g' }
        ];
        await pastaProduct.save();
      }

      console.log('✅ All sample data seeded successfully!');
    } else {
      console.log('📊 Database already has data, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

// Initialize database
mongoose.connection.once('open', () => {
  console.log('🔗 Connected to MongoDB');
  seedSampleData();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Add this route before your other routes
app.get('/api/debug/inventory', async (req, res) => {
  try {
    const inventoryCount = await Inventory.countDocuments();
    const productCount = await Product.countDocuments();
    const sampleInventory = await Inventory.find().limit(5);
    const sampleProducts = await Product.find().limit(5);
    
    res.json({
      inventoryCount,
      productCount,
      sampleInventory,
      sampleProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/test/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchRegex = new RegExp(query, 'i');
    
    const products = await Product.find({
      name: searchRegex
    });
    
    const inventory = await Inventory.find({
      name: searchRegex
    });
    
    res.json({
      query,
      productsFound: products.length,
      inventoryFound: inventory.length,
      products: products.slice(0, 3),
      inventory: inventory.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Load routes
const routes = loadRoutes();
app.use('/api/auth', routes.auth);
app.use('/api/products', routes.products);
app.use('/api/recipes', routes.recipes);
app.use('/api/mealPlans', routes.mealPlans);
app.use('/api/recommendations', routes.recommendations);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Wal AI Backend is healthy!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      recipeSearch: true,
      mealPlanning: true,
      recommendations: true,
      inventory: true
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Wal AI API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      },
      products: {
        getAll: 'GET /api/products',
        search: 'POST /api/products/search',
        nlqSearch: 'POST /api/products/nlq-search',
        recipe: 'POST /api/products/recipe'
      },
      recipes: {
        search: 'POST /api/recipes/search',
        getById: 'GET /api/recipes/:id'
      },
      mealPlans: {
        create: 'POST /api/mealPlans',
        getByUser:   'GET /api/mealPlans/:userId'
      },
      recommendations: {
        cart: 'POST /api/recommendations/cart',
        mealPlan: 'POST /api/recommendations/meal-plan',
        trending: 'GET /api/recommendations/trending',
        seasonal: 'GET /api/recommendations/seasonal'
      }
    }
  });
});
app.post('/api/admin/seed-now', async (req, res) => {
  try {
    // Clear existing data
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    
    // Run the seed function
    await seedSampleData();
    
    res.json({ message: 'Data seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : ' An error occurred. Please try again later.'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});