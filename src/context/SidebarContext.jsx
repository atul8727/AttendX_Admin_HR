import { createContext, useMemo, useReducer } from 'react'

export const SidebarContext = createContext(null)

function reducer(state, action) {
  if (action.type === 'toggle') return { ...state, collapsed: !state.collapsed }
  if (action.type === 'mobile') return { ...state, mobileOpen: !state.mobileOpen }
  if (action.type === 'closeMobile') return { ...state, mobileOpen: false }
  return state
}

export function SidebarProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { collapsed: false, mobileOpen: false })
  const value = useMemo(
    () => ({
      ...state,
      toggleSidebar: () => dispatch({ type: 'toggle' }),
      toggleMobileSidebar: () => dispatch({ type: 'mobile' }),
      closeMobileSidebar: () => dispatch({ type: 'closeMobile' })
    }),
    [state]
  )
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}
