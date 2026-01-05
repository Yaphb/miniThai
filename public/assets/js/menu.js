/**
 * Enhanced Menu Management Module
 */

/* global formatPrice, cart */

// Static menu data as fallback
const staticMenuData = {
  categories: ['Appetizers', 'Main Course', 'Desserts', 'Drinks'],
  items: [
    {
      id: '1',
      name: 'Tom Yum Goong',
      description_en: 'Spicy shrimp soup with lemongrass and mushrooms',
      price: 25.90,
      category: 'Appetizers',
      vegetarian: false,
      spicyLevel: 2,
      image: 'assets/images/tom-yum.jpg'
    },
    {
      id: '2',
      name: 'Pad Thai',
      description_en: 'Stir-fried rice noodles with eggs, tofu, and peanuts',
      price: 22.50,
      category: 'Main Course',
      vegetarian: true,
      spicyLevel: 1,
      image: 'assets/images/pad-thai.jpg'
    },
    {
      id: '3',
      name: 'Green Curry',
      description_en: 'Creamy coconut curry with chicken and Thai eggplant',
      price: 26.90,
      category: 'Main Course',
      vegetarian: false,
      spicyLevel: 3,
      image: 'assets/images/green-curry.jpg'
    },
    {
      id: '4',
      name: 'Mango Sticky Rice',
      description_en: 'Sweet sticky rice with fresh mango and coconut milk',
      price: 15.90,
      category: 'Desserts',
      vegetarian: true,
      spicyLevel: 0,
      image: 'assets/images/mango-sticky-rice.jpg'
    },
    {
      id: '5',
      name: 'Thai Iced Tea',
      description_en: 'Sweet and creamy iced tea with condensed milk',
      price: 8.90,
      category: 'Drinks',
      vegetarian: true,
      spicyLevel: 0,
      image: 'assets/images/thai-iced-tea.jpg'
    },
    {
      id: '6',
      name: 'Pad See Ew',
      description_en: 'Stir-fried wide noodles with dark soy sauce and Chinese broccoli',
      price: 21.90,
      category: 'Main Course',
      vegetarian: false,
      spicyLevel: 1,
      image: 'assets/images/pad-see-ew.jpg'
    },
    {
      id: '7',
      name: 'Som Tam',
      description_en: 'Spicy green papaya salad with tomatoes and peanuts',
      price: 18.90,
      category: 'Appetizers',
      vegetarian: true,
      spicyLevel: 3,
      image: 'assets/images/som-tam.jpg'
    },
    {
      id: '8',
      name: 'Massaman Curry',
      description_en: 'Rich and mild curry with beef, potatoes, and peanuts',
      price: 28.90,
      category: 'Main Course',
      vegetarian: false,
      spicyLevel: 1,
      image: 'assets/images/massaman.jpg'
    }
  ]
};

// Local format price function in case global isn't available
function localFormatPrice(amount) {
  if (typeof formatPrice !== 'undefined') {
    return formatPrice(amount)
  }
  return 'RM' + parseFloat(amount).toFixed(2)
}

// Enhanced pagination state
let menuState = {
  currentPage: 1,
  itemsPerPage: 6, // Fixed to 6 items per page (2 rows x 3 columns)
  allItems: [],
  filteredItems: [],
  data: null,
  viewMode: 'grid', // Fixed to grid view only
  sortBy: 'name',
  filters: {
    search: '',
    category: 'all',
    diet: 'all',
    spice: 'all'
  }
}

