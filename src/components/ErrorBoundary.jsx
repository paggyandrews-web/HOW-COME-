import { Component } from 'react'
import { logError } from '../utils/errorLogger'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logError(error, {
      context: 'react-error-boundary',
      componentStack: info?.componentStack || null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000000',
            color: '#f1f5f9',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888888', marginBottom: 20, maxWidth: 320 }}>
            We've logged this issue automatically. Please try reloading the app.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#1a9d8e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
