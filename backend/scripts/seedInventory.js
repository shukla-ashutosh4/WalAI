const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
require('dotenv').config();

const sampleInventory = [
  // Pasta varieties
  {
    name: "Spaghetti Pasta",
    quantity: 25.0,
    unit: "kg",
    price: 2.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["spaghetti", "pasta", "noodles", "italian"],
    tags: ["pasta", "italian", "wheat", "dinner"],
    description: "Premium Italian spaghetti pasta made from durum wheat",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/b2e47318-0c9f-4e5b-82b6-ff88fe15d58f.png"
  },
  {
    name: "Penne Pasta",
    quantity: 20.0,
    unit: "kg",
    price: 3.19,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["penne", "pasta", "noodles", "italian"],
    tags: ["pasta", "italian", "wheat", "dinner"],
    description: "Classic penne pasta perfect for various sauces",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/b2e47318-0c9f-4e5b-82b6-ff88fe15d58f.png"
  },
  {
    name: "Fusilli Pasta",
    quantity: 15.0,
    unit: "kg",
    price: 3.29,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["fusilli", "pasta", "spiral", "italian"],
    tags: ["pasta", "italian", "spiral", "dinner"],
    description: "Spiral-shaped pasta that holds sauce perfectly",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/b2e47318-0c9f-4e5b-82b6-ff88fe15d58f.png"
  },

  // Sauces
  {
    name: "Tomato Sauce",
    quantity: 30.0,
    unit: "liter",
    price: 2.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["tomato sauce", "marinara", "red sauce", "pasta sauce"],
    tags: ["sauce", "tomato", "pasta", "italian"],
    description: "Rich tomato sauce for pasta and pizza",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f7f0ac0c-da1c-4e10-88bf-72243799fac4.png"
  },
  {
    name: "White Sauce",
    quantity: 20.0,
    unit: "liter",
    price: 3.49,
    category: "food-grocery",
    dietaryTypes: ["Veg"],
    searchKeywords: ["white sauce", "cream sauce", "alfredo", "bechamel"],
    tags: ["sauce", "cream", "pasta", "italian"],
    description: "Creamy white sauce perfect for pasta dishes",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f7f0ac0c-da1c-4e10-88bf-72243799fac4.png"
  },
  {
    name: "Pesto Sauce",
    quantity: 15.0,
    unit: "liter",
    price: 4.99,
    category: "food-grocery",
    dietaryTypes: ["Veg"],
    searchKeywords: ["pesto", "basil sauce", "green sauce"],
    tags: ["sauce", "basil", "pesto", "italian"],
    description: "Fresh basil pesto sauce with pine nuts",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f7f0ac0c-da1c-4e10-88bf-72243799fac4.png"
  },

  // Proteins
  {
    name: "Chicken Breast",
    quantity: 50.0,
    unit: "kg",
    price: 12.99,
    category: "food-grocery",
    dietaryTypes: ["Non-Veg"],
    searchKeywords: ["chicken", "breast", "meat", "protein"],
    tags: ["meat", "protein", "chicken", "fresh"],
    description: "Fresh chicken breast for protein-rich meals",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },
  {
    name: "Ground Beef",
    quantity: 30.0,
    unit: "kg",
    price: 8.99,
    category: "food-grocery",
    dietaryTypes: ["Non-Veg"],
    searchKeywords: ["beef", "ground beef", "meat", "protein"],
    tags: ["meat", "protein", "beef", "ground"],
    description: "Fresh ground beef for pasta and other dishes",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },

  // Dairy & Cheese
  {
    name: "Mozzarella Cheese",
    quantity: 10.0,
    unit: "kg",
    price: 5.99,
    category: "food-grocery",
    dietaryTypes: ["Veg"],
    searchKeywords: ["mozzarella", "cheese", "dairy", "italian cheese"],
    tags: ["cheese", "dairy", "italian", "pasta"],
    description: "Fresh mozzarella cheese perfect for pasta and pizza",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/7aa82969-1459-4587-a1cc-21c604a4745a.png"
  },
  {
    name: "Parmesan Cheese",
    quantity: 8.0,
    unit: "kg",
    price: 8.99,
    category: "food-grocery",
    dietaryTypes: ["Veg"],
    searchKeywords: ["parmesan", "parmigiano", "cheese", "hard cheese"],
    tags: ["cheese", "dairy", "italian", "aged"],
    description: "Aged parmesan cheese for authentic Italian flavor",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/7aa82969-1459-4587-a1cc-21c604a4745a.png"
  },

  // Vegetables & Seasonings
  {
    name: "Garlic",
    quantity: 25.0,
    unit: "kg",
    price: 1.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["garlic", "cloves", "seasoning", "vegetable"],
    tags: ["vegetable", "seasoning", "fresh", "aromatic"],
    description: "Fresh garlic bulbs for cooking",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },
  {
    name: "Onions",
    quantity: 40.0,
    unit: "kg",
    price: 1.49,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["onions", "yellow onions", "vegetable"],
    tags: ["vegetable", "fresh", "cooking"],
    description: "Fresh yellow onions for cooking",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },
  {
    name: "Bell Peppers",
    quantity: 20.0,
    unit: "kg",
    price: 3.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["bell peppers", "peppers", "vegetable", "fresh"],
    tags: ["vegetable", "fresh", "colorful"],
    description: "Colorful bell peppers for cooking",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },
  {
    name: "Spinach",
    quantity: 15.0,
    unit: "kg",
    price: 2.49,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["spinach", "leafy greens", "vegetable"],
    tags: ["vegetable", "fresh", "leafy"],
    description: "Fresh spinach leaves for salads and cooking",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },

  // Oils & Condiments
  {
    name: "Olive Oil",
    quantity: 50.0,
    unit: "liter",
    price: 7.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["olive oil", "extra virgin", "cooking oil", "oil"],
    tags: ["oil", "cooking", "healthy", "mediterranean"],
    description: "Extra virgin olive oil for cooking and dressing",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },
  {
    name: "Mayonnaise",
    quantity: 20.0,
    unit: "liter",
    price: 4.99,
    category: "food-grocery",
    dietaryTypes: ["Veg"],
    searchKeywords: ["mayonnaise", "mayo", "condiment", "spread"],
    tags: ["condiment", "cream", "sandwich"],
    description: "Rich and creamy mayonnaise for sandwiches and salads",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },

  // Bread & Bakery
  {
    name: "Whole Wheat Bread",
    quantity: 100.0,
    unit: "pieces",
    price: 2.49,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["bread", "whole wheat", "bakery", "sandwich"],
    tags: ["bread", "wheat", "bakery", "breakfast"],
    description: "Fresh whole wheat bread perfect for sandwiches",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/14f49fd9-3401-461f-a905-56bdc9c75ed4.png"
  },
  {
    name: "Garlic Bread",
    quantity: 50.0,
    unit: "pieces",
    price: 3.99,
    category: "food-grocery",
    dietaryTypes: ["Veg"],
    searchKeywords: ["garlic bread", "bread", "garlic", "side dish"],
    tags: ["bread", "garlic", "side", "italian"],
    description: "Delicious garlic bread perfect as a side dish",
    isIngredient: false,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/14f49fd9-3401-461f-a905-56bdc9c75ed4.png"
  },

  // Kitchen Items
  {
    name: "Non-Stick Frying Pan",
    quantity: 25.0,
    unit: "pieces",
    price: 29.99,
    category: "kitchen-items",
    dietaryTypes: ["Veg", "Non-Veg", "Vegan"],
    searchKeywords: ["frying pan", "non-stick", "cookware", "kitchen"],
    tags: ["cookware", "pan", "kitchen", "cooking"],
    description: "High-quality non-stick frying pan for healthy cooking",
    isIngredient: false,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/6614e3f1-a3f5-4750-a30b-835fe9f48d47.png"
  },
  {
    name: "Pasta Pot",
    quantity: 15.0,
    unit: "pieces",
    price: 45.99,
    category: "kitchen-items",
    dietaryTypes: ["Veg", "Non-Veg", "Vegan"],
    searchKeywords: ["pasta pot", "large pot", "cookware", "kitchen"],
    tags: ["cookware", "pot", "kitchen", "pasta"],
    description: "Large pot perfect for cooking pasta",
    isIngredient: false,
        image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/6614e3f1-a3f5-4750-a30b-835fe9f48d47.png"
  },

  // Herbs & Spices
  {
    name: "Italian Herbs",
    quantity: 5.0,
    unit: "kg",
    price: 6.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["italian herbs", "herbs", "seasoning", "spices"],
    tags: ["herbs", "seasoning", "italian", "spices"],
    description: "Blend of Italian herbs for authentic flavor",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },
  {
    name: "Black Pepper",
    quantity: 2.0,
    unit: "kg",
    price: 12.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["black pepper", "pepper", "spice", "seasoning"],
    tags: ["spice", "pepper", "seasoning", "cooking"],
    description: "Fresh ground black pepper for seasoning",
    isIngredient: true,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  },

  // Beverages (Recommendations)
  {
    name: "Italian Wine",
    quantity: 30.0,
    unit: "bottles",
    price: 15.99,
    category: "food-grocery",
    dietaryTypes: ["Veg", "Vegan"],
    searchKeywords: ["wine", "italian wine", "beverage", "alcohol"],
    tags: ["beverage", "wine", "italian", "alcohol"],
    description: "Premium Italian wine to pair with pasta",
    isIngredient: false,
    image: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8f948a76-baa1-49ad-9aee-7f9e547cd86b.png"
  }
];

