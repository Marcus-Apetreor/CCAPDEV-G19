const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tier: { type: Number, required: true },
    bio: { type: String, default: null },
    profilePicture: { type: String} // Default profile picture
});

module.exports = mongoose.model('Application', ApplicationSchema);
