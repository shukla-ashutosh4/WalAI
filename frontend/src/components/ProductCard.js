import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box,
  Rating
} from '@mui/material';
import { Add, ShoppingCart } from '@mui/icons-material';

const ProductCard = ({ product, onAddToCart, showIngredients = false }) => {
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={product.image || `https://via.placeholder.com/300x200/4CAF50/white?text=${encodeURIComponent(product.name)}`}
        alt={`${product.name} - Fresh grocery item available at SmartGrocer AI`}
        sx={{ objectFit: 'cover' }}
      />
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
          {product.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {product.description}
        </Typography>

        {/* Product Tags */}
        {product.tags && product.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {product.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {/* Rating (if available) */}
        {product.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating value={product.rating} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({product.reviewCount || 0})
            </Typography>
          </Box>
        )}

        {/* Ingredients Preview */}
        {showIngredients && product.suggestedIngredients && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
              Includes: {product.suggestedIngredients.length} ingredients
            </Typography>
          </Box>
        )}

        {/* Price and Add to Cart */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
            ${product.price.toFixed(2)}
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={handleAddToCart}
            startIcon={<Add />}
            sx={{ 
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              '&:hover': { 
                background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                transform: 'scale(1.05)' 
              },
              transition: 'all 0.2s ease'
            }}
          >
            Add
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;