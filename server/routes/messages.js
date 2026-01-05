const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');

// Get all messages (protected route)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const messages = await db.collection('messages').find({}).sort({ createdAt: -1 }).toArray();
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get a single message by ID (protected route)
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const message = await db.collection('messages').findOne({ _id: new ObjectId(req.params.id) });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

// Create a new message
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        
        const db = getDB();
        const result = await db.collection('messages').insertOne({
            name,
            email,
            phone: phone || '',
            subject: subject || '',
            message,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        res.status(201).json({ 
            message: 'Message sent successfully',
            messageId: result.insertedId 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark message as read (protected route)
router.patch('/:id/read', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('messages').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    read: true,
                    updatedAt: new Date() 
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({ error: 'Failed to update message status' });
    }
});

module.exports = router;
