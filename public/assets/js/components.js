/**
 * Component Loader
 * Handles loading of reusable components
 */

class ComponentLoader {
  constructor() {
    this.components = {
      'header': 'components/header.html',
      'footer': 'components/footer.html'
    };
    this.loadedComponents = new Set();
  }

  /**
   * Load a component by name
   * @param {string} componentName - Name of the component to load
   * @param {HTMLElement} targetElement - Element to insert the component into
   * @param {string} position - Where to insert the component ('beforeend', 'afterbegin', etc.)
   */
  async load(componentName, targetElement, position = 'beforeend') {
    if (this.loadedComponents.has(componentName)) {
      console.warn(`Component '${componentName}' is already loaded.`);
      return;
    }

    const componentPath = this.components[componentName];
    if (!componentPath) {
      console.error(`Component '${componentName}' not found.`);
      return;
    }

    try {
      const response = await fetch(componentPath);
      if (!response.ok) throw new Error(`Failed to load component: ${componentName}`);
      
      const html = await response.text();
      targetElement.insertAdjacentHTML(position, html);
      this.loadedComponents.add(componentName);
      
      // Initialize any scripts in the component
      this._initComponentScripts(componentName, targetElement);
      
      // Special handling for header component to ensure cart badge works
      if (componentName === 'header') {
        this._initHeaderCartBadge();
      }
      
    } catch (error) {
      console.error(`Error loading component '${componentName}':`, error);
    }
  }

  /**
   * Initialize cart badge after header component loads
   * @private
   */
  _initHeaderCartBadge() {
    console.log('[ComponentLoader] Header loaded, initializing cart badge...');
    
    // Wait a bit for the header script to run, then ensure badge is updated
    setTimeout(() => {
      if (window.cart && window.cart.updateCartBadge) {
        window.cart.updateCartBadge();
        console.log('[ComponentLoader] Cart badge updated after header load');
      }
      
      // Also call global initializer if available
      if (window.initializeCartBadge) {
        window.initializeCartBadge();
      }
    }, 100);
  }

  /**
   * Initialize scripts within a loaded component
   * @private
   */
  _initComponentScripts(componentName, container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      script.parentNode.replaceChild(newScript, script);
    });
  }

  /**
   * Load all components marked with data-component attribute
   */
  async loadAll() {
    const componentElements = document.querySelectorAll('[data-component]');
    
    // Load components in sequence to ensure proper initialization order
    for (const element of componentElements) {
      const componentName = element.getAttribute('data-component');
      const position = element.getAttribute('data-position') || 'beforeend';
      await this.load(componentName, element, position);
    }
    
    // After all components are loaded, ensure cart badge is working
    setTimeout(() => {
      if (window.cart && window.cart.updateCartBadge) {
        window.cart.updateCartBadge();
        console.log('[ComponentLoader] Final cart badge update after all components loaded');
      }
    }, 200);
  }
}

// Create and export a singleton instance
const componentLoader = new ComponentLoader();

// Auto-load components when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    componentLoader.loadAll();
  });
} else {
  componentLoader.loadAll();
}

export { componentLoader };
