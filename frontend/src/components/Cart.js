// frontend/src/components/Cart.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Grid,
  AppBar,
  Toolbar,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import CartRecommendations from './CartRecommendations';

const Cart = ({ 
  cartItems = [], 
  onClose, 
  onAddToCart, 
  onRemoveFromCart, 
  onUpdateCartItem, 
  onClearCart,
  userPreferences, 
  user, 
  cartTotal, 
  deliveryOption 
}) => {
  const [showRecommendations, setShowRecommendations] = useState(true);

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveFromCart(index);
    } else {
      onUpdateCartItem(cartItems[index].id, { quantity: newQuantity });
    }
  };

  const getItemTotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'white', 
      zIndex: 1300, 
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#0071ce' }}>
        <Toolbar>
          <ShoppingCartIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Your Cart ({cartItems.length} items)
          </Typography>
          <IconButton color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3 }}>
        {cartItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Add some products to get started
            </Typography>
            <Button variant="contained" onClick={onClose}>
              Continue Shopping
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* Cart Items */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Cart Items</Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={onClearCart}
                    startIcon={<DeleteIcon />}
                  >
                    Clear Cart
                  </Button>
                </Box>
                
                <List>
                  {cartItems.map((item, index) => (
                    <React.Fragment key={item.id || index}>
                      <ListItem sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                          {/* Item Image */}
                          <Box
                            component="img"
                            src={item.image || `https://via.placeholder.com/80x80/4CAF50/white?text=${encodeURIComponent(item.name)}`}
                            alt={item.name}
                            sx={{ width: 80, height: 80, borderRadius: 1, mr: 2 }}
                          />
                          
                          {/* Item Details */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {item.name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                              {item.selectedDietType && (
                                <Chip label={item.selectedDietType} size="small" color="primary" />
                              )}
                              {item.isRecipeIngredient && (
                                <Chip label="Recipe Ingredient" size="small" variant="outlined" />
                              )}
                            </Box>
                            
                            {item.recipeName && (
                              <Typography variant="caption" color="text.secondary">
                                For: {item.recipeName}
                              </Typography>
                            )}
                            
                            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                              ${item.price.toFixed(2)} each
                            </Typography>
                          </Box>
                          
                          {/* Quantity Controls */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                          
                          {/* Item Total */}
                          <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                            <Typography variant="h6" fontWeight="bold">
                              ${getItemTotal(item)}
                            </Typography>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => onRemoveFromCart(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < cartItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            {/* Order Summary */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>${cartTotal}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Delivery:</Typography>
                    <Typography>{deliveryOption === 'delivery' ? '$5.99' : 'Free'}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${(parseFloat(cartTotal) + (deliveryOption === 'delivery' ? 5.99 : 0)).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large"
                  sx={{ mb: 2 }}
                >
                  Proceed to Checkout
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Recommendations */}
        {cartItems.length > 0 && showRecommendations && (
          <Box sx={{ mt: 4 }}>
            <CartRecommendations
              cartItems={cartItems}
              onAddToCart={onAddToCart}
              userPreferences={userPreferences}
              user={user}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Cart;