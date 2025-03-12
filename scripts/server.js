require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // For password hashing
const multer = require('multer'); // For handling file uploads
const path = require('path');
const User = require('./models/User'); // Import User model
const Reservation = require("./models/Reservation"); 
const fs = require('fs');




const app = express();

// Configure CORS to allow requests from your frontend origin
app.use(cors());

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from the uploads directory

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

const imgDir = path.join(__dirname, '..', 'img'); // ✅ Moves "img" outside "scripts"

if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

// Configure multer to store profile pictures in "img/" outside "scripts/"
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imgDir); // ✅ Save images to "img/" outside "scripts/"
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Serve static images correctly
app.use('/img', express.static(imgDir));
const rootDir = path.join(__dirname, '..');

// Serve static files (CSS, JS, images, etc.) from the root folder
app.use(express.static(rootDir));

// Serve mainhub.html when visiting localhost:3000
app.get("/", (req, res) => {
    res.sendFile(path.join(rootDir, 'mainhub.html'));
});

app.post('/register', async (req, res) => {
    console.log("Received a request to /register");
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);

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
            return res.status(400).json({ error: "Username or email already exists" });
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
            profilePicture: "/img/defaultdp.png", // Assign default profile picture
            approved: tier === 1
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});


app.post('/update-profile', upload.single('profilePicture'), async (req, res) => {
    try {
        const { bio, username } = req.body; // ✅ Use username

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const profilePicture = req.file ? `/img/${req.file.filename}` : null; // ✅ Correct path

        const updateData = { bio };
        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }

        const updatedUser = await User.findOneAndUpdate({ username }, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Server error, please try again later." });
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
                tier: user.tier,
                profilePicture: user.profilePicture
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

app.get('/get-user', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: "Username is required." });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found." });

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user data:", error);
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

app.get("/my-reservations", async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: "Username is required." });
        }

        const userReservations = await Reservation.find({ username });
        res.status(200).json(userReservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
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
