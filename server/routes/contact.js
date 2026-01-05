const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// Submit contact form
router.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const db = getDB();
        const contactsCollection = db.collection('contacts');
        
        // Create new contact
        const contact = {
            name,
            email,
            message,
            status: 'new',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await contactsCollection.insertOne(contact);
        
        // In a real app, you might want to send an email notification here
        
        res.status(201).json({
            success: true,
            message: 'Thank you for your message. We will get back to you soon!',
            data: { ...contact, _id: result.insertedId }
        });
        
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Submit reservation form
router.post('/api/reservations', async (req, res) => {
    try {
        const { name, email, phone, date, time, partySize, specialRequests } = req.body;
        
        // Basic validation
        if (!name || !email || !phone || !date || !time || !partySize) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Convert date to proper Date object
        const reservationDate = new Date(date);
        if (isNaN(reservationDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const db = getDB();
        const reservationsCollection = db.collection('reservations');

        // Create new reservation
        const reservation = {
            name,
            email,
            phone,
            date: reservationDate,
            time,
            partySize: parseInt(partySize, 10),
            specialRequests: specialRequests || '',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await reservationsCollection.insertOne(reservation);
        
        // In a real app, you might want to send a confirmation email here
        
        res.status(201).json({
            success: true,
            message: 'Your reservation has been received. We will confirm shortly!',
            data: { ...reservation, _id: result.insertedId }
        });
        
    } catch (error) {
        console.error('Reservation submission error:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your reservation',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin route to get all contacts (protected in a real app)
router.get('/api/admin/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ submittedAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Admin route to get all reservations (protected in a real app)
router.get('/api/admin/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ date: 1, time: 1 });
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

module.exports = router;
