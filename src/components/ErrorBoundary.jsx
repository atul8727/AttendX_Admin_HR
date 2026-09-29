import { Component } from 'react'
import Button from './ui/Button.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
    }
  }

  // React calls this method when an error occurs in the child component tree.
  // It updates the state so the fallback UI can be displayed.
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })

    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-app-bg px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-xl font-semibold text-app-text">
              Something went wrong
            </h1>

            <p className="mb-6 text-sm text-app-text/70">
              There was an error while loading this page. Please try going
              back to the dashboard.
            </p>

            <Button onClick={this.handleReset}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
