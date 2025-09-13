import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import WalAILogoImage from './WalAI_LOGO.jpg';

const Login = ({ onLogin }) => {
  const location = useLocation();
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
  const [isRegister, setIsRegister] = useState(
    location.state?.message ? true : false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState(
    location.state?.message || ''
  );

  useEffect(() => {
    if (location.state?.message) {
      setRedirectMessage(location.state.message);
      setIsRegister(true);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isRegister
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`;

      const payload = isRegister
        ? {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            preferences: formData.preferences
          }
        : {
            email: formData.email,
            password: formData.password
          };

      const response = await axios.post(endpoint, payload);

      setSuccess(isRegister ? 'Account created successfully!' : 'Welcome back!');
      setLoading(false);

      setTimeout(() => {
        onLogin && onLogin(
          {
            name: response.data.user.name || 'User',
            email: response.data.user.email,
            preferences: response.data.user.preferences || formData.preferences
          },
          response.data.token
        );
      }, 1000);
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      if (!isRegister && errorMessage.includes('User not found')) {
        setError('Account not found. Please create an account.');
        setIsRegister(true);
      } else {
        setError(errorMessage);
      }
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

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setRedirectMessage('');
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

  const WAILogo = ({ size = 80 }) => (
    <div className="relative flex items-center justify-center">
      <div
        className="relative rounded-xl p-4 shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
        style={{
          background: 'rgba(0, 113, 206, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 113, 206, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          width: `${size}px`,
          height: `${size * 0.8}px`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-yellow-400/20 rounded-xl"></div>
        <img
          src={WalAILogoImage}
          alt="WAI Logo"
          className="relative z-10 max-w-full max-h-full object-contain"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x96/0071ce/ffffff?text=WAI'; }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden font-inter">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com"></script>

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0071ce 0%, #004c91 25%, #ffc220 50%, #0071ce 75%, #004c91 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite'
        }}
      />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20"
          style={{
            background: 'rgba(255, 194, 32, 0.3)',
            backdropFilter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div
          className="absolute top-40 right-32 w-24 h-24 rounded-full opacity-20"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(30px)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full opacity-10"
          style={{
            background: 'rgba(0, 113, 206, 0.3)',
            backdropFilter: 'blur(50px)',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8 px-4">
        <div className="w-full max-w-md mx-auto">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 hover:shadow-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <div
              className="text-center py-8 px-6 border-b"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <WAILogo size={100} />
              <h1 className="text-3xl font-bold text-white mt-4 drop-shadow-lg">
                {isRegister ? 'Create your account' : 'Sign in to WAI'}
              </h1>
              <p className="text-white/80 mt-2 text-sm drop-shadow">
                {redirectMessage
                  ? redirectMessage
                  : isRegister
                    ? 'Create your account to get started with WAI'
                    : 'Enter your email and password to sign in.'
                }
              </p>
            </div>

            <div className="p-6">
              {redirectMessage && !isRegister && (
                <div
                  className="mb-4 p-3 rounded-lg border backdrop-blur-sm"
                  style={{
                    background: 'rgba(255, 194, 32, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 194, 32, 0.3)'
                  }}
                >
                  <div className="text-yellow-200 text-sm">{redirectMessage}</div>
                </div>
              )}

              {error && (
                <div
                  className="mb-4 p-3 rounded-lg border backdrop-blur-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <div className="flex items-center">
                    <div className="text-red-200 text-sm">{error}</div>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="ml-auto text-red-200 hover:text-red-100 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {success && (
                <div
                  className="mb-4 p-3 rounded-lg border backdrop-blur-sm"
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <div className="text-green-200 text-sm">{success}</div>
                </div>
              )}

              <div>
                {isRegister && (
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required={isRegister}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-white/60 transition-all duration-300 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">Phone number or email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-white/60 text-lg transition-all duration-300 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {(isRegister || formData.email) && (
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="w-full pl-10 pr-12 py-3 rounded-lg border text-white placeholder-white/60 transition-all duration-300 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {isRegister && (
                      <p className="text-xs text-white/60 mt-1">Minimum 6 characters</p>
                    )}
                  </div>
                )}

                {isRegister && (
                  <div
                    className="mb-4 p-4 rounded-lg border backdrop-blur-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <h3 className="text-sm font-semibold text-white/90 mb-3">Preferences (Optional)</h3>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label htmlFor="dietType" className="block text-xs font-medium text-white/80 mb-1">Diet Type</label>
                        <select
                          id="dietType"
                          value={formData.preferences.dietType}
                          onChange={(e) => handleInputChange('preferences.dietType', e.target.value)}
                          className="w-full px-3 py-2 rounded-md border text-white text-sm transition-all duration-300 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <option value="Veg">🥕 Vegetarian</option>
                          <option value="Non-Veg">🍖 Non-Vegetarian</option>
                          <option value="Vegan">🌱 Vegan</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="servingSize" className="block text-xs font-medium text-white/80 mb-1">Serving Size</label>
                        <select
                          id="servingSize"
                          value={formData.preferences.servingSize}
                          onChange={(e) => handleInputChange('preferences.servingSize', e.target.value)}
                          className="w-full px-3 py-2 rounded-md border text-white text-sm transition-all duration-300 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <option value={1}>1 person</option>
                          <option value={2}>2 people</option>
                          <option value={4}>4 people</option>
                          <option value={6}>6 people</option>
                          <option value={8}>8 people</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="cookingTime" className="block text-xs font-medium text-white/80 mb-1">Cooking Time Preference</label>
                      <select
                        id="cookingTime"
                        value={formData.preferences.cookingTime}
                        onChange={(e) => handleInputChange('preferences.cookingTime', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border text-white text-sm transition-all duration-300 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <option value="quick">⚡ Quick (Under 30 min)</option>
                        <option value="medium">🕐 Medium (30-60 min)</option>
                        <option value="long">🕑 Long (Over 60 min)</option>
                        <option value="any">🍳 Any Duration</option>
                      </select>
                    </div>
                  </div>
                )}

                <div
                  className="mb-6 p-3 rounded-lg border backdrop-blur-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <p className="text-xs text-white/80">
                    Securing your personal information is our priority.
                  </p>
                  <button
                    type="button"
                    onClick={() => console.log('See our privacy measures clicked')}
                    className="text-xs text-yellow-300 hover:text-yellow-100 underline transition-colors"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    See our privacy measures.
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 font-semibold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  style={loading ? {
                    background: 'rgba(156, 163, 175, 0.3)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(156, 163, 175, 0.5)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  } : {
                    background: 'rgba(255, 194, 32, 0.2)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 194, 32, 0.5)',
                    boxShadow: '0 4px 12px rgba(255, 194, 32, 0.3)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/50"></div>
                    </div>
                  ) : (
                    isRegister ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-white/80 mb-2">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                type="button"
                onClick={switchMode}
                className="text-yellow-300 hover:text-yellow-100 font-semibold text-sm hover:underline transition-colors"
              >
                {isRegister ? 'Sign In' : 'Create Account'}
              </button>
            </div>

            <div
              className="py-4 px-6 text-center border-t backdrop-blur-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <p className="text-xs text-white/70 mb-2">© 2025 WAI. All Rights Reserved.</p>
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => console.log('Give feedback clicked')}
                  className="text-xs text-yellow-300 hover:text-yellow-100 transition-colors"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Give feedback
                </button>
                <button
                  type="button"
                  onClick={() => console.log('Privacy Rights clicked')}
                  className="text-xs text-yellow-300 hover:text-yellow-100 transition-colors"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Privacy Rights
                </button>
                <button
                  type="button"
                  onClick={() => console.log('Your Privacy Choices clicked')}
                  className="text-xs text-yellow-300 hover:text-yellow-100 transition-colors"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Your Privacy Choices
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }

          input::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          select option {
            background: rgba(0, 113, 206, 0.9);
            color: white;
          }
        `}
      </style>
    </div>
  );
};

export default Login;