async function seedInventory() {
  try {
    console.log('🌱 Starting inventory seeding process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartgrocer', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing inventory and products...');
    await Inventory.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');

    let createdCount = 0;
    let errorCount = 0;

    // Create products and inventory items
    for (const [index, item] of sampleInventory.entries()) {
      try {
        console.log(`📦 Processing item ${index + 1}/${sampleInventory.length}: ${item.name}`);
        
        // Create product first
        const product = new Product({
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          image: item.image,
          tags: item.tags,
          dietaryTypes: item.dietaryTypes,
          searchKeywords: item.searchKeywords,
          isIngredient: item.isIngredient,
          nutritionInfo: item.nutritionInfo || {},
          suggestedIngredients: []
        });
        
        await product.save();

        // Create inventory item
        const inventoryItem = new Inventory({
          productId: product._id,
          name: item.name,
          category: item.dietaryTypes ? item.dietaryTypes[0] : 'Common',
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          inStock: item.quantity > 0,
          searchKeywords: item.searchKeywords,
          tags: item.tags,
          nutritionInfo: item.nutritionInfo || {},
          supplier: 'Default Supplier',
          lastRestocked: new Date()
        });
        
        await inventoryItem.save();
        createdCount++;
        
        console.log(`✅ Created: ${item.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating item ${item.name}:`, error.message);
      }
    }

    // Add suggested ingredients relationships
    console.log('🔗 Adding suggested ingredients relationships...');
    
    try {
      const spaghetti = await Product.findOne({ name: 'Spaghetti Pasta' });
      const tomatoSauce = await Product.findOne({ name: 'Tomato Sauce' });
      const mozzarella = await Product.findOne({ name: 'Mozzarella Cheese' });
      const penne = await Product.findOne({ name: 'Penne Pasta' });
      const whiteSauce = await Product.findOne({ name: 'White Sauce' });

      if (spaghetti && tomatoSauce && mozzarella) {
        spaghetti.suggestedIngredients = [
          { productId: tomatoSauce._id, name: 'Tomato Sauce', quantity: '200', unit: 'ml' },
          { productId: mozzarella._id, name: 'Mozzarella Cheese', quantity: '100', unit: 'g' }
        ];
        await spaghetti.save();
      }

      if (penne && whiteSauce && mozzarella) {
        penne.suggestedIngredients = [
          { productId: whiteSauce._id, name: 'White Sauce', quantity: '150', unit: 'ml' },
          { productId: mozzarella._id, name: 'Mozzarella Cheese', quantity: '75', unit: 'g' }
        ];
        await penne.save();
      }

      console.log('✅ Added suggested ingredients relationships');
    } catch (error) {
      console.error('⚠️  Error adding relationships:', error.message);
    }

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Successfully created: ${createdCount} items`);
    console.log(`❌ Errors encountered: ${errorCount} items`);
    console.log(`📦 Total inventory items: ${await Inventory.countDocuments()}`);
    console.log(`🛍️  Total products: ${await Product.countDocuments()}`);
    
    // Verify data integrity
    console.log('\n🔍 Verifying data integrity...');
    const inventoryCount = await Inventory.countDocuments();
    const productCount = await Product.countDocuments();
    
    if (inventoryCount === productCount && inventoryCount === createdCount) {
      console.log('✅ Data integrity check passed');
    } else {
      console.log('⚠️  Data integrity check failed');
      console.log(`Expected: ${createdCount}, Products: ${productCount}, Inventory: ${inventoryCount}`);
    }

    console.log('\n🎉 Sample inventory seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Add CLI options
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForced = args.includes('--force');

if (isDryRun) {
  console.log('🧪 Dry run mode - no actual seeding will occur');
  console.log(`Would seed ${sampleInventory.length} items`);
  process.exit(0);
}

if (!isForced) {
  console.log('⚠️  This will clear all existing products and inventory data.');
  console.log('⚠️  Run with --force to proceed, or --dry-run to preview.');
  console.log('⚠️  Example: npm run seed --force');
  process.exit(1);
}

// Run the seeding
seedInventory().then(() => {
  console.log('✨ Seeding process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Seeding process failed:', error);
  process.exit(1);
});