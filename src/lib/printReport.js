
export function printReport(title) {
  const previousTitle = document.title
  if (title) document.title = title

  const restore = () => {
    document.title = previousTitle
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
}