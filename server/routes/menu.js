const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const menuItems = await db.collection('menu').find({}).toArray();
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Get a single menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const menuItem = await db.collection('menu').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ error: 'Failed to fetch menu item' });
    }
});

// Add a new menu item (protected route - add authentication middleware if needed)
router.post('/', async (req, res) => {
    try {
        const { name, description, price, category, image } = req.body;
        
        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }
        
        const db = getDB();
        const result = await db.collection('menu').insertOne({
            name,
            description: description || '',
            price: parseFloat(price),
            category,
            image: image || '',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        res.status(201).json({ 
            message: 'Menu item created successfully',
            id: result.insertedId 
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
});

module.exports = router;
