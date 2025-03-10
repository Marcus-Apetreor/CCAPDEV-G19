require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // For password hashing
const User = require('./models/User'); // Import User model
const Reservation = require("./models/Reservation"); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// **Register Route**
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, repeatPassword, accountType } = req.body;

        if (!username || !email || !password || !repeatPassword || !accountType) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (password !== repeatPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: "Username or Email already exists" });
        }

        const tierMapping = { 
            student: 1, 
            officer: 2, 
            professor: 3,  
            admin: 4 
        };
        const tier = tierMapping[accountType.toLowerCase()] || 1;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword, tier });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // **1. Validate Input**
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // **2. Check if the user exists**
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // **3. Compare passwords**
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // **4. Return success response**
        res.status(200).json({
            message: "Login successful",
            user: {
                username: user.username,
                email: user.email,
                tier: user.tier
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

app.post("/reserve", async (req, res) => {
    try {
        const { room, roomType, date, timeslot, seat, username } = req.body;

        // Validate required fields
        if (!room || !roomType || !date || !timeslot || !username) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        // Check if the room is already booked
        const existingReservation = await Reservation.findOne({ room, date, timeslot });

        if (existingReservation) {
            return res.status(400).json({ error: "Room is already reserved at this date and timeslot" });
        }

        // Create new reservation
        const newReservation = new Reservation({ room, roomType, date, timeslot, seat: seat || null, username });
        await newReservation.save();

        res.status(201).json({ message: "Reservation successful!" });
    } catch (error) {
        console.error("Reservation Error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
