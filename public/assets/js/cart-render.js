/**
 * Enhanced Cart Rendering Module
 * Handles rendering of cart items with pagination in the UI
 */

// Cart pagination state
let cartState = {
  currentPage: 1,
  itemsPerPage: 4, // Fixed to 4 items per page
  allItems: [],
  filteredItems: [],
  searchTerm: ''
}

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

// Local format price function in case global isn't available
function localFormatPrice(amount) {
  if (typeof formatPrice !== 'undefined') {
    return formatPrice(amount);
  }
  return 'RM' + parseFloat(amount).toFixed(2);
}

// Apply search filter to cart items
function applyCartFilters() {
  cartState.allItems = cart.getItems();

  if (cartState.searchTerm) {
    cartState.filteredItems = cartState.allItems.filter(item =>
      item.name.toLowerCase().includes(cartState.searchTerm.toLowerCase())
    );
  } else {
    cartState.filteredItems = [...cartState.allItems];
  }

  // Reset to first page when filters change
  cartState.currentPage = 1;
}

// Render cart items with pagination
function renderCartItems() {
  const cartItemsContainer = document.querySelector('.cart-items');
  if (!cartItemsContainer) return;

  // Update cart state
  applyCartFilters();

  if (cartState.filteredItems.length === 0) {
    if (cartState.allItems.length === 0) {
      // Cart is completely empty
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <a href="/menu.html" class="btn" style="margin-top: 1rem;">Browse Menu</a>
        </div>
      `;
    } else {
      // No items match search
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">🔍</div>
          <h2>No items found</h2>
          <p>No items match your search term "${cartState.searchTerm}".</p>
          <button onclick="clearCartSearch()" class="btn" style="margin-top: 1rem;">Clear Search</button>
        </div>
      `;
    }
    updateCartPagination();
    return;
  }

  // Calculate pagination
  const start = (cartState.currentPage - 1) * cartState.itemsPerPage;
  const end = start + cartState.itemsPerPage;
  const pageItems = cartState.filteredItems.slice(start, end);

  cartItemsContainer.innerHTML = pageItems.map(item => {
    const emoji = getItemEmoji(item.name);
    const fallbackClass = !item.image ? 'fallback-emoji' : '';

    return `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-image ${fallbackClass}">
          ${item.image ? `<img src="/${item.image}" alt="${item.name}" onerror="this.parentElement.classList.add('fallback-emoji')">` : ''}
          <div class="item-emoji">${emoji}</div>
        </div>
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <div class="cart-item-price">${localFormatPrice(item.price)}</div>
          <div class="quantity-control">
            <button class="decrease-quantity" data-id="${item.id}" title="Decrease quantity">-</button>
            <input type="number" value="${item.quantity}" min="1" max="99" data-id="${item.id}" title="Quantity">
            <button class="increase-quantity" data-id="${item.id}" title="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <div class="item-subtotal">${localFormatPrice(item.price * item.quantity)}</div>
          <button class="remove-btn" data-id="${item.id}" title="Remove item">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners for the current page items
  attachCartItemListeners();

  // Update pagination controls
  updateCartPagination();
}

// Attach event listeners to cart item controls
function attachCartItemListeners() {
  // Decrease quantity buttons
  document.querySelectorAll('.decrease-quantity').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.id;
      const item = cartState.allItems.find(i => i.id === itemId);
      if (item && item.quantity > 1) {
        cart.updateQuantity(itemId, item.quantity - 1);
      } else if (item && item.quantity === 1) {
        // When quantity is 1 and user clicks decrease, ask for confirmation to remove
        if (confirm(`Remove ${item.name} from cart?`)) {
          cart.removeItem(itemId);
        }
      }
    });
  });

  // Increase quantity buttons
  document.querySelectorAll('.increase-quantity').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.id;
      const item = cartState.allItems.find(i => i.id === itemId);
      if (item && item.quantity < 99) {
        cart.updateQuantity(itemId, item.quantity + 1);
      }
    });
  });

  // Remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.id;
      const item = cartState.allItems.find(i => i.id === itemId);
      if (item && confirm(`Remove ${item.name} from cart?`)) {
        cart.removeItem(itemId);
      }
    });
  });

  // Quantity input fields
  document.querySelectorAll('.quantity-control input').forEach(input => {
    input.addEventListener('change', (e) => {
      const quantity = parseInt(e.target.value, 10) || 1;
      const validQuantity = Math.max(1, Math.min(99, quantity));
      e.target.value = validQuantity;
      cart.updateQuantity(e.target.dataset.id, validQuantity);
    });

    // Prevent invalid input
    input.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    });
  });
}

// Update cart pagination controls (simplified)
function updateCartPagination() {
  const totalPages = Math.ceil(cartState.filteredItems.length / cartState.itemsPerPage);
  const paginationDiv = document.getElementById('cartPagination');

  if (!paginationDiv) return;

  if (totalPages > 1) {
    paginationDiv.style.display = 'flex';

    // Update results info
    const resultsInfo = document.getElementById('cartResultsInfo');
    if (resultsInfo) {
      const start = (cartState.currentPage - 1) * cartState.itemsPerPage + 1;
      const end = Math.min(start + cartState.itemsPerPage - 1, cartState.filteredItems.length);
      resultsInfo.textContent = `Showing ${start}-${end} of ${cartState.filteredItems.length} items`;
    }

    // Update page numbers
    const pageNumbers = document.getElementById('cartPageNumbers');
    if (pageNumbers) {
      pageNumbers.innerHTML = generateCartPageNumbers(cartState.currentPage, totalPages);
    }

    // Update button states
    updateCartPaginationButtons(totalPages);
  } else {
    paginationDiv.style.display = 'none';
  }
}

// Generate page numbers for cart pagination (simplified)
function generateCartPageNumbers(current, total) {
  const pages = [];
  const showPages = 5;

  if (total <= showPages) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 3; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    }
  }

  return pages.map(page => {
    if (page === '...') {
      return `<span class="page-number ellipsis">...</span>`;
    }
    const isActive = page === current ? 'active' : '';
    return `<button class="page-number ${isActive}" onclick="goToCartPage(${page})">${page}</button>`;
  }).join('');
}

// Update cart pagination button states (simplified)
function updateCartPaginationButtons(totalPages) {
  const prevBtn = document.getElementById('cartPrevPage');
  const nextBtn = document.getElementById('cartNextPage');

  if (prevBtn) prevBtn.disabled = cartState.currentPage === 1;
  if (nextBtn) nextBtn.disabled = cartState.currentPage === totalPages;
}

// Navigate to specific cart page
function goToCartPage(page) {
  cartState.currentPage = page;
  renderCartItems();
  scrollToCartTop();
}

// Clear cart search
function clearCartSearch() {
  const searchInput = document.getElementById('cartSearch');
  if (searchInput) {
    searchInput.value = '';
    cartState.searchTerm = '';
    renderCartItems();
  }
}

// Scroll to cart top
function scrollToCartTop() {
  const cartSection = document.querySelector('.cart-section');
  if (cartSection) {
    cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Initialize cart pagination controls (simplified)
function initializeCartPagination() {
  // Search functionality
  const searchInput = document.getElementById('cartSearch');
  const clearSearchBtn = document.getElementById('clearCartSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      cartState.searchTerm = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
      }
      renderCartItems();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        cartState.searchTerm = '';
        clearSearchBtn.style.display = 'none';
        renderCartItems();
      }
    });
  }

  // Pagination buttons (simplified)
  const prevBtn = document.getElementById('cartPrevPage');
  const nextBtn = document.getElementById('cartNextPage');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (cartState.currentPage > 1) {
        cartState.currentPage--;
        renderCartItems();
        scrollToCartTop();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(cartState.filteredItems.length / cartState.itemsPerPage);
      if (cartState.currentPage < totalPages) {
        cartState.currentPage++;
        renderCartItems();
        scrollToCartTop();
      }
    });
  }
}

// Update cart summary
function updateCartSummary() {
  const subtotal = cart.getTotal();
  const total = subtotal;

  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');

  if (subtotalEl) subtotalEl.textContent = localFormatPrice(subtotal);
  if (totalEl) totalEl.textContent = localFormatPrice(total);
}

// Initialize cart page
function initCartPage() {
  // Initialize pagination controls
  initializeCartPagination();

  // Initial render
  renderCartItems();
  updateCartSummary();

  // Subscribe to cart changes
  cart.subscribe(() => {
    renderCartItems();
    updateCartSummary();
  });
}

// Clear entire cart with confirmation
function clearEntireCart() {
  if (cartState.allItems.length === 0) {
    alert('Your cart is already empty.');
    return;
  }

  // Create confirmation dialog
  const confirmed = confirm(
    `Are you sure you want to clear your entire cart? This will remove ${cartState.allItems.length} item(s) and cannot be undone.`
  );

  if (confirmed) {
    // Clear the cart
    if (typeof cart !== 'undefined' && typeof cart.clear === 'function') {
      cart.clear();
      console.log('[Cart] Cart cleared');
      
      // Update the display
      initCartPage();
      
      // Show success message
      const status = document.getElementById('status');
      if (status) {
        status.innerHTML = `
          <i class="fas fa-check-circle"></i>
          Cart cleared successfully!
        `;
        status.className = 'status show success';
        setTimeout(() => {
          status.className = 'status';
        }, 3000);
      }
    } else {
      console.warn('[Cart] Cart.clear() method not available');
      alert('Unable to clear cart. Please try again.');
    }
  }
}

// Initialize when DOM is loaded
function initializeCart() {
  // Make sure cart is available
  if (typeof cart === 'undefined') {
    console.error('Cart is not available. Make sure cart.js is loaded before cart-render.js');
    return;
  }

  // Initialize the page
  initCartPage();

  // Setup clear cart button
  const clearCartBtn = document.getElementById('clearCartBtn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearEntireCart);
    console.log('[Cart] Clear cart button initialized');
  }

  // Update cart badge
  if (typeof updateCartBadge === 'function') {
    updateCartBadge();
  }
}

// Check if cart is already defined
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCart);
} else {
  // If cart is not loaded yet, wait for it
  if (typeof cart === 'undefined') {
    const checkCart = setInterval(() => {
      if (typeof cart !== 'undefined') {
        clearInterval(checkCart);
        initializeCart();
      }
    }, 100);
  } else {
    initializeCart();
  }
}

// Make functions globally available
window.goToCartPage = goToCartPage;
window.clearCartSearch = clearCartSearch;
window.clearEntireCart = clearEntireCart;