async function loadMenu() {
  console.log('[Menu] Enhanced script started')
  const grid = document.getElementById('menuGrid')
  const loadingEl = document.getElementById('menuLoading')
  
  // Show loading state
  if (loadingEl) {
    loadingEl.style.display = 'block'
  }
  
  // Ensure grid exists
  if (!grid) {
    console.error('[Menu] Grid element not found')
    return
  }

  console.log('[Menu] Grid element found, starting enhanced load')

  try {
    let data = null
    
    // Try to fetch from API first
    try {
      console.log('[Menu] Attempting to fetch menu from API...')
      const response = await fetch('/api/menu')
      
      if (response.ok) {
        const apiData = await response.json()
        console.log('[Menu] API Response:', apiData)
        
        // Check if API returned valid data with items
        if (apiData && apiData.items && Array.isArray(apiData.items) && apiData.items.length > 0) {
          data = apiData
          console.log('[Menu] ✓ Menu data loaded from API with', apiData.items.length, 'items')
        } else {
          console.warn('[Menu] API returned empty, using static fallback')
          data = staticMenuData
        }
      } else {
        console.warn(`[Menu] API returned status ${response.status}, using static fallback`)
        data = staticMenuData
      }
    } catch (fetchError) {
      console.warn('[Menu] API fetch failed:', fetchError.message, '- using static fallback')
      data = staticMenuData
    }

    // Hide loading state
    if (loadingEl) {
      loadingEl.style.display = 'none'
    }

    // Validate we have data
    if (!data || !data.items || data.items.length === 0) {
      console.error('[Menu] No menu data available')
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p class="text-muted">Unable to load menu data.</p>
        </div>
      `
      return
    }

    menuState.data = data
    menuState.allItems = data.items

    // Initialize UI components
    initializeFilters()
    initializePagination()
    updateStats()

    // Apply filters and pagination
    applyFiltersAndRender()
    
    console.log('[Menu] ✓ Enhanced menu loading complete')
  } catch (error) {
    console.error('[Menu] Fatal error:', error, error.stack)
    if (loadingEl) {
      loadingEl.style.display = 'none'
    }
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <p class="text-muted">Unable to load menu. Please try again later.</p>
      </div>
    `
  }
}

// Initialize filter controls
function initializeFilters() {
  const categoryFilter = document.getElementById('categoryFilter')
  const searchInput = document.getElementById('searchInput')
  const clearSearchBtn = document.getElementById('clearSearch')
  const resetFiltersBtn = document.getElementById('resetFilters')
  const sortFilter = document.getElementById('sortFilter')

  if (!categoryFilter) return

  // Setup category filter
  const categories = ['All', ...new Set(menuState.allItems.map(item => item.category))]
  categoryFilter.innerHTML = categories
    .map(cat => `<option value="${cat === 'All' ? 'all' : cat}">${cat}</option>`)
    .join('')

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      menuState.filters.search = e.target.value.toLowerCase()
      if (clearSearchBtn) {
        clearSearchBtn.style.display = e.target.value ? 'block' : 'none'
      }
      applyFiltersAndRender()
    })
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = ''
      menuState.filters.search = ''
      clearSearchBtn.style.display = 'none'
      applyFiltersAndRender()
    })
  }

  // Filter event listeners
  categoryFilter.addEventListener('change', (e) => {
    menuState.filters.category = e.target.value
    applyFiltersAndRender()
  })

  const dietFilter = document.getElementById('dietFilter')
  if (dietFilter) {
    dietFilter.addEventListener('change', (e) => {
      menuState.filters.diet = e.target.value
      applyFiltersAndRender()
    })
  }

  const spiceFilter = document.getElementById('spiceFilter')
  if (spiceFilter) {
    spiceFilter.addEventListener('change', (e) => {
      menuState.filters.spice = e.target.value
      applyFiltersAndRender()
    })
  }

  // Sort functionality
  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      menuState.sortBy = e.target.value
      applyFiltersAndRender()
    })
  }

  // Reset filters
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      menuState.filters = {
        search: '',
        category: 'all',
        diet: 'all',
        spice: 'all'
      }
      menuState.sortBy = 'name'
      
      // Reset UI
      if (searchInput) searchInput.value = ''
      if (clearSearchBtn) clearSearchBtn.style.display = 'none'
      categoryFilter.value = 'all'
      if (dietFilter) dietFilter.value = 'all'
      if (spiceFilter) spiceFilter.value = 'all'
      if (sortFilter) sortFilter.value = 'name'
      
      applyFiltersAndRender()
    })
  }
}

// Initialize view controls (removed - fixed to grid view)
// View controls functionality removed as per requirements

// Initialize simplified pagination (only prev/next and page numbers)
function initializePagination() {
  const prevBtn = document.getElementById('prevPage')
  const nextBtn = document.getElementById('nextPage')
  const pageNumbers = document.getElementById('pageNumbers')

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (menuState.currentPage > 1) {
        menuState.currentPage--
        renderCurrentPage()
        scrollToTop()
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(menuState.filteredItems.length / menuState.itemsPerPage)
      if (menuState.currentPage < totalPages) {
        menuState.currentPage++
        renderCurrentPage()
        scrollToTop()
      }
    })
  }

  if (pageNumbers) {
    pageNumbers.addEventListener('click', (e) => {
      const btn = e.target.closest('button.page-number')
      if (!btn) return
      if (btn.classList.contains('ellipsis')) return
      const page = Number(btn.dataset.page)
      if (!Number.isFinite(page)) return
      if (page === menuState.currentPage) return

      menuState.currentPage = page
      renderCurrentPage()
      scrollToTop()
    })
  }
}

