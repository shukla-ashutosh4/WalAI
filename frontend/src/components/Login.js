import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Link,
  Card,
  CardContent
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ShoppingCart,
  Restaurant,
  LocalGroceryStore,
  SmartToy
} from '@mui/icons-material';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '',
    preferences: {
      dietType: 'Veg',
      servingSize: 2,
      allergies: [],
      cuisinePreferences: [],
      budgetRange: {
        min: 0,
        max: 1000
      },
      cookingTime: 'any'
    }
  });
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    // Prepare payload based on mode
    const payload = isRegister ? formData : {
      email: formData.email,
      password: formData.password
    };
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}`, 
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store authentication data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        setSuccess(isRegister ? 'Account created successfully!' : 'Welcome back!');
        
        // Delay to show success message
        setTimeout(() => {
          onLogin(response.data.user, response.data.token);
        }, 1000);
      } else {
        throw new Error('No token received');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        setError(error.response.data.errors.join(', '));
      } else {
        setError(error.response?.data?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setFormData({ 
      email: '', 
      password: '', 
      name: '',
      preferences: {
        dietType: 'Veg',
        servingSize: 2,
        allergies: [],
        cuisinePreferences: [],
        budgetRange: {
          min: 0,
          max: 1000
        },
        cookingTime: 'any'
      }
    });
  };

  // Demo login function
  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, 
        {
          email: 'demo@walai.com',
          password: 'demo123'
        }
      );
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setSuccess('Demo login successful!');
        setTimeout(() => {
          onLogin(response.data.user, response.data.token);
        }, 1000);
      }
    } catch (error) {
      // If demo account doesn't exist, create it
      try {
        const createResponse = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`,
          {
            name: 'Demo User',
            email: 'demo@walai.com',
            password: 'demo123',
            preferences: {
              dietType: 'Veg',
              servingSize: 2,
              allergies: [],
              cuisinePreferences: ['italian', 'american']
            }
          }
        );
        
        if (createResponse.data.token) {
          localStorage.setItem('token', createResponse.data.token);
          localStorage.setItem('user', JSON.stringify(createResponse.data.user));
          
          setSuccess('Demo account created and logged in!');
          setTimeout(() => {
            onLogin(createResponse.data.user, createResponse.data.token);
          }, 1000);
        }
      } catch (createError) {
        setError('Demo login failed. Please try manual login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          
          {/* Left Side - Branding */}
          <Box sx={{ 
            flex: 1, 
            color: 'white', 
            display: { xs: 'none', md: 'block' } 
          }}>
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              Wal AI
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              Smart Grocery Shopping with AI
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SmartToy sx={{ mr: 2, fontSize: 30 }} />
                <Typography variant="h6">AI-Powered Recipe Search</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Restaurant sx={{ mr: 2, fontSize: 30 }} />
                <Typography variant="h6">Intelligent Meal Planning</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalGroceryStore sx={{ mr: 2, fontSize: 30 }} />
                <Typography variant="h6">Smart Shopping Lists</Typography>
              </Box>
            </Box>

            <Card sx={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: 'white', fontStyle: 'italic' }}>
                  "Just search for any dish and we'll automatically add all the ingredients to your cart!"
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1, display: 'block' }}>
                  - Try searching "Chicken Pasta" or "White Pasta"
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Right Side - Login Form */}
          <Box sx={{ flex: 1, maxWidth: 400 }}>
            <Paper elevation={10} sx={{ 
              p: 4, 
              borderRadius: 3,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="primary">
                  Wal AI
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {isRegister ? 'Create Your Account' : 'Welcome Back'}
                </Typography>
              </Box>

              {/* Alerts */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {isRegister && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    margin="normal"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  margin="normal"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  helperText={isRegister ? "Minimum 6 characters" : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Registration Preferences */}
                {isRegister && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Preferences (Optional)
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Diet Type</InputLabel>
                        <Select
                          value={formData.preferences.dietType}
                          onChange={(e) => handleInputChange('preferences.dietType', e.target.value)}
                          label="Diet Type"
                        >
                          <MenuItem value="Veg">🥕 Vegetarian</MenuItem>
                          <MenuItem value="Non-Veg">🍖 Non-Vegetarian</MenuItem>
                          <MenuItem value="Vegan">🌱 Vegan</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Serving Size</InputLabel>
                        <Select
                          value={formData.preferences.servingSize}
                          onChange={(e) => handleInputChange('preferences.servingSize', e.target.value)}
                          label="Serving Size"
                        >
                          <MenuItem value={1}>1 person</MenuItem>
                          <MenuItem value={2}>2 people</MenuItem>
                          <MenuItem value={4}>4 people</MenuItem>
                          <MenuItem value={6}>6 people</MenuItem>
                          <MenuItem value={8}>8 people</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Cooking Time Preference</InputLabel>
                      <Select
                        value={formData.preferences.cookingTime}
                        onChange={(e) => handleInputChange('preferences.cookingTime', e.target.value)}
                        label="Cooking Time Preference"
                      >
                        <MenuItem value="quick">⚡ Quick (Under 30 min)</MenuItem>
                        <MenuItem value="medium">🕐 Medium (30-60 min)</MenuItem>
                        <MenuItem value="long">🕑 Long (Over 60 min)</MenuItem>
                        <MenuItem value="any">🍳 Any Duration</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Remember Me */}
                {!isRegister && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Remember me"
                    sx={{ mt: 1 }}
                  />
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    mt: 3, 
                    mb: 2, 
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    isRegister ? 'Create Account' : 'Sign In'
                  )}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary"> OR
                  </Typography>
                </Divider>

                {/* Switch Mode */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                  </Typography>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={switchMode}
                    sx={{ 
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {isRegister ? 'Sign In' : 'Sign Up'}
                  </Link>
                </Box>

                {/* Demo Account */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Demo Account:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Email: demo@walai.com | Password: demo123
                  </Typography>
                </Box>
              </form>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;