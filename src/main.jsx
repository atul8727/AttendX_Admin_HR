import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { store } from './store/store.js'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: { duration: 3000 },
          error: { duration: 5000 },
          style: {
            background: 'rgb(var(--color-surface))',
            color: 'rgb(var(--color-text))',
            border: '1px solid rgb(var(--color-primary) / 0.15)',
            borderRadius: '0.75rem',
            boxShadow: '0 18px 45px rgba(31, 38, 135, 0.12)'
          }
        }}
      />
    </Provider>
  </React.StrictMode>
)
