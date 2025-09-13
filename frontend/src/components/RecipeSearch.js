// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Container,
//   Paper,
//   Typography,
//   TextField,
//   Button,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Grid,
//   Card,
//   CardContent,
//   CardMedia,
//   CardActions,
//   Chip,
//   Alert,
//   CircularProgress,
//   InputAdornment,
//   Tabs,
//   Tab,
//   Divider,
//   IconButton,
//   Tooltip,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon
// } from '@mui/material';
// import {
//   Search,
//   Restaurant,
//   People,
//   Timer,
//   ShoppingCart,
//   Add,
//   Visibility,
//   Star,
//   LocalDining,
//   Kitchen,
//   TrendingUp,
//   Whatshot,
//   AccessTime
// } from '@mui/icons-material';
// import axios from 'axios';
// import ProductCard from './ProductCard';
// import IngredientSelector from './IngredientSelector';

// const RecipeSearch = ({ user, onAddToCart }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [recipe, setRecipe] = useState(null);
//   const [showIngredients, setShowIngredients] = useState(false);
//   const [numPeople, setNumPeople] = useState(user?.preferences?.servingSize || 2);
//   const [dietType, setDietType] = useState(user?.preferences?.dietType || 'Veg');
//   const [tabValue, setTabValue] = useState(0);
//   const [featuredRecipes, setFeaturedRecipes] = useState({
//     popular: [],
//     trending: [],
//     quick: []
//   });

//   // Search suggestions
//   const searchSuggestions = [
//     'Chicken Pasta', 'White Pasta', 'Red Pasta', 'Baked Spaghetti',
//     'Penne Arrabbiata', 'Fusilli Primavera', 'Creamy Alfredo',
//     'Tomato Basil Pasta', 'Garlic Butter Pasta', 'Pesto Pasta'
//   ];

//   useEffect(() => {
//     loadFeaturedRecipes();
//   }, []);

//   const loadFeaturedRecipes = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

//       const [popularRes, trendingRes, quickRes] = await Promise.all([
//         axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/featured/popular?limit=6`, { headers }),
//         axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/featured/trending?limit=6`, { headers }),
//         axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/featured/quick?maxTime=30&limit=6`, { headers })
//       ]);

//       setFeaturedRecipes({
//         popular: popularRes.data.recipes || [],
//         trending: trendingRes.data.recipes || [],
//         quick: quickRes.data.recipes || []
//       });
//     } catch (error) {
//       console.error('Error loading featured recipes:', error);
//     }
//   };

//   const searchProducts = async (query) => {
//     if (!query.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const token = localStorage.getItem('token');
//       const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

//       const response = await axios.post(
//         `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/search`,
//         { query },
//         { headers }
//       );

//       setSearchResults(response.data.products || []);
      
//       if (response.data.products.length === 0) {
//         setError(`No products found for "${query}". Try searching with different keywords.`);
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       setError('Search failed. Please try again.');
//       setSearchResults([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateRecipe = async (dishName) => {
//     setLoading(true);
//     setError('');

//     try {
//       const token = localStorage.getItem('token');
//       const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

//       const response = await axios.post(
//         `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/generate`,
//         {
//           dishName,
//           numPeople,
//           dietType
//         },
//         { headers }
//       );

//       setRecipe(response.data);
//       setShowIngredients(true);
//       setTabValue(0); // Switch to ingredients tab
//     } catch (error) {
//       console.error('Recipe generation error:', error);
//       setError('Failed to generate recipe. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (tabValue === 0) {
//       searchProducts(searchQuery);
//     } else {
//       generateRecipe(searchQuery);
//     }
//   };

//   const handleSuggestionClick = (suggestion) => {
//     setSearchQuery(suggestion);
//     if (tabValue === 0) {
//       searchProducts(suggestion);
//     } else {
//       generateRecipe(suggestion);
//     }
//   };

//   const handleTabChange = (event, newValue) => {
//     setTabValue(newValue);
//     setSearchResults([]);
//     setError('');
//     setRecipe(null);
//     setShowIngredients(false);
//   };

