/**
 * Checkout Module - Robust Implementation
 * Handles order submission and checkout display
 */

(function () {
  'use strict';

  // --- Checkout Pagination State ---
  let checkoutSummaryState = {
    currentPage: 1,
    itemsPerPage: 4,
    totalItems: 0
  };

  // --- Utility Functions ---

  // Get emoji for menu item
  function getItemEmoji(name) {
    const emojiMap = {
      'tom yum': '🍲',
      'pad thai': '🍜',
      'green curry': '🍛',
      'mango sticky rice': '🥭',
      'spring roll': '🌯',
      'papaya salad': '🥗',
      'som tam': '🥗',
      'thai iced tea': '🧋',
      'coconut': '🥥',
      'chicken': '🍗',
      'beef': '🥩',
      'pork': '🐖',
      'shrimp': '🍤',
      'fish': '🐟',
      'rice': '🍚',
      'noodle': '🍜',
      'soup': '🥣',
      'salad': '🥗',
      'dessert': '🍧',
      'drink': '🥤',
      'beer': '🍺',
      'wine': '🍷',
      'cocktail': '🍹',
      'massaman': '🍛',
      'pad see ew': '🍜',
      'curry': '🍲',
      'pad': '🍤',
      'tom': '🥣'
    };

    name = name.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (name.includes(key)) {
        return emoji;
      }
    }
    return '🍽️'; // Default emoji
  }

  // Format price
  function formatPrice(amount) {
    if (typeof window.formatPrice === 'function') {
      return window.formatPrice(amount);
    }
    try {
      return new Intl.NumberFormat('ms-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      return 'RM' + parseFloat(amount).toFixed(2);
    }
  }
  function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status show ${type}`;
    statusEl.style.display = 'block';

    // Auto-hide success/error messages
    if (type !== 'loading') {
      setTimeout(() => {
        statusEl.style.display = 'none';
        statusEl.className = 'status';
        statusEl.textContent = '';
      }, 5000);
    }
  }

  // Show/Clear Field Errors
  function showFieldError(input, message) {
    input.classList.add('error');
    const fieldGroup = input.closest('.form-group');
    if (fieldGroup) {
      let errorMsg = fieldGroup.querySelector('.error-msg');
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-msg';
        fieldGroup.appendChild(errorMsg);
      }
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
    }
  }

  function clearFieldError(input) {
    input.classList.remove('error');
    const fieldGroup = input.closest('.form-group');
    if (fieldGroup) {
      const errorMsg = fieldGroup.querySelector('.error-msg');
      if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
      }
    }
  }

  // --- Main Logic ---

  function updateSummary() {
    if (!window.cart) return;

    const subtotal = window.cart.getTotal();

    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    const deliveryMethod = deliveryRadio ? deliveryRadio.value : 'delivery';
    const deliveryFee = deliveryMethod === 'delivery' ? 5 : 0;
    const total = subtotal + deliveryFee;

    const subtotalEl = document.getElementById('subtotal');
    const deliveryEl = document.getElementById('deliveryFee');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (deliveryEl) deliveryEl.textContent = deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free';
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  function renderCheckoutItems() {
    console.log('[Checkout] Rendering items...');
    const container = document.getElementById('checkoutOrderItems');
    if (!container) return;

    // Double check cart availability
    if (!window.cart) {
      container.innerHTML = '<p class="error-message">Cart system not ready.</p>';
      return;
    }

    if (window.cart.isEmpty()) {
      container.innerHTML = `
        <div class="empty-order">
          <p>Your cart is empty.</p>
          <a href="/menu.html" class="btn" style="margin-top: 10px;">Browse Menu</a>
        </div>
      `;
      // Hide form if empty
      const formDiv = document.querySelector('.cart-summary');
      if (formDiv) formDiv.style.opacity = '0.5';
      updateCheckoutPagination();
      return;
    }

    const items = window.cart.getItems();
    checkoutSummaryState.totalItems = items.length;

    // Calculate pagination
    const start = (checkoutSummaryState.currentPage - 1) * checkoutSummaryState.itemsPerPage;
    const end = start + checkoutSummaryState.itemsPerPage;
    const pageItems = items.slice(start, end);

    container.innerHTML = pageItems.map(item => {
      const emoji = getItemEmoji(item.name);
      const fallbackClass = !item.image ? 'fallback-emoji' : '';

      return `
        <div class="checkout-item">
          <div class="checkout-item-image ${fallbackClass}">
            ${item.image ? `<img src="/${item.image}" alt="${item.name}" onerror="this.parentElement.classList.add('fallback-emoji'); this.style.display='none';">` : ''}
            <div class="item-emoji" style="display: ${item.image ? 'none' : 'flex'}; align-items: center; justify-content: center;">${emoji}</div>
          </div>
          <div class="checkout-item-details">
            <strong>${item.name}</strong>
            <small>Quantity: <span style="font-weight: bold; color: #d4af37;">${item.quantity}</span></small>
          </div>
          <div class="checkout-item-price">
            ${formatPrice(item.price * item.quantity)}
          </div>
        </div>
      `;
    }).join('');

    // Update item count badge
    const badge = document.getElementById('summaryItemCount');
    if (badge) {
      badge.textContent = `${checkoutSummaryState.totalItems} ${checkoutSummaryState.totalItems === 1 ? 'Item' : 'Items'}`;
    }

    updateSummary();
    updateCheckoutPagination();
  }

  // Update checkout summary pagination
  function updateCheckoutPagination() {
    const totalPages = Math.ceil(checkoutSummaryState.totalItems / checkoutSummaryState.itemsPerPage);
    const paginationDiv = document.getElementById('checkoutSummaryPagination');

    if (!paginationDiv) return;

    if (totalPages > 1) {
      paginationDiv.style.display = 'flex';

      // Update page info
      const pageInfo = document.getElementById('summaryPageInfo');
      if (pageInfo) {
        const start = (checkoutSummaryState.currentPage - 1) * checkoutSummaryState.itemsPerPage + 1;
        const end = Math.min(start + checkoutSummaryState.itemsPerPage - 1, checkoutSummaryState.totalItems);
        pageInfo.textContent = `Showing ${start}-${end} of ${checkoutSummaryState.totalItems} items`;
      }

      // Update button states
      const prevBtn = document.getElementById('summaryPrevPage');
      const nextBtn = document.getElementById('summaryNextPage');
      if (prevBtn) prevBtn.disabled = checkoutSummaryState.currentPage === 1;
      if (nextBtn) nextBtn.disabled = checkoutSummaryState.currentPage === totalPages;
    } else {
      paginationDiv.style.display = 'none';
    }
  }

  // Navigate checkout summary pages
  function goToCheckoutPage(page) {
    checkoutSummaryState.currentPage = page;
    renderCheckoutItems();
  }

  function validateCheckoutForm(form) {
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
      // Skip validating address if pickup is selected
      if (input.id === 'checkout-address') {
        const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
        if (deliveryRadio && deliveryRadio.value === 'pickup') {
          clearFieldError(input);
          return;
        }
      }

      clearFieldError(input);
      const value = input.value.trim();

      if (!value) {
        showFieldError(input, 'This field is required');
        isValid = false;
        return;
      }

      if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          showFieldError(input, 'Please enter a valid email address');
          isValid = false;
        }
      } else if (input.type === 'tel') {
        const phoneRegex = /^[\d\s\-()+]{8,}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          showFieldError(input, 'Please enter a valid phone number');
          isValid = false;
        }
      }
    });

    return isValid;
  }

  async function submitOrder(ev) {
    ev.preventDefault();
    const form = ev.target;

    if (!window.cart || window.cart.isEmpty()) {
      showStatus('Cart is empty. Please add items first.', 'error');
      return;
    }

    if (!validateCheckoutForm(form)) {
      showStatus('Please check the form fields', 'error');
      return;
    }

    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    const deliveryMethod = deliveryRadio ? deliveryRadio.value : 'delivery';
    const subtotal = window.cart.getTotal();
    const deliveryFee = deliveryMethod === 'delivery' ? 5 : 0;

    const items = window.cart.getItems();

    const payload = {
      name: document.getElementById('checkout-name').value.trim(),
      email: document.getElementById('checkout-email').value.trim(),
      phone: document.getElementById('checkout-phone').value.trim(),
      address: deliveryMethod === 'delivery' ? document.getElementById('checkout-address').value.trim() : '',
      deliveryMethod,
      items: items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();

        // Save order locally for tracking
        try {
          const orders = JSON.parse(localStorage.getItem('miniThai_orders') || '[]');
          orders.push({
            ...payload,
            orderId: result.orderId,
            createdAt: new Date().toISOString(),
            status: 'pending'
          });
          localStorage.setItem('miniThai_orders', JSON.stringify(orders));
        } catch (e) {
          console.error('Error saving locally:', e);
        }

        showStatus('Order placed successfully! Redirecting...', 'success');
        window.cart.clear(); // Use global cart instance
        form.reset();

        setTimeout(() => {
          window.location.href = `/orders.html?email=${encodeURIComponent(payload.email)}`;
        }, 2000);

      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showStatus('Failed to place order. Please try again.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('Network error:', error);
      showStatus('Network error. Please check your connection.', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  // --- Initialization ---

  function init() {
    console.log('[Checkout] Initializing...');

    // Robust check for window.cart
    const checkCartInterval = setInterval(() => {
      if (window.cart) {
        clearInterval(checkCartInterval);
        console.log('[Checkout] Cart found, initializing UI');

        renderCheckoutItems();

        // Setup Form
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
          checkoutForm.addEventListener('submit', submitOrder);
        }

        // Setup Delivery Toggle
        const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
        deliveryRadios.forEach(radio => {
          radio.addEventListener('change', () => {
            const addressField = document.getElementById('deliveryAddressField');
            const addressInput = document.getElementById('checkout-address');

            if (radio.value === 'delivery') {
              if (addressField) addressField.style.display = 'block';
              if (addressInput) addressInput.required = true;
            } else {
              if (addressField) addressField.style.display = 'none';
              if (addressInput) addressInput.required = false;
            }
            updateSummary();
          });
        });

        // Validation Listeners
        document.querySelectorAll('input, textarea').forEach(field => {
          field.addEventListener('input', () => clearFieldError(field));
        });

        // Setup Pagination Controls
        const prevBtn = document.getElementById('summaryPrevPage');
        const nextBtn = document.getElementById('summaryNextPage');

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            if (checkoutSummaryState.currentPage > 1) {
              goToCheckoutPage(checkoutSummaryState.currentPage - 1);
            }
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(checkoutSummaryState.totalItems / checkoutSummaryState.itemsPerPage);
            if (checkoutSummaryState.currentPage < totalPages) {
              goToCheckoutPage(checkoutSummaryState.currentPage + 1);
            }
          });
        }

        // Subscribe to cart changes to re-render items
        if (window.cart && typeof window.cart.subscribe === 'function') {
          window.cart.subscribe(() => {
            checkoutSummaryState.currentPage = 1; // Reset to first page when cart changes
            renderCheckoutItems();
          });
        }

      } else {
        console.log('[Checkout] Waiting for window.cart...');
      }
    }, 100); // Check every 100ms

    // Timeout after 5 seconds to avoid infinite loop
    setTimeout(() => {
      clearInterval(checkCartInterval);
      if (!window.cart) {
        console.error('[Checkout] global cart object never loaded.');
        const container = document.getElementById('checkoutOrderItems');
        if (container) container.innerHTML = '<p class="error-message">System Error: Cart failed to load. Please refresh.</p>';
      }
    }, 5000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
