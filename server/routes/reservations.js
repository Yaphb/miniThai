const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');

// Get all reservations (protected route)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const reservations = await db.collection('reservations')
            .find({})
            .sort({ date: 1, time: 1 })
            .toArray();
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

// Get a single reservation by ID (protected route)
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const reservation = await db.collection('reservations').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        res.json(reservation);
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({ error: 'Failed to fetch reservation' });
    }
});

// Create a new reservation
router.post('/', async (req, res) => {
    try {
        // Handle form field names from the HTML form
        const name = req.body.name || req.body['res-name'];
        const email = req.body.email || req.body['res-email'];
        const phone = req.body.phone || req.body['res-phone'];
        const date = req.body.date || req.body['res-date'];
        const time = req.body.time || req.body['res-time'];
        const guests = req.body.guests || req.body.partySize || req.body['res-guests'];
        const specialRequests = req.body.specialRequests || req.body['res-requests'] || '';
        
        // Basic validation
        if (!name || !email || !phone || !date || !time || !guests) {
            return res.status(400).json({ 
                error: 'Name, email, phone, date, time, and number of guests are required',
                receivedData: req.body // For debugging
            });
        }
        
        // Additional validation for date and time
        const reservationDate = new Date(`${date}T${time}`);
        if (isNaN(reservationDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date or time format' });
        }
        
        // Check if the date is in the past
        const now = new Date();
        if (reservationDate < now) {
            return res.status(400).json({ error: 'Cannot make a reservation in the past' });
        }
        
        const db = getDB();
        
        // Check for existing reservation at the same time
        const existingReservation = await db.collection('reservations').findOne({
            date,
            time,
            status: { $ne: 'cancelled' }
        });
        
        if (existingReservation) {
            return res.status(409).json({ 
                error: 'This time slot is already booked. Please choose another time.' 
            });
        }
        
        // Create new reservation
        const result = await db.collection('reservations').insertOne({
            name,
            email,
            phone,
            date,
            time,
            guests: parseInt(guests, 10),
            specialRequests,
            status: 'confirmed',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        res.status(201).json({ 
            message: 'Reservation created successfully',
            reservationId: result.insertedId 
        });
        
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// Update reservation status (protected route)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const db = getDB();
        const result = await db.collection('reservations').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status,
                    updatedAt: new Date() 
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        res.json({ message: 'Reservation status updated successfully' });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ error: 'Failed to update reservation status' });
    }
});

// Cancel a reservation
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required to cancel a reservation' });
        }
        
        const db = getDB();
        const result = await db.collection('reservations').updateOne(
            { 
                _id: new ObjectId(req.params.id),
                email: email // Ensure the email matches the reservation
            },
            { 
                $set: { 
                    status: 'cancelled',
                    updatedAt: new Date() 
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                error: 'Reservation not found or email does not match' 
            });
        }
        
        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ error: 'Failed to cancel reservation' });
    }
});

module.exports = router;
