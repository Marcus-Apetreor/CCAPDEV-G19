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

async function reserveRoom(room, roomType, date, timeslot, seat, username, userTier, confirmOverwrite = false) {
    try {
        const response = await fetch("http://localhost:3000/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, roomType, date, timeslot, seat, username, userTier, confirmOverwrite })
        });

        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error reserving room:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

export { 
    reserveRoom,     
    checkReservation 
};