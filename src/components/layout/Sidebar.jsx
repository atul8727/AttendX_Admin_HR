import { Link, useLocation } from 'react-router-dom'
import { FiChevronLeft, FiMenu, FiX } from 'react-icons/fi'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { SidebarContext } from '../../context/SidebarContext.jsx'
import { navGroups } from '../../constants/navConfig.js'
import { isNavItemActive } from '../../lib/navActive.js'
import logo from '../../assets/logo.svg'

export default function Sidebar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { collapsed, mobileOpen, toggleSidebar, closeMobileSidebar } = useContext(SidebarContext)
  const width = collapsed ? 'lg:w-20' : 'lg:w-72'
  // translate-x-0 aur -translate-x-full ek saath lagane se CSS order par depend hota tha;
  // ab mobile par sirf ek class lagti hai, desktop par lg:translate-x-0.
  const mobileTranslate = mobileOpen ? 'translate-x-0' : '-translate-x-full'

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 print:hidden lg:hidden"
          onClick={closeMobileSidebar}
          aria-label={t('common:sidebar.closeNavigation')}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-1rem))] ${mobileTranslate} flex-col bg-[#023859] text-white shadow-soft transition print:hidden lg:translate-x-0 ${width}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AttendX" className="h-10 w-10 rounded-lg" />
            <span className={`text-xl font-black ${collapsed ? 'lg:hidden' : ''}`}>{t('common:sidebar.brand')}</span>
          </div>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 lg:hidden"
            onClick={closeMobileSidebar}
            aria-label={t('common:sidebar.close')}
          >
            <FiX />
          </button>
          <button
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 lg:grid"
            onClick={toggleSidebar}
            aria-label={t('common:sidebar.collapse')}
          >
            {collapsed ? <FiMenu /> : <FiChevronLeft />}
          </button>
        </div>
        <nav className="hide-scrollbar flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.labelKey}>
              <p
                className={`px-3 pb-2 text-xs font-bold uppercase tracking-wide text-white/60 ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                {t(group.labelKey)}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = isNavItemActive(item, pathname)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileSidebar}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 font-semibold transition ${
                        isActive ? 'bg-white text-primary' : 'text-white/85 hover:bg-white/15 hover:text-white'
                      } ${collapsed ? 'justify-between lg:justify-center' : 'justify-between'}`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{t(item.labelKey)}</span>
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
                    </Link>
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