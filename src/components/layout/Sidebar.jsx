import { NavLink } from 'react-router-dom'
import { FiChevronLeft, FiMenu, FiX } from 'react-icons/fi'
import { useContext } from 'react'
import { SidebarContext } from '../../context/SidebarContext.jsx'
import { navGroups } from '../../constants/navConfig.js'
import logo from '../../assets/logo.svg'

export default function Sidebar() {
  const { collapsed, mobileOpen, toggleSidebar, toggleMobileSidebar, closeMobileSidebar } = useContext(SidebarContext)
  const width = collapsed ? 'lg:w-20' : 'lg:w-72'

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={closeMobileSidebar}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2rem))] -translate-x-full flex-col bg-[#023859] text-white shadow-soft transition lg:translate-x-0 ${width} ${mobileOpen ? 'translate-x-0' : ''}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AttendX" className="h-10 w-10 rounded-lg" />
            <span className={`text-xl font-black ${collapsed ? 'lg:hidden' : ''}`}>AttendX Admin</span>
          </div>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 lg:hidden"
            onClick={toggleMobileSidebar}
            aria-label="Close sidebar"
          >
            <FiX />
          </button>
          <button
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 lg:grid"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            {collapsed ? <FiMenu /> : <FiChevronLeft />}
          </button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p
                className={`px-3 pb-2 text-xs font-bold uppercase tracking-wide text-white/60 ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `flex min-h-11 items-center gap-3 rounded-lg px-3 font-semibold transition ${
                          isActive ? 'bg-white text-primary' : 'text-white/85 hover:bg-white/15 hover:text-white'
                        } ${collapsed ? 'justify-between lg:justify-center' : 'justify-between'}`
                      }
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`rounded-full bg-warning px-2 py-0.5 text-xs text-white ${
                            collapsed ? 'lg:hidden' : ''
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