//   useEffect(() => {
//     const delayedSearch = setTimeout(() => {
//       if (searchQuery && tabValue === 0) {
//         searchProducts(searchQuery);
//       }
//     }, 500);

//     return () => clearTimeout(delayedSearch);
//   }, [searchQuery, tabValue]);

//   return (
//     <Container maxWidth="lg" sx={{ py: 4 }}>
//       {/* Header */}
//       <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//           <Restaurant sx={{ fontSize: 40, mr: 2 }} />
//           <Box>
//             <Typography variant="h3" fontWeight="bold">
//               Recipe Search
//             </Typography>
//             <Typography variant="h6" sx={{ opacity: 0.9 }}>
//               Find recipes and add all ingredients to cart
//             </Typography>
//           </Box>
//         </Box>

//         {/* Search Tabs */}
//         <Tabs 
//           value={tabValue} 
//           onChange={handleTabChange}
//           sx={{ 
//             mb: 3,
//             '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
//             '& .Mui-selected': { color: 'white !important' },
//             '& .MuiTabs-indicator': { backgroundColor: 'white' }
//           }}
//         >
//           <Tab icon={<Search />} label="Search Products" />
//           <Tab icon={<Kitchen />} label="Generate Recipe" />
//         </Tabs>

//         {/* Search Form */}
//         <form onSubmit={handleSearch}>
//           <Grid container spacing={2} alignItems="center">
//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder={tabValue === 0 ? "Search for ingredients (e.g., 'white sauce', 'pasta')" : "Enter dish name (e.g., 'Chicken Pasta', 'White Pasta')"}
//                 variant="outlined"
//                 sx={{ 
//                   '& .MuiOutlinedInput-root': { 
//                     backgroundColor: 'rgba(255,255,255,0.9)',
//                     '& fieldset': { borderColor: 'transparent' }
//                   }
//                 }}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Search color="action" />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Grid>
            
//             <Grid item xs={6} md={2}>
//               <FormControl fullWidth>
//                 <InputLabel sx={{ color: 'white' }}>People</InputLabel>
//                 <Select
//                   value={numPeople}
//                   onChange={(e) => setNumPeople(parseInt(e.target.value))}
//                   sx={{ 
//                     backgroundColor: 'rgba(255,255,255,0.9)',
//                     '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
//                   }}
//                 >
//                   {[1,2,3,4,5,6,7,8].map(num => (
//                     <MenuItem key={num} value={num}>
//                       <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                         <People sx={{ mr: 1, fontSize: 16 }} />
//                         {num}
//                       </Box>
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
            
//             <Grid item xs={6} md={2}>
//               <FormControl fullWidth>
//                 <InputLabel sx={{ color: 'white' }}>Diet</InputLabel>
//                 <Select
//                   value={dietType}
//                   onChange={(e) => setDietType(e.target.value)}
//                   sx={{ 
//                     backgroundColor: 'rgba(255,255,255,0.9)',
//                     '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
//                   }}
//                 >
//                   <MenuItem value="Veg">🥕 Vegetarian</MenuItem>
//                   <MenuItem value="Non-Veg">🍖 Non-Vegetarian</MenuItem>
//                   <MenuItem value="Vegan">🌱 Vegan</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12} md={2}>
//               <Button
//                 type="submit"
//                 fullWidth
//                 variant="contained"
//                 size="large"
//                 disabled={loading || !searchQuery.trim()}
//                 sx={{ 
//                   py: 2,
//                   backgroundColor: 'rgba(255,255,255,0.2)',
//                   '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
//                 }}
//               >
//                 {loading ? <CircularProgress size={24} color="inherit" /> : 
//                  tabValue === 0 ? 'Search' : 'Generate'}
//               </Button>
//             </Grid>
//           </Grid>
//         </form>

//         {/* Search Suggestions */}
//         <Box sx={{ mt: 3 }}>
//           <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
//             Popular searches:
//           </Typography>
//           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//             {searchSuggestions.slice(0, 6).map((suggestion) => (
//               <Chip
//                 key={suggestion}
//                 label={suggestion}
//                 onClick={() => handleSuggestionClick(suggestion)}
//                 sx={{ 
//                   backgroundColor: 'rgba(255,255,255,0.2)',
//                   color: 'white',
//                   '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
//                 }}
//               />
//             ))}
//           </Box>
//         </Box>
//       </Paper>

