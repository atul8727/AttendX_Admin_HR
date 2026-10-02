import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProvider } from '../../context/SidebarContext.jsx'
import Sidebar from './Sidebar.jsx'
import { isNavItemActive } from '../../lib/navActive.js'
import { navGroups } from '../../constants/navConfig.js'

const items = navGroups.flatMap((group) => group.items)
const activeLabels = (pathname) => items.filter((item) => isNavItemActive(item, pathname)).map((item) => item.path)

describe('sidebar active state', () => {
  test('suspicious attempts does not highlight attendance overrides', () => {
    expect(activeLabels('/attendance/suspicious-attempts')).toEqual(['/attendance/suspicious-attempts'])
  })

  test('attendance and correction highlight only attendance overrides', () => {
    expect(activeLabels('/attendance')).toEqual(['/attendance'])
    expect(activeLabels('/attendance/correction')).toEqual(['/attendance'])
  })

  test('leave stays active on all leave sub pages', () => {
    for (const page of ['/leave/requests', '/leave/types', '/leave/balances']) {
      expect(activeLabels(page)).toEqual(['/leave/requests'])
    }
  })

  test('dashboard is active only on root, nested employee routes keep employees active', () => {
    expect(activeLabels('/')).toEqual(['/'])
    expect(activeLabels('/employees/12')).toEqual(['/employees'])
  })

  test('exactly one link has aria-current in the rendered sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/attendance/suspicious-attempts']}>
        <SidebarProvider>
          <Sidebar />
        </SidebarProvider>
      </MemoryRouter>
    )
    const current = document.querySelectorAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '/attendance/suspicious-attempts')
    expect(screen.getAllByRole('link').length).toBe(items.length)
  })
})