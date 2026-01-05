/**
 * Page Transition Module
 * Handles smooth transitions between pages
 */

// Add page transition effect when clicking navigation links
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a[href]')

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Don't apply transition for current page
      if (link.href === window.location.href) {
        e.preventDefault()
        return
      }

      // Apply fade-out effect before navigation
      const main = document.querySelector('main')
      if (main) {
        main.style.animation = 'fadeOut 0.3s ease-out'
        main.style.animationFillMode = 'forwards'
      }

      // Allow the animation to play before navigation
      // (Note: page will reload naturally with default behavior)
    })
  })
})

// Add fade-out animation to CSS dynamically
const style = document.createElement('style')
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`
document.head.appendChild(style)

// Highlight current page in navigation
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a[href]')
  const currentPath = window.location.pathname

  navLinks.forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page')
      link.style.color = 'var(--accent)'
      link.style.fontWeight = '600'
    }
  })
})