//       {/* Error Message */}
//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {/* Loading State */}
//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//           <CircularProgress size={40} />
//           <Typography sx={{ ml: 2, alignSelf: 'center' }}>
//             {tabValue === 0 ? 'Searching products...' : 'Generating recipe...'}
//           </Typography>
//         </Box>
//       )}

//       {/* Recipe Ingredient Selector Dialog */}
//       {recipe && showIngredients && (
//         <IngredientSelector
//           recipe={recipe}
//           onAddToCart={onAddToCart}
//           onClose={() => setShowIngredients(false)}
//         />
//       )}

//       {/* Product Search Results */}
//       {!showIngredients && searchResults.length > 0 && (
//         <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
//           <Typography variant="h5" gutterBottom>
//             Found {searchResults.length} products for "{searchQuery}"
//           </Typography>
//           <Grid container spacing={3}>
//             {searchResults.map((product) => (
//               <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
//                 <ProductCard
//                   product={product}
//                   onAddToCart={onAddToCart}
//                 />
//               </Grid>
//             ))}
//           </Grid>
//         </Paper>
//       )}

//       {/* Featured Recipes */}
//       {!loading && !showIngredients && searchResults.length === 0 && (
//         <Box>
//           {/* Popular Recipes */}
//           {featuredRecipes.popular.length > 0 && (
//             <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
//                 <Typography variant="h5" fontWeight="bold">
//                   Popular Recipes
//                 </Typography>
//               </Box>
//               <Grid container spacing={2}>
//                 {featuredRecipes.popular.map((recipe) => (
//                   <Grid item xs={12} sm={6} md={4} key={recipe._id}>
//                     <Card sx={{ cursor: 'pointer' }} onClick={() => handleSuggestionClick(recipe.name)}>
//                       <CardContent>
//                         <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                           <Timer sx={{ fontSize: 16, mr: 0.5 }} />
//                           <Typography variant="body2" color="text.secondary">
//                             {recipe.prepTime + recipe.cookTime} min
//                           </Typography>
//                           <Star sx={{ fontSize: 16, ml: 2, mr: 0.5, color: 'gold' }} />
//                           <Typography variant="body2" color="text.secondary">
//                             {recipe.ratings?.average || 0}
//                           </Typography>
//                         </Box>
//                         <Chip 
//                           label={recipe.category} 
//                           size="small" 
//                           color="primary" 
//                           variant="outlined" 
//                         />
//                       </CardContent>
//                     </Card>
//                   </Grid>
//                 ))}
//               </Grid>
//             </Paper>
//           )}

//           {/* Quick Recipes */}
//           {featuredRecipes.quick.length > 0 && (
//             <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
//                 <Typography variant="h5" fontWeight="bold">
//                   Quick Recipes
//                 </Typography>
//               </Box>
//               <Grid container spacing={2}>
//                 {featuredRecipes.quick.map((recipe) => (
//                   <Grid item xs={12} sm={6} md={4} key={recipe._id}>
//                     <Card sx={{ cursor: 'pointer' }} onClick={() => handleSuggestionClick(recipe.name)}>
//                       <CardContent>
//                         <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                           <Timer sx={{ fontSize: 16, mr: 0.5 }} />
//                           <Typography variant="body2" color="text.secondary">
//                             {recipe.prepTime + recipe.cookTime} min
//                           </Typography>
//                           <Star sx={{ fontSize: 16, ml: 2, mr: 0.5, color: 'gold' }} />
//                           <Typography variant="body2" color="text.secondary">
//                             {recipe.ratings?.average || 0}
//                           </Typography>
//                         </Box>
//                         <Chip 
//                           label={recipe.category} 
//                           size="small" 
//                           color="primary" 
//                           variant="outlined" 
//                         />
//                       </CardContent>
//                     </Card>
//                   </Grid>
//                 ))}
//               </Grid>
//             </Paper>
//           )}

