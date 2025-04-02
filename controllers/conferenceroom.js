import { checkReservation, reserveRoom } from "../models/conferenceroomModel.js";

async function submitReservation(confirmOverwrite = false) {
    const room = document.getElementById("room-selection").value;
    const date = document.getElementById("date-selection").value;
    const timeslot = document.getElementById("timeslot-selection").value;
    const seat = document.getElementById("seat-selection")?.value || null; // Allow null values

    // Get logged-in user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("You must be logged in to make a reservation.");
        window.location.href = "../views/login.html"; 
        return;
    }

    const userTier = user.tier;
    const roomType = "conference";

    // Check if all required fields are filled
    if (!room || !date || !timeslot) {
        alert("Please fill in all required fields before reserving.");
        return;
    }

    try {
        // **Step 1: Check for existing reservations**
        const checkResult = checkReservation(room, roomType, date, timeslot, seat, userTier);

        if (checkResponse.ok) {
            if (checkResult.requireConfirmation) {
                // **Step 2: Ask user for confirmation before overwriting**
                const userConfirmed = confirm(checkResult.message);
                if (!userConfirmed) {
                    return; // Stop if user declines to overwrite
                }
            }
        } else {
            alert(`Error: ${checkResult.error}`);
            return;
        }

        // **Step 3: Proceed with reservation (with overwrite if needed)**
        const reserveResult = reserveRoom(room, roomType, date, timeslot, seat, user.username, userTier, true);

        if (reserveResult.ok) {
            alert("Reservation successful!");
        } else {
            alert(`Error: ${reserveResult.error}`);
        }

    } catch (error) {
        console.error("Reservation error:", error);
        alert("Something went wrong. Please try again.");
    }
}

// Ensure button is correctly linked to the function
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("button").addEventListener("click", submitReservation);
    const dateInput = document.getElementById("date-selection");
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    dateInput.setAttribute("min", today); // Set min date to today
});
