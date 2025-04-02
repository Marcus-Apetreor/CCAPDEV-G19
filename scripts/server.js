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
const Application = require("./models/Application"); 
const session = require('express-session');

const app = express();


app.use(session({
    secret: 'secret-key',  // Keep this key secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Cookies should be secure only in production (via HTTPS)
        httpOnly: true, // Prevent client-side JS from accessing cookies
        sameSite: 'strict', // Prevent CSRF attacks
        maxAge: 24 * 60 * 60 * 1000 // 1-day session expiration, adjust as needed
    }
}));

// Configure CORS to allow requests from your frontend origin
app.use(cors());

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from the uploads directory

// Middleware for session expiration or tracking last activity
app.use((req, res, next) => {
    const sessionDuration = 30 * 60 * 1000; // Set session duration to 30 minutes
    const currentTime = Date.now();

    if (req.session.user) {
        // If the session exists, check if lastActivity is defined
        if (req.session.user.lastActivity) {
            const elapsed = currentTime - req.session.user.lastActivity;
            if (elapsed > sessionDuration) {
                req.session.destroy((err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Session expired, failed to log out' });
                    }
                    res.clearCookie('connect.sid'); // Clear session cookie if expired
                    return res.status(403).json({ error: 'Session expired, please log in again.' });
                });
            }
        }
        // Update the lastActivity timestamp for the active session
        req.session.user.lastActivity = currentTime;
    } else {
        // If req.session.user is undefined, initialize it (optional)
        req.session.user = {};
    }

    next(); // Continue with the next middleware/route handler
});


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


async function createUsersFromSampleData() {
    try {
        // load sample data
        const sampleData = JSON.parse(fs.readFileSync('sample_data/sample-users.json', 'utf-8'));

        for (const userData of sampleData) {
            const { username, email, password, tier, bio, profilePicture, approved } = userData;

            // check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log(`User with email ${email} already exists.`);
                continue;
            }

            // hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // create new user
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                tier,
                bio: bio || null,
                profilePicture: profilePicture || "/img/defaultdp.png",
                approved: approved !== undefined ? approved : false // default false if not specified
            });

            await newUser.save();
            console.log(`User ${username} created successfully.`);
        }
    } catch (error) {
        console.error("Error creating users:", error);
    }
}
createUsersFromSampleData();

function checkAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(403).json({ error: 'You must be logged in to access this route.' });
    }
    next(); // Proceed to the next middleware/route handler
}

async function createReservationsFromSampleData() {
    try {
        // load sample reservation data
        const sampleData = JSON.parse(fs.readFileSync('sample_data/sample-reservations.json', 'utf-8'));

        for (const reservationData of sampleData) {
            const { room, roomType, date, timeslot, seat, username } = reservationData;

            // check if the same reservation already exists
            const existingReservation = await Reservation.findOne({ room, date, timeslot, seat, username });
            if (existingReservation) {
                console.log(`Reservation for ${username} in room ${room} on ${date} at ${timeslot} already exists.`);
                continue;
            }

            // create new reservation
            const newReservation = new Reservation({
                room,
                roomType,
                date,
                timeslot,
                seat: seat || null, // default to null if not specified
                username
            });

            await newReservation.save();
            console.log(`Reservation for ${username} in room ${room} on ${date} at ${timeslot} created successfully.`);
        }
    } catch (error) {
        console.error("Error creating reservations:", error);
    }
}
createReservationsFromSampleData();