//           {/* Trending Recipes */}
//           {featuredRecipes.trending.length > 0 && (
//             <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <Whatshot sx={{ mr: 1, color: 'primary.main' }} />
//                 <Typography variant="h5" fontWeight="bold">
//                   Trending Recipes
//                 </Typography>
//               </Box>
//               <Grid container spacing={2}>
//                 {featuredRecipes.trending.map((recipe) => (
//                   <Grid item xs={12} sm={6} md={4} key={recipe._id}>
//                     <Card sx={{ cursor: 'pointer' }} onClick={() => handleSuggestionClick(recipe.name)}>
//                       <CardContent>
//                         <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                           <Timer sx={{ fontSize: 16, mr: 0.5 }} />
//                           <Typography variant="body2" color="text.secondary">
//                             {recipe.prepTime + recipe.cookTime} min
//                           </Typography>
//                           <Star sx={{ fontSize: 16, ml: 2, mr: 0.5, color: 'gold' }} />
//                           <Typography variant="body2" color="text.secondary">
//                             {recipe.ratings?.average || 0}
//                           </Typography>
//                         </Box>
//                         <Chip 
//                           label={recipe.category} 
//                           size="small" 
//                           color="primary" 
//                           variant="outlined" 
//                         />
//                       </CardContent>
//                     </Card>
//                   </Grid>
//                 ))}
//               </Grid>
//             </Paper>
//           )}
//         </Box>
//       )}
//     </Container>
//   );
// };

// export default RecipeSearch;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Search,
  Restaurant,
  People,
  Timer,
  ShoppingCart,
  Add,
  Visibility,
  Star,
  LocalDining,
  Kitchen,
  TrendingUp,
  Whatshot,
  AccessTime
} from '@mui/icons-material';
import axios from 'axios';
import ProductCard from './ProductCard';
import IngredientSelector from './IngredientSelector';

