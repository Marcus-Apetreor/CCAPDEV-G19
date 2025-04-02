// Fetch all reservations
async function fetchReservations() {
    try {
        const response = await fetch("http://localhost:3000/reservations");
        if (!response.ok) throw new Error("Failed to fetch reservations.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching reservations:", error);
        throw error;
    }
}

// Cancel a reservation
async function cancelAReservation(room, seat, date, timeslot, username) {
    try {
        const response = await fetch("http://localhost:3000/cancel-reservation", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, seat, date, timeslot, username })
        });

        if (!response.ok) throw new Error("Failed to cancel reservation.");
        return await response.json();
    } catch (error) {
        console.error("Error canceling reservation:", error);
        throw error;
    }
}

// Update a reservation
async function updateReservation(updatedReservation) {
    try {
        const response = await fetch("http://localhost:3000/update-reservation", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedReservation)
        });

        if (!response.ok) throw new Error("Failed to update reservation.");
        return await response.json();
    } catch (error) {
        console.error("Error updating reservation:", error);
        throw error;
    }
}

// Check if a student exists
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

// Check for existing reservations
async function checkReservation(reservationData) {
    try {
        const response = await fetch("http://localhost:3000/check-reservation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reservationData)
        });

        if (!response.ok) throw new Error("Failed to check reservation.");
        return await response.json();
    } catch (error) {
        console.error("Error checking reservation:", error);
        throw error;
    }
}

// Reserve a room
async function reserveRoom(reservationData) {
    try {
        const response = await fetch("http://localhost:3000/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reservationData)
        });

        if (!response.ok) throw new Error("Failed to reserve room.");
        return await response.json();
    } catch (error) {
        console.error("Error reserving room:", error);
        throw error;
    }
}

// Export all functions
export {
    fetchReservations,
    cancelAReservation,
    updateReservation,
    checkStudent,
    checkReservation,
    reserveRoom
};