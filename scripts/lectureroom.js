async function submitReservation() {
    const room = document.getElementById("room-selection").value;
    const date = document.getElementById("date-selection").value;
    const timeslot = document.getElementById("timeslot-selection").value;
    const seat = document.getElementById("seat-selection")?.value || null; // Allow null values

    // Get logged-in user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        alert("You must be logged in to make a reservation.");
        window.location.href = "login.html"; // Redirect to login
        return;
    }

    // Check if all required fields are filled
    if (!room || !date || !timeslot) {
        alert("Please fill in all required fields before reserving.");
        return;
    }

    const roomType = "lecture";

    // Debugging logs
    console.log("Submitting Reservation:", { room, roomType, date, timeslot, seat, username: user.username });

    try {
        const response = await fetch("http://localhost:3000/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, roomType, date, timeslot, seat, username: user.username })
        });

        const result = await response.json();
        

        if (response.ok) {
            alert("Reservation successful!");
        } else {
            alert(`Error: ${result.error}`);
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
