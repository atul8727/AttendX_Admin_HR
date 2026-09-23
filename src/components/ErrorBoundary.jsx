import { Component } from 'react'
import Button from './ui/Button.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  // Jab bhi child tree me error aaye, React ye method call karta hai
  // taaki hum state update karke fallback UI dikha sakein.
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  // Yahan error ko log karte hain (console / monitoring service jaise Sentry).
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-app-bg px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-xl font-semibold text-app-text">
              Kuch galat ho gaya
            </h1>
            <p className="mb-6 text-sm text-app-text/70">
              Is page ko load karte waqt error aayi. Dashboard par wapas jaane
              ki koshish karo.
            </p>
            <Button onClick={this.handleReset}>Dashboard par jaao</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary