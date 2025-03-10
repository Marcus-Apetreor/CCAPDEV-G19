const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
    room: { type: String, required: true },
    roomType: { type: String, required: true }, // New: Room type
    date: { type: String, required: true }, // YYYY-MM-DD format
    timeslot: { type: String, required: true },
    seat: { type: String, default: null }, // New: Seat (Optional)
    username: { type: String, required: true }
});

// Create a unique index to prevent duplicate reservations for the same room, date, and timeslot
ReservationSchema.index({ room: 1, date: 1, timeslot: 1 }, { unique: true });

module.exports = mongoose.model("Reservation", ReservationSchema);
