const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');

// Get all orders (protected route)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const orders = await db.collection('orders').find({}).toArray();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get a single order by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create a new order
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, deliveryMethod, items, subtotal, deliveryFee, total, status = 'pending' } = req.body;
        
        if (!name || !email || !phone || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Name, email, phone, and at least one item are required' });
        }
        
        const db = getDB();
        const result = await db.collection('orders').insertOne({
            name,
            email,
            phone,
            address: deliveryMethod === 'delivery' ? address : 'Pickup',
            deliveryMethod,
            items,
            subtotal: parseFloat(subtotal),
            deliveryFee: parseFloat(deliveryFee || 0),
            total: parseFloat(total),
            status,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        res.status(201).json({ 
            message: 'Order created successfully',
            orderId: result.insertedId 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status (protected route)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const db = getDB();
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status,
                    updatedAt: new Date() 
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
