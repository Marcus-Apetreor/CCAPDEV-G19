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

// Configure CORS to allow requests from frontend-backend
app.use(cors({
    origin: 'http://localhost:5500', // Replace with frontend port
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from the uploads directory

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Configure multer for file uploads
// documentation: https://www.npmjs.com/package/multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Update Profile Route
app.post('/update-profile', upload.single('profilePicture'), async (req, res) => {
    try {
        const { bio } = req.body;
        const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;
        const userId = req.user._id; // display user id

        const updatedData = { bio };
        if (profilePicture) {
            updatedData.profilePicture = profilePicture;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

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

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            tier,
            bio: null,
            approved: tier === 1 // Automatically approve tier 1 accounts
        });

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

app.post("/check-reservation", async (req, res) => {
    try {
        const { room, roomType, date, timeslot, seat, userTier } = req.body;

        if (!room || !roomType || !date || !timeslot || userTier === undefined) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        function parseTime(timeString) {
            let [time, modifier] = timeString.split(" ");
            let [hours, minutes] = time.split(":").map(Number);
            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;
            return hours * 60 + minutes;
        }

        const newStart = parseTime(timeslot.split(" - ")[0]);
        const newEnd = parseTime(timeslot.split(" - ")[1]);

        let conflictingReservations = await Reservation.find({ room, date, seat });

        for (let reservation of conflictingReservations) {
            const existingStart = parseTime(reservation.timeslot.split(" - ")[0]);
            const existingEnd = parseTime(reservation.timeslot.split(" - ")[1]);

            if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                const existingUser = await User.findOne({ username: reservation.username });

                if (!existingUser) {
                    console.warn(`Warning: User ${reservation.username} not found.`);
                    continue;
                }

                const existingUserTier = existingUser.tier;

                // **Enforce Tier-Based Overwriting Rules**
                const canOverwrite = 
                    (userTier === 3 && existingUserTier <= 2) ||  // Tier 3 can overwrite Tier 1 and 2
                    (userTier === 4 && existingUserTier <= 3);   // Tier 4 can overwrite Tier 1, 2, and 3

                if (canOverwrite) {
                    return res.status(200).json({
                        message: `There is already a reservation by a lower-tier user (Tier ${existingUserTier}). Do you want to overwrite their reservation?`,
                        requireConfirmation: true
                    });
                } else {
                    return res.status(400).json({ error: "There is already a reservation within this timeslot." });
                }
            }
        }

        res.status(200).json({ message: "No conflicts found. You can proceed with the reservation." });
    } catch (error) {
        console.error("Check Reservation Error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});



app.post("/reserve", async (req, res) => {
    try {
        const { room, roomType, date, timeslot, seat, username, userTier, confirmOverwrite } = req.body;

        if (!room || !roomType || !date || !timeslot || !username || userTier === undefined) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        function parseTime(timeString) {
            let [time, modifier] = timeString.split(" ");
            let [hours, minutes] = time.split(":").map(Number);
            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;
            return hours * 60 + minutes;
        }

        if (roomType === "complab") {
            const newStart = parseTime(timeslot.split(" - ")[0]);
            const newEnd = parseTime(timeslot.split(" - ")[1]);

            let conflictingReservations = await Reservation.find({ room, date, seat });

            for (let reservation of conflictingReservations) {
                const existingStart = parseTime(reservation.timeslot.split(" - ")[0]);
                const existingEnd = parseTime(reservation.timeslot.split(" - ")[1]);

                if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                    const existingUser = await User.findOne({ username: reservation.username });

                    if (!existingUser) {
                        console.warn(`Warning: User ${reservation.username} not found.`);
                        continue;
                    }

                    const existingUserTier = existingUser.tier;

                    // **Enforce Tier-Based Overwriting Rules**
                    const canOverwrite = 
                        (userTier === 3 && existingUserTier <= 2) ||  // Tier 3 can overwrite Tier 1 and 2
                        (userTier === 4 && existingUserTier <= 3);   // Tier 4 can overwrite Tier 1, 2, and 3
    
                    if (canOverwrite) {
                        return res.status(200).json({
                            message: `There is already a reservation by a lower-tier user (Tier ${existingUserTier}). Do you want to overwrite their reservation?`,
                            requireConfirmation: true
                        });
                    } else {
                        return res.status(400).json({ error: "There is already a reservation within this timeslot." });
                    }
                }
            }
        } else {
            let existingReservation = await Reservation.findOne({ room, date, timeslot });

            if (existingReservation) {
                const existingUser = await User.findOne({ username: existingReservation.username });

                if (!existingUser) {
                    console.warn(`Warning: User ${existingReservation.username} not found.`);
                    return res.status(400).json({ error: "Room is already reserved at this date and timeslot." });
                }

                const existingUserTier = existingUser.tier;

                if (existingUserTier < userTier) {
                    if (!confirmOverwrite) {
                        return res.status(200).json({
                            message: `This room is already reserved by a lower-tier user (Tier ${existingUserTier}). Do you want to overwrite their reservation?`,
                            requireConfirmation: true
                        });
                    } else {
                        await Reservation.deleteOne({ _id: existingReservation._id });
                    }
                } else {
                    return res.status(400).json({ error: "Room is already reserved at this date and timeslot." });
                }
            }
        }

        const newReservation = new Reservation({ room, roomType, date, timeslot, seat: seat || null, username, userTier });
        await newReservation.save();

        res.status(201).json({ message: "Reservation successful!" });

    } catch (error) {
        console.error("Reservation Error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

app.get("/check-student", async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: "Username is required." });

        const student = await User.findOne({ username, tier: 1 }); // Ensure it's a student
        res.status(200).json({ exists: !!student });

    } catch (error) {
        console.error("Error checking student:", error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
});

app.get("/user-reservations", async (req, res) => {
    try {
        const { username, date } = req.query;

        if (!username || !date) {
            return res.status(400).json({ error: "Username and date are required." });
        }

        function convertToDate(timeStr) {
            let [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":").map(Number);
        
            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;
        
            return new Date(2000, 0, 1, hours, minutes);
        }
        

        function getMinutesDifference(startTime, endTime) {
            const start = convertToDate(startTime);
            const end = convertToDate(endTime);
            return (end - start) / (1000 * 60); // Convert milliseconds to minutes
        }

        const reservations = await Reservation.find({ username, date });

        let totalMinutes = 0;
        reservations.forEach(reservation => {
            const [startTime, endTime] = reservation.timeslot.split(" - ");
            totalMinutes += getMinutesDifference(startTime, endTime);
        });

        res.status(200).json({ totalMinutes });
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
});

// Fetch pending accounts
app.get('/pending-accounts', async (req, res) => {
    try {
        const pendingAccounts = await User.find({ approved: false, tier: { $gt: 1 } });
        res.status(200).json(pendingAccounts);
    } catch (error) {
        console.error('Error fetching pending accounts:', error);
        res.status(500).json({ error: 'Server error, please try again later.' });
    }
});

// Approve account
app.post('/approve-account/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndUpdate(id, { approved: true });
        res.status(200).json({ message: 'Account approved successfully' });
    } catch (error) {
        console.error('Error approving account:', error);
        res.status(500).json({ error: 'Server error, please try again later.' });
    }
});

// Disapprove account
app.post('/disapprove-account/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'Account disapproved and deleted successfully' });
    } catch (error) {
        console.error('Error disapproving account:', error);
        res.status(500).json({ error: 'Server error, please try again later.' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
