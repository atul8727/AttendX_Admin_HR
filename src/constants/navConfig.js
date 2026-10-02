import {
  FiActivity,
  FiCalendar,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiHome,
  FiMapPin,
  FiUsers,
  FiMonitor,
  FiShieldOff
} from 'react-icons/fi'

// labelKey = translation key (locales/*/nav.json). Text yahan mat likho.
//
// Active-state rules (lib/navActive.js):
//   path     -> link ka destination
//   end      -> true ho to sirf exact URL par active (prefix match nahi)
//   activeOn -> in URLs par bhi item active dikhe (default: [path]).
//               end:true ho to exact match, warna prefix match.
export const navGroups = [
  {
    labelKey: 'nav:groups.core',
    items: [
      { labelKey: 'nav:items.dashboard', path: '/', icon: FiHome, end: true },
      { labelKey: 'nav:items.employees', path: '/employees', icon: FiUsers },
      { labelKey: 'nav:items.wfh', path: '/wfh', icon: FiMonitor },
      { labelKey: 'nav:items.offices', path: '/offices', icon: FiMapPin },
      { labelKey: 'nav:items.devices', path: '/devices', icon: FiCpu }
    ]
  },
  {
    labelKey: 'nav:groups.operations',
    items: [
      // /leave/requests, /leave/types, /leave/balances — teeno par "Leave" active rahe
      { labelKey: 'nav:items.leave', path: '/leave/requests', icon: FiCalendar, activeOn: ['/leave'] },
      { labelKey: 'nav:items.holidays', path: '/holidays', icon: FiClipboard },
      // end:true — warna /attendance/suspicious-attempts par ye bhi highlight ho jata tha
      {
        labelKey: 'nav:items.attendanceOverview',
        path: '/attendance',
        icon: FiActivity,
        end: true,
        activeOn: ['/attendance', '/attendance/correction']
      },
      { labelKey: 'nav:items.attendanceReport', path: '/reports', icon: FiFileText },
      { labelKey: 'nav:items.suspiciousAttempts', path: '/attendance/suspicious-attempts', icon: FiShieldOff }
    ]
  }
]