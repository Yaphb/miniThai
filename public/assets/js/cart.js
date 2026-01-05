/**
 * Shopping Cart Module
 * Manages cart state, persistence, and operations
 */

class ShoppingCart {
  constructor() {
    this.storageKey = 'miniThai_cart'
    this.cart = this.loadCart()
    this.listeners = []
    this.badgeUpdateInterval = null
    this.initializeBadgeUpdater()
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading cart:', error)
      return []
    }
  }

  // Save cart to localStorage
  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cart))
      this.notifyListeners()
      this.updateCartBadge() // Always update badge when cart changes
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }

  // Initialize badge updater with polling fallback
  initializeBadgeUpdater() {
    // Update badge immediately
    this.updateCartBadge()
    
    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey) {
          this.cart = this.loadCart()
          this.updateCartBadge()
          this.notifyListeners()
        }
      })
    }
  }

  // Update cart badge - robust method that works across pages
  updateCartBadge() {
    const badge = document.getElementById('cart-count')
    if (badge) {
      const count = this.getCount()
      // Only update if the count has actually changed
      if (parseInt(badge.textContent) !== count) {
        badge.textContent = count
        badge.style.display = count > 0 ? 'inline-flex' : 'none'
        
        // Add animation for visual feedback only when count increases
        if (count > 0 && parseInt(badge.textContent) < count) {
          badge.classList.add('cart-badge-animate')
          setTimeout(() => {
            badge.classList.remove('cart-badge-animate')
          }, 300)
        }
      }
    }
  }

  // Subscribe to cart changes
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback)
      // Return unsubscribe function
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback)
      }
    }
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this)
      } catch (error) {
        console.error('Error in cart listener:', error)
      }
    })
  }

  // Get all items in cart
  getItems() {
    return [...this.cart]
  }

  // Get cart total
  getTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Get cart count (total quantity of all items)
  getCount() {
    return this.cart.reduce((total, item) => total + (item.quantity || 1), 0)
  }

  // Check if cart is empty
  isEmpty() {
    return this.cart.length === 0
  }

  // Add item to cart
  addItem(item) {
    if (!item.id || !item.name || !item.price) {
      console.error('Invalid item:', item)
      return false
    }

    // Check if item already exists
    const existingItem = this.cart.find(cartItem => 
      cartItem.id === item.id && 
      (!cartItem.image || cartItem.image === item.image)
    )

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1)
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || '',
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString()
      })
    }

    this.saveCart()
    console.log(`Added ${item.name} to cart. Total items: ${this.getCount()}`)
    return true
  }

  // Remove item from cart
  removeItem(itemId) {
    const index = this.cart.findIndex(item => item.id === itemId)
    if (index > -1) {
      const removedItem = this.cart[index]
      this.cart.splice(index, 1)
      this.saveCart()
      console.log(`Removed ${removedItem.name} from cart. Total items: ${this.getCount()}`)
      return true
    }
    return false
  }

  // Update item quantity
  updateQuantity(itemId, quantity) {
    const item = this.cart.find(cartItem => cartItem.id === itemId)
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(itemId)
      }
      const oldQuantity = item.quantity
      item.quantity = quantity
      this.saveCart()
      console.log(`Updated ${item.name} quantity from ${oldQuantity} to ${quantity}. Total items: ${this.getCount()}`)
      return true
    }
    return false
  }

  // Clear cart
  clear() {
    this.cart = []
    this.saveCart()
    console.log('Cart cleared')
    return true
  }

  // Cleanup method
  destroy() {
    if (this.badgeUpdateInterval) {
      clearInterval(this.badgeUpdateInterval)
    }
  }
}

// Global cart instance
window.cart = new ShoppingCart()
const cart = window.cart

// Global function to update cart badge - can be called from anywhere
window.updateCartBadge = function() {
  if (window.cart) {
    window.cart.updateCartBadge()
  }
}

// Global function to initialize cart badge - called when header loads
window.initializeCartBadge = function() {
  console.log('[Cart] Initializing badge...')
  
  // Update badge immediately
  if (window.cart) {
    window.cart.updateCartBadge()
    
    // Subscribe to cart changes
    window.cart.subscribe(() => {
      window.cart.updateCartBadge()
    })
    
    console.log('[Cart] Badge initialized with count:', window.cart.getCount())
  }
  
  // Set up MutationObserver to watch for header changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.querySelector && node.querySelector('#cart-count')) {
          console.log('[Cart] Badge element detected, updating...')
          setTimeout(() => {
            if (window.cart) {
              window.cart.updateCartBadge()
            }
          }, 100)
        }
      })
    })
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(window.initializeCartBadge, 100)
    })
  } else {
    setTimeout(window.initializeCartBadge, 100)
  }
  
  // Also initialize on page visibility change (when switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.cart) {
      setTimeout(() => {
        window.cart.updateCartBadge()
      }, 100)
    }
  })
}

// Export for use
if (typeof module !== 'undefined') {
  module.exports = { ShoppingCart, cart }
}
