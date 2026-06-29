export function escapeHtml(text) {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}
