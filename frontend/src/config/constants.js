// frontend/src/config/constants.js
export const APP_CONFIG = {
  name: 'Wal AI',
  version: '1.0.0',
  description: 'Intelligent grocery shopping with AI-powered recommendations',
  tagline: 'Smart Grocery Shopping with AI',
  company: 'Wal AI Technologies',
  supportEmail: 'support@walai.com',
  features: {
    recipeSearch: true,
    mealPlanning: true,
    aiRecommendations: true,
    smartCart: true,
    dietaryPreferences: true,
    inventoryTracking: true
  }
};

export const CATEGORIES = [
  {
    id: 'food-grocery',
    name: 'Food & Grocery',
    icon: '🛒',
    description: 'Fresh produce, pantry essentials, snacks & more',
    keywords: ['food', 'grocery', 'fresh', 'produce', 'pantry', 'vegetables', 'fruits', 'dairy', 'meat'],
    subcategories: [
      { id: 'fresh-produce', name: 'Fresh Produce', icon: '🥬' },
      { id: 'dairy-eggs', name: 'Dairy & Eggs', icon: '🥛' },
      { id: 'meat-seafood', name: 'Meat & Seafood', icon: '🥩' },
      { id: 'pantry-staples', name: 'Pantry Staples', icon: '🍚' },
      { id: 'snacks', name: 'Snacks', icon: '🍿' },
      { id: 'beverages', name: 'Beverages', icon: '🥤' }
    ]
  },
  {
    id: 'kitchen-items',
    name: 'Kitchen Items',
    icon: '🍳',
    description: 'Cookware, utensils, appliances & accessories',
    keywords: ['kitchen', 'cookware', 'utensils', 'appliances', 'tools', 'gadgets'],
    subcategories: [
      { id: 'cookware', name: 'Cookware', icon: '🍳' },
      { id: 'utensils', name: 'Utensils', icon: '🥄' },
      { id: 'appliances', name: 'Appliances', icon: '🔌' },
      { id: 'storage', name: 'Storage', icon: '📦' },
      { id: 'gadgets', name: 'Gadgets', icon: '⚙️' }
    ]
  },
  {
    id: 'recipes',
    name: 'Recipe Search',
    icon: '👨‍🍳',
    description: 'Find recipes and add all ingredients to cart',
    keywords: ['recipes', 'cooking', 'meals', 'dishes', 'cuisine', 'ingredients'],
    subcategories: [
      { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
      { id: 'lunch', name: 'Lunch', icon: '☀️' },
      { id: 'dinner', name: 'Dinner', icon: '🌙' },
      { id: 'snacks', name: 'Snacks', icon: '🍪' },
      { id: 'desserts', name: 'Desserts', icon: '🍰' }
    ]
  }
];

export const SEARCH_SUGGESTIONS = [
  // Recipe-based suggestions
  'pasta for 4 people',
  'chicken curry recipe',
  'white pasta ingredients',
  'red pasta sauce',
  'healthy breakfast options',
  'ingredients for pizza',
  'quick dinner ideas',
  'vegetarian pasta',
  'italian cuisine',
  'comfort food recipes',
  
  // Product-based suggestions
  'fresh vegetables',
  'organic produce',
  'gluten-free snacks',
  'dairy products',
  'cooking essentials',
  'party snacks',
  'healthy snacks',
  'breakfast cereals',
  'cooking oils',
  'spices and herbs',
  
  // Dietary-specific suggestions
  'vegan ingredients',
  'keto-friendly foods',
  'low-carb options',
  'protein sources',
  'whole grain products',
  'sugar-free alternatives'
];

export const DIETARY_TYPES = [
  {
    id: 'veg',
    name: 'Vegetarian',
    icon: '🥕',
    description: 'No meat, but includes dairy and eggs',
    color: '#4CAF50'
  },
  {
    id: 'vegan',
    name: 'Vegan',
    icon: '🌱',
    description: 'No animal products whatsoever',
    color: '#8BC34A'
  },
  {
    id: 'non-veg',
    name: 'Non-Vegetarian',
    icon: '🍖',
    description: 'Includes all food types including meat',
    color: '#FF5722'
  },
  {
    id: 'pescatarian',
    name: 'Pescatarian',
    icon: '🐟',
    description: 'Vegetarian diet that includes fish',
    color: '#2196F3'
  },
  {
    id: 'keto',
    name: 'Keto',
    icon: '🥑',
    description: 'Low-carb, high-fat diet',
    color: '#9C27B0'
  },
  {
    id: 'gluten-free',
    name: 'Gluten-Free',
    icon: '🌾',
    description: 'No gluten-containing ingredients',
    color: '#FF9800'
  }
];

export const MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', icon: '🌅', time: '6:00-10:00 AM' },
  { id: 'lunch', name: 'Lunch', icon: '☀️', time: '12:00-2:00 PM' },
  { id: 'dinner', name: 'Dinner', icon: '🌙', time: '6:00-9:00 PM' },
  { id: 'snack', name: 'Snack', icon: '🍪', time: 'Anytime' }
];

export const COOKING_TIMES = [
  { id: 'quick', name: 'Quick (Under 30 min)', icon: '⚡', maxTime: 30 },
  { id: 'medium', name: 'Medium (30-60 min)', icon: '🕐', maxTime: 60 },
  { id: 'long', name: 'Long (Over 60 min)', icon: '🕑', maxTime: 120 },
  { id: 'any', name: 'Any Duration', icon: '🍳', maxTime: null }
];

