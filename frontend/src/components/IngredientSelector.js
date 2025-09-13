import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  Badge,
  Collapse,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  Restaurant as RestaurantIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import axios from 'axios';

const IngredientSelector = ({ 
  recipe,
  onAddToCart,
  onClose,
  cartItems = [],
  userPreferences = {},
  showSnackbar // Add this prop to receive snackbar function from parent
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectionMode, setSelectionMode] = useState('multiple');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // New state for ingredient checking
  const [ingredientAvailability, setIngredientAvailability] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Memoize ingredients to prevent unnecessary re-renders
  const ingredients = useMemo(() => {
    return recipe?.ingredients || recipe?.availableItems || [];
  }, [recipe?.ingredients, recipe?.availableItems]);

  const missingIngredients = useMemo(() => {
    return recipe?.missingItems || [];
  }, [recipe?.missingItems]);

  const recipeInfo = useMemo(() => ({
    name: recipe?.dish || recipe?.name || 'Recipe',
    servings: recipe?.servings || recipe?.numPeople || 1,
    prepTime: recipe?.prepTime || 0,
    cookTime: recipe?.cookTime || 0,
    instructions: recipe?.instructions || recipe?.steps || []
  }), [recipe]);

  // Default snackbar function if not provided
  const handleShowSnackbar = useCallback((message, severity = 'success') => {
    if (showSnackbar) {
      showSnackbar(message, severity);
    } else {
      console.log(`${severity.toUpperCase()}: ${message}`);
    }
  }, [showSnackbar]);

  // Check ingredient availability in inventory
  const checkIngredientAvailability = useCallback(async () => {
    if (ingredients.length === 0) return;
    
    setCheckingAvailability(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const availabilityPromises = ingredients.map(async (ingredient) => {
        const ingredientName = ingredient.ingredient || ingredient.name;
        
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/check-ingredients`,
            {
              productName: ingredientName,
              dietType: userPreferences.dietType || 'vegetarian',
              servings: recipeInfo.servings
            },
            { headers }
          );

          return {
            name: ingredientName,
            available: response.data.success && response.data.data.hasIngredients,
            details: response.data.data || {},
            inStock: response.data.data.availableItems?.length > 0
          };
        } catch (error) {
          console.error(`Failed to check availability for ${ingredientName}:`, error);
          return {
            name: ingredientName,
            available: false,
            details: {},
            inStock: false,
            error: true
          };
        }
      });

      const results = await Promise.all(availabilityPromises);
      
      const availabilityMap = {};
      results.forEach(result => {
        availabilityMap[result.name] = result;
      });
      
      setIngredientAvailability(availabilityMap);
      setAvailabilityChecked(true);
      
      const availableCount = results.filter(r => r.available).length;
      handleShowSnackbar(
        `Checked ${results.length} ingredients. ${availableCount} available in inventory.`,
        availableCount > 0 ? 'success' : 'warning'
      );
      
    } catch (error) {
      console.error('Failed to check ingredient availability:', error);
      handleShowSnackbar('Failed to check ingredient availability', 'error');
    } finally {
      setCheckingAvailability(false);
    }
  }, [ingredients, userPreferences.dietType, recipeInfo.servings, handleShowSnackbar]);

  useEffect(() => {
    // Initialize quantities from recipe
    const initialQuantities = {};
    ingredients.forEach(ingredient => {
      const key = ingredient.ingredient || ingredient.name;
      initialQuantities[key] = ingredient.requiredQuantity || ingredient.quantity || 1;
    });
    setQuantities(initialQuantities);

    // Auto-select essential ingredients and available items
    const essentialIngredients = ingredients.filter(ing => 
      ing.isEssential !== false || ing.inStock !== false
    );
    setSelectedIngredients(essentialIngredients);

    // Auto-check availability on load
    if (ingredients.length > 0) {
      checkIngredientAvailability();
    }
  }, [ingredients, checkIngredientAvailability]);

  // Check if ingredient is available in inventory
  const isAvailable = useCallback((ingredient) => {
    const ingredientName = ingredient.ingredient || ingredient.name;
    const availability = ingredientAvailability[ingredientName];
    
    if (availability) {
      return availability.available && availability.inStock;
    }
    
    // Fallback to recipe data
    return ingredient.inStock !== false && (ingredient.availableQuantity || 0) > 0;
  }, [ingredientAvailability]);

  // Check if ingredient is already in cart
  const isInCart = useCallback((ingredientName) => {
    return cartItems.some(item => 
      item.name?.toLowerCase() === ingredientName?.toLowerCase()
    );
  }, [cartItems]);

  // Get ingredient category color
  const getCategoryColor = useCallback((category) => {
    switch (category?.toLowerCase()) {
      case 'veg': return 'success';
      case 'non-veg': return 'error';
      case 'vegan': return 'info';
      default: return 'default';
    }
  }, []);

  // Handle ingredient selection
  const handleIngredientSelect = useCallback((ingredient, isSelected) => {
    const ingredientKey = ingredient.ingredient || ingredient.name;
    
    if (selectionMode === 'single') {
      setSelectedIngredients([ingredient]);
    } else {
      const newSelection = isSelected 
        ? [...selectedIngredients, ingredient]
        : selectedIngredients.filter(item => 
            (item.ingredient || item.name) !== ingredientKey
          );
      
      setSelectedIngredients(newSelection);
    }
  }, [selectionMode, selectedIngredients]);

  // Handle quantity change
  const handleQuantityChange = useCallback((ingredientName, newQuantity) => {
    setQuantities(prev => ({
      ...prev,
      [ingredientName]: Math.max(0, newQuantity)
    }));
  }, []);

  // Add selected ingredients to cart
  const handleAddSelectedToCart = useCallback(() => {
    const itemsToAdd = selectedIngredients.map(ingredient => {
      const ingredientKey = ingredient.ingredient || ingredient.name;
      return {
        _id: ingredient._id || ingredient.inventoryId || `recipe-${ingredientKey}`,
        name: ingredientKey,
        price: ingredient.price || 2.99,
        quantity: quantities[ingredientKey] || ingredient.requiredQuantity || ingredient.quantity || 1,
        unit: ingredient.unit || 'pieces',
        category: ingredient.category || userPreferences.dietType || 'Common',
        isRecipeIngredient: true,
        recipeName: recipeInfo.name,
        image: ingredient.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(ingredientKey)}`,
        description: ingredient.preparationNotes || `Fresh ${ingredientKey} for cooking`
      };
    });
    
    onAddToCart(itemsToAdd);
    handleShowSnackbar(`Added ${itemsToAdd.length} ingredients to cart!`, 'success');
    onClose();
  }, [selectedIngredients, quantities, userPreferences.dietType, recipeInfo.name, onAddToCart, handleShowSnackbar, onClose]);

  // Add all available ingredients to cart
  const handleAddAllAvailableToCart = useCallback(() => {
    const availableItems = ingredients.filter(ingredient => isAvailable(ingredient));
    const itemsToAdd = availableItems.map(ingredient => {
      const ingredientKey = ingredient.ingredient || ingredient.name;
      return {
        _id: ingredient._id || ingredient.inventoryId || `recipe-${ingredientKey}`,
        name: ingredientKey,
        price: ingredient.price || 2.99,
        quantity: quantities[ingredientKey] || ingredient.requiredQuantity || ingredient.quantity || 1,
        unit: ingredient.unit || 'pieces',
        category: ingredient.category || userPreferences.dietType || 'Common',
        isRecipeIngredient: true,
        recipeName: recipeInfo.name,
        image: ingredient.image || `https://via.placeholder.com/100x100/4CAF50/white?text=${encodeURIComponent(ingredientKey)}`,
        description: ingredient.preparationNotes || `Fresh ${ingredientKey} for cooking`
      };
    });
    
    onAddToCart(itemsToAdd);
    handleShowSnackbar(`Added ${itemsToAdd.length} available ingredients to cart!`, 'success');
    onClose();
  }, [ingredients, isAvailable, quantities, userPreferences.dietType, recipeInfo.name, onAddToCart, handleShowSnackbar, onClose]);

  // Calculate total cost
  const calculateTotalCost = useCallback(() => {
    return selectedIngredients.reduce((total, ingredient) => {
      const ingredientKey = ingredient.ingredient || ingredient.name;
      const quantity = quantities[ingredientKey] || ingredient.requiredQuantity || ingredient.quantity || 1;
      const price = ingredient.price || 2.99;
      return total + (price * quantity);
    }, 0).toFixed(2);
  }, [selectedIngredients, quantities]);

  // Filter ingredients based on availability
  const allIngredients = useMemo(() => {
    return [...ingredients, ...missingIngredients.map(item => ({
      ingredient: item.ingredient || item.name || item,
      name: item.name || item.ingredient || item,
      inStock: false,
      availableQuantity: 0,
      isMissing: true
    }))];
  }, [ingredients, missingIngredients]);

  const filteredIngredients = useMemo(() => {
    return showUnavailable 
      ? allIngredients 
      : allIngredients.filter(ingredient => isAvailable(ingredient) || ingredient.isEssential);
  }, [showUnavailable, allIngredients, isAvailable]);

  const availableCount = useMemo(() => {
    return allIngredients.filter(ingredient => isAvailable(ingredient)).length;
  }, [allIngredients, isAvailable]);

  const unavailableCount = allIngredients.length - availableCount;

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Recipe Ingredients
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={selectedIngredients.length} color="primary">
              <ShoppingCartIcon />
            </Badge>
            <IconButton 
              onClick={checkIngredientAvailability} 
              disabled={checkingAvailability}
              size="small"
            >
              {checkingAvailability ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
          {recipeInfo.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          <Chip 
            icon={<RestaurantIcon />} 
            label={`${recipeInfo.servings} servings`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          {recipeInfo.prepTime > 0 && (
            <Chip 
              icon={<TimerIcon />} 
              label={`${recipeInfo.prepTime + recipeInfo.cookTime} min total`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          )}
          {availabilityChecked && (
            <Chip 
              icon={<InventoryIcon />} 
              label={`${availableCount}/${allIngredients.length} available`} 
              size="small" 
              color={availableCount > 0 ? 'success' : 'error'} 
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Recipe Instructions Toggle */}
        {recipeInfo.instructions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowInstructions(!showInstructions)}
              startIcon={<InfoIcon />}
              size="small"
            >
              {showInstructions ? 'Hide' : 'Show'} Recipe Instructions
            </Button>
            
            <Collapse in={showInstructions}>
              <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f8f9fa' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Cooking Instructions:
                </Typography>
                <List dense>
                  {recipeInfo.instructions.map((instruction, index) => (
                    <ListItem key={index} sx={{ py : 0.5 }}>
                      <ListItemText
                        primary={`${index + 1}. ${typeof instruction === 'string' ? instruction : instruction.instruction}`}
                        secondary={instruction.tips && `Tip: ${instruction.tips}`}
                      />
                     </ListItem>
                  ))}
                </List>
              </Paper>
            </Collapse>
          </Box>
        )}

        {/* Selection Controls */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">Selection Mode</FormLabel>
                <RadioGroup
                  row
                  value={selectionMode}
                  onChange={(e) => setSelectionMode(e.target.value)}
                >
                  <FormControlLabel value="multiple" control={<Radio />} label="Multiple" />
                  <FormControlLabel value="single" control={<Radio />} label="Single" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showUnavailable}
                    onChange={(e) => setShowUnavailable(e.target.checked)}
                  />
                }
                label="Show unavailable items"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Availability Summary */}
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {availableCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  {unavailableCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unavailable
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {selectedIngredients.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Selected
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="secondary.main" fontWeight="bold">
                  ${calculateTotalCost()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Cost
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Ingredients List */}
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredIngredients.map((ingredient, index) => {
            const ingredientKey = ingredient.ingredient || ingredient.name;
            const isSelected = selectedIngredients.some(item => 
              (item.ingredient || item.name) === ingredientKey
            );
            const available = isAvailable(ingredient);
            const inCart = isInCart(ingredientKey);
            
            return (
              <React.Fragment key={ingredientKey || index}>
                <ListItem
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isSelected ? '#e3f2fd' : available ? 'white' : '#fafafa',
                    opacity: available ? 1 : 0.6
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleIngredientSelect(ingredient, e.target.checked)}
                      disabled={!available && !ingredient.isEssential}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<CheckCircleIcon />}
                    />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {ingredientKey}
                        </Typography>
                        
                        {ingredient.category && (
                          <Chip
                            label={ingredient.category}
                            size="small"
                            color={getCategoryColor(ingredient.category)}
                            variant="outlined"
                          />
                        )}
                        
                        {ingredient.isEssential !== false && (
                          <Chip label="Essential" size="small" color="warning" />
                        )}
                        
                        {inCart && (
                          <Chip label="In Cart" size="small" color="success" />
                        )}
                        
                        {!available && (
                          <Chip 
                            label="Unavailable" 
                            size="small" 
                            color="error"
                            icon={<WarningIcon />}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Need: {ingredient.quantity} {ingredient.unit}
                          {ingredient.preparationNotes && (
                            <span> | {ingredient.preparationNotes}</span>
                          )}
                        </Typography>
                        
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          ${(ingredient.price || 2.99).toFixed(2)} per {ingredient.unit}
                        </Typography>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Quantity Selector */}
                      {isSelected && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(
                              ingredientKey, 
                              (quantities[ingredientKey] || ingredient.quantity || 1) - 1
                            )}
                          >
                            <RemoveIcon />
                          </IconButton>
                          
                          <TextField
                            size="small"
                            value={quantities[ingredientKey] || ingredient.quantity || 1}
                            onChange={(e) => handleQuantityChange(ingredientKey, parseInt(e.target.value) || 0)}
                            sx={{ width: 60, mx: 1 }}
                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                          />
                          
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(
                              ingredientKey, 
                              (quantities[ingredientKey] || ingredient.quantity || 1) + 1
                            )}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>

                {index < filteredIngredients.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>

        {/* Selection Summary */}
        {selectedIngredients.length > 0 && (
          <Paper sx={{ p: 2, mt: 2, backgroundColor: '#e8f5e8' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Selection Summary
            </Typography>
            <Typography variant="body2">
              {selectedIngredients.length} ingredients selected
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              Total Cost: ${calculateTotalCost()}
            </Typography>
          </Paper>
        )}

        {/* Warnings */}
        {unavailableCount > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {unavailableCount} ingredient(s) are not available in inventory. 
            Consider selecting alternatives or check back later.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleAddAllAvailableToCart}
          disabled={availableCount === 0}
        >
          Add All Available
        </Button>
        
        <Button
          variant="contained"
          onClick={handleAddSelectedToCart}
          disabled={selectedIngredients.length === 0}
          startIcon={<ShoppingCartIcon />}
        >
          Add to Cart ({selectedIngredients.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngredientSelector;