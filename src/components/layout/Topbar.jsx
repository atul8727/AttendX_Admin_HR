import { useContext, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiSearch } from 'react-icons/fi'
import { SidebarContext } from '../../context/SidebarContext.jsx'
import { apiSlice, clearAuthSession, getAuthUser, getRefreshToken } from '../../store/apiSlice.js'
import { useLogoutAdminMutation } from '../../store/api/authApi.js'
import ThemeToggle from '../ui/ThemeToggle.jsx'
import Avatar from '../ui/Avatar.jsx'

export default function Topbar() {
  const { toggleMobileSidebar } = useContext(SidebarContext)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutAdmin, { isLoading: logoutLoading }] = useLogoutAdminMutation()
  const user = getAuthUser()
  const displayName = user?.name || 'Admin'
  const role = user?.role || 'ADMIN'
  const crumb = location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).join(' / ')

  useEffect(() => {
    function handleClick(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    try {
      await logoutAdmin(getRefreshToken()).unwrap()
    } catch (err) {
      void err
    } finally {
      clearAuthSession()
      dispatch(apiSlice.util.resetApiState())
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 min-w-0 flex-wrap items-center gap-2 border-b border-primary/10 bg-app-surface/90 px-3 py-3 backdrop-blur sm:flex-nowrap sm:gap-3 lg:px-6">
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
      {/* <div className="relative order-2 w-full min-w-0 sm:order-none sm:ml-auto sm:max-w-md sm:flex-1">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
        <input
          className="h-10 w-full rounded-lg border border-primary/10 bg-app-bg pl-9 pr-3 text-sm text-app-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Search employee, request, report..."
        />
      </div> */}

      {/* Bell + Theme + Profile — grouped and pushed to the right on every breakpoint */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning" aria-label="Notifications">
          <FiBell />
        </button>
        <ThemeToggle />
        <div className="relative block shrink-0" ref={profileRef}>
          <button
            className="flex min-h-10 items-center gap-2 rounded-lg bg-primary/5 p-1.5 transition hover:bg-primary/10 sm:pr-2"
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <Avatar name={displayName} size="sm" />
            <span className="hidden max-w-24 truncate text-sm font-bold text-app-text sm:block">{displayName}</span>
            <FiChevronDown className={`h-4 w-4 text-app-muted transition ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-primary/10 bg-app-surface p-2 shadow-soft ring-1 ring-white/40 dark:ring-white/5">
              <div className="border-b border-primary/10 px-3 py-2">
                <p className="truncate text-sm font-black text-app-text">{displayName}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{role}</p>
              </div>
              <button
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                <FiLogOut className="h-4 w-4" />
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}