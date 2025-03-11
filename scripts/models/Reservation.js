const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
    room: { type: String, required: true },
    roomType: { type: String, required: true }, // New: Room type
    date: { type: String, required: true }, // YYYY-MM-DD format
    timeslot: { type: String, required: true },
    seat: { type: String, default: null }, // New: Seat (Optional)
    username: { type: String, required: true }
});



module.exports = mongoose.model("Reservation", ReservationSchema);
