const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  partySize: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  notes: String,
  specialRequests: String
});

module.exports = mongoose.model('Reservation', reservationSchema);
