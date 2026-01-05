/**
 * Order Tracking Module
 * Handles order search and display functionality
 */

// Show status message
function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status')
  if (!statusEl) return

  statusEl.textContent = message
  statusEl.className = `status show ${type}`

  if (type === 'success') {
    setTimeout(() => {
      statusEl.className = 'status'
      statusEl.textContent = ''
    }, 5000)
  }
}

// Get emoji for menu item
function getItemEmoji(name) {
  const emojiMap = {
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

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.toLowerCase().includes(key)) {
      return emoji
    }
  }
  return '🍽️'
}

// Format date to readable format
function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get status badge color and text
function getStatusBadge(status) {
  const statuses = {
    pending: { text: 'Pending', color: 'pending' },
    confirmed: { text: 'Confirmed', color: 'confirmed' },
    preparing: { text: 'Preparing', color: 'preparing' },
    ready: { text: 'Ready for Pickup', color: 'ready' },
    completed: { text: 'Completed', color: 'completed' },
    cancelled: { text: 'Cancelled', color: 'cancelled' }
  }
  return statuses[status] || { text: 'Unknown', color: 'pending' }
}

// Render single order card
function renderOrderCard(order) {
  const statusBadge = getStatusBadge(order.status || 'pending')
  const deliveryLabel = order.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'
  const orderId = order.orderId || 'N/A'

  return `
    <div class="order-card expandable" data-order-id="${orderId}">
      <div class="order-header">
        <div>
          <div style="font-weight: 600; margin-bottom: var(--space-1);">Order #${orderId}</div>
          <div class="order-id">${formatDate(order.createdAt || new Date().toISOString())}</div>
        </div>
        <span class="order-status ${statusBadge.color}">${statusBadge.text}</span>
      </div>

      <div class="order-info-grid">
        <div class="info-item">
          <div class="info-label">Subtotal</div>
          <div class="info-value">${formatPrice(order.subtotal || 0)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Delivery Fee</div>
          <div class="info-value">${formatPrice(order.deliveryFee || 0)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total</div>
          <div class="info-value">${formatPrice(order.total || 0)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Method</div>
          <div class="info-value">${deliveryLabel}</div>
        </div>
      </div>

      <div class="order-items">
        <h4>Order Details</h4>
        <div class="item-list">
          ${(order.items || []).map(item => `
            <div class="item-row">
              <span class="item-name">${getItemEmoji(item.name)} ${item.name}</span>
              <span class="item-qty">x${item.quantity}</span>
              <span class="item-price">${formatPrice(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        ${order.address ? `
          <div style="margin-bottom: var(--space-2); font-size: 0.9rem;">
            <strong>Delivery Address:</strong><br>
            <span style="color: var(--text-muted);">${order.address}</span>
          </div>
        ` : ''}

        ${order.timeline && order.timeline.length > 0 ? `
          <div class="timeline">
            <h4 style="margin-top: 0; margin-bottom: var(--space-2); font-size: 0.95rem;">Order Timeline</h4>
            ${order.timeline.map(event => `
              <div class="timeline-item">
                <div class="timeline-time">${formatDate(event.timestamp)}</div>
                <div class="timeline-text">${event.message}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="order-total">
          <span>Final Total</span>
          <span>${formatPrice(order.total || 0)}</span>
        </div>
      </div>
    </div>
  `
}

// Render empty state
function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">📋</div>
      <h2>No Orders Found</h2>
      <p class="text-muted">No orders found for this email address</p>
      <a href="/menu.html" class="btn" style="margin-top: var(--space-3);">Continue Shopping</a>
    </div>
  `
}

// Initialize orders page
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm')
    const ordersContainer = document.getElementById('ordersContainer')

    if (!searchForm) return

    // Handle search form submission
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const email = document.getElementById('searchEmail').value.trim()

      if (!email) {
        showStatus('Please enter an email address', 'error')
        return
      }

      try {
        const response = await fetch(`/api/orders/email?email=${encodeURIComponent(email)}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch orders')
        }

        const data = await response.json()
        const orders = data.orders || []

        if (orders.length === 0) {
          ordersContainer.innerHTML = renderEmptyState()
          showStatus('No orders found for this email', 'info')
          return
        }

        // Render orders
        ordersContainer.innerHTML = orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(order => renderOrderCard(order))
          .join('')

        showStatus(`Found ${orders.length} order(s)`, 'success')

        // Add click handlers for expandable cards
        document.querySelectorAll('.order-card.expandable').forEach(card => {
          card.addEventListener('click', () => {
            const itemsDiv = card.querySelector('.order-items')
            if (itemsDiv) {
              itemsDiv.classList.toggle('expanded')
            }
          })
        })
      } catch (error) {
        console.error('Error fetching orders:', error)
        showStatus('Failed to load orders. Please try again.', 'error')
        ordersContainer.innerHTML = renderEmptyState()
      }
    })

    // Populate email from recent order if available
    try {
      const orders = JSON.parse(localStorage.getItem('miniThai_orders') || '[]')
      if (orders.length > 0) {
        const lastEmail = orders[orders.length - 1].email
        if (lastEmail) {
          document.getElementById('searchEmail').value = lastEmail
        }
      }
    } catch (e) {
      // Silently fail if localStorage is empty
    }
  })
}
