// Function to check for existing reservations
async function checkReservation(room, roomType, date, timeslot, seat, userTier) {
    try {
        const response = await fetch("http://localhost:3000/check-reservation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, roomType, date, timeslot, seat, userTier })
        });

        if (!response.ok) throw new Error("Failed to check reservation");
        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error checking reservation:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

// Function to reserve a room
async function reserveRoom(room, roomType, date, timeslot, seat, username, userTier, confirmOverwrite = false) {
    try {
        const response = await fetch("http://localhost:3000/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, roomType, date, timeslot, seat, username, userTier, confirmOverwrite })
        });

        if (!response.ok) throw new Error("Failed to reserve room");
        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error reserving room:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

// Export the functions
export { 
    checkReservation, 
    reserveRoom 
};