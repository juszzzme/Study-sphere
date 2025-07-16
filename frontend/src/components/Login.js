import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  // mymind-inspired color palette
  const colors = {
    // Core colors
    deepNavy: '#1a2332',
    mutedGray: '#6b7280',
    pureWhite: '#ffffff',
    lightCream: '#fdf8f3',
    coral: '#ff6e40',

    // StudySphere brand colors
    darkBlue: '#1e3d59',
    cream: '#f5f0e1',
    yellow: '#ffc13b',
    richRed: '#d81e5b',

    // Gradients
    warmGradient: 'linear-gradient(135deg, #ff8a65 0%, #ffab91 50%, #fdf8f3 100%)',
    neutralGradient: 'linear-gradient(135deg, #fdf8f3 0%, #ffffff 100%)'
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: colors.neutralGradient,
      color: colors.deepNavy,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* mymind-style subtle background */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '10%',
        width: '200px',
        height: '200px',
        background: colors.warmGradient,
        borderRadius: '50%',
        opacity: 0.03,
        filter: 'blur(40px)'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: '250px',
        height: '250px',
        background: `linear-gradient(135deg, ${colors.deepNavy}10, ${colors.coral}10)`,
        borderRadius: '50%',
        opacity: 0.02,
        filter: 'blur(50px)'
      }}></div>

      {/* mymind-style centered card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '3rem',
        borderRadius: '16px',
        background: colors.pureWhite,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* mymind-style minimal header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: colors.deepNavy,
            marginBottom: '0.5rem',
            letterSpacing: '-0.5px',
            fontFamily: '"Inter", sans-serif'
          }}>
            Welcome back
          </div>
          <div style={{
            fontSize: '0.95rem',
            color: colors.mutedGray,
            fontWeight: '400'
          }}>
            Sign in to your StudySphere account
          </div>
        </div>
        
        {/* mymind-style error message */}
        {error && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            color: '#dc2626',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.1)'
          }}>
            {error}
          </div>
        )}

        {/* mymind-style form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: colors.deepNavy,
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: colors.pureWhite,
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                color: colors.deepNavy,
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.border = `1px solid ${colors.deepNavy}`;
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 50, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
              required
              placeholder="you@example.com"
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: colors.deepNavy,
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: colors.pureWhite,
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                color: colors.deepNavy,
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif'
              }}
              onFocus={(e) => {
                e.target.style.border = `1px solid ${colors.deepNavy}`;
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 50, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(0,0,0,0.1)';
                e.target.style.boxShadow = 'none';
              }}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: colors.deepNavy,
              color: colors.pureWhite,
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isLoading ? 0.7 : 1,
              fontFamily: '"Inter", sans-serif'
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.background = '#0f1419')}
            onMouseOut={(e) => !isLoading && (e.target.style.background = colors.deepNavy)}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* mymind-style footer links */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: '0.9rem',
            color: colors.mutedGray
          }}>
            Don't have an account? <Link to="/register" style={{
              color: colors.deepNavy,
              textDecoration: 'none',
              fontWeight: '500'
            }}>Get started</Link>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '1rem'
          }}>
            <Link to="/" style={{
              color: colors.mutedGray,
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '400'
            }}>
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
