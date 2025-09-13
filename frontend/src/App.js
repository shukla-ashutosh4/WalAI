import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
import Login from './components/Login';
import ShoppingInterface from './components/ShoppingInterface';
import MealPlanner from './components/MealPlanner';
import RecipeSearch from './components/RecipeSearch';
import Cart from './components/Cart';
import {
  UI_CONSTANTS,
  STORAGE_KEYS,
  DEFAULT_PREFERENCES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './config/constants';
import { authAPI, healthAPI } from './utils/api';

// Theme configuration (unchanged)
const theme = createTheme({
  palette: {
    primary: {
      main: UI_CONSTANTS.COLORS.PRIMARY,
    },
    secondary: {
      main: UI_CONSTANTS.COLORS.SECONDARY,
    },
    background: {
      default: UI_CONSTANTS.COLORS.BACKGROUND,
    },
    success: {
      main: UI_CONSTANTS.COLORS.SUCCESS,
    },
    warning: {
      main: UI_CONSTANTS.COLORS.WARNING,
    },
    error: {
      main: UI_CONSTANTS.COLORS.ERROR,
    },
    info: {
      main: UI_CONSTANTS.COLORS.INFO,
    },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.3s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: UI_CONSTANTS.COLORS.PRIMARY,
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: UI_CONSTANTS.BREAKPOINTS.XS,
      sm: UI_CONSTANTS.BREAKPOINTS.SM,
      md: UI_CONSTANTS.BREAKPOINTS.MD,
      lg: UI_CONSTANTS.BREAKPOINTS.LG,
      xl: UI_CONSTANTS.BREAKPOINTS.XL,
    },
  },
});

