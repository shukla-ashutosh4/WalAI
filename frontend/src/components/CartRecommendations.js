// frontend/src/components/CartRecommendations.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Rating,
  Tooltip,
  Badge,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ShoppingCart as ShoppingCartIcon,
  Recommend as RecommendIcon,
  LocalOffer as OfferIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  CompareArrows as CompareIcon,
  Refresh as RefreshIcon,
  Whatshot as WhatshotIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import axios from 'axios';

const CartRecommendations = ({ 
  cartItems = [],
  onAddToCart, 
  userPreferences = {},
  user
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [alternativeBrands, setAlternativeBrands] = useState([]);
  const [complementaryItems, setComplementaryItems] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('alternatives'); // 'alternatives', 'complementary', 'similar'

  useEffect(() => {
    if (cartItems.length > 0) {
      loadEnhancedRecommendations();
    }
  }, [cartItems]);

  const loadEnhancedRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Get cart item names to exclude from recommendations
      const cartItemNames = cartItems.map(item => item.name.toLowerCase());
      const cartCategories = [...new Set(cartItems.map(item => item.category))];

      // Load alternative brands for existing cart items
      const alternativesPromise = axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations/alternatives`,
        {
          cartItems: cartItems.map(item => ({
            _id: item._id,
            name: item.name,
            category: item.category,
            tags: item.tags,
            price: item.price
          })),
          excludeItems: cartItemNames,
          dietType: userPreferences.dietType || user?.preferences?.dietType || 'Veg'
        },
        { headers }
      );

      // Load complementary items (ingredients that go well together)
      const complementaryPromise = axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations/complementary`,
        {
          cartItems: cartItems.map(item => ({
            _id: item._id,
            name: item.name,
            category: item.category,
            tags: item.tags,
            isRecipeIngredient: item.isRecipeIngredient,
            recipeName: item.recipeName
          })),
          excludeItems: cartItemNames,
          dietType: userPreferences.dietType || user?.preferences?.dietType || 'Veg'
        },
        { headers }
      );

      // Load similar products (different types of same category)
      const similarPromise = axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations/similar`,
        {
          cartCategories,
          cartItems: cartItems.map(item => item.name),
          excludeItems: cartItemNames,
          dietType: userPreferences.dietType || user?.preferences?.dietType || 'Veg'
        },
        { headers }
      );

      const [alternativesRes, complementaryRes, similarRes] = await Promise.all([
        alternativesPromise,
        complementaryPromise,
        similarPromise
      ]);

      setAlternativeBrands(alternativesRes.data.alternatives || []);
      setComplementaryItems(complementaryRes.data.complementary || []);
      setSimilarProducts(similarRes.data.similar || []);

    } catch (error) {
      console.error('Error loading enhanced recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Check if item is already in cart
  const isInCart = (itemId, itemName) => {
    return cartItems.some(cartItem => 
      cartItem._id === itemId || 
      cartItem.name.toLowerCase() === itemName.toLowerCase()
    );
  };

  // Handle add to cart
  const handleAddToCart = (item) => {
    if (isInCart(item._id, item.name)) {
      return; // Don't add if already in cart
    }

    const cartItem = {
      _id: item._id,
      name: item.name,
      price: item.price || 2.99,
      image: item.image,
      description: item.description,
      category: item.category,
      tags: item.tags,
      quantity: 1,
      isRecommendation: true,
      recommendationType: item.type || 'general'
    };

    onAddToCart && onAddToCart(cartItem);
  };

  // Render recommendation card
  const renderRecommendationCard = (item, index) => {
    const inCart = isInCart(item._id, item.name);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || index}>
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': { boxShadow: 4 },
          transition: 'box-shadow 0.3s ease',
          opacity: inCart ? 0.6 : 1
        }}>
          <CardMedia
            component="img"
            height="160"
            image={item.image || `https://via.placeholder.com/300x160/4CAF50/white?text=${encodeURIComponent(item.name)}`}
            alt={item.name}
            sx={{ objectFit: 'cover' }}
          />
          
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold', flexGrow: 1 }}>
                {item.name}
              </Typography>
              {item.reason && (
                <Tooltip title={item.reason}>
                  <Chip 
                    label={item.type || 'Recommended'} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flexGrow: 1, fontSize: '0.8rem' }}>
              {item.description || item.reason}
            </Typography>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {item.tags.slice(0, 2).map((tag, tagIndex) => (
                  <Chip 
                    key={tagIndex}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: 18 }}
                  />
                ))}
              </Box>
            )}

            {/* Price comparison */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                ${(item.price || 2.99).toFixed(2)}
              </Typography>
              {item.originalPrice && item.originalPrice > item.price && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.7rem' }}
                  >
                    ${item.originalPrice.toFixed(2)}
                  </Typography>
                  <Chip
                    label={`Save ${Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%`}
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.6rem', height: 18 }}
                  />
                </Box>
              )}
            </Box>

            {/* Rating */}
            {item.rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={item.rating} readOnly size="small" precision={0.1} />
                <Typography variant="caption" sx={{ ml: 0.5, fontSize: '0.7rem' }}>
                  ({item.reviewCount || 0})
                </Typography>
              </Box>
            )}

            {/* Action Button */}
            <Button
              variant={inCart ? "outlined" : "contained"}
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleAddToCart(item)}
              disabled={inCart}
              sx={{ 
                borderRadius: 2, 
                mt: 'auto',
                fontSize: '0.8rem'
              }}
            >
              {inCart ? 'In Cart' : 'Add to Cart'}
            </Button>

            {/* Relevance Score */}
            {item.relevanceScore && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Match: {Math.round(item.relevanceScore * 100)}%
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add items to your cart to see personalized recommendations
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RecommendIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Recommended for You
          </Typography>
        </Box>
        
        <IconButton onClick={loadEnhancedRecommendations} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Alternative Brands (${alternativeBrands.length})`}
            onClick={() => setActiveTab('alternatives')}
            color={activeTab === 'alternatives' ? 'primary' : 'default'}
            variant={activeTab === 'alternatives' ? 'filled' : 'outlined'}
            icon={<CompareIcon />}
          />
          <Chip
            label={`Goes Well With (${complementaryItems.length})`}
            onClick={() => setActiveTab('complementary')}
            color={activeTab === 'complementary' ? 'primary' : 'default'}
            variant={activeTab === 'complementary' ? 'filled' : 'outlined'}
            icon={<OfferIcon />}
          />
          <Chip
            label={`Similar Products (${similarProducts.length})`}
            onClick={() => setActiveTab('similar')}
            color={activeTab === 'similar' ? 'primary' : 'default'}
            variant={activeTab === 'similar' ? 'filled' : 'outlined'}
            icon={<WhatshotIcon />}
          />
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, alignSelf: 'center' }}>
            Loading recommendations...
          </Typography>
        </Box>
      )}

      {/* Content based on active tab */}
      {!loading && (
        <>
          {/* Alternative Brands */}
          {activeTab === 'alternatives' && (
            <>
              {alternativeBrands.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                  <CompareIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No alternative brands available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We couldn't find alternative brands for your current cart items
                  </Typography>
                </Paper>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Alternative Brands & Better Deals
                  </Typography>
                  <Grid container spacing={2}>
                    {alternativeBrands.map((item, index) => renderRecommendationCard(item, index))}
                  </Grid>
                </>
              )}
            </>
          )}

          {/* Complementary Items */}
          {activeTab === 'complementary' && (
            <>
              {complementaryItems.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                  <OfferIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No complementary items available
                  </Typography>
                </Paper>
              ) : (
                <>
                   <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Items That Go Well With Your Cart
                  </Typography>
                  <Grid container spacing={2}>
                    {complementaryItems.map((item, index) => renderRecommendationCard(item, index))}
                  </Grid>
                </>
              )}
            </>
          )}

          {/* Similar Products */}
          {activeTab === 'similar' && (
            <>
              {similarProducts.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                  <WhatshotIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No similar products available
                  </Typography>
                </Paper>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Similar Products You Might Like
                  </Typography>
                  <Grid container spacing={2}>
                    {similarProducts.map((item, index) => renderRecommendationCard(item, index))}
                  </Grid>
                </>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default CartRecommendations;