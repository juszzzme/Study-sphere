import axios from 'axios';
import { API_BASE_URL } from './config';

// Create axios instance with custom config
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add token to every request
instance.interceptors.request.use(
  (config) => {
    try {
      const tokenData = localStorage.getItem('token');
      if (tokenData) {
        // Parse the token data (it's stored as JSON)
        const parsedToken = JSON.parse(tokenData);
        const token = parsedToken.token;

        // Check if token is expired
        if (parsedToken.expiresAt && Date.now() >= parsedToken.expiresAt) {
          // Token is expired, remove it
          localStorage.removeItem('token');
          console.warn('Token expired, removing from storage');
        } else if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // If token parsing fails, remove the invalid token
      console.error('Error parsing token:', error);
      localStorage.removeItem('token');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear local storage token
      localStorage.removeItem('token');
      
      // Don't automatically redirect - let the components handle auth errors
      // This prevents unexpected redirects during API calls
      
      // Set a flag that components can check
      localStorage.setItem('auth_error', 'true');
      
      console.warn('Authentication error occurred');
    }
    return Promise.reject(error);
  }
);

export default instance;