// Apply filters and sorting
function applyFiltersAndRender() {
  try {
    console.log('[Menu] Applying enhanced filters and rendering...')
    
    // Filter items
    menuState.filteredItems = menuState.allItems.filter(item => {
      const categoryMatch = menuState.filters.category === 'all' || item.category === menuState.filters.category
      const dietMatch = menuState.filters.diet === 'all' ||
        (menuState.filters.diet === 'vegetarian' ? item.vegetarian : !item.vegetarian)
      const spiceMatch = menuState.filters.spice === 'all' || String(item.spicyLevel) === menuState.filters.spice
      const searchMatch = !menuState.filters.search || 
        item.name.toLowerCase().includes(menuState.filters.search) ||
        (item.description_en && item.description_en.toLowerCase().includes(menuState.filters.search))

      return categoryMatch && dietMatch && spiceMatch && searchMatch
    })

    // Sort items
    menuState.filteredItems.sort((a, b) => {
      switch (menuState.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'category':
          return a.category.localeCompare(b.category)
        case 'spice':
          return a.spicyLevel - b.spicyLevel
        default:
          return 0
      }
    })

    console.log('[Menu] Filtered to', menuState.filteredItems.length, 'items')

    // Reset to first page on filter change
    menuState.currentPage = 1
    updateStats()
    renderCurrentPage()
  } catch (error) {
    console.error('[Menu] Error applying filters:', error)
    const grid = document.getElementById('menuGrid')
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p class="text-muted">Error displaying menu items.</p>
        </div>
      `
    }
  }
}

// Update statistics (removed stats display as per requirements)
function updateStats() {
  // Stats display removed as per requirements
  // Only update cart count if cart is available
  const cartItemsEl = document.getElementById('cartItems')
  if (cartItemsEl && typeof cart !== 'undefined') {
    cartItemsEl.textContent = cart.getCount()
  }
}

// Render current page with fixed 2x3 grid layout
function renderCurrentPage() {
  const grid = document.getElementById('menuGrid')
  const start = (menuState.currentPage - 1) * menuState.itemsPerPage
  const end = start + menuState.itemsPerPage
  const pageItems = menuState.filteredItems.slice(start, end)

  // Always use grid view (fixed)
  grid.className = 'menu-grid grid-view'

  if (menuState.filteredItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3>No dishes found</h3>
        <p class="text-muted">Try adjusting your filters or search terms.</p>
      </div>
    `
    updatePaginationControls()
    return
  }

  // Fill empty slots to maintain 2x3 grid structure
  const gridItems = [...pageItems]
  while (gridItems.length < 6) {
    gridItems.push(null) // Add empty slots
  }

  grid.innerHTML = gridItems
    .map(item => item ? createEnhancedMenuCard(item) : '<div class="card-placeholder" style="visibility: hidden;"></div>')
    .join('')

  console.log('[Menu] ✓ Rendered page', menuState.currentPage, 'with', pageItems.length, 'items in 2x3 grid')

  // Attach cart button listeners
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      addToCart(btn.dataset)
    })
  })

  updatePaginationControls()
}