app.post('/register', checkAuth, async (req, res) => {
    console.log("Received a request to /register");
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);

    try {
        const { username, email, password, repeatPassword, accountType } = req.body;

        // Validate input
        if (!username || !email || !password || !repeatPassword || !accountType) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (password !== repeatPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: "Username or email already exists" });
        }

        // Mapping account types to tiers
        const tierMapping = { 
            student: 1, 
            officer: 2, 
            professor: 3,  
            admin: 4 
        };
        const tier = tierMapping[accountType.toLowerCase()] || 1;

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (tier === 2 || tier === 3 || tier === 4) {
            // Store tier 2 or 3 users in the Application database
            const newApplication = new Application({
                username,
                email,
                password: hashedPassword,
                tier,
                bio: null,
                profilePicture: "/img/defaultdp.png", // Default profile picture
            });

            await newApplication.save();

            // Send back confirmation response with alert message for tier 2 or 3 users
            res.status(201).json({ 
                message: "Application sent! Kindly wait for approval from the administrator." 
            });
        } else {
            // For tier 1 (student) and tier 4 (admin), create the user directly in the User database
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                tier,
                bio: null,
                profilePicture: "/img/defaultdp.png", // Default profile picture
                approved: true // Auto approve for tier 1 and 4
            });

            await newUser.save();
            res.status(201).json({ message: "User registered successfully" });
        }

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});



app.post('/update-profile', upload.single('profilePicture'), checkAuth, async (req, res) => {
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

        // **4. Regenerate session ID for security (session fixation protection)**
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to regenerate session.' });
            }

            // **5. Store user data in the session**
            req.session.user = {
                username: user.username,
                tier: user.tier,
                profilePicture: user.profilePicture
            };

            // **6. Return success response**
            res.status(200).json({
                message: "Login successful",
                user: {
                    username: user.username,
                    email: user.email,
                    tier: user.tier,
                    profilePicture: user.profilePicture
                }
            });
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});


