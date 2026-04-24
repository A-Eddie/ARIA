import React from 'react';

/**
 * Error Boundary component for catching React errors
 * Prevents the entire app from crashing due to component errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // reportErrorToService(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--textMuted)', marginBottom: '2rem', maxWidth: '500px' }}>
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              width: '100%',
              maxWidth: '600px',
              textAlign: 'left',
              marginBottom: '2rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '0.5rem',
            }}>
              <summary style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                marginTop: '1rem',
                overflow: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text)',
              }}>
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={this.resetError}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for catching errors in async operations
 * Use with error callbacks in async functions
 */
export const useAsyncError = () => {
  const [, setError] = React.useState();

  return React.useCallback(
    (error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
};
