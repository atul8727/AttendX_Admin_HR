import { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { FiBell, FiMenu, FiSearch } from 'react-icons/fi'
import { SidebarContext } from '../../context/SidebarContext.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'
import Avatar from '../ui/Avatar.jsx'

export default function Topbar() {
  const { toggleMobileSidebar } = useContext(SidebarContext)
  const location = useLocation()
  const crumb = location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).join(' / ')

  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-2 border-b border-primary/10 bg-app-surface/90 px-3 py-3 backdrop-blur sm:flex-nowrap sm:gap-3 lg:px-6">
      <button
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary lg:hidden"
        onClick={toggleMobileSidebar}
        aria-label="Open navigation"
      >
        <FiMenu />
      </button>
      <div className="hidden min-w-0 flex-col md:flex">
        <span className="text-xs font-bold uppercase tracking-wide text-app-muted">Admin / Overview</span>
        <span className="truncate text-sm font-semibold capitalize text-app-text">{crumb}</span>
      </div>
      <div className="relative order-2 w-full sm:order-none sm:ml-auto sm:max-w-md sm:flex-1">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
        <input
          className="h-10 w-full rounded-lg border border-primary/10 bg-app-bg pl-9 pr-3 text-sm text-app-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Search employee, request, report..."
        />
      </div>
      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning" aria-label="Notifications">
        <FiBell />
      </button>
      <ThemeToggle />
      <div className="hidden items-center gap-2 rounded-lg bg-primary/5 p-1.5 sm:flex">
        <Avatar name="Riya Kapoor" size="sm" />
        <span className="pr-2 text-sm font-bold text-app-text">Riya</span>
      </div>
    </header>
  )
}
