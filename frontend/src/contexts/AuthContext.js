import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from '../axiosConfig';

// Create the auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  
  // Clear any auth errors
  const clearError = () => setError(null);

  // Check auth status on mount
  useEffect(() => {
    const verifyAuth = async () => {
      clearError();
      setLoading(true);
      
      try {
        const tokenData = localStorage.getItem('token');
        if (!tokenData) {
          setLoading(false);
          return;
        }

        let parsedToken, token, expiresAt;
        try {
          parsedToken = JSON.parse(tokenData);
          token = parsedToken.token;
          expiresAt = parsedToken.expiresAt;
        } catch (parseError) {
          console.error('Error parsing token data:', parseError);
          // Clear invalid token data
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }

        // Validate token structure
        if (!token) {
          console.error('Invalid token structure');
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }

        // Check if token is expired (only if expiresAt is set)
        if (expiresAt && Date.now() >= expiresAt) {
          // Try to refresh token
          try {
            const refreshResponse = await axios.get('/api/auth/refresh', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            const newToken = refreshResponse.data.token;
            const newExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now

            // Update token in localStorage
            localStorage.setItem('token', JSON.stringify({
              token: newToken,
              expiresAt: newExpiry
            }));

            // Update axios headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            // Fetch user data
            const userResponse = await axios.get('/api/auth/user');
            setUser(userResponse.data);
            setIsAuthenticated(true);
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            // Clear invalid token
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setError('Session expired. Please log in again.');
            setIsAuthenticated(false);
            return;
          }
        } else {
          // Token is still valid
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          try {
            const response = await axios.get('/api/auth/user');
            setUser(response.data);
            setIsAuthenticated(true);
          } catch (userFetchError) {
            console.error('Failed to fetch user data:', userFetchError);

            // If it's a network error or server unavailable, create a mock user for development
            if (userFetchError.code === 'ECONNREFUSED' || userFetchError.code === 'ERR_NETWORK') {
              console.warn('Backend unavailable, using mock user for development');
              const mockUser = {
                id: 'dev-user',
                email: 'developer@studysphere.dev',
                name: 'Development User',
                role: 'student'
              };
              setUser(mockUser);
              setIsAuthenticated(true);
            } else {
              throw userFetchError; // Re-throw other errors
            }
          }
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        
        setError(err.response?.data?.message || 'Session expired. Please log in again.');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    // Verify auth on mount
    verifyAuth();

    // Set up token refresh interval (check every 5 minutes)
    const refreshInterval = setInterval(() => {
      verifyAuth();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      delete axios.defaults.headers.common['Authorization'];
    };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    clearError();
    setLoading(true);
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Check if token exists and is still valid
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        if (Date.now() < tokenData.expiresAt) {
          // Token is still valid, try to refresh
          try {
            const refreshResponse = await axios.get('/api/auth/refresh');
            const { token } = refreshResponse.data;
            
            // Update token with new expiration
            const newTokenData = {
              token,
              expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
            };
            localStorage.setItem('token', JSON.stringify(newTokenData));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return true;
          } catch (refreshErr) {
            // Refresh failed, proceed with login
          }
        }
      }

      // Create controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await axios.post('/api/auth/login', { email, password }, {
          signal: controller.signal
        });
        const { token, userId, name, email: userEmail } = response.data;
        
        // Save token with expiration
        const tokenData = {
          token,
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('token', JSON.stringify(tokenData));
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Create user object
        const userData = {
          id: userId,
          name,
          email: userEmail
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return true;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      console.error('Login failed:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.';
      
      // Clear invalid token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (name, email, password) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/register', { 
        name, 
        email, 
        password 
      });
      
      const { token, userId, name: userName, email: userEmail } = response.data;
      
      // Save token
      localStorage.setItem('token', token);
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Create user object from the response fields
      const userData = {
        id: userId,
        name: userName,
        email: userEmail
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Registration failed. Please try again.';
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Remove token
    localStorage.removeItem('token');
    
    // Clear auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    clearError();
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (userData) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await axios.put('/api/auth/profile', userData);
      
      setUser(response.data);
      return true;
    } catch (err) {
      console.error('Profile update failed:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Failed to update profile. Please try again.';
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 