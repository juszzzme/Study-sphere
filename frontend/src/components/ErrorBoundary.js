import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can customize this error UI as needed
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
          <div style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              color: '#cf1322',
              fontSize: '1.5rem',
              margin: '0 0 1rem 0'
            }}>Something went wrong</h1>
            
            <p style={{ color: '#333', marginBottom: '1.5rem' }}>
              The application encountered an unexpected error. Please try reloading the page.
            </p>
            
            <p style={{ 
              fontFamily: 'monospace', 
              background: '#fafafa', 
              padding: '1rem', 
              borderRadius: '4px',
              color: '#666',
              textAlign: 'left',
              fontSize: '0.85rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error && this.state.error.toString()}
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: '#1890ff',
                color: 'white',
                border: 'none',
                padding: '0.8rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                marginTop: '1rem'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