app.post("/check-reservation", checkAuth, async (req, res) => {
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
                    (userTier === 4);   // Tier 4 can overwrite Tier 1, 2, and 3

                if (canOverwrite) {
                    return res.status(200).json({
                        message: `There is already a reservation by another user (Tier ${existingUserTier}). Do you want to overwrite their reservation?`,
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

app.post("/check-reservation-seats", checkAuth, async (req, res) => {
    try {
        const { room, date, timeslot } = req.body;

        if (!room || !date || !timeslot) {
            return res.status(400).json({ error: "Room, date, and timeslot are required" });
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

        let conflictingReservations = await Reservation.find({ room, date });

        let takenSeats = [];

        for (let reservation of conflictingReservations) {
            const existingStart = parseTime(reservation.timeslot.split(" - ")[0]);
            const existingEnd = parseTime(reservation.timeslot.split(" - ")[1]);

            if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                if (reservation.seat) {
                    takenSeats.push(reservation.seat);
                }
            }
        }

        res.status(200).json({
            message: "Checked reservations.",
            takenSeats: takenSeats
        });
    } catch (error) {
        console.error("Check Reservation Error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});



app.post("/reserve", checkAuth, async (req, res) => {
    try {
        const { room, roomType, date, timeslot, seat, username, userTier, confirmOverwrite } = req.body;

        if (!room) {
            return res.status(400).json({ error: "Room is required" });
        }
        if (!roomType) {
            return res.status(400).json({ error: "Room Type is required" });
        }
        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }
        if (!timeslot) {
            return res.status(400).json({ error: "Timeslot is required" });
        }
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        if (userTier === undefined) {
            return res.status(400).json({ error: "User Tier is required" });
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
                        (userTier === 4);   // Tier 4 can overwrite Tier 1, 2, and 3
    
                    if (canOverwrite) {
                        return res.status(200).json({
                            message: `There is already a reservation by another user (Tier ${existingUserTier}). Do you want to overwrite their reservation?`,
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
                            message: `This room is already reserved by another user (Tier ${existingUserTier}). Do you want to overwrite their reservation?`,
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

app.delete('/cancel-reservation', checkAuth, async (req, res) => {
    console.log("Received DELETE request:", req.body);

    try {
        let { room, seat, date, timeslot, username } = req.body;

        if (!room || !date || !timeslot || !username) {
            console.log("Missing required fields!");
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 🔹 Convert seat "null" (string) to actual null value
        if (seat === "null" || seat === "N/A") {
            seat = null;
        }

        console.log(`Searching for reservation: Room=${room}, Seat=${seat}, Date=${date}, Time=${timeslot}, User=${username}`);

        const deletedReservation = await Reservation.findOneAndDelete({
            room,
            seat,
            date,
            timeslot,
            username
        });

        if (!deletedReservation) {
            console.log("Reservation not found!");
            return res.status(404).json({ error: "Reservation not found" });
        }

        console.log("Reservation canceled successfully.");
        res.status(200).json({ message: "Reservation canceled successfully" });

    } catch (error) {
        console.error("Error canceling reservation:", error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
});



app.get("/check-student", checkAuth, async (req, res) => {
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

app.get('/get-user', checkAuth, async (req, res) => {
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




app.get("/user-reservations", checkAuth, async (req, res) => {
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

app.get("/reservations", checkAuth, async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch reservations" });
    }
});

// Update reservation when seat is "N/A" or null
app.put("/update-reservation", checkAuth, async (req, res) => {
    try {
        const { 
            originalUsername, 
            originalRoom, 
            originalDate, 
            originalTimeblock, 
            username, 
            room, 
            date, 
            timeslot, 
            seat 
        } = req.body;

        if (!originalUsername || !originalRoom || !originalDate || !originalTimeblock) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const updatedReservation = await Reservation.findOneAndUpdate(
            { 
                username: originalUsername, 
                room: originalRoom, 
                date: originalDate, 
                timeslot: originalTimeblock 
            }, // Find using original values
            { username, room, seat, date, timeslot }, // Update fields
            { new: true } // Return updated document
        );

        if (!updatedReservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.status(200).json({ message: "Reservation updated successfully", updatedReservation });
    } catch (error) {
        console.error("Error updating reservation:", error);
        res.status(500).json({ error: "Server error. Please try again." });
    }
});



app.get("/my-reservations", checkAuth, async (req, res) => {
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

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).json({ message: 'Logged out successfully' });
    });
});


// Server-side endpoint to retrieve all accounts in the Application database
app.get('/pending-accounts', checkAuth, async (req, res) => {
    try {
        // Fetch all accounts from the Application collection
        const applications = await Application.find();

        // Return the accounts to the client
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching pending accounts:', error);
        res.status(500).json({ error: 'Failed to fetch pending accounts' });
    }
});


// Approve account route
// Approve account route (use username instead of accountId)
app.put('/approve-account/:username', checkAuth, async (req, res) => {
    try {
        const { username } = req.params;

        // Find the application by username
        const application = await Application.findOne({ username });
        if (!application) {
            return res.status(404).json({ error: "Account not found" });
        }

        // Create the new user from the application
        const newUser = new User({
            username: application.username,
            email: application.email,
            password: application.password,  // Assuming password is already hashed
            tier: application.tier,
            bio: application.bio || null,
            profilePicture: application.profilePicture || "/img/defaultdp.png",
            approved: true // Mark as approved
        });

        await newUser.save();
        await Application.deleteOne({ username }); // Remove from Application collection

        res.status(200).json({ message: "Account approved and moved to User collection" });
    } catch (error) {
        console.error('Error approving account:', error);
        res.status(500).json({ error: 'Failed to approve account' });
    }
});


// Disapprove account route (use username instead of accountId)
app.delete('/disapprove-account/:username', checkAuth, async (req, res) => {
    try {
        const { username } = req.params;

        // Delete the application from the Application collection using the username
        const application = await Application.deleteOne({ username });
        if (!application.deletedCount) {
            return res.status(404).json({ error: "Account not found" });
        }

        res.status(200).json({ message: "Account disapproved and deleted" });
    } catch (error) {
        console.error('Error disapproving account:', error);
        res.status(500).json({ error: 'Failed to disapprove account' });
    }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
