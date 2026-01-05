require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const config = require('./config')
const { connectDB, getDB } = require('./db')
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const reservationRoutes = require('./routes/reservations');
const contactRoutes = require('./routes/contact');

const app = express()
app.use(express.json())
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}))
app.use(compression())
app.use(cors({ origin: config.corsOrigin }))
app.use(morgan('dev'))

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: config.env === 'production' ? '7d' : 0 }))

// Helper to catch async errors
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

app.use('/api/contact', contactRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reservations', reservationRoutes);

app.get('/api/gallery', asyncHandler(async (req, res) => {
  const db = getDB()
  const images = await db.collection('gallery').find().toArray()
  res.json({ images })
}))

app.get('/api/staff', asyncHandler(async (req, res) => {
  const db = getDB()
  const team = await db.collection('staff').find().toArray()
  res.json({ team })
}))

app.post('/api/contact', asyncHandler(async (req, res) => {
  const { name, email, message } = req.body
  if (!name || !email || !message) return res.status(400).json({ error: 'Invalid payload' })
  
  const item = { 
    id: Date.now().toString(), 
    name, 
    email, 
    message, 
    createdAt: new Date().toISOString() 
  }
  
  await getDB().collection('messages').insertOne(item)
  res.json({ ok: true })
}))

app.post('/api/reservations', asyncHandler(async (req, res) => {
  const { name, email, phone, date, time, partySize } = req.body
  if (!name || !email || !phone || !date || !time || !partySize) return res.status(400).json({ error: 'Invalid payload' })
  
  const item = { 
    id: Date.now().toString(), 
    name, 
    email, 
    phone, 
    date, 
    time, 
    partySize, 
    createdAt: new Date().toISOString() 
  }
  
  await getDB().collection('reservations').insertOne(item)
  res.json({ ok: true })
}))

app.post('/api/menu', asyncHandler(async (req, res) => {
  const { name, category, price, description_en, description_th, vegetarian, spicyLevel, image } = req.body
  if (!name || !category || price == null) return res.status(400).json({ error: 'Invalid payload' })
  
  const item = { 
    id: Date.now().toString(), 
    name, 
    category, 
    price, 
    description_en, 
    description_th, 
    vegetarian: !!vegetarian, 
    spicyLevel: spicyLevel || 0, 
    image 
  }
  
  await getDB().collection('menu').insertOne(item)
  res.json(item)
}))

app.put('/api/menu/:id', asyncHandler(async (req, res) => {
  const id = req.params.id
  const db = getDB()
  
  // We use our own 'id' field, not _id
  const existing = await db.collection('menu').findOne({ id })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  
  const updates = { ...req.body, id } // Ensure id doesn't change
  delete updates._id // Don't try to update immutable _id
  
  await db.collection('menu').updateOne({ id }, { $set: updates })
  const updated = await db.collection('menu').findOne({ id })
  res.json(updated)
}))

app.delete('/api/menu/:id', asyncHandler(async (req, res) => {
  const id = req.params.id
  await getDB().collection('menu').deleteOne({ id })
  res.json({ ok: true })
}))

app.post('/api/orders', asyncHandler(async (req, res) => {
  const { name, email, phone, address, deliveryMethod, items, subtotal, deliveryFee, total } = req.body
  
  // Validate required fields
  if (!name || !email || !phone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  if (deliveryMethod === 'delivery' && !address) {
    return res.status(400).json({ error: 'Delivery address is required for delivery orders' })
  }
  
  // Generate order ID
  const orderId = 'ORD' + Date.now().toString()
  
  const order = {
    orderId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    address: address ? address.trim() : null,
    deliveryMethod,
    items,
    subtotal: parseFloat(subtotal) || 0,
    deliveryFee: parseFloat(deliveryFee) || 0,
    total: parseFloat(total) || 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        timestamp: new Date().toISOString(),
        message: 'Order placed successfully'
      }
    ]
  }
  
  try {
    await getDB().collection('orders').insertOne(order)
    console.log(`Order ${orderId} created for ${email}`)
    
    res.status(201).json({ 
      success: true, 
      orderId,
      message: 'Order placed successfully'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
}))

app.get('/api/orders', asyncHandler(async (req, res) => {
  const { email } = req.query
  
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' })
  }
  
  try {
    const db = getDB()
    const orders = await db.collection('orders')
      .find({ email: email.trim().toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray()
    
    console.log(`Found ${orders.length} orders for ${email}`)
    
    res.json({ 
      success: true,
      orders: orders || []
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
}))

app.get('/api/orders/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params
  
  try {
    const db = getDB()
    const order = await db.collection('orders').findOne({ orderId })
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    res.json({ 
      success: true,
      order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
}))

app.put('/api/orders/:orderId/status', asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const { status, message } = req.body
  
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  
  try {
    const db = getDB()
    const order = await db.collection('orders').findOne({ orderId })
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    const timelineEntry = {
      timestamp: new Date().toISOString(),
      message: message || `Order status updated to ${status}`
    }
    
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      $push: { timeline: timelineEntry }
    }
    
    await db.collection('orders').updateOne(
      { orderId },
      { $set: { status, updatedAt: updateData.updatedAt }, $push: { timeline: timelineEntry } }
    )
    
    console.log(`Order ${orderId} status updated to ${status}`)
    
    res.json({ 
      success: true,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
}))

app.delete('/api/orders/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params
  
  try {
    const result = await getDB().collection('orders').deleteOne({ orderId })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    console.log(`Order ${orderId} deleted`)
    res.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({ error: 'Failed to delete order' })
  }
}))

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

if (require.main === module) {
  connectDB().then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`)
    })
  }).catch(err => {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  })
}

module.exports = app