// Create enhanced menu card (grid view only)
function createEnhancedMenuCard(item) {
  try {
    const vegetarianBadge = item.vegetarian ? '🌿 Vegetarian' : ''
    const spiceLevel = '🌶️'.repeat(item.spicyLevel)
    const emoji = getItemEmoji(item.name)
    
    // Ensure proper image path
    let imagePath = item.image
    if (!imagePath.startsWith('/')) {
      imagePath = '/' + imagePath
    }

    // Only grid view (list view removed)
    return `
      <div class="card fade-in">
        <div style="height: 200px; background: linear-gradient(135deg, var(--accent-light), #f5f5f5); overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <img src="${imagePath}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.fontSize='3rem'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.textContent='${emoji}';">
        </div>
        <div class="content">
          <h3>${item.name}</h3>
          <p>${item.description_en || item.description || ''}</p>
          
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
            ${item.vegetarian ? `<span style="font-size: 0.8rem; background: var(--accent-light); color: var(--text); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm);">${vegetarianBadge}</span>` : ''}
            ${spiceLevel ? `<span style="font-size: 0.8rem; background: rgba(229, 57, 53, 0.1); color: var(--error); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm);">${spiceLevel}</span>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--space-3); border-top: 1px solid var(--border-light);">
            <p style="font-weight: 600; color: var(--accent); margin: 0;">${localFormatPrice(item.price)}</p>
            <button 
              class="btn add-to-cart-btn" 
              style="padding: 0.5rem 1rem; font-size: 0.85rem;"
              data-id="${item.id}"
              data-name="${item.name}"
              data-price="${item.price}"
              data-image="${item.image}"
              aria-label="Add ${item.name} to cart">
              + Add to Cart
            </button>
          </div>
        </div>
      </div>
    `
  } catch (cardError) {
    console.error('Error creating enhanced menu card:', cardError, item)
    return ''
  }
}

// Simplified pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(menuState.filteredItems.length / menuState.itemsPerPage)
  const paginationDiv = document.getElementById('menuPagination')
  const resultsInfo = document.getElementById('resultsInfo')
  const pageNumbers = document.getElementById('pageNumbers')

  if (!paginationDiv) return

  if (totalPages > 1) {
    paginationDiv.style.display = 'flex'
    
    // Update results info
    const start = (menuState.currentPage - 1) * menuState.itemsPerPage + 1
    const end = Math.min(start + menuState.itemsPerPage - 1, menuState.filteredItems.length)
    if (resultsInfo) {
      resultsInfo.textContent = `Showing ${start}-${end} of ${menuState.filteredItems.length} items`
    }

    // Update page numbers
    if (pageNumbers) {
      pageNumbers.innerHTML = generatePageNumbers(menuState.currentPage, totalPages)
    }

    // Update button states
    const prevBtn = document.getElementById('prevPage')
    const nextBtn = document.getElementById('nextPage')

    if (prevBtn) prevBtn.disabled = menuState.currentPage === 1
    if (nextBtn) nextBtn.disabled = menuState.currentPage === totalPages
  } else {
    paginationDiv.style.display = 'none'
  }
}

// Generate page numbers with ellipsis
function generatePageNumbers(current, total) {
  const pages = []
  const showPages = 5 // Number of page buttons to show

  if (total <= showPages) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show pages with ellipsis
    if (current <= 3) {
      // Show first pages
      for (let i = 1; i <= 4; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      // Show last pages
      pages.push(1)
      pages.push('...')
      for (let i = total - 3; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Show middle pages
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages.map(page => {
    if (page === '...') {
      return `<span class="page-number ellipsis">...</span>`
    }
    const isActive = page === current ? 'active' : ''
    return `<button type="button" class="page-number ${isActive}" data-page="${page}">${page}</button>`
  }).join('')
}

// Scroll to top smoothly
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Get emoji for item (enhanced)
function getItemEmoji(name) {
  const emojiMap = {
    'tom yum': '🍲',
    'pad thai': '🍜',
    'green curry': '🍛',
    'mango sticky rice': '🥭',
    'spring roll': '🌯',
    'som tam': '🥗',
    'thai iced tea': '🧋',
    'massaman': '🍛',
    'pad see ew': '🍜',
    'curry': '🍲',
    'pad': '🍤',
    'tom': '🥣',
    'salad': '🥗',
    'rice': '🍚',
    'noodle': '🍜',
    'soup': '🍲',
    'dessert': '🍰',
    'drink': '🥤'
  }

  const lowerName = name.toLowerCase()
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) {
      return emoji
    }
  }
  return '🍽️'
}

// Add item to cart with enhanced feedback
function addToCart(itemData) {
  if (typeof cart === 'undefined') {
    console.warn('[Menu] Cart not available yet, cannot add item')
    return
  }

  const item = {
    id: itemData.id,
    name: itemData.name,
    price: parseFloat(itemData.price),
    image: itemData.image
  }

  const success = cart.addItem(item)
  if (success) {
    showAddToCartFeedback(item.name)
    updateStats()
  }
}

// Enhanced feedback when item is added
function showAddToCartFeedback(itemName) {
  const statusEl = document.getElementById('menuStatus') || createStatusElement()
  statusEl.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <strong>${itemName}</strong> added to cart!
  `
  statusEl.className = 'status show success'
  statusEl.style.position = 'fixed'
  statusEl.style.top = '100px'
  statusEl.style.right = '20px'
  statusEl.style.zIndex = '1000'
  statusEl.style.width = 'auto'
  statusEl.style.maxWidth = '300px'

  setTimeout(() => {
    statusEl.className = 'status'
  }, 3000)
}

// Create status element if it doesn't exist
function createStatusElement() {
  const el = document.createElement('div')
  el.id = 'menuStatus'
  el.className = 'status'
  document.body.appendChild(el)
  return el
}

console.log('[Menu] Enhanced script file loaded, registering DOM listeners')
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Menu] DOMContentLoaded event fired')
  loadMenu()
})

// Also run immediately if DOM is already loaded
if (document.readyState !== 'loading') {
  console.log('[Menu] DOM already fully loaded, running enhanced loadMenu immediately')
  loadMenu()
} else {
  console.log('[Menu] DOM still loading, will run on DOMContentLoaded')
}

// Subscribe to cart changes to update stats
if (typeof cart !== 'undefined') {
  cart.subscribe(() => {
    updateStats()
  })
}
