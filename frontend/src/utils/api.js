import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS, ERROR_MESSAGES } from '../config/constants';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for recipe generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to include auth token and handle loading
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // Log API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);
    
    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.error('Permission denied');
    } else if (error.response?.status >= 500) {
      console.error('Server error');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error');
    }
    
    return Promise.reject(error);
  }
);

// Utility function to handle API errors
const handleApiError = (error, defaultMessage = ERROR_MESSAGES.SERVER_ERROR) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, ERROR_MESSAGES.AUTH_FAILED) 
      };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Registration failed') 
      };
    }
  },

  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return { success: true };
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to fetch profile') 
      };
    }
  }
};

// Products API
export const productAPI = {
  search: async (query, filters = {}) => {
    try {
      const response = await api.post(API_ENDPOINTS.PRODUCTS.SEARCH, { 
        query, 
        filters 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, ERROR_MESSAGES.SEARCH_FAILED) 
      };
    }
  },

  nlqSearch: async (query, userId, userContext) => {
    try {
      const response = await api.post(API_ENDPOINTS.PRODUCTS.NLQ_SEARCH, { 
        query, 
        userId, 
        userContext 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, ERROR_MESSAGES.SEARCH_FAILED) 
      };
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.GET_ALL, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to fetch products') 
      };
    }
  },

  getById: async (productId) => {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.GET_BY_ID.replace(':id', productId));
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Product not found') 
      };
    }
  },

  getSuggestions: async (productId) => {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.SUGGESTIONS.replace(':id', productId));
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to get suggestions') 
      };
    }
  },

  getRecipe: async (productId, dietaryType, servings) => {
    try {
      const response = await api.post(API_ENDPOINTS.PRODUCTS.RECIPE, {
        productId,
        dietaryType,
        servings
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to get recipe') 
      };
    }
  }
};

// Recipes API
export const recipeAPI = {
  search: async (query, filters = {}) => {
    try {
      const response = await api.post(API_ENDPOINTS.RECIPES.SEARCH, { 
        query, 
        filters 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, ERROR_MESSAGES.RECIPE_NOT_FOUND) 
      };
    }
  },

  generate: async (dishName, numPeople, dietType) => {
    try {
      const response = await api.post(API_ENDPOINTS.RECIPES.GENERATE, {
        dishName,
        numPeople,
        dietType
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to generate recipe') 
      };
    }
  },

  getById: async (recipeId) => {
    try {
      const response = await api.get(API_ENDPOINTS.RECIPES.GET_BY_ID.replace(':id', recipeId));
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Recipe not found') 
      };
    }
  },

  getFeatured: async (type = 'popular', limit = 6) => {
    try {
      let endpoint;
      switch (type) {
        case 'trending':
          endpoint = API_ENDPOINTS.RECIPES.FEATURED.TRENDING;
          break;
        case 'quick':
          endpoint = API_ENDPOINTS.RECIPES.FEATURED.QUICK;
          break;
        default:
          endpoint = API_ENDPOINTS.RECIPES.FEATURED.POPULAR;
      }
      
      const response = await api.get(`${endpoint}?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to fetch featured recipes') 
      };
    }
  }
};

// Meal Plans API
export const mealPlanAPI = {
  getUserPlans: async (userId) => {
    try {
      const response = await api.get(API_ENDPOINTS.MEAL_PLANS.GET_USER_PLANS.replace(':userId', userId));
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to fetch meal plans') 
      };
    }
  },

  create: async (mealPlanData) => {
    try {
      const response = await api.post(API_ENDPOINTS.MEAL_PLANS.CREATE, mealPlanData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to create meal plan') 
      };
    }
  },

  update: async (planId, updateData) => {
    try {
      const response = await api.put(API_ENDPOINTS.MEAL_PLANS.UPDATE.replace(':id', planId), updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to update meal plan') 
      };
    }
  },

  delete: async (planId) => {
    try {
      await api.delete(API_ENDPOINTS.MEAL_PLANS.DELETE.replace(':id', planId));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to delete meal plan') 
      };
    }
  }
};

// Recommendations API
export const recommendationAPI = {
  getCartRecommendations: async (cartItems, dietType) => {
    try {
      const response = await api.post(API_ENDPOINTS.RECOMMENDATIONS.CART, {
        cartItems,
        dietType
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to get recommendations') 
      };
    }
  },

  getMealPlanRecommendations: async (preferences) => {
    try {
      const response = await api.post(API_ENDPOINTS.RECOMMENDATIONS.MEAL_PLAN, {
        preferences
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to get meal plan recommendations') 
      };
    }
  },

  getTrending: async (limit = 6) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.RECOMMENDATIONS.TRENDING}?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to get trending items') 
      };
    }
  },

  getSeasonal: async (limit = 6) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.RECOMMENDATIONS.SEASONAL}?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to get seasonal items') 
      };
    }
  }
};

// Inventory API
export const inventoryAPI = {
  checkAvailability: async (items) => {
    try {
      const response = await api.post(API_ENDPOINTS.INVENTORY.CHECK, { items });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to check inventory') 
      };
    }
  },

  search: async (query) => {
    try {
      const response = await api.post(API_ENDPOINTS.INVENTORY.SEARCH, { query });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Inventory search failed') 
      };
    }
  }
};

// Health check API
export const healthAPI = {
  check: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.HEALTH);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Health check failed') 
      };
    }
  }
};

// Cart API (for persistent cart storage)
export const cartAPI = {
  save: async (cartData) => {
    try {
      const response = await api.post('/api/cart/save', cartData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, ERROR_MESSAGES.CART_ERROR) 
      };
    }
  },

  get: async (userId) => {
    try {
      const response = await api.get(`/api/cart/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to fetch cart') 
      };
    }
  },

  clear: async (userId) => {
    try {
      await api.delete(`/api/cart/${userId}`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: handleApiError(error, 'Failed to clear cart') 
      };
    }
  }
};

// Utility functions
export const apiUtils = {
  // Check if API is available
  isApiAvailable: async () => { try {
      const response = await healthAPI.check();
      return response.success;
    } catch {
      return false;
    }
  },

  // Format error messages for user display
  formatErrorMessage: (error) => {
    return handleApiError(error);
  },

  // Log API usage for analytics
  logApiUsage: (endpoint, method) => {
    console.log(`API Usage: ${method} ${endpoint}`);
  }
};

export default api;