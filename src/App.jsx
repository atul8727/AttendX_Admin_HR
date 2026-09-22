import { ThemeProvider } from './context/ThemeContext.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppRoutes />
      </SidebarProvider>
    </ThemeProvider>
  )
}
