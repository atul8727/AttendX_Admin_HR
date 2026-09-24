import { useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarContext } from '../../context/SidebarContext.jsx'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function AdminLayout() {
  const { collapsed } = useContext(SidebarContext)
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-app-bg bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(13,148,136,0.10),transparent_30%)]">
      <Sidebar />
      <div className={`min-h-screen min-w-0 max-w-full transition-all ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <Topbar />
        <main className="min-w-0 max-w-full px-3 py-4 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
