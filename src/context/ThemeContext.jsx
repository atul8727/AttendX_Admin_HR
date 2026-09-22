import { createContext, useEffect, useMemo, useReducer } from 'react'

export const ThemeContext = createContext(null)

function reducer(state, action) {
  if (action.type === 'toggle') return { theme: state.theme === 'dark' ? 'light' : 'dark' }
  if (action.type === 'set') return { theme: action.theme }
  return state
}

export function ThemeProvider({ children }) {
  const initialTheme = localStorage.getItem('attendx-theme') || 'light'
  const [state, dispatch] = useReducer(reducer, { theme: initialTheme })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    localStorage.setItem('attendx-theme', state.theme)
  }, [state.theme])

  const value = useMemo(
    () => ({ theme: state.theme, toggleTheme: () => dispatch({ type: 'toggle' }) }),
    [state.theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
