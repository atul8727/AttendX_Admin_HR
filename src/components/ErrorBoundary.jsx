import { Component } from 'react'
import { withTranslation } from 'react-i18next'
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
    const { t } = this.props

    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-app-bg px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-xl font-semibold text-app-text">
              {t('errors:boundaryTitle')}
            </h1>

            <p className="mb-6 text-sm text-app-text/70">
              {t('errors:boundaryBody')}
            </p>

            <Button onClick={this.handleReset}>
              {t('errors:goToDashboard')}
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Class component me hook nahi chalta -> withTranslation HOC (language badalne par re-render hota hai)
const TranslatedErrorBoundary = withTranslation()(ErrorBoundary)
export default TranslatedErrorBoundary