/**
 * Content Loading Module
 * Handles dynamic content for staff sections
 */

/* global ce */

async function loadStaff() {
  try {
    const response = await fetch('/api/staff')
    const data = await response.json()
    const container = document.getElementById('staff')

    if (!container) return

    // Add section heading if on about page
    if (container.parentElement.id === 'about' || container.className.includes('grid')) {
      const heading = ce('h2')
      heading.textContent = 'Meet Our Team'
      heading.style.gridColumn = '1 / -1'
      heading.classList.add('mb-large')
      container.insertBefore(heading, container.firstChild)
    }

    data.team.forEach((member, index) => {
      const card = ce('div')
      card.className = 'card fade-in'
      card.style.animationDelay = `${index * 0.1}s`
      card.innerHTML = `
        <img src="/${member.photo}" alt="${member.name}" loading="lazy">
        <div class="content">
          <h3>${member.name}</h3>
          <p style="color: var(--accent); font-weight: 600; margin-bottom: 0.5rem;">${member.role}</p>
          <p>${member.bio_en}</p>
        </div>
      `
      container.appendChild(card)
    })
  } catch (error) {
    console.error('Error loading staff:', error)
  }
}

// Load content on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadStaff()
})
