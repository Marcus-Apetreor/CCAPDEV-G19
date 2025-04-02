// Function to check reservation
async function checkReservation(room, roomType, date, timeslot, seat, userTier) {
    try {
        const response = await fetch("http://localhost:3000/check-reservation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, roomType, date, timeslot, seat, userTier })
        });

        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error checking reservation:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

// Function to reserve a seat
async function reserveSeat(room, roomType, date, timeslot, seat, username, userTier) {
    try {
        const response = await fetch("http://localhost:3000/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                room, 
                roomType, 
                date, 
                timeslot, 
                seat, 
                username, 
                userTier 
            })
        });

        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error reserving seat:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

// Function to check reservation seats
async function checkReservationSeats(room, date, timeslot) {
    try {
        const response = await fetch("http://localhost:3000/check-reservation-seats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, date, timeslot })
        });

        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error checking reservation seats:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

async function checkStudent(username) {
    try {
        const response = await fetch(`http://localhost:3000/check-student?username=${username}`);
        if (!response.ok) throw new Error("Failed to check student.");
        return await response.json();
    } catch (error) {
        console.error("Error checking student:", error);
        throw error;
    }
}

// Export the functions
export { 
    checkReservation, 
    reserveSeat, 
    checkReservationSeats,
    checkStudent
};