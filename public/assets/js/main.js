/**
 * Utility Functions
 */

/* eslint-disable no-unused-vars */

// Query selector shorthand
function q(selector) {
  return document.querySelector(selector)
}

// Create element shorthand
function ce(tagName) {
  return document.createElement(tagName)
}

// Format price with currency
function formatPrice(amount) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Make formatPrice globally available
window.formatPrice = formatPrice;

// Smooth scroll to element
function smoothScroll(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Add fade-in animation to elements
function addFadeInAnimation(elements) {
  const elementArray = Array.isArray(elements) ? elements : [elements]
  elementArray.forEach(el => {
    el.classList.add('fade-in')
  })
}
