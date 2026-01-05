/**
 * Contact Form Handling
 * Handles form validation and submission for both contact and reservation forms
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize forms
    const contactForm = document.getElementById('contactForm');
    const reservationForm = document.getElementById('reservationForm');
    const statusElement = document.getElementById('status');

    // Set minimum date to today for reservation
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('res-date');
    if (dateInput) {
        dateInput.min = today;
        dateInput.value = today;
    }

    // Set default time to next hour
    const timeInput = document.getElementById('res-time');
    if (timeInput) {
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        timeInput.value = nextHour.toTimeString().substring(0, 5);
    }

    // Show status message
    function showStatus(message, type = 'success') {
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = `status ${type} show`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusElement.className = 'status';
            statusElement.textContent = '';
        }, 5000);
    }

    // Show field error
    function showError(input, message) {
        const field = input.closest('.field');
        if (!field) return;
        
        let errorElement = field.querySelector('.error-msg');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-msg';
            field.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        input.classList.add('error');
    }

    // Clear field error
    function clearError(input) {
        const field = input.closest('.field');
        if (!field) return;
        
        const errorElement = field.querySelector('.error-msg');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        
        input.classList.remove('error');
    }

    // Validate email format
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // Validate phone number (basic validation)
    function isValidPhone(phone) {
        const re = /^[\d\s\-+()]{8,}$/;
        return re.test(phone);
    }

    // Validate form fields
    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            clearError(field);
            const value = field.value.trim();
            
            if (!value) {
                showError(field, 'This field is required');
                isValid = false;
                return;
            }
            
            if (field.type === 'email' && !isValidEmail(value)) {
                showError(field, 'Please enter a valid email address');
                isValid = false;
            }
            
            if (field.id === 'res-phone' && !isValidPhone(value)) {
                showError(field, 'Please enter a valid phone number');
                isValid = false;
            }
            
            // Additional validation for reservation date
            if (field.type === 'date' && field.id === 'res-date') {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    showError(field, 'Please select a future date');
                    isValid = false;
                }
            }
            
            // Additional validation for party size
            if (field.name === 'partySize') {
                const partySize = parseInt(value, 10);
                if (isNaN(partySize) || partySize < 1 || partySize > 20) {
                    showError(field, 'Party size must be between 1 and 20');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    // Handle form submission
    async function handleSubmit(form, type) {
        if (!validateForm(form)) {
            showStatus('Please correct the errors in the form', 'error');
            return;
        }
        
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Sending...';
        
        try {
            const endpoint = type === 'contact' ? '/api/contact' : '/api/reservations';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData.entries()))
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }
            
            // Reset form on success
            form.reset();
            
            // Show success message
            const successMessage = type === 'contact' 
                ? 'Your message has been sent. We\'ll get back to you soon!'
                : 'Your reservation has been received. We will confirm shortly!';
                
            showStatus(successMessage, 'success');
            
        } catch (error) {
            console.error('Form submission error:', error);
            showStatus(error.message || 'An error occurred. Please try again later.', 'error');
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    // Add event listeners
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSubmit(contactForm, 'contact');
        });
        
        // Add input event listeners for real-time validation
        contactForm.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => clearError(input));
        });
    }
    
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSubmit(reservationForm, 'reservation');
        });
        
        // Add input event listeners for real-time validation
        reservationForm.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => clearError(input));
        });
    }
});
