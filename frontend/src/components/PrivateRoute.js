import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Check for token
    const token = localStorage.getItem('token');
    const authError = localStorage.getItem('auth_error');
    
    // Clear auth error flag if it exists
    if (authError) {
      localStorage.removeItem('auth_error');
    }
    
    if (!token || authError === 'true') {
      setIsAuthenticated(false);
      setIsLoading(false);
      if (authError === 'true') {
        setError('Your session has expired. Please log in again.');
      }
      return;
    }
    
    // If we have user data from context, use that for faster verification
    if (user) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // Otherwise check token validity
    const validateToken = async () => {
      try {
        // We consider just having a token to be valid
        // The actual API requests will validate it further
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation error:', error);
        setError('Authentication failed. Please log in again.');
        setIsAuthenticated(false);
        
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, [user]);
  
  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f0e1',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 110, 64, 0.3)',
          borderRadius: '50%',
          borderTopColor: '#ff6e40',
          animation: 'spin 1s linear infinite',
          marginBottom: '10px'
        }}></div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ fontSize: '16px', color: '#1e3d59' }}>
          Loading...
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f0e1',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
          <h2 style={{ color: '#d32f2f', marginBottom: '15px' }}>Authentication Error</h2>
          <p style={{ marginBottom: '20px', color: '#555' }}>{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              backgroundColor: '#ff6e40',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Authentication check
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
