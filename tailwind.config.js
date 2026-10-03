/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        teal: 'rgb(var(--color-teal) / <alpha-value>)',
        app: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-muted) / <alpha-value>)'
        }
      },
           boxShadow: {
        soft: '0 18px 45px rgba(31, 38, 135, 0.12)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        ring: {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.7)', opacity: '0' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        ring: 'ring 3s ease-out infinite',
        'spin-slow': 'spin 18s linear infinite',
        'fade-up': 'fade-up 0.6s ease-out both'
      }
    }
  },
  plugins: []
}
