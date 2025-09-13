import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress
} from '@mui/material';
import { 
  ShoppingCart, 
  Search, 
  Add, 
  Remove,
  Close,
  AccountCircle,
  Menu,
  LocationOn
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Enhanced Shopping Interface Component
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
  const navigate = useNavigate();
  
  // State Management
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showCart, setShowCart] = useState(false);
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

  const categories = [
    { 
      id: 'food-grocery', 
      name: 'Food & Grocery', 
      icon: '🛒',
      description: 'Fresh produce, pantry essentials, snacks & more'
    },
    { 
      id: 'kitchen-items', 
      name: 'Kitchen Items', 
      icon: '🍳',
      description: 'Cookware, utensils, appliances & accessories'
    },
    { 
      id: 'recipes', 
      name: 'Recipe Search', 
      icon: '👨‍🍳',
      description: 'Find recipes and add all ingredients to cart'
    }
  ];

  // Handle real-time search suggestions from API
  const handleSearchSuggestions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/search`,
        {
          query: searchQuery,
          category: selectedCategory?.id
        },
        { headers }
      );
      
      const products = response.data.products || response.data;
      setSuggestions(Array.isArray(products) ? products.slice(0, 5) : []);
    } catch (error) {
      console.error('Search suggestions failed:', error);
    }
  }, [searchQuery, selectedCategory]);

  // Load recommendations based on cart items
  const loadCartRecommendations = useCallback(async () => {
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
          dietType: userPreferences.dietType
        },
        { headers }
      );

      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }, [cart, userPreferences.dietType]);

  // Real-time search suggestions
  useEffect(() => {
    if (searchQuery.length > 2 && selectedCategory && !recipeSearchMode) {
      const debounceTimer = setTimeout(() => {
        handleSearchSuggestions();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, selectedCategory, recipeSearchMode, handleSearchSuggestions]);

  // Load cart recommendations when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      loadCartRecommendations();
    }
  }, [cart, loadCartRecommendations]);

  // Handle recipe search - UPDATED
  const handleRecipeSearch = async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a recipe name', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/generate`,
        {
          dishName: searchQuery,
          numPeople: userPreferences.servingSize || 2,
          dietType: userPreferences.dietType || 'Veg'
        },
        { headers }
      );

      const result = response.data;
      
      if (result.availableItems && result.availableItems.length > 0) {
        // Add all available ingredients to cart
        result.availableItems.forEach(item => {
          const cartItem = {
            _id: item.inventoryId || `temp_${Date.now()}_${Math.random()}`,
            name: item.name || item.ingredient,
            price: item.price || 2.99,
            quantity: item.requiredQuantity || item.quantity || 1,
            unit: item.unit || 'pieces',
            category: userPreferences.dietType,
            isRecipeIngredient: true,
            recipeName: result.recipe?.name || searchQuery,
            addedAt: new Date().toISOString(),
            image: item.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(item.name || item.ingredient)}`
          };
          onAddToCart(cartItem);
        });
        
        showSnackbar(
          `Added ${result.availableItems.length} ingredients for ${result.recipe?.name || searchQuery} to cart!`, 
          'success'
        );
        
        // Show missing items if any
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
    } catch (error) {
      console.error('Recipe search failed:', error);
      showSnackbar(
        error.response?.data?.message || 'Recipe search failed. Please try again.', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle natural language query search
  const handleNLQSearch = async () => {
    if (!searchQuery.trim()) {
      showSnackbar('Please enter a search query', 'warning');
      return;
    }

    if (recipeSearchMode) {
      handleRecipeSearch();
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/search`,
        {
          query: searchQuery,
          filters: {
            category: selectedCategory?.id,
            dietType: userPreferences.dietType
          }
        },
        { headers }
      );

      setProducts(response.data.products || []);
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
  };

  // Add product to cart with dietary selection
  const handleAddToCart = (product) => {
    setCurrentProduct(product);
    setSelectedDietType(userPreferences.dietType || '');
    setShowDietaryDialog(true);
  };

  // Handle dietary selection
  const handleDietarySelection = () => {
    if (!selectedDietType) {
      showSnackbar('Please select a dietary preference', 'warning');
      return;
    }
    setShowDietaryDialog(false);
    setShowQuantityDialog(true);
  };

  // Handle quantity selection
  const handleQuantitySelection = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Try to get recipe data for the product
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

        // Add main product
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

        // Add ingredients if available
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
              image: ingredient.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(ingredient.name)}`
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
        // If recipe fetch fails, just add the main product
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

  // Reset dialog states
  const handleDialogReset = () => {
    setShowQuantityDialog(false);
    setShowDietaryDialog(false);
    setCurrentProduct(null);
    setSelectedDietType('');
    setServingCount(1);
  };

  // Quick add product from suggestion
  const quickAddFromSuggestion = (product) => {
    handleAddToCart(product);
    setSearchQuery('');
    setSuggestions([]);
  };

  // Calculate total price of cart
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Show snackbar notifications
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle category selection
  const handleCategoryClick = (category) => {
    if (category.id === 'recipes') {
      setRecipeSearchMode(true);
      setSelectedCategory(category);
    } else {
      setRecipeSearchMode(false);
      setSelectedCategory(category);
    }
    setProducts([]);
    setSearchQuery('');
  };

  // Enhanced Header Component
  const EnhancedHeader = () => (
    <Box>
      <AppBar position="static" sx={{ background: '#004c91', boxShadow: 'none', minHeight: '48px' }}>
        <Toolbar sx={{ minHeight: '48px !important', px: { xs: 1, md: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3 }}>
              <LocationOn sx={{ color: 'white', mr: 1, fontSize: '18px' }} />
              <Typography variant="body2" sx={{ color: 'white', fontSize: '13px' }}>
                {deliveryOption === 'delivery' ? 'Delivery to' : 'Pickup from'} Sacramento, 95829
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex ', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            <FormControl size="small" sx={{ minWidth: 120, display: { xs: 'none', sm: 'block' } }}>
              <Select
                value={deliveryOption}
                onChange={onDeliveryOptionChange}
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '& .MuiSvgIcon-root': { color: 'white' }
                }} >
                <MenuItem value="pickup">Pickup</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountCircle sx={{ color: 'white', mr: 1 }} />
              <Typography variant="body2" sx={{ 
                color: 'white', 
                fontSize: '13px',
                display: { xs: 'none', sm: 'block' }
              }}>
                {user.name}
              </Typography>
            </Box>
            
            <IconButton 
              color="inherit" 
              onClick={() => setShowCart(true)} 
              sx={{ color: 'white', p: { xs: 0.5, md: 1 } }}
            >
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCart />
              </Badge>
              <Typography variant="body2" sx={{ 
                ml: 1, 
                fontSize: '13px',
                display: { xs: 'none', sm: 'block' }
              }}>
                ${getTotalPrice()}
              </Typography>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <AppBar position="static" sx={{ background: '#0071ce', boxShadow: 1 }}>
        <Toolbar sx={{ py: 1, px: { xs: 1, md: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton
              sx={{ display: { xs: 'block', md: 'none' }, color: 'white', mr: 1 }}
              onClick={() => setMobileMenuOpen(true)}
            > <Menu />
            </IconButton>

            <Box sx={{ mr: { xs: 1, md: 4 }, minWidth: 'fit-content' }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                Wal AI
              </Typography>
            </Box>

            <Box sx={{
              flexGrow: 1,
              maxWidth: { xs: 'none', md: '600px' },
              mx: { xs: 1, md: 2 },
              display: selectedCategory ? 'block' : 'none'
            }}>
              <Box sx={{ position: 'relative', display: 'flex' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={recipeSearchMode ? "Search recipes ( )" : "Search products..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNLQSearch()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '24px',
                      fontSize: '14px',
                      height: '40px',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: '2px solid #ffc220' }
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
                    backgroundColor: '#ffc220',
                    color: '#000',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    '&:hover': { backgroundColor: '#e6ae00' },
                    '&:disabled': { backgroundColor: '#ccc' }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : <Search fontSize="small" />}
                </IconButton>

                {/* Search Suggestions */}
                {suggestions.length > 0 && (
                  <Paper 
                    sx={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      zIndex: 1000, 
                      mt: 1,
                      borderRadius: '8px',
                      boxShadow: 3,
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}
                  >
                    <List sx={{ p: 0 }}>
                      {suggestions.map((suggestion, index) => (
                        <ListItem 
                          key={index}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                            py: 1
                          }}
                          onClick={() => quickAddFromSuggestion(suggestion)}
                        >
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">{suggestion.name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip label={`$${suggestion.price}`} size="small" color="primary" />
                                  <IconButton size="small" sx={{ color: 'primary.main' }}>
                                    <Add fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {suggestion.description}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </Box>

            <Button 
              variant="text" 
              sx={{ 
                color: 'white', 
                textTransform: 'none',
                display: { xs: 'none', md: 'block' },
                minWidth: 'fit-content'
              }}
              onClick={onLogout}
            >
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Menu
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <List>
            <ListItem button onClick={() => handleCategoryClick(categories[0])}>
              <ListItemText primary="Grocery & Essentials" />
            </ListItem>
            <ListItem button onClick={() => handleCategoryClick(categories[1])}>
              <ListItemText primary="Kitchen Items" />
            </ListItem>
            <ListItem button onClick={() => handleCategoryClick(categories[2])}>
              <ListItemText primary="Recipe Search" />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={onLogout}
            sx={{ mt: 2 }}
          >
            Sign Out
          </Button>
        </Box>
      </Drawer>
    </Box>
  );

  // Category Selection View
  if (!selectedCategory) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
        <EnhancedHeader />
        
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
          {/* Category Selection */}
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold', 
            textAlign: 'center', 
            mb: 4,
            fontSize: { xs: '1.8rem', md: '2.5rem' }
          }}>
            Choose Your Shopping Category
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: { xs: '250px', md: '300px' },
                    '&:hover': { 
                      transform: 'scale(1.03)',
                      boxShadow: 6
                    },
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: '12px'
                  }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <CardMedia
                    component="img"
                    height="150"
                    image={`https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3767381e-ce3d-439b-b50c-ae81890323a4.png`}
                    alt={`${category.name} - ${category.description} for smart grocery shopping`}
                  />
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 1 }}>
                      {category.icon}
                    </Typography>
                    <Typography variant="h5" gutterBottom sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', md: '1.5rem' }
                    }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                      {category.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  // Shopping Interface View
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      <EnhancedHeader />

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Button 
            onClick={() => setSelectedCategory(null)}
            startIcon={<Close />}
            sx={{ color: 'primary.main', mb: 1 }}
          >
            Back to Categories
          </Button>
          <Typography variant="body2" color="text.secondary">
            Home / {selectedCategory.name}
          </Typography>
        </Box>

        {/* Category Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.8rem', md: '2.5rem' }
          }}>
            {selectedCategory.icon} {selectedCategory.name}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            {selectedCategory.description}
          </Typography>
        </Box>

        {/* Search Results */}
        {products.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold', 
              mb: 3,
              fontSize: { xs: '1.3rem', md: '1.5rem' }
            }}>
              Search Results ({products.length} items)
            </Typography>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '8px',
                    '&:hover': { boxShadow: 4 }
                  }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={product.image || `https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/11dcba25-a29c-4761-9448-2958f5eaf33e.png`}
                      alt={`${product.name} - Premium quality ${product.description} available at SmartGrocer`}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '14px',
                        lineHeight: 1.3
                      }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2, 
                        fontSize: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product.description}
                      </Typography>

                      {/* Tags */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {product.tags?.slice(0, 2).map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>

                      {/* Price */}
                      <Typography variant="h6" color="primary" sx={{ 
                        fontWeight: 'bold', 
                        mb: 2,
                        fontSize: '1.1rem'
                      }}>
                        ${product.price.toFixed(2)}
                      </Typography>

                      {/* Add Button */}
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleAddToCart(product)}
                        startIcon={<Add />}
                        sx={{ 
                          backgroundColor: '#0071ce',
                          borderRadius: '24px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          py: 1,
                          '&:hover': { backgroundColor: '#004c91' }
                        }}
                      >
                        Add to cart
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* No Results Message */}
        {searchQuery && products.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No products found for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try searching with different keywords
            </Typography>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="h6" color="text.secondary">
              Searching products...
            </Typography>
          </Box>
        )}
      </Container>

      {/* Dietary Preference Dialog */}
      <Dialog 
        open={showDietaryDialog} 
        onClose={() => setShowDietaryDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
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
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowDietaryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDietarySelection} 
            variant="contained"
            disabled={!selectedDietType}
            sx={{ backgroundColor: '#0071ce' }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quantity/Servings Dialog */}
      <Dialog 
        open={showQuantityDialog} 
        onClose={() => setShowQuantityDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
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
              size="medium"
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
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowQuantityDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleQuantitySelection} 
            variant="contained"
            sx={{ backgroundColor: '#0071ce' }}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Cart Drawer */}
      <Drawer anchor="right" open={showCart} onClose={() => setShowCart(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 400 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Cart Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#0071ce' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                Your Cart ({cart.length})
              </Typography>
              <IconButton onClick={() => setShowCart(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Cart Items */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {cart.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ShoppingCart sx={{ fontSize: '4rem', color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Your cart is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add some products to get started
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {cart.map((item, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid #f0f0f0', py: 2, px: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {item.name}
                        </Typography>
                        <IconButton size="small" onClick={() => onRemoveFromCart(index)}>
                          <Remove fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        {item.dietaryType && (
                          <Chip 
                            label={item.dietaryType} 
                            size="small" 
                            color="primary" 
                            sx={{ mr: 1, fontSize: '11px' }} 
                          />
                        )}
                        
                        {item.isRecipeIngredient && (
                          <Chip 
                            label="Recipe ingredient" 
                            size="small" 
                            variant="outlined" 
                            color="secondary"
                            sx={{ mr: 1, fontSize: '11px' }}
                          />
                        )}
                        
                        {item.isAutoAdded && (
                          <Chip 
                            label="Auto-added" 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '11px' }}
                          />
                        )}
                      </Box>
                      
                      {item.recipeName && (
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          fontSize: '10px',
                          display: 'block',
                          mb: 0.5
                        }}>
                          For: {item.recipeName}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                          Qty: {item.quantity} {item.unit || ''}
                          {item.servings && ` (${item.servings} servings)`}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                  Recommended for you
                </Typography>
                <Grid container spacing={1}>
                  {recommendations.slice(0, 4).map((rec, index) => (
                    <Grid item xs={6} key={index}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f0f0f0' }
                        }} 
                        onClick={() => handleAddToCart(rec.item || rec)}
                      >
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '11px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {rec.name || rec.item?.name}
                          </Typography>
                          <Typography variant="caption" color="primary" display="block" sx={{ fontSize: '11px' }}>
                            ${rec.price || rec.item?.price}
                          </Typography>
                          {rec.reason && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px' }}>
                              {rec.reason}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ${getTotalPrice()}
                </Typography>
              </Box>
              
              {/* Recipe ingredients summary */}
              {cart.some(item => item.isRecipeIngredient) && (
                <Box sx={{ mb: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                  <Typography variant="caption" color="primary" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
                    🍳 Recipe ingredients: {cart.filter(item => item.isRecipeIngredient).length} items
                  </Typography>
                </Box>
              )}
              
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                sx={{ 
                  backgroundColor: '#ffc220',
                  color: '#000',
                  fontWeight: 'bold',
                  borderRadius: '24px',
                  '&:hover': { backgroundColor: '#e6ae00' }
                }}
                onClick={() => showSnackbar('Checkout feature coming soon!', 'info')}
              >
                Checkout
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Snackbar */}
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
    </Box>
  );
};

export default ShoppingInterface;