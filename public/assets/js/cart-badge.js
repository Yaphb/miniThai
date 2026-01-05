/**
 * Cart Badge Manager
 * Ensures cart badge works consistently across all pages and page switches
 */

class CartBadgeManager {
  constructor() {
    this.badgeId = 'cart-count';
    this.updateInterval = null;
    this.isInitialized = false;
    this.init();
  }

  init() {
    console.log('[CartBadge] Initializing badge manager...');
    
    // Start monitoring immediately
    this.startMonitoring();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateBadge();
      }
    });
    
    // Handle window focus
    window.addEventListener('focus', () => {
      this.updateBadge();
    });
    
    // Handle storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'miniThai_cart') {
        this.updateBadge();
      }
    });
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('[CartBadge] Running initialization...');
    
    // Update badge immediately
    this.updateBadge();
    
    // Subscribe to cart changes if cart is available
    if (window.cart && typeof window.cart.subscribe === 'function') {
      window.cart.subscribe(() => {
        this.updateBadge();
      });
      console.log('[CartBadge] Subscribed to cart changes');
    }
    
    // Set up MutationObserver to watch for badge element changes
    this.setupBadgeObserver();
    
    this.isInitialized = true;
    console.log('[CartBadge] Initialization complete');
  }

  startMonitoring() {
    // Update badge every 2 seconds to ensure consistency
    this.updateInterval = setInterval(() => {
      this.updateBadge();
    }, 2000);
  }

  setupBadgeObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Check if the added node contains the badge or is the badge itself
            const badge = node.id === this.badgeId ? node : node.querySelector(`#${this.badgeId}`);
            if (badge) {
              console.log('[CartBadge] Badge element detected in DOM, updating...');
              setTimeout(() => this.updateBadge(), 50);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  updateBadge() {
    const badge = document.getElementById(this.badgeId);
    
    if (!badge) {
      // Badge not found, will try again later
      return;
    }

    if (!window.cart) {
      // Cart not available yet
      return;
    }

    try {
      const count = window.cart.getCount();
      const currentText = badge.textContent;
      const currentDisplay = badge.style.display;
      
      // Only update if there's a change to avoid unnecessary DOM manipulation
      if (currentText !== count.toString()) {
        badge.textContent = count;
        
        // Add animation for visual feedback when count increases
        if (count > parseInt(currentText) && count > 0) {
          badge.classList.add('cart-badge-animate');
          setTimeout(() => {
            badge.classList.remove('cart-badge-animate');
          }, 300);
        }
      }
      
      const shouldShow = count > 0;
      const newDisplay = shouldShow ? 'inline-flex' : 'none';
      
      if (currentDisplay !== newDisplay) {
        badge.style.display = newDisplay;
      }
      
    } catch (error) {
      console.error('[CartBadge] Error updating badge:', error);
    }
  }

  // Force update method that can be called externally
  forceUpdate() {
    this.updateBadge();
  }

  // Cleanup method
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Create global instance
window.cartBadgeManager = new CartBadgeManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartBadgeManager;
}