export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile'
  },
  
  PRODUCTS: {
    SEARCH: '/api/products/search',
    GET_ALL: '/api/products',
    GET_BY_ID: '/api/products/:id',
    NLQ_SEARCH: '/api/products/nlq-search',
    SUGGESTIONS: '/api/products/:id/suggestions',
    RECIPE: '/api/products/recipe'
  },
  
  RECIPES: {
    SEARCH: '/api/recipes/search',
    GENERATE: '/api/recipes/generate',
    GET_BY_ID: '/api/recipes/:id',
    FEATURED: {
      POPULAR: '/api/recipes/featured/popular',
      TRENDING: '/api/recipes/featured/trending',
      QUICK: '/api/recipes/featured/quick'
    }
  },
  
  MEAL_PLANS: {
    GET_USER_PLANS: '/api/mealPlans/:userId',
    CREATE: '/api/mealPlans',
    UPDATE: '/api/mealPlans/:id',
    DELETE: '/api/mealPlans/:id'
  },
  
  RECOMMENDATIONS: {
    CART: '/api/recommendations/cart',
    MEAL_PLAN: '/api/recommendations/meal-plan',
    TRENDING: '/api/recommendations/trending',
    SEASONAL: '/api/recommendations/seasonal'
  },
  
  INVENTORY: {
    CHECK: '/api/inventory/check',
    SEARCH: '/api/inventory/search'
  },
  
  HEALTH: '/api/health',
  DOCS: '/api/docs'
};

export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: '#0071ce',
    SECONDARY: '#ffc220',
    SUCCESS: '#4CAF50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196F3',
    BACKGROUND: '#f7f7f7',
    SURFACE: '#ffffff'
  },
  
  BREAKPOINTS: {
    XS: 0,
    SM: 600,
    MD: 960,
    LG: 1280,
    XL: 1920
  },
  
  SPACING: {
    UNIT: 8,
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
    XLARGE: 48
  },
  
  ANIMATION: {
    DURATION: {
      SHORT: 200,
      STANDARD: 300,
      COMPLEX: 500
    },
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  CART_ITEMS: 'cartItems',
  USER_PREFERENCES: 'userPreferences',
  SEARCH_HISTORY: 'searchHistory',
  REMEMBER_ME: 'rememberMe',
  DELIVERY_OPTION: 'deliveryOption'
};

export const DEFAULT_PREFERENCES = {
  dietType: 'Veg',
  servingSize: 2,
  allergies: [],
  cuisinePreferences: [],
  budgetRange: {
    min: 0,
    max: 1000
  },
  cookingTime: 'any',
  spiceLevel: 'medium',
  notifications: {
    email: true,
    push: true,
    sms: false
  }
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SEARCH_FAILED: 'Search failed. Please try again.',
  RECIPE_NOT_FOUND: 'Recipe not found. Try a different search.',
  CART_ERROR: 'Failed to update cart. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PERMISSION_DENIED: 'Permission denied. Please log in again.'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  ITEM_ADDED: 'Item added to cart!',
  RECIPE_GENERATED: 'Recipe generated successfully!',
  MEAL_PLAN_CREATED: 'Meal plan created successfully!',
  PREFERENCES_UPDATED: 'Preferences updated successfully!',
  CART_CLEARED: 'Cart cleared successfully!'
};

export const FEATURE_FLAGS = {
  ENABLE_AI_RECOMMENDATIONS: true,
  ENABLE_MEAL_PLANNING: true,
  ENABLE_VOICE_SEARCH: false,
  ENABLE_BARCODE_SCANNER: false,
  ENABLE_SOCIAL_SHARING: false,
  ENABLE_LOYALTY_PROGRAM: false,
  ENABLE_DELIVERY_TRACKING: false,
  ENABLE_PRICE_COMPARISON: true,
  ENABLE_NUTRITION_INFO: true,
  ENABLE_RECIPE_RATING: true
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_SUGGESTIONS_LIMIT: 5,
  RECOMMENDATIONS_LIMIT: 6,
  RECENT_SEARCHES_LIMIT: 10
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  SEARCH_MIN_LENGTH: 2,
  MAX_CART_ITEMS: 100,
  MAX_SERVING_SIZE: 20,
  MIN_SERVING_SIZE: 1
};

export const DEMO_DATA = {
  DEMO_USER: {
    email: 'demo@walai.com',
    password: 'demo123',
    name: 'Demo User'
  },
  
  SAMPLE_SEARCHES: [
    'Chicken Pasta',
    'White Pasta',
    'Red Pasta',
    'Vegetarian Pizza',
    'Healthy Salad',
    'Quick Breakfast'
  ],
  
  POPULAR_RECIPES: [
    'Spaghetti Carbonara',
    'Chicken Tikka Masala',
    'Vegetable Stir Fry',
    'Margherita Pizza',
    'Caesar Salad',
    'Chocolate Chip Cookies'
  ]
};

// Create a constants object to export as default
const constants = {
  APP_CONFIG,
  CATEGORIES,
  SEARCH_SUGGESTIONS,
  DIETARY_TYPES,
  MEAL_TYPES,
  COOKING_TIMES,
  API_ENDPOINTS,
  UI_CONSTANTS,
  STORAGE_KEYS,
  DEFAULT_PREFERENCES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURE_FLAGS,
  PAGINATION,
  VALIDATION_RULES,
  DEMO_DATA
};

export default constants;