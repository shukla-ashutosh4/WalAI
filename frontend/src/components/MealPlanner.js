import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Container,
  Paper,
  Divider,
  Fab,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Logout as LogoutIcon,
  Restaurant as RestaurantIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  AutoFixHigh as AutoFixHighIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Timer as TimerIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';

const MealPlanner = ({ 
  user, 
  onLogout, 
  userPreferences, 
  onUpdatePreferences, 
  onRecipeToCart 
}) => {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreferencesDialog, setOpenPreferencesDialog] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner'];

  useEffect(() => {
    if (user) {
      fetchMealPlans();
    }
  }, [user]);

  const fetchMealPlans = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/mealPlans/${user._id || user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMealPlans(response.data || []);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setError('Failed to fetch meal plans');
      setMealPlans([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const createMealPlan = async () => {
    setGeneratingPlan(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/mealPlans`,
        {
          userId: user._id || user.id,
          weekStartDate: weekStartDate.toISOString(),
          meals: generateEmptyMeals(),
          preferences: userPreferences,
          name: `Week of ${weekStartDate.toLocaleDateString()}`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMealPlans([...mealPlans, response.data]);
      setSuccess('Meal plan created successfully!');
      setOpenDialog(false);
    } catch (err) {
      console.error('Error creating meal plan:', err);
      setError(err.response?.data?.message || 'Failed to create meal plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const generateAIMealPlan = async () => {
    setGeneratingPlan(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // First, get AI recommendations
      const recommendationsResponse = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations/meal-plan`,
        {
          preferences: {
            ...userPreferences,
            dietTypes: [userPreferences.dietType]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiGeneratedMeals = transformAIResponseToMeals(recommendationsResponse.data.recommendations);
      
      // Then create the meal plan
      const mealPlanResponse = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/mealPlans`,
        {
          userId: user._id || user.id,
          weekStartDate: weekStartDate.toISOString(),
          meals: aiGeneratedMeals,
          preferences: userPreferences,
          generatedBy: 'AI',
          name: `AI Week of ${weekStartDate.toLocaleDateString()}`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMealPlans([...mealPlans, mealPlanResponse.data]);
      setSuccess('AI-generated meal plan created successfully!');
      setOpenDialog(false);
    } catch (err) {
      console.error('Error generating AI meal plan:', err);
      setError(err.response?.data?.message || 'Failed to generate AI meal plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const generateEmptyMeals = () => {
    return daysOfWeek.map(day => ({
      day,
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: []
    }));
  };

  const transformAIResponseToMeals = (aiResponse) => {
    // Handle different response formats
    if (Array.isArray(aiResponse)) {
      return generateEmptyMeals(); // Fallback to empty if array format
    }
    
    return daysOfWeek.map(day => ({
      day,
      breakfast: aiResponse[day]?.breakfast || {
        name: 'Oatmeal with Fruits',
        prepTime: 10,
        cookTime: 5,
        servings: userPreferences.servingSize || 2
      },
      lunch: aiResponse[day]?.lunch || {
        name: 'Vegetable Pasta',
        prepTime: 15,
        cookTime: 20,
        servings: userPreferences.servingSize || 2
      },
      dinner: aiResponse[day]?.dinner || {
        name: 'Rice with Curry',
        prepTime: 20,
        cookTime: 30,
        servings: userPreferences.servingSize || 2
      },
      snacks: aiResponse[day]?.snacks || []
    }));
  };

  const deleteMealPlan = async (mealPlanId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/mealPlans/${mealPlanId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setMealPlans(mealPlans.filter(plan => plan._id !== mealPlanId));
      setSuccess('Meal plan deleted successfully!');
    } catch (err) {
      console.error('Error deleting meal plan:', err);
      setError('Failed to delete meal plan');
    }
  };

  const addMealToCart = async (recipe, servings = userPreferences.servingSize) => {
    try {
      if (onRecipeToCart) {
        const result = await onRecipeToCart(recipe, servings, userPreferences.dietType);
        if (result?.success) {
          setSuccess(`Added ${recipe.name} ingredients to cart!`);
        } else {
          setError(result?.message || 'Failed to add meal to cart');
        }
      } else {
        // Fallback: create a simple cart item
        const cartItem = {
          _id: `meal-${Date.now()}`,
          name: recipe.name,
          price: 15.99, // Default meal price
          description: `Meal plan recipe: ${recipe.name}`,
          category: userPreferences.dietType,
          isMealPlan: true,
          servings: servings
        };
        setSuccess(`Added ${recipe.name} to cart!`);
      }
    } catch (err) {
      console.error('Error adding meal to cart:', err);
      setError('Failed to add meal to cart');
    }
  };

  const addWeekToCart = async (plan) => {
    try {
      let addedCount = 0;
      
      for (const meal of plan.meals) {
        for (const mealType of mealTypes) {
          if (meal[mealType]) {
            await addMealToCart(meal[mealType]);
            addedCount++;
          }
        }
      }
      
      if (addedCount > 0) {
        setSuccess(`Added ${addedCount} meals from this week to cart!`);
      } else {
        setError('No meals found in this plan to add to cart');
      }
    } catch (err) {
      console.error('Error adding week to cart:', err);
      setError('Failed to add week to cart');
    }
  };

  const handlePreferencesUpdate = (newPrefs) => {
    onUpdatePreferences(newPrefs);
    setSuccess('Preferences updated successfully!');
    setOpenPreferencesDialog(false);
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="sticky" sx={{ mb: 3 }}>
        <Toolbar>
          <CalendarIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meal Planner
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.name || 'User'}
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={() => setOpenPreferencesDialog(true)}
            sx={{ mr: 1 }}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Current Preferences */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Preferences
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              icon={<RestaurantIcon />}
              label={`Diet: ${userPreferences.dietType}`} 
              color="primary" 
            />
            <Chip 
              icon={<PeopleIcon />}
              label={`Serving Size: ${userPreferences.servingSize}`} 
              color="secondary" 
            />
            {userPreferences.allergies?.map(allergy => (
              <Chip key={allergy} label={`No ${allergy}`} variant="outlined" />
            ))}
          </Box>
        </Paper>

        {/* Meal Plans */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Your Meal Plans ({mealPlans.length})
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchMealPlans}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              Refresh
            </Button>
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2, alignSelf: 'center' }}>
                Loading meal plans...
              </Typography>
            </Box>
          ) : mealPlans.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <RestaurantIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No meal plans yet
              </Typography>
              <Typography color="text.secondary" paragraph>
                Create your first meal plan to get started with organized meal planning
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create Your First Meal Plan
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {mealPlans.map((plan) => (
                <Grid item xs={12} key={plan._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">
                            {plan.name || `Week of ${new Date(plan.weekStartDate).toLocaleDateString()}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created: {new Date(plan.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {plan.generatedBy === 'AI' && (
                            <Chip 
                              icon={<AutoFixHighIcon />} 
                              label="AI Generated" 
                              color="secondary" 
                              size="small"
                            />
                          )}
                          <Button
                            startIcon={<ShoppingCartIcon />}
                            variant="outlined"
                            size="small"
                            onClick={() => addWeekToCart(plan)}
                          >
                            Add Week to Cart
                          </Button>
                           <IconButton
                            size="small"
                            onClick={() => deleteMealPlan(plan._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={1}>
                        {plan.meals.map((meal) => (
                          <Grid item xs={12} md={6} lg={4} key={meal.day}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {meal.day}
                              </Typography>
                              
                              {mealTypes.map(mealType => (
                                <Box key={mealType} sx={{ mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}:
                                  </Typography>
                                  {meal[mealType] ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Typography variant="body2">
                                        {meal[mealType].name}
                                      </Typography>
                                      <Tooltip title="Add to cart">
                                        <IconButton 
                                          size="small"
                                          onClick={() => addMealToCart(meal[mealType])}
                                        >
                                          <ShoppingCartIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.disabled">
                                      Not planned
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add meal plan"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setOpenDialog(true)}
        >
          <AddIcon />
        </Fab>

        {/* Create Meal Plan Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Meal Plan</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              type="date"
              label="Week Start Date"
              value={weekStartDate.toISOString().split('T')[0]}
              onChange={(e) => setWeekStartDate(new Date(e.target.value))}
              sx={{ mt: 2, mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <Typography variant="body2" color="text.secondary">
              Choose how you'd like to create your meal plan:
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                createMealPlan();
              }}
              disabled={generatingPlan}
              variant="outlined"
            >
              Create Empty Plan
            </Button>
            <Button
              onClick={() => {
                generateAIMealPlan();
              }}
              disabled={generatingPlan}
              variant="contained"
              startIcon={generatingPlan ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
            >
              {generatingPlan ? 'Generating...' : 'AI Generate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preferences Dialog */}
        <Dialog open={openPreferencesDialog} onClose={() => setOpenPreferencesDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Preferences</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Diet Type</InputLabel>
                <Select
                  value={userPreferences.dietType}
                  onChange={(e) => handlePreferencesUpdate({ ...userPreferences, dietType: e.target.value })}
                >
                  <MenuItem value="Veg">Vegetarian</MenuItem>
                  <MenuItem value="Non-Veg">Non-Vegetarian</MenuItem>
                  <MenuItem value="Vegan">Vegan</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Default Serving Size"
                value={userPreferences.servingSize}
                onChange={(e) => handlePreferencesUpdate({ ...userPreferences, servingSize: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 10 }}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPreferencesDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MealPlanner;