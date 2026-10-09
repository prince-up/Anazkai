import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('[HideAI] 🚀 Application initializing at', new Date().toISOString());
console.log('[HideAI] Protocol:', window.location?.protocol);
console.log('[HideAI] UserAgent:', window.navigator?.userAgent);
console.log('[HideAI] Electron require available:', !!window.require);

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HideAI Fatal Error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0b0f19',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box',
          textAlign: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%'
          }}>
            <h2 style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              ⚠️ HideAI Encountered an Error
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '16px' }}>
              {this.state.error?.message || 'Unknown runtime error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload App
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#d1d5db',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🧹 Reset Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global window unhandled rejection catcher
window.addEventListener('unhandledrejection', (event) => {
  console.error('[HideAI Unhandled Promise Rejection]', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('[HideAI Window Error]', event.error || event.message);
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>,
  );
} else {
  console.error('[HideAI] Root element not found!');
}
