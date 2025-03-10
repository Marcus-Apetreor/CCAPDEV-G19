const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tier: { type: Number, required: true }
    //add variable for Profile Picture, however you want to implement it (make sure to add it to the register part of server.js)
});

module.exports = mongoose.model('User', UserSchema);