const App = () => {
  const navigate = useNavigate();

  // Core state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cart and shopping state
  const [cart, setCart] = useState([]);
  const [deliveryOption, setDeliveryOption] = useState('pickup');

  // User preferences with enhanced defaults
  const [userPreferences, setUserPreferences] = useState(DEFAULT_PREFERENCES);

  // UI state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load saved user data
  const loadSavedData = useCallback((savedCart, savedPreferences, savedDeliveryOption) => {
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        setCart([]);
      }
    }

    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setUserPreferences((prev) => ({ ...prev, ...parsedPreferences }));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }

    if (savedDeliveryOption) {
      setDeliveryOption(savedDeliveryOption);
    }
  }, []);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    setUser(null);
    setCart([]);
    setUserPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Check for existing authentication
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      const savedCart = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
      const savedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const savedDeliveryOption = localStorage.getItem(STORAGE_KEYS.DELIVERY_OPTION);

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          const profileResult = await authAPI.getProfile();
          if (profileResult.success) {
            setUser(profileResult.data.user || parsedUser);
            loadSavedData(savedCart, savedPreferences, savedDeliveryOption);
          } else {
            clearAuthData();
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuthData();
    }
  }, [loadSavedData, clearAuthData]);

  // Check API health and authentication on app load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const healthCheck = await healthAPI.check();
        console.log('API Status:', healthCheck.success ? 'online' : 'offline');
        await checkAuthStatus();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [checkAuthStatus]);

  // Auto-save data to localStorage
  useEffect(() => {
    if (user && cart.length >= 0) {
      localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cart));
    }
  }, [cart, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(userPreferences));
    }
  }, [userPreferences, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_OPTION, deliveryOption);
  }, [deliveryOption]);

  // Authentication handlers
  const handleLogin = async (userData, token) => {
    try {
      setUser(userData);
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      }
      const initialPreferences = {
        ...DEFAULT_PREFERENCES,
        ...userData.preferences,
      };
      setUserPreferences(initialPreferences);
      setCart([]);
      showSnackbar(SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
    } catch (error) {
      console.error('Login handler error:', error);
      showSnackbar(ERROR_MESSAGES.AUTH_FAILED, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setCart([]);
      setUserPreferences(DEFAULT_PREFERENCES);
      showSnackbar('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      clearAuthData();
    }
  };

  // Cart management functions
  const handleAddToCart = (item, dietType = null, servings = 1) => {
    try {
      if (!item || !item.name) {
        showSnackbar('Invalid item data', 'error');
        return;
      }

      const existingItemIndex = cart.findIndex(
        (cartItem) =>
          cartItem._id === item._id ||
          cartItem.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existingItemIndex !== -1) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += item.quantity || 1;
        setCart(updatedCart);
        showSnackbar(`Updated ${item.name} quantity`, 'success');
      } else {
        const cartItem = {
          ...item,
          id: `${item._id || 'temp'}_${Date.now()}_${Math.random()}`,
          selectedDietType: dietType || userPreferences.dietType,
          servings: servings,
          quantity: item.quantity || 1,
          addedAt: new Date().toISOString(),
          price: item.price || 2.99,
          image:
            item.image ||
            `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(
              item.name
            )}`,
          description: item.description || `Fresh ${item.name} for cooking`,
          category: item.category || 'General',
        };

        setCart((prevCart) => [...prevCart, cartItem]);
        showSnackbar(`${item.name} added to cart`, 'success');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showSnackbar(ERROR_MESSAGES.CART_ERROR, 'error');
    }
  };

  const handleRemoveFromCart = (cartItemIndex) => {
    try {
      const removedItem = cart[cartItemIndex];
      setCart((prevCart) => prevCart.filter((_, index) => index !== cartItemIndex));
      showSnackbar(`${removedItem?.name || 'Item'} removed from cart`, 'success');
    } catch (error) {
      console.error('Remove from cart error:', error);
      showSnackbar('Failed to remove item', 'error');
    }
  };

  const handleUpdateCartItem = (cartItemId, updates) => {
    try {
      setCart((prevCart) =>
        prevCart.map((item) => (item.id === cartItemId ? { ...item, ...updates } : item))
      );
    } catch (error) {
      console.error('Update cart item error:', error);
      showSnackbar('Failed to update item', 'error');
    }
  };

  const handleClearCart = () => {
    try {
      setCart([]);
      showSnackbar(SUCCESS_MESSAGES.CART_CLEARED, 'success');
    } catch (error) {
      console.error('Clear cart error:', error);
    }
  };

  // Cart utility functions
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Cart open handler
  const handleCartOpen = () => {
    navigate('/cart');
  };

  // Preferences handler
  const handleUpdatePreferences = (newPreferences) => {
    setUserPreferences((prev) => ({ ...prev, ...newPreferences }));
    showSnackbar(SUCCESS_MESSAGES.PREFERENCES_UPDATED, 'success');
  };

  // Delivery option handler
  const handleOptionChange = (e) => {
    setDeliveryOption(e.target.value);
  };

  // Recipe to cart handler
  const handleRecipeToCart = async (recipeData, servings, dietType) => {
    try {
      let ingredients = [];
      if (recipeData.ingredients) {
        ingredients = recipeData.ingredients;
      } else if (recipeData.availableItems) {
        ingredients = recipeData.availableItems;
      } else if (Array.isArray(recipeData)) {
        ingredients = recipeData;
      }

      if (ingredients.length === 0) {
        return {
          success: false,
          message: 'No ingredients found in recipe',
          itemsAdded: 0,
        };
      }

      const recipeCartItems = ingredients.map((ingredient, index) => ({
        _id: ingredient._id || ingredient.inventoryId || `recipe_ingredient_${index}`,
        name: ingredient.name || ingredient.ingredient,
        price: ingredient.price || 2.99,
        quantity: ingredient.requiredQuantity || ingredient.quantity || 1,
        unit: ingredient.unit || 'pieces',
        id: `recipe_${ingredient.name || ingredient.ingredient}_${dietType}_${Date.now()}_${index}`,
        selectedDietType: dietType || userPreferences.dietType,
        servings: servings,
        isRecipeIngredient: true,
        recipeName: recipeData.name || recipeData.dish || 'Recipe',
        addedAt: new Date().toISOString(),
        image:
          ingredient.image ||
          `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(
            ingredient.name || ingredient.ingredient
          )}`,
        description:
          ingredient.description ||
          ingredient.preparationNotes ||
          `Fresh ${ingredient.name || ingredient.ingredient} for cooking`,
        category: ingredient.category || dietType,
      }));

      setCart((prevCart) => [...prevCart, ...recipeCartItems]);

      return {
        success: true,
        message: `Added ${recipeData.name || 'recipe'} ingredients to cart`,
        itemsAdded: recipeCartItems.length,
      };
    } catch (error) {
      console.error('Error adding recipe to cart:', error);
      return {
        success: false,
        message: 'Failed to add recipe to cart',
        error: error.message,
      };
    }
  };

  // Snackbar handler
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          flexDirection="column"
          gap={2}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CircularProgress size={60} sx={{ color: 'white' }} />
          <Box sx={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>
              Loading Wal AI...
            </div>
            <div style={{ fontSize: '1rem', opacity: 0.8 }}>
              Preparing your smart shopping experience
            </div>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Routes>
          <Route
            path="/shop"
            element={
              user ? (
                <ShoppingInterface
                  user={user}
                  onLogout={handleLogout}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onUpdateCartItem={handleUpdateCartItem}
                  onClearCart={handleClearCart}
                  userPreferences={userPreferences}
                  onUpdatePreferences={handleUpdatePreferences}
                  deliveryOption={deliveryOption}
                  onDeliveryOptionChange={handleOptionChange}
                  onCartOpen={handleCartOpen}
                  cartItemCount={getCartItemCount()}
                  cartTotal={getCartTotal()}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/recipes"
            element={
              user ? (
                <RecipeSearch
                  user={user}
                  onLogout={handleLogout}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onRecipeToCart={handleRecipeToCart}
                  userPreferences={userPreferences}
                  onUpdatePreferences={handleUpdatePreferences}
                  onCartOpen={handleCartOpen}
                  cartItemCount={getCartItemCount()}
                  cartTotal={getCartTotal()}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/meal-planner"
            element={
              user ? (
                <MealPlanner
                  user={user}
                  onLogout={handleLogout}
                  userPreferences={userPreferences}
                  onUpdatePreferences={handleUpdatePreferences}
                  onRecipeToCart={handleRecipeToCart}
                  onCartOpen={handleCartOpen}
                  cartItemCount={getCartItemCount()}
                  cartTotal={getCartTotal()}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/shop" replace /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/cart"
            element={
              user ? (
                <Cart
                  cartItems={cart}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onUpdateCartItem={handleUpdateCartItem}
                  onClearCart={handleClearCart}
                  userPreferences={userPreferences}
                  user={user}
                  cartTotal={getCartTotal()}
                  deliveryOption={deliveryOption}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/" element={user ? <Navigate to="/shop" replace /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
};

export default App;
// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import { CssBaseline, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
// import Login from './components/Login';
// import ShoppingInterface from './components/ShoppingInterface';
// import MealPlanner from './components/MealPlanner';
// import RecipeSearch from './components/RecipeSearch';
// import Cart from './components/Cart';
// import { 
//   UI_CONSTANTS, 
//   STORAGE_KEYS, 
//   DEFAULT_PREFERENCES,
//   ERROR_MESSAGES,
//   SUCCESS_MESSAGES 
// } from './config/constants';
// import { authAPI, healthAPI } from './utils/api';

// // Enhanced theme with Walmart-like styling
// const theme = createTheme({
//   palette: {
//     primary: {
//       main: UI_CONSTANTS.COLORS.PRIMARY,
//     },
//     secondary: {
//       main: UI_CONSTANTS.COLORS.SECONDARY,
//     },
//     background: {
//       default: UI_CONSTANTS.COLORS.BACKGROUND,
//     },
//     success: {
//       main: UI_CONSTANTS.COLORS.SUCCESS,
//     },
//     warning: {
//       main: UI_CONSTANTS.COLORS.WARNING,
//     },
//     error: {
//       main: UI_CONSTANTS.COLORS.ERROR,
//     },
//     info: {
//       main: UI_CONSTANTS.COLORS.INFO,
//     },
//   },
//   typography: {
//     fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
//     h1: {
//       fontWeight: 700,
//       fontSize: '2.5rem',
//     },
//     h2: {
//       fontWeight: 600,
//       fontSize: '2rem',
//     },
//     h3: {
//       fontWeight: 600,
//       fontSize: '1.75rem',
//     },
//     h4: {
//       fontWeight: 500,
//       fontSize: '1.5rem',
//     },
//     h5: {
//       fontWeight: 500,
//       fontSize: '1.25rem',
//     },
//     h6: {
//       fontWeight: 500,
//       fontSize: '1rem',
//     },
//   },
//   components: {
//     MuiButton: {
//       styleOverrides: {
//         root: {
//           borderRadius: 8,
//           textTransform: 'none',
//           fontWeight: 600,
//           padding: '10px 20px',
//           transition: 'all 0.3s ease',
//         },
//         contained: {
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           '&:hover': {
//             boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
//             transform: 'translateY(-1px)',
//           },
//         },
//       },
//     },
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           borderRadius: 12,
//           boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
//           transition: 'all 0.3s ease-in-out',
//           '&:hover': {
//             boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
//             transform: 'translateY(-2px)',
//           },
//         },
//       },
//     },
//     MuiTextField: {
//       styleOverrides: {
//         root: {
//           '& .MuiOutlinedInput-root': {
//             borderRadius: 8,
//             transition: 'all 0.3s ease',
//             '&:hover': {
//               '& .MuiOutlinedInput-notchedOutline': {
//                 borderColor: UI_CONSTANTS.COLORS.PRIMARY,
//               },
//             },
//           },
//         },
//       },
//     },
//     MuiChip: {
//       styleOverrides: {
//         root: {
//           borderRadius: 16,
//           fontWeight: 500,
//         },
//       },
//     },
//   },
//   breakpoints: {
//     values: {
//       xs: UI_CONSTANTS.BREAKPOINTS.XS,
//       sm: UI_CONSTANTS.BREAKPOINTS.SM,
//       md: UI_CONSTANTS.BREAKPOINTS.MD,
//       lg: UI_CONSTANTS.BREAKPOINTS.LG,
//       xl: UI_CONSTANTS.BREAKPOINTS.XL,
//     },
//   },
// });

// const App = () => {
//   // Core state
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
  
//   // Cart and shopping state
//   const [cart, setCart] = useState([]);
//   const [showCart, setShowCart] = useState(false);
//   const [deliveryOption, setDeliveryOption] = useState('pickup');
  
//   // User preferences with enhanced defaults
//   const [userPreferences, setUserPreferences] = useState(DEFAULT_PREFERENCES);
  
//   // UI state
//   const [snackbar, setSnackbar] = useState({ 
//     open: false, 
//     message: '', 
//     severity: 'success' 
//   });

//   // Load saved user data
//   const loadSavedData = useCallback((savedCart, savedPreferences, savedDeliveryOption) => {
//     if (savedCart) {
//       try {
//         const parsedCart = JSON.parse(savedCart);
//         setCart(Array.isArray(parsedCart) ? parsedCart : []);
//       } catch (error) {
//         console.error('Error parsing saved cart:', error);
//         setCart([]);
//       }
//     }
    
//     if (savedPreferences) {
//       try {
//         const parsedPreferences = JSON.parse(savedPreferences);
//         setUserPreferences(prev => ({ ...prev, ...parsedPreferences }));
//       } catch (error) {
//         console.error('Error parsing saved preferences:', error);
//       }
//     }

//     if (savedDeliveryOption) {
//       setDeliveryOption(savedDeliveryOption);
//     }
//   }, []);

//   // Clear authentication data
//   const clearAuthData = useCallback(() => {
//     localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
//     localStorage.removeItem(STORAGE_KEYS.USER_DATA);
//     localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
//     localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
//     setUser(null);
//     setCart([]);
//     setUserPreferences(DEFAULT_PREFERENCES);
//   }, []);

//   // Check for existing authentication
//   const checkAuthStatus = useCallback(async () => {
//     try {
//       const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
//       const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
//       const savedCart = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
//       const savedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
//       const savedDeliveryOption = localStorage.getItem(STORAGE_KEYS.DELIVERY_OPTION);
      
//       if (token && userData) {
//         try {
//           const parsedUser = JSON.parse(userData);
//           const profileResult = await authAPI.getProfile();
//           if (profileResult.success) {
//             setUser(profileResult.data.user || parsedUser);
//             loadSavedData(savedCart, savedPreferences, savedDeliveryOption);
//           } else {
//             clearAuthData();
//           }
//         } catch (parseError) {
//           console.error('Error parsing user data:', parseError);
//           clearAuthData();
//         }
//       }
//     } catch (error) {
//       console.error('Auth check error:', error);
//       clearAuthData();
//     }
//   }, [loadSavedData, clearAuthData]);

//   // Check API health and authentication on app load
//   useEffect(() => {
//     const initializeApp = async () => {
//       try {
//         const healthCheck = await healthAPI.check();
//         console.log('API Status:', healthCheck.success ? 'online' : 'offline');
//         await checkAuthStatus();
//       } catch (error) {
//         console.error('App initialization error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeApp();
//   }, [checkAuthStatus]);

//   // Auto-save data to localStorage
//   useEffect(() => {
//     if (user && cart.length >= 0) {
//       localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cart));
//     }
//   }, [cart, user]);

//   useEffect(() => {
//     if (user) {
//       localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(userPreferences));
//     }
//   }, [userPreferences, user]);

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEYS.DELIVERY_OPTION, deliveryOption);
//   }, [deliveryOption]);

//   // Authentication handlers
//   const handleLogin = async (userData, token) => {
//     try {
//       setUser(userData);
//       if (token) {
//         localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
//         localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
//       }
//       const initialPreferences = {
//         ...DEFAULT_PREFERENCES,
//         ...userData.preferences
//       };
//       setUserPreferences(initialPreferences);
//       setCart([]);
//       showSnackbar(SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
//     } catch (error) {
//       console.error('Login handler error:', error);
//       showSnackbar(ERROR_MESSAGES.AUTH_FAILED, 'error');
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await authAPI.logout();
//       setUser(null);
//       setCart([]);
//       setShowCart(false);
//       setUserPreferences(DEFAULT_PREFERENCES);
//       showSnackbar('Logged out successfully', 'success');
//     } catch (error) {
//       console.error('Logout error:', error);
//       clearAuthData();
//     }
//   };

//   // Cart management functions
//   const handleAddToCart = (item, dietType = null, servings = 1) => {
//     try {
//       if (!item || !item.name) {
//         showSnackbar('Invalid item data', 'error');
//         return;
//       }

//       const existingItemIndex = cart.findIndex(cartItem => 
//         cartItem._id === item._id || 
//         cartItem.name.toLowerCase() === item.name.toLowerCase()
//       );

//       if (existingItemIndex !== -1) {
//         const updatedCart = [...cart];
//         updatedCart[existingItemIndex].quantity += (item.quantity || 1);
//         setCart(updatedCart);
//         showSnackbar(`Updated ${item.name} quantity`, 'success');
//       } else {
//         const cartItem = {
//           ...item,
//           id: `${item._id || 'temp'}_${Date.now()}_${Math.random()}`,
//           selectedDietType: dietType || userPreferences.dietType,
//           servings: servings,
//           quantity: item.quantity || 1,
//           addedAt: new Date().toISOString(),
//           price: item.price || 2.99,
//           image: item.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(item.name)}`,
//           description: item.description || `Fresh ${item.name} for cooking`,
//           category: item.category || 'General'
//         };
        
//         setCart(prevCart => [...prevCart, cartItem]);
//         showSnackbar(`${item.name} added to cart`, 'success');
//       }
//     } catch (error) {
//       console.error('Add to cart error:', error);
//       showSnackbar(ERROR_MESSAGES.CART_ERROR, 'error');
//     }
//   };

//   const handleRemoveFromCart = (cartItemIndex) => {
//     try {
//       const removedItem = cart[cartItemIndex];
//       setCart(prevCart => prevCart.filter((_, index) => index !== cartItemIndex));
//       showSnackbar(`${removedItem?.name || 'Item'} removed from cart`, 'success');
//     } catch (error) {
//       console.error('Remove from cart error:', error);
//       showSnackbar('Failed to remove item', 'error');
//     }
//   };

//   const handleUpdateCartItem = (cartItemId, updates) => {
//     try {
//       setCart(prevCart => 
//         prevCart.map(item => 
//           item.id === cartItemId ? { ...item, ...updates } : item
//         )
//       );
//     } catch (error) {
//       console.error('Update cart item error:', error);
//       showSnackbar('Failed to update item', 'error');
//     }
//   };

//   const handleClearCart = () => {
//     try {
//       setCart([]);
//       showSnackbar(SUCCESS_MESSAGES.CART_CLEARED, 'success');
//     } catch (error) {
//       console.error('Clear cart error:', error);
//     }
//   };

//   // Cart utility functions
//   const getCartTotal = () => {
//     return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
//   };

//   const getCartItemCount = () => {
//     return cart.reduce((count, item) => count + item.quantity, 0);
//   };

//   // Cart open/close handlers
//   const handleCartOpen = () => {
//     setShowCart(true);
//   };

//   const handleCartClose = () => {
//     setShowCart(false);
//   };

//   // Preferences handler
//   const handleUpdatePreferences = (newPreferences) => {
//     setUserPreferences(prev => ({ ...prev, ...newPreferences }));
//     showSnackbar(SUCCESS_MESSAGES.PREFERENCES_UPDATED, 'success');
//   };

//   // Delivery option handler
//   const handleOptionChange = (e) => {
//     setDeliveryOption(e.target.value);
//   };

//   // Recipe to cart handler
//   const handleRecipeToCart = async (recipeData, servings, dietType) => {
//     try {
//       let ingredients = [];
//       if (recipeData.ingredients) {
//         ingredients = recipeData.ingredients;
//       } else if (recipeData.availableItems) {
//         ingredients = recipeData.availableItems;
//       } else if (Array.isArray(recipeData)) {
//         ingredients = recipeData;
//       }

//       if (ingredients.length === 0) {
//         return {
//           success: false,
//           message: 'No ingredients found in recipe',
//           itemsAdded: 0
//         };
//       }

//       const recipeCartItems = ingredients.map((ingredient, index) => ({
//         _id: ingredient._id || ingredient.inventoryId || `recipe_ingredient_${index}`,
//         name: ingredient.name || ingredient.ingredient,
//         price: ingredient.price || 2.99,
//         quantity: ingredient.requiredQuantity || ingredient.quantity || 1,
//         unit: ingredient.unit || 'pieces',
//         id: `recipe_${ingredient.name || ingredient.ingredient}_${dietType}_${Date.now()}_${index}`,
//         selectedDietType: dietType || userPreferences.dietType,
//         servings: servings,
//         isRecipeIngredient: true,
//         recipeName: recipeData.name || recipeData.dish || 'Recipe',
//         addedAt: new Date().toISOString(),
//         image: ingredient.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(ingredient.name || ingredient.ingredient)}`,
//         description: ingredient.description || ingredient.preparationNotes || `Fresh ${ingredient.name || ingredient.ingredient} for cooking`,
//         category: ingredient.category || dietType
//       }));
      
//       setCart(prevCart => [...prevCart, ...recipeCartItems]);
      
//       return {
//         success: true,
//         message: `Added ${recipeData.name || 'recipe'} ingredients to cart`,
//         itemsAdded: recipeCartItems.length
//       };
//     } catch (error) {
//       console.error('Error adding recipe to cart:', error);
//       return {
//         success: false,
//         message: 'Failed to add recipe to cart',
//         error: error.message
//       };
//     }
//   };

//   // Snackbar handler
//   const showSnackbar = (message, severity) => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const handleSnackbarClose = () => {
//     setSnackbar({ ...snackbar, open: false });
//   };

//   if (loading) {
//     return (
//       <ThemeProvider theme={theme}>
//         <CssBaseline />
//         <Box
//           display="flex"
//           justifyContent="center"
//           alignItems="center"
//           minHeight="100vh"
//           flexDirection="column"
//           gap={2}
//           sx={{
//             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//             color: 'white'
//           }}
//         >
//           <CircularProgress size={60} sx={{ color: 'white' }} />
//           <Box sx={{ textAlign: 'center' }}>
//             <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>
//               Loading Wal AI...
//             </div>
//             <div style={{ fontSize: '1rem', opacity: 0.8 }}>
//               Preparing your smart shopping experience
//             </div>
//           </Box>
//         </Box>
//       </ThemeProvider>
//     );
//   }

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <Router>
//         <div className="App">
//           {showCart && (
//             <Cart
//               cartItems={cart}
//               onClose={handleCartClose}
//               onAddToCart={handleAddToCart}
//               onRemoveFromCart={handleRemoveFromCart}
//               onUpdateCartItem={handleUpdateCartItem}
//               onClearCart={handleClearCart}
//               userPreferences={userPreferences}
//               user={user}
//               cartTotal={getCartTotal()}
//               deliveryOption={deliveryOption}
//             />
//           )}

//           <Routes>
//             <Route 
//               path="/shop" 
//               element={
//                 user ? (
//                   <ShoppingInterface 
//                     user={user} 
//                     onLogout={handleLogout}
//                     cart={cart}
//                     onAddToCart={handleAddToCart}
//                     onRemoveFromCart={handleRemoveFromCart}
//                     onUpdateCartItem={handleUpdateCartItem}
//                     onClearCart={handleClearCart}
//                     userPreferences={userPreferences}
//                     onUpdatePreferences={handleUpdatePreferences}
//                     deliveryOption={deliveryOption}
//                     onDeliveryOptionChange={handleOptionChange}
//                     onCartOpen={handleCartOpen}
//                     cartItemCount={getCartItemCount()}
//                     cartTotal={getCartTotal()}
//                   />
//                 ) : (
//                   <Navigate to="/login" replace />
//                 )
//               } 
//             />
//             <Route 
//               path="/recipes" 
//               element={
//                 user ? (
//                   <RecipeSearch 
//                     user={user}
//                     onLogout={handleLogout}
//                     cart={cart}
//                     onAddToCart={handleAddToCart}
//                     onRecipeToCart={handleRecipeToCart}
//                     userPreferences={userPreferences}
//                     onUpdatePreferences={handleUpdatePreferences}
//                     onCartOpen={handleCartOpen}
//                     cartItemCount={getCartItemCount()}
//                     cartTotal={getCartTotal()}
//                   />
//                 ) : (
//                   <Navigate to="/login" replace />
//                 )
//               } 
//             />
//             <Route 
//               path="/meal-planner" 
//               element={
//                 user ? (
//                   <MealPlanner 
//                     user={user}
//                     onLogout={handleLogout}
//                     userPreferences={userPreferences}
//                     onUpdatePreferences={handleUpdatePreferences}
//                     onRecipeToCart={handleRecipeToCart}
//                     onCartOpen={handleCartOpen}
//                     cartItemCount={getCartItemCount()}
//                     cartTotal={getCartTotal()}
//                   />
//                 ) : (
//                   <Navigate to="/login" replace />
//                 )
//               } 
//             />
//             <Route 
//               path="/login" 
//               element={
//                 user ? (
//                   <Navigate to="/shop" replace />
//                 ) : (
//                   <Login onLogin={handleLogin} />
//                 )
//               } 
//             />
//             <Route 
//               path="/" 
//               element={
//                 user ? (
//                   <Navigate to="/shop" replace />
//                 ) : (
//                   <Navigate to="/login" replace />
//                 )
//               } 
//             />
//             <Route 
//               path="*" 
//               element={<Navigate to="/" replace />} 
//             />
//           </Routes>

//           <Snackbar 
//             open={snackbar.open} 
//             autoHideDuration={6000} 
//             onClose={handleSnackbarClose}
//           >
//             <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
//               {snackbar.message}
//             </Alert>
//           </Snackbar>
//         </div>
//       </Router>
//     </ThemeProvider>
//   );
// };
// export default App;