const RecipeSearch = ({ user, onAddToCart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [numPeople, setNumPeople] = useState(user?.preferences?.servingSize || 2);
  const [dietType, setDietType] = useState(user?.preferences?.dietType || 'Veg');
  const [tabValue, setTabValue] = useState(0);
  const [featuredRecipes, setFeaturedRecipes] = useState({
    popular: [],
    trending: [],
    quick: []
  });

  // Search suggestions
  const searchSuggestions = [
    'Chicken Pasta', 'White Pasta', 'Red Pasta', 'Baked Spaghetti',
    'Penne Arrabbiata', 'Fusilli Primavera', 'Creamy Alfredo',
    'Tomato Basil Pasta', 'Garlic Butter Pasta', 'Pesto Pasta'
  ];

  useEffect(() => {
    loadFeaturedRecipes();
  }, []);

  const loadFeaturedRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [popularRes, trendingRes, quickRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/featured/popular?limit=6`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/featured/trending?limit=6`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/featured/quick?maxTime=30&limit=6`, { headers })
      ]);

      setFeaturedRecipes({
        popular: popularRes.data.recipes || [],
        trending: trendingRes.data.recipes || [],
        quick: quickRes.data.recipes || []
      });
    } catch (error) {
      console.error('Error loading featured recipes:', error);
    }
  };

  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/search`,
        { query },
        { headers }
      );

      setSearchResults(response.data.products || []);
      
      if (response.data.products.length === 0) {
        setError(`No products found for "${query}". Try searching with different keywords.`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const generateRecipe = async (dishName) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recipes/generate`,
        {
          dishName,
          numPeople,
          dietType
        },
        { headers }
      );

      setRecipe(response.data);
      setShowIngredients(true);
      setTabValue(0); // Switch to ingredients tab
    } catch (error) {
      console.error('Recipe generation error:', error);
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tabValue === 0) {
      searchProducts(searchQuery);
    } else {
      generateRecipe(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    if (tabValue === 0) {
      searchProducts(suggestion);
    } else {
      generateRecipe(suggestion);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchResults([]);
    setError('');
    setRecipe(null);
    setShowIngredients(false);
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery && tabValue === 0) {
        searchProducts(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, tabValue]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Restaurant sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h3" fontWeight="bold">
              Recipe Search
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Find recipes and add all ingredients to cart
            </Typography>
          </Box>
        </Box>

        {/* Search Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
            '& .Mui-selected': { color: 'white !important' },
            '& .MuiTabs-indicator': { backgroundColor: 'white' }
          }}
        >
          <Tab icon={<Search />} label="Search Products" />
          <Tab icon={<Kitchen />} label="Generate Recipe" />
        </Tabs>

        {/* Search Form */}
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tabValue === 0 ? "Search for ingredients (e.g., 'white sauce', 'pasta')" : "Enter dish name (e.g., 'Chicken Pasta', 'White Pasta')"}
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '& fieldset': { borderColor: 'transparent' }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>People</InputLabel>
                <Select
                  value={numPeople}
                  onChange={(e) => setNumPeople(parseInt(e.target.value))}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
                  }}
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <MenuItem key={num} value={num}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <People sx={{ mr: 1, fontSize: 16 }} />
                        {num}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Diet</InputLabel>
                <Select
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
                  }}
                >
                  <MenuItem value="Veg">🥕 Vegetarian</MenuItem>
                  <MenuItem value="Non-Veg">🍖 Non-Vegetarian</MenuItem>
                  <MenuItem value="Vegan">🌱 Vegan</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !searchQuery.trim()}
                sx={{ 
                  py: 2,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 
                 tabValue === 0 ? 'Search' : 'Generate'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Search Suggestions */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
            Popular searches:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {searchSuggestions.slice(0, 6).map((suggestion) => (
              <Chip
                key={suggestion}
                label={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, alignSelf: 'center' }}>
            {tabValue === 0 ? 'Searching products...' : 'Generating recipe...'}
          </Typography>
        </Box>
      )}

      {/* Recipe Ingredient Selector Dialog */}
      {recipe && showIngredients && (
        <IngredientSelector
          recipe={recipe}
          onAddToCart={onAddToCart}
          onClose={() => setShowIngredients(false)}
        />
      )}

      {/* Product Search Results */}
      {!showIngredients && searchResults.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Found {searchResults.length} products for "{searchQuery}"
          </Typography>
          <Grid container spacing={3}>
            {searchResults.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Featured Recipes */}
      {!loading && !showIngredients && searchResults.length === 0 && (
        <Box>
          {/* Popular Recipes */}
          {featuredRecipes.popular.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Popular Recipes
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {featuredRecipes.popular.map((recipe) => (
                  <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                    <Card sx={{ cursor: 'pointer' }} onClick={() => handleSuggestionClick(recipe.name)}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Timer sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {recipe.prepTime + recipe.cookTime} min
                          </Typography>
                          <Star sx={{ fontSize: 16, ml: 2, mr: 0.5, color: 'gold' }} />
                          <Typography variant="body2" color="text.secondary">
                            {recipe.ratings?.average || 0}
                          </Typography>
                        </Box>
                        <Chip 
                          label={recipe.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Quick Recipes */}
          {featuredRecipes.quick.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Quick Recipes
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {featuredRecipes.quick.map((recipe) => (
                  <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                    <Card sx={{ cursor: 'pointer' }} onClick={() => handleSuggestionClick(recipe.name)}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Timer sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {recipe.prepTime + recipe.cookTime} min
                          </Typography>
                          <Star sx={{ fontSize: 16, ml: 2, mr: 0.5, color: 'gold' }} />
                          <Typography variant="body2" color="text.secondary">
                            {recipe.ratings?.average || 0}
                          </Typography>
                        </Box>
                        <Chip 
                          label={recipe.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Trending Recipes */}
          {featuredRecipes.trending.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Whatshot sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Trending Recipes
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {featuredRecipes.trending.map((recipe) => (
                  <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                    <Card sx={{ cursor: 'pointer' }} onClick={() => handleSuggestionClick(recipe.name)}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Timer sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {recipe.prepTime + recipe.cookTime} min
                          </Typography>
                          <Star sx={{ fontSize: 16, ml: 2, mr: 0.5, color: 'gold' }} />
                          <Typography variant="body2" color="text.secondary">
                            {recipe.ratings?.average || 0}
                          </Typography>
                        </Box>
                        <Chip 
                          label={recipe.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default RecipeSearch;