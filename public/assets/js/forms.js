/**
 * Form Validation and Submission Module
 */

// Email validation regex
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Phone validation - flexible format
function validatePhone(phone) {
  return /^[\d\s\-()+]{10,}$/.test(phone.replace(/\s/g, ''))
}

// Show status message with styling
function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status')
  if (!statusEl) return

  statusEl.textContent = message
  statusEl.className = `status show ${type}`
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusEl.className = 'status'
      statusEl.textContent = ''
    }, 5000)
  }
}

// Clear field errors
function clearFieldError(input) {
  input.classList.remove('error')
  const errorMsg = input.parentElement.querySelector('.error-msg')
  if (errorMsg) {
    errorMsg.textContent = ''
    errorMsg.style.display = 'none'
  }
}

// Show field error
function showFieldError(input, message) {
  input.classList.add('error')
  const errorMsg = input.parentElement.querySelector('.error-msg')
  if (errorMsg) {
    errorMsg.textContent = message
    errorMsg.style.display = 'block'
  }
}

// Validate form inputs
function validateFormInputs(form) {
  const inputs = form.querySelectorAll('[required]')
  let isValid = true

  inputs.forEach(input => {
    clearFieldError(input)
    const value = input.value.trim()

    // Check if empty
    if (!value) {
      showFieldError(input, 'This field is required')
      isValid = false
      return
    }

    // Type-specific validation
    if (input.type === 'email') {
      if (!validateEmail(value)) {
        showFieldError(input, 'Please enter a valid email address')
        isValid = false
      }
    } else if (input.type === 'tel') {
      if (!validatePhone(value)) {
        showFieldError(input, 'Please enter a valid phone number')
        isValid = false
      }
    } else if (input.type === 'date') {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        showFieldError(input, 'Please select a future date')
        isValid = false
      }
    } else if (input.type === 'number') {
      const num = parseInt(value)
      if (num < input.min || (input.max && num > input.max)) {
        showFieldError(input, `Please enter a number between ${input.min} and ${input.max}`)
        isValid = false
      }
    }
  })

  return isValid
}

// Submit contact form
async function submitContact(ev) {
  ev.preventDefault()
  const form = ev.target

  if (!validateFormInputs(form)) {
    showStatus('Please check the form fields', 'error')
    return
  }

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim()
  }

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      showStatus('✓ Message sent successfully! We\'ll be in touch soon.', 'success')
      form.reset()
    } else {
      showStatus('Failed to send message. Please try again later.', 'error')
    }
  } catch (error) {
    console.error('Contact form error:', error)
    showStatus('Network error. Please check your connection.', 'error')
  }
}

// Submit reservation form
async function submitReservation(ev) {
  ev.preventDefault()
  const form = ev.target

  if (!validateFormInputs(form)) {
    showStatus('Please check the form fields', 'error')
    return
  }

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    date: form.date.value,
    time: form.time.value,
    partySize: parseInt(form.partySize.value)
  }

  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      showStatus('✓ Reservation submitted successfully! Check your email for confirmation.', 'success')
      form.reset()
    } else {
      showStatus('Failed to make reservation. Please try again later.', 'error')
    }
  } catch (error) {
    console.error('Reservation form error:', error)
    showStatus('Network error. Please check your connection.', 'error')
  }
}

// Initialize form handlers
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm')
    const reservationForm = document.getElementById('reservationForm')

    if (contactForm) {
      contactForm.addEventListener('submit', submitContact)
      
      // Clear errors on input
      contactForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
          clearFieldError(input)
        })
      })
    }

    if (reservationForm) {
      reservationForm.addEventListener('submit', submitReservation)
      
      // Clear errors on input
      reservationForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
          clearFieldError(input)
        })
      })
    }
  })
}

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { validateEmail, validatePhone, validateFormInputs }
}
