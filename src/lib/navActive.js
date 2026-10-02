// Sirf ek hi item active hona chahiye. NavLink ka default prefix-match
// (/attendance -> /attendance/suspicious-attempts) dono ko highlight kar deta tha,
// isliye matching yahan explicitly ki hai.
export function isNavItemActive(item, pathname) {
  const current = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const bases = item.activeOn ?? [item.path]
  return bases.some((base) => {
    if (item.end || base === '/') return current === base
    return current === base || current.startsWith(`${base}/`)
  })
}