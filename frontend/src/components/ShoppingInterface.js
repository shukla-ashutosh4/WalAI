import React, { useState, useEffect, useCallback, useRef } from 'react';
import WalAILogoImage from './Logo.png';
import {
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Box,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Drawer,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  ClickAwayListener,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material';
import { 
  Add,
  AccountCircle,
  Menu,
  LocationOn,
  ExpandMore,
  Search,
  ShoppingCart,
  Close
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ShoppingInterface = ({ 
  user, 
  onLogout, 
  cart, 
  onAddToCart, 
  onRemoveFromCart, 
  onUpdateCartItem, 
  onClearCart,
  userPreferences, 
  onUpdatePreferences,
  deliveryOption,
  onDeliveryOptionChange 
}) => {
  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // State Management
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Enhanced features state
  const [showDietaryDialog, setShowDietaryDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedDietType, setSelectedDietType] = useState('');
  const [servingCount, setServingCount] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recipeSearchMode, setRecipeSearchMode] = useState(false);
  
  // New state for ingredient checking
  const [checkingIngredients, setCheckingIngredients] = useState({});
  const [showIngredientsDialog, setShowIngredientsDialog] = useState(false);
  const [selectedProductIngredients, setSelectedProductIngredients] = useState(null);
  const [grocerySearchMode, setGrocerySearchMode] = useState('products');

  const categories = [
    { 
      id: 'food-grocery', 
      name: 'Food & Grocery', 
      icon: '🛒',
      description: 'Fresh produce, pantry essentials, snacks & recipe ingredients'
    },
  ];

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCategoryClick = useCallback((category) => {
    if (category.id === 'recipes') {
      setRecipeSearchMode(true);
      setSelectedCategory(category);
    } else {
      setRecipeSearchMode(false);
      setSelectedCategory(category);
      setGrocerySearchMode('products'); 
    }
    setProducts([]);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setMobileMenuOpen(false);
  }, []);

  const handleGrocerySearchModeChange = useCallback((event, newMode) => {
    if (newMode !== null) {
      setGrocerySearchMode(newMode);
      setProducts([]);
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const loadCartRecommendations = useCallback(async () => {
    if (cart.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations/cart`,
        {
          cartItems: cart.map(item => ({
            _id: item._id,
            name: item.name,
            category: item.category,
            tags: item.tags,
            price: item.price
          })),
          dietType: userPreferences?.dietType
        },
        { headers }
      );

      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      showSnackbar('Failed to load recommendations', 'error');
    }
  }, [cart, userPreferences?.dietType, showSnackbar]);

 const checkProductIngredients = useCallback(async (product) => {
    if (checkingIngredients[product._id]) return;
    
    setCheckingIngredients(prev => ({ ...prev, [product._id]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/check-ingredients`,
        {
          productName: product.name,
          dietType: userPreferences?.dietType || 'vegetarian',
          servings: 2
        },
        { headers }
      );

      if (response.data.success) {
        const ingredientData = response.data.data;
        
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p._id === product._id 
              ? { ...p, ingredientAvailability: ingredientData }
              : p
          )
        );
        
        setSelectedProductIngredients({
          product,
          ingredients: ingredientData
        });
        setShowIngredientsDialog(true);
      } 
      else {
        console.error('Ingredient check failed:', response.data.message);
        // showSnackbar('Failed to check ingredient availability', 'error');
      }
    } 
    catch (error) {
      console.error('Failed to check ingredients:', error);
      // showSnackbar('Failed to check ingredient availability', 'error');
    } 
    finally {
      setCheckingIngredients(prev => ({ ...prev, [product._id]: false }));
    }
  }, [userPreferences?.dietType, showSnackbar, checkingIngredients]);
  const handleSearchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (selectedCategory && (recipeSearchMode || (selectedCategory.id === 'food-grocery' && grocerySearchMode === 'recipes'))) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/search`,
        {
          query: query,
          category: selectedCategory?.id || 'all',
          limit: 8
        },
        { headers }
      );

      const products = response.data.products || response.data || [];
      const suggestionList = Array.isArray(products) ? products.slice(0, 8) : [];
      
      setSuggestions(suggestionList);
      setShowSuggestions(suggestionList.length > 0);
    } catch (error) {
      console.error('Search suggestions failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedCategory, recipeSearchMode, grocerySearchMode]);

  const handleRecipeSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a recipe name', 'warning');
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/generate`,
        {
          dishName: searchQuery,
          numPeople: userPreferences?.servingSize || 2,
          dietType: userPreferences?.dietType || 'Veg'
        },
        { headers }
      );

      const result = response.data;
      
      if (result.availableItems && result.availableItems.length > 0) {
        result.availableItems.forEach(item => {
          const cartItem = {
            _id: item.inventoryId || `temp_${Date.now()}_${Math.random()}`,
            name: item.name || item.ingredient,
            price: item.price || 2.99,
            quantity: item.requiredQuantity || item.quantity || 1,
            unit: item.unit || 'pieces',
            category: userPreferences?.dietType,
            isRecipeIngredient: true,
            recipeName: result.recipe?.name || searchQuery,
            addedAt: new Date().toISOString(),
            image: item.image || 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/fa5ce1e6-51df-48b0-837f-15c603286cb6.png'
          };
          onAddToCart(cartItem);
        });
        
        showSnackbar(
          `Added ${result.availableItems.length} ingredients for ${result.recipe?.name || searchQuery} to cart!`, 
          'success'
        );
        
        if (result.missingItems && result.missingItems.length > 0) {
          setTimeout(() => {
            showSnackbar(
              `Note: ${result.missingItems.length} ingredients are not available in inventory`, 
              'warning'
            );
          }, 2000);
        }
      } else {
        showSnackbar('No ingredients found for this recipe', 'info');
      }
      
      setSearchQuery('');
      setSuggestions([]);
    } catch (error) {
      console.error('Recipe search failed:', error);
      showSnackbar(
        error.response?.data?.message || 'Recipe search failed. Please try again.', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, userPreferences?.servingSize, userPreferences?.dietType, onAddToCart, showSnackbar]);

  const handleNLQSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a search query', 'warning');
      return;
    }

    setShowSuggestions(false);

    if (selectedCategory && (recipeSearchMode || (selectedCategory.id === 'food-grocery' && grocerySearchMode === 'recipes'))) {
      handleRecipeSearch();
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const shouldCheckIngredients = selectedCategory?.id === 'food-grocery';

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/search`,
        {
          query: searchQuery,
          category: selectedCategory?.id || 'all',
          filters: {
            dietType: userPreferences?.dietType
          },
          checkIngredients: shouldCheckIngredients
        },
        { headers }
      );

      setProducts(response.data.products || []);
      
      if (!selectedCategory && response.data.products && response.data.products.length > 0) {
        setSelectedCategory(categories[0]);
      }
      
      showSnackbar(
        response.data.message || `Found ${response.data.products?.length || 0} products`, 
        'success'
      );
    } catch (error) {
      console.error('Search failed:', error);
      showSnackbar('Search failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, recipeSearchMode, handleRecipeSearch, selectedCategory, userPreferences?.dietType, showSnackbar, grocerySearchMode]);

  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const isRecipeMode = selectedCategory && (recipeSearchMode || (selectedCategory.id === 'food-grocery' && grocerySearchMode === 'recipes'));
    if (value.length >= 2 && !isRecipeMode) {
      debounceTimerRef.current = setTimeout(() => {
        handleSearchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedCategory, recipeSearchMode, grocerySearchMode, handleSearchSuggestions]);

  const handleSearchFocus = useCallback(() => {
    if (suggestions.length > 0 && searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  }, [suggestions.length, searchQuery.length]);

  const handleClickAway = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      handleNLQSearch();
    }
  }, [handleNLQSearch]);

  const handleAddToCart = useCallback((product) => {
    setCurrentProduct(product);
    setSelectedDietType(userPreferences?.dietType || '');
    setShowDietaryDialog(true);
  }, [userPreferences?.dietType]);

  const quickAddFromSuggestion = useCallback((product) => {
    setShowSuggestions(false);
    handleAddToCart({...product, imageUrl: product.image});
    setSearchQuery('');
    setSuggestions([]);
  }, [handleAddToCart]);

  useEffect(() => {
    loadCartRecommendations();
  }, [loadCartRecommendations]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleDietarySelection = () => {
    if (!selectedDietType) {
      showSnackbar('Please select a dietary preference', 'warning');
      return;
    }
    setShowDietaryDialog(false);
    setShowQuantityDialog(true);
  };

  const handleQuantitySelection = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/generate`,
          {
            dishName: currentProduct.name,
            numPeople: servingCount,
            dietType: selectedDietType
          },
          { headers }
        );

        const recipeData = response.data;

        const mainItem = {
          _id: currentProduct._id,
          name: currentProduct.name,
          price: currentProduct.price,
          quantity: servingCount,
          category: selectedDietType,
          imageUrl: currentProduct.image,
          description: currentProduct.description
        };
        onAddToCart(mainItem);

        if (recipeData.availableItems && recipeData.availableItems.length > 0) {
          recipeData.availableItems.forEach(ingredient => {
            const ingredientItem = {
              _id: ingredient.inventoryId || `ingredient_${Date.now()}_${Math.random()}`,
              name: ingredient.name || ingredient.ingredient,
              price: ingredient.price || 2.99,
              quantity: Math.ceil(ingredient.requiredQuantity || 1),
              category: selectedDietType,
              isRecipeIngredient: true,
              recipeName: currentProduct.name,
              image: ingredient.image || 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f5473ca2-8f32-422f-919a-48c4eacddc59.png'
            };
            onAddToCart(ingredientItem);
          });
          
          showSnackbar(
            `${currentProduct.name} and ${recipeData.availableItems.length} ingredients added to cart!`, 
            'success'
          );
        } else {
          showSnackbar(`${currentProduct.name} added to cart!`, 'success');
        }

      } catch (recipeError) {
        const mainItem = {
          _id: currentProduct._id,
          name: currentProduct.name,
          price: currentProduct.price,
          quantity: servingCount,
          category: selectedDietType,
          image: currentProduct.image,
          description: currentProduct.description
        };
        onAddToCart(mainItem);
        showSnackbar(`${currentProduct.name} added to cart!`, 'success');
      }

      handleDialogReset();

    } catch (error) {
      console.error('Add to cart failed:', error);
      showSnackbar('Failed to add item to cart', 'error');
    }
  };

  const handleDialogReset = () => {
    setShowQuantityDialog(false);
    setShowDietaryDialog(false);
    setCurrentProduct(null);
    setSelectedDietType('');
    setServingCount(1);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCartClick = () => {
    try {
      navigate('/cart');
    } catch (error) {
      console.error('Navigation to cart failed:', error);
      showSnackbar('Unable to open cart. Please try again.', 'error');
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    setSelectedCategory(null);
    setSearchQuery('');
    setProducts([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const WalmartStyleHeader = () => (
    <Box>
      <Box sx={{ 
        backgroundColor: '#0071DC', 
        color: 'white',
        padding: '8px 0',
        fontSize: '14px'
      }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            minHeight: '56px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{ mr: 3, minWidth: '48px' }}>
                <img 
                  src={WalAILogoImage}
                  alt="Walmart spark logo with yellow background and blue star" 
                  style={{ width: '69px', height: '69px', cursor: 'pointer' }} 
                  className="relative z-10 max-w-full max-h-full object-contain"
                  onClick={handleLogoClick}
                />
              </Box>
              <Box sx={{ mr: 3, minWidth: '200px' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <Select
                    value={deliveryOption || 'pickup'}
                    onChange={onDeliveryOptionChange}
                    variant="outlined"
                    displayEmpty
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '& .MuiSvgIcon-root': { color: 'white' },
                      '& .MuiSelect-select': { 
                        paddingTop: '8px', 
                        paddingBottom: '8px',
                        paddingLeft: '32px',
                        fontSize: '14px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }
                    }}
                    startAdornment={
                      <InputAdornment position="start" sx={{ position: 'absolute', left: '8px' }}>
                        <LocationOn sx={{ fontSize: '18px', color: 'white' }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="pickup">Pickup</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="h1" sx={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  fontSize: '14px',
                  display: 'block',
                  mt: 0.5
                }}>
                  719 W. Walnut Street, Rogers, Arkansas
                </Typography>
              </Box>
              <Box sx={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search everything at Wal AI online and in store"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onFocus={handleSearchFocus}
                      onKeyPress={handleKeyPress}
                      inputRef={searchInputRef}
                      size="medium"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          borderRadius: '24px',
                          height: '48px',
                          paddingRight: '48px',
                          '& fieldset': { 
                            border: 'none',
                            borderRadius: '24px'
                          },
                          '& input': { 
                            padding: '12px 16px',
                            fontSize: '16px',
                            height: '24px'
                          },
                          '&:hover fieldset': { border: 'none' },
                          '&.Mui-focused fieldset': { border: 'none' }
                        }
                      }}
                    />
                    <IconButton 
                      onClick={handleNLQSearch}
                      disabled={loading}
                      sx={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: '#0071DC',
                        color: 'white',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        border: '2px solid white',
                        zIndex: 1,
                        '&:hover': { backgroundColor: '#004c91' },
                        '&:disabled': { backgroundColor: '#ccc' }
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Search sx={{ fontSize: '20px' }} />
                      )}
                    </IconButton>
                    {showSuggestions && suggestions.length > 0 && (
                      <Paper 
                        sx={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          zIndex: 1000, 
                          mt: 1,
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          maxHeight: '400px',
                          overflow: 'auto'
                        }}
                      >
                        <Box sx={{ p: 1 }}>
                          <Typography variant="subtitle2" sx={{ 
                            px: 2, 
                            py: 1, 
                            color: '#666',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>
                            Suggested Products
                          </Typography>
                          <List sx={{ p: 0 }}>
                            {suggestions.map((suggestion, index) => (
                              <ListItem 
                                key={index}
                                sx={{ 
                                  cursor: 'pointer',
                                  borderRadius: '8px',
                                  mx: 1,
                                  mb: 0.5,
                                  '&:hover': { 
                                    backgroundColor: '#f5f5f5',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  },
                                  transition: 'all 0.2s ease',
                                  py: 1.5
                                }}
                                onClick={() => {
                                  quickAddFromSuggestion(suggestion);
                                  checkProductIngredients(suggestion);
                                }}
                              >
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  width: '100%',
                                  gap: 2
                                }}>
                                  <Box sx={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    backgroundColor: '#f8f9fa',
                                    flexShrink: 0
                                  }}>
                                    <img 
                                      src={suggestion.image || "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/9d923f87-f9f0-4cfa-8e91-fd9b998acb9b.png"} 
                                      alt={suggestion.name}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 'bold',
                                      fontSize: '14px',
                                      lineHeight: 1.2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {suggestion.name}
                                    </Typography>
                                    {suggestion.description && (
                                      <Typography variant="caption" sx={{ 
                                        color: '#666',
                                        fontSize: '12px',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}>
                                        {suggestion.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    flexShrink: 0
                                  }}>
                                    <Chip 
                                      label={`$${suggestion.price?.toFixed(2) || '0.00'}`} 
                                      size="small" 
                                      sx={{
                                        backgroundColor: '#0071DC',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '11px'
                                      }}
                                    />
                                    <IconButton 
                                      size="small" 
                                      sx={{ 
                                        color: '#0071DC',
                                        backgroundColor: 'rgba(0,113,220,0.1)',
                                        '&:hover': { backgroundColor: 'rgba(0,113,220,0.2)' }
                                      }}
                                    >
                                      <Add fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </ClickAwayListener>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 3,
              minWidth: 'fit-content' 
            }}>
              <Box sx={{ 
                textAlign: 'center', 
                cursor: 'pointer', 
                display: { xs: 'none', md: 'block' },
                minWidth: '60px'
              }}>
                <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                  Reorder
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '12px', opacity: 0.8 }}>
                  My Items
                </Typography>
              </Box>
              <Box sx={{ 
                textAlign: 'center', 
                cursor: 'pointer',
                minWidth: '60px'
              }} onClick={onLogout}>
                <AccountCircle sx={{ fontSize: '28px', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {user ? user.name : 'Sign In'}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '12px', opacity: 0.8 }}>
                  Account
                </Typography>
              </Box>
              <Box sx={{ 
                textAlign: 'center', 
                cursor: 'pointer',
                minWidth: '60px'
              }} onClick={handleCartClick}>
                <Badge 
                  badgeContent={cart.length} 
                  color="error" 
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      top: 8, 
                      right: 8,
                      backgroundColor: '#FF6B35',
                      color: 'white',
                      fontSize: '11px'
                    } 
                  }}
                >
                  <ShoppingCart sx={{ fontSize: '28px' }} />
                </Badge>
                <Typography variant="body2" sx={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: cart.length > 0 ? '#FFC220' : 'white'
                }}>
                  ${getTotalPrice()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box sx={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e6e6e6',
        padding: '8px 0'
      }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            fontSize: '14px'
          }}>
            <Button
              startIcon={<Menu />}
              sx={{ 
                color: '#004c91', 
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
              onClick={() => setMobileMenuOpen(true)}
            >
              Departments
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Get it Fast
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              New Arrivals
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Rollbacks & more
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Dinner Made Easy
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Pharmacy Delivery
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Trending
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Swim Shop
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              My Items
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Auto Service
            </Button>
            <Button sx={{ color: '#004c91', textTransform: 'none', fontSize: '14px' }}>
              Wal AI+
            </Button>
          </Box>
        </Container>
      </Box>
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Departments
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {categories.map((category) => (
              <ListItem 
                key={category.id} 
                button 
                onClick={() => handleCategoryClick(category)}
                sx={{ py: 1.5 }}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 2, fontSize: '20px' }}>{category.icon}</Typography>
                      <Typography sx={{ fontWeight: 'bold' }}>{category.name}</Typography>
                    </Box>
                  }
                  secondary={category.description}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );

  if (!selectedCategory) {
    return (
      <Box sx={{ backgroundColor: '#f7f8fa' }}>
        <WalmartStyleHeader />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '350px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={() => handleCategoryClick(categories[0])}
              >
                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/33d330d6-3e76-48da-b444-033ec1b43752.png" alt="Bright summer home interior with modern furniture, plants, and natural lighting showcasing seasonal home decor trends" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Home Essentials
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: 'white',
                      color: '#004c91',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      alignSelf: 'flex-start',
                      textTransform: 'none'
                    }}
                  >
                    Shop now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '350px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#E6F3FF',
                  position: 'relative',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={() => handleCategoryClick(categories[0])}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#004c91', fontSize: '20px', mb: 1 }}>
                    Get it in as fast as an hour*
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: '#666'}}>
                      AI-powered recipe search • Smart ingredient scaling • Real-time inventory
                    </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#004c91', mb: 2, fontSize: '48px' }}>
                     {categories[0].name}
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: 'white',
                      color: '#004c91',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      alignSelf: 'flex-start',
                      textTransform: 'none'
                    }}
                  >
                    Shop now
                  </Button>
                  <Box sx={{ position: 'absolute', right: 20, top: 20, bottom: 20 }}>
                    <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/276cb09d-1c00-4be5-a90e-b9a22950ccff.png" alt="Modern grocery shopping experience showing fresh produce, smart cart technology, and AI-powered recommendations in a bright store setting"  style={{ width: '200px', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '350px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#4A90E2',
                  color: 'white',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={() => handleCategoryClick(categories[0])}
              >
                <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#000000', fontSize: '18px', mb: 1 }}>
                    Summer Trendings
                  </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '22px',mb: 1 }}>
                      Hot Summer Savings
                    </Typography>
                    <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: 'white',
                      color: '#004c91',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      alignSelf: 'flex-start',
                      textTransform: 'none'
                    }}
                  >
                    Shop now
                  </Button>
                  </Box>
                  <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/41bbe906-0527-429d-8879-d9a5785d0cc2.png" alt="Colorful array of school and classroom supplies including notebooks, pens, scissors, and educational materials for teachers" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '250px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
              >
                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/6e0ce53c-6c1e-48e7-a9d5-e7894765689c.png" alt="Premium La Roche-Posay skincare products arranged elegantly on a clean white background showcasing dermatological expertise" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: '18px' }}>
                    Save on La Roche-Posay Anthelios
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: 'white',
                      color: '#004c91',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      alignSelf: 'flex-start',
                      textTransform: 'none'
                    }}
                  >
                    Shop now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '250px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#FFE4E1',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
              >
                <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/ff81a3fc-0a19-4f11-b4ce-1b5b916b0a17.png" alt="Luxurious Victoria's Secret beauty products and fragrances displayed in elegant pink packaging with sophisticated styling" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#8B4B8C' }}>
                      Premium beauty. Victoria's Secret.
                    </Typography>

                   <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: 'white',
                      color: '#004c91',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      alignSelf: 'flex-start',
                      textTransform: 'none'
                    }}
                  >
                    Shop now
                  </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '250px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#E8F5E8',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={() => handleCategoryClick(categories[0])}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00008B', fontSize: '28px',mb: 1 }}>
                     Get top tech in as fast as an hour
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, color: '#2E7D32' }}>
                     Beyond Ordinary Electronics. Electrify Your Experience.
                    </Typography>
                   <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: 'white',
                      color: '#004c91',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      alignSelf: 'flex-start',
                      textTransform: 'none'
                    }}
                  >
                    Shop now
                  </Button>
                  </Box>
                  <img src="https://i5.walmartimages.com/dfw/4ff9c6c9-5d72/k2-_0893b905-b759-437b-921a-701f48a2e018.v1.jpg?odnHeight=216&odnWidth=385&odnBg=&odnDynImageQuality=70" alt="" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f7f8fa' }}>
      <WalmartStyleHeader />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Button 
            onClick={() => setSelectedCategory(null)}
            startIcon={<Close />}
            sx={{ 
              color: '#004c91', 
              mb: 1,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Back to Home
          </Button>
          <Typography variant="body2" color="text.secondary">
            Home / {selectedCategory.name}
          </Typography>
        </Box>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 'bold',
            color: '#004c91',
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            {selectedCategory.icon} {selectedCategory.name}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ 
            fontSize: { xs: '1rem', md: '1.25rem' },
            mb: 2
          }}>
            {selectedCategory.description}
          </Typography>
        </Box>
        {selectedCategory.id === 'food-grocery' && (
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <ToggleButtonGroup
              value={grocerySearchMode}
              exclusive
              onChange={handleGrocerySearchModeChange}
              aria-label="grocery search mode"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '24px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  padding: '8px 24px',
                  border: '2px solid #0071DC',
                  '&.Mui-selected': {
                    backgroundColor: '#0071DC',
                    color: 'white'
                  }
                }
              }}
            >
              <ToggleButton value="products" aria-label="products">
                🛍️ Products
              </ToggleButton>
              <ToggleButton value="recipes" aria-label="recipes">
                🍳 Recipes
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        {products.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold', 
              mb: 3,
              color: '#004c91',
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}>
              Search Results ({products.length} items)
            </Typography>
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': { 
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}>
                    <img src={product.image || "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/83999ac7-5af7-471b-b383-88f46b86c281.png"} alt={`High-quality product image of ${product.name}`} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        lineHeight: 1.3,
                        color: '#004c91'
                      }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2, 
                        fontSize: '14px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {product.tags?.slice(0, 2).map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '11px' }}
                          />
                        ))}
                      </Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold', 
                        mb: 2,
                        fontSize: '18px',
                        color: '#0071DC'
                      }}>
                        ${product.price?.toFixed(2) || '0.00'}
                      </Typography>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleAddToCart(product)}
                        startIcon={<Add />}
                        sx={{ 
                          backgroundColor: '#FFC220',
                          color: '#004c91',
                          borderRadius: '24px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          py: 1.5,
                          '&:hover': { backgroundColor: '#e6ae00' }
                        }}
                      >
                        Add to cart
                      </Button>
                      {product.ingredientAvailability && (
                        <Box sx={{ mt: 2 }}>
                          <Accordion>
                            <AccordionSummary 
                              expandIcon={<ExpandMore />}
                              sx={{ minHeight: '40px' }}
                            >
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                Ingredient Availability
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                              {product.ingredientAvailability.hasIngredients ? (
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                                    Available: {product.ingredientAvailability.availableItems.length} | 
                                    Missing: {product.ingredientAvailability.missingItems.length}
                                  </Typography>
                                  {product.ingredientAvailability.missingItems.length > 0 && (
                                    <Typography variant="body2" color="error.main" sx={{ fontSize: '12px' }}>
                                      Missing: {product.ingredientAvailability.missingItems.join(', ')}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="error.main" sx={{ fontSize: '12px' }}>
                                  No ingredients available
                                </Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        {searchQuery && products.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              No products found for "{searchQuery}"
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try searching with different keywords or browse our categories
            </Typography>
          </Box>
        )}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: '#0071DC', mb: 2 }} />
            <Typography variant="h5" color="text.secondary">
              Searching products...
            </Typography>
          </Box>
        )}
      </Container>
      <Dialog 
        open={showDietaryDialog} 
        onClose={() => setShowDietaryDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#004c91' }}>
          Choose Your Dietary Preference
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Dietary Type</InputLabel>
              <Select
                value={selectedDietType}
                onChange={(e) => setSelectedDietType(e.target.value)}
                label="Select Dietary Type"
              >
                <MenuItem value="vegan">🌱 Vegan</MenuItem>
                <MenuItem value="vegetarian">🥕 Vegetarian</MenuItem>
                <MenuItem value="non-vegetarian">🍖 Non-Vegetarian</MenuItem>
              </Select>
            </FormControl>
            {currentProduct && (
              <Box sx={{ p: 2, backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
                <Typography variant="h6" gutterBottom>
                  {currentProduct.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We'll automatically add the right ingredients based on your dietary preference
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowDietaryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDietarySelection} 
            variant="contained"
            disabled={!selectedDietType}
            sx={{ backgroundColor: '#0071DC', borderRadius: '24px' }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog 
        open={showQuantityDialog} 
        onClose={() => setShowQuantityDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#004c91' }}>
          How Many Servings?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              For how many people?
            </Typography>
            <TextField
              type="number"
              value={servingCount}
              onChange={(e) => setServingCount(Math.max(1, parseInt(e.target.value) || 1))}
              InputProps={{ inputProps: { min: 1, max: 20 } }}
              sx={{ mt: 2, width: '120px' }}
              size="large"
            />
            {currentProduct && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
                <Typography variant="body1" gutterBottom>
                  <strong>{currentProduct.name}</strong> ({selectedDietType})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ingredients will be calculated for {servingCount} serving{servingCount > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowQuantityDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleQuantitySelection} 
            variant="contained"
            sx={{ backgroundColor: '#0071DC', borderRadius: '24px' }}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog 
        open={showIngredientsDialog} 
        onClose={() => setShowIngredientsDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#004c91' }}>
          Ingredient Availability for {selectedProductIngredients?.product.name}
        </DialogTitle>
        <DialogContent>
          {selectedProductIngredients && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Available Ingredients: {selectedProductIngredients.ingredients.availableItems.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Missing Ingredients: {selectedProductIngredients.ingredients.missingItems.length}
              </Typography>
              {selectedProductIngredients.ingredients.missingItems.length > 0 && (
                <Typography variant="body2" color="error.main">
                  Note: {selectedProductIngredients.ingredients.missingItems.join(', ')} are not available in inventory.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowIngredientsDialog(false)}
            sx={{ borderRadius: '24px' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShoppingInterface;