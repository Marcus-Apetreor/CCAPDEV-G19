import { 
    checkReservation, 
    reserveRoom 
} from "../models/conferenceroomModel.js";

async function submitReservation(confirmOverwrite = false) {
    const room = document.getElementById("room-selection").value;
    const date = document.getElementById("date-selection").value;
    const timeslot = document.getElementById("timeslot-selection").value;
    const seat = document.getElementById("seat-selection")?.value || null; // Allow null values

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("You must be logged in to make a reservation.");
        window.location.href = "/views/login.html"; 
        return;
    }

    const userTier = user.tier;
    const roomType = "conference";

    if (!room || !date || !timeslot) {
        alert("Please fill in all required fields before reserving.");
        return;
    }

    try {
        // **Step 1: Check for existing reservations using the new function**
        const result1 = await checkReservation(room, roomType, date, timeslot, seat, userTier);

        if (result1.requireConfirmation) {
            const userConfirmed = confirm(checkResult.message); // **Step 2: Ask user for confirmation**
            if (!userConfirmed) {
                return; // Stop if user declines to overwrite
            }
        } else if (!checkResult.success) {
            alert(`Error: ${checkResult.error}`);
            return;
        }

        // **Step 3: Proceed with reservation**
        const result2 = await reserveRoom(room, roomType, date, timeslot, seat, user.username, userTier, confirmOverwrite);

        if (result2.success) {
            alert("Reservation successful!");
        } else {
            alert(`Error: ${result2.error}`);
        }

    } catch (error) {
        console.error("Reservation error:", error);
        alert("Something went wrong. Please try again.");
    }
}

//cruds
