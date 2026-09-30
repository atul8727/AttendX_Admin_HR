import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

// Leave module ke teen pages (Requests / Types / Balances) ke beech switch karne ke liye
// tab-style navigation. Isse pehle sirf "/leave/requests" hi sidebar se reachable tha,
// isliye Leave Types aur Leave Balances pages UI me kahin dikhte nahi the (rasta hi nahi tha),
// jabki unke components + APIs pehle se hi bane hue the.
const LEAVE_NAV_ITEMS = [
  { labelKey: 'nav.requests', path: '/leave/requests' },
  { labelKey: 'nav.types', path: '/leave/types' },
  { labelKey: 'nav.balances', path: '/leave/balances' }
]

export default function LeaveSubNav() {
  const { t } = useTranslation('leave')
  return (
    <div className="hide-scrollbar flex max-w-full overflow-x-auto rounded-lg border border-primary/15 bg-app-bg p-1">
      {LEAVE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex min-h-10 shrink-0 items-center rounded-md px-4 text-sm font-bold transition ${
              isActive ? 'bg-primary text-white shadow-soft' : 'text-primary hover:bg-primary/10'
            }`
          }
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </div>
  )
}