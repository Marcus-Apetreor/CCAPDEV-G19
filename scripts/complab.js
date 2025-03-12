document.addEventListener("DOMContentLoaded", () => {
    const reserveForStudentContainer = document.getElementById("reserveForStudentContainer");
    const reserveForStudentCheckbox = document.getElementById("reserveForStudentCheckbox");
    const studentReservationPopup = document.getElementById("studentReservationPopup");
    const studentUsernameInput = document.getElementById("studentUsernameInput");
    const confirmStudentReservation = document.getElementById("confirmStudentReservation");
    const closePopup = document.querySelector(".close-popup");
    const popupOverlay = document.getElementById("popupOverlay");
    const reserveBtn = document.getElementById("reserve-btn");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("You must be logged in to make a reservation.");
        window.location.href = "login.html";
        return;
    }

    const userTier = user.tier;
    let studentUsername = null; // Placeholder for selected student's username

    if (userTier === 3 || userTier === 4) {
        reserveForStudentContainer.style.display = "inline-flex";  // Ensures proper alignment
        reserveForStudentContainer.style.alignItems = "center";
        reserveForStudentContainer.style.gap = "5px";
    }

    // Handle reserve button click
    reserveBtn.addEventListener("click", () => {
        if (reserveForStudentCheckbox.checked) {
            // **Show popup & overlay**
            studentReservationPopup.style.display = "block";
            popupOverlay.style.display = "block";
        } else {
            // **Proceed with normal reservation (logged-in user)**
            submitReservation(user.username);
        }
    });

    // Close popup
    closePopup.addEventListener("click", () => {
        studentReservationPopup.style.display = "none";
        popupOverlay.style.display = "none";
    });

    popupOverlay.addEventListener("click", () => {
        studentReservationPopup.style.display = "none";
        popupOverlay.style.display = "none";
    });

    // Confirm Student Selection
    confirmStudentReservation.addEventListener("click", async () => {
        const enteredUsername = studentUsernameInput.value.trim();
        if (!enteredUsername) {
            alert("Please enter a valid username.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/check-student?username=${enteredUsername}`);
            const result = await response.json();

            if (response.ok && result.exists) {
                studentUsername = enteredUsername;
                studentReservationPopup.style.display = "none"; // Close popup
                popupOverlay.style.display = "none";
                submitReservation(studentUsername); // Proceed with reservation under student's name
            } else {
                alert("Student not found. Please enter a valid username.");
            }
        } catch (error) {
            console.error("Error checking student:", error);
            alert("An error occurred. Please try again.");
        }
    });
});


// Submit Reservation Function
async function submitReservation(usernameOverride = null) {
    const room = document.getElementById("seat-selection").value;
    const date = document.getElementById("date-selection").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const selectedSeats = Array.from(document.querySelectorAll(".seat.selected")).map(seat => seat.textContent);
    const errorMessage = document.getElementById("error-message");

    // Get logged-in user
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("You must be logged in to make a reservation.");
        window.location.href = "login.html";
        return;
    }

    const userTier = user.tier;
    const timeslot = `${startTime} - ${endTime}`;
    const reservationUsername = usernameOverride ? usernameOverride : user.username; // Use student username if provided
    const reservationMinutes = getMinutesDifference(startTime, endTime);

    // Validation checks
    if (selectedSeats.length === 0) {
        errorMessage.textContent = "Error: Please select at least one seat.";
        return;
    }
    if (!room || !date || !startTime || !endTime) {
        errorMessage.textContent = "Error: Please fill in all required fields.";
        return;
    }
    if (convertToDate(endTime) <= convertToDate(startTime)) {
        errorMessage.textContent = "Error: End time must be later than start time.";
        return;
    }

    // Prevent past date selection
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
        errorMessage.textContent = "Error: You cannot select a past date.";
        return;
    }

    // Fetch user's total reservation duration for the day
    let dailyReservedMinutes = 0;
    try {
        const response = await fetch(`http://localhost:3000/user-reservations?username=${user.username}&date=${date}`);
        const data = await response.json();

        if (response.ok) {
            dailyReservedMinutes = data.totalMinutes;
        } else {
            console.warn("Failed to fetch user's daily reservations:", data.error);
        }
    } catch (error) {
        console.error("Error fetching user's daily reservations:", error);
    }

    // Restrict total daily reservation time to 90 minutes for Tier 1 & 2
    if ((userTier === 1 || userTier === 2) && (dailyReservedMinutes + reservationMinutes > 90)) {
        errorMessage.textContent = `Error: You can only reserve up to 90 minutes per day. You have already reserved ${dailyReservedMinutes} minutes.`;
        return;
    }

    errorMessage.textContent = ""; // Clear previous errors

    // Prevent Tier 1 & 2 from reserving multiple seats
if ((userTier === 1 || userTier === 2) && selectedSeats.length > 1) {
    errorMessage.textContent = "Error: You can only reserve one seat at a time.";
    return;
}

// Process each selected seat as a separate reservation
let successfulReservations = 0;
let failedReservations = 0;

for (let seat of selectedSeats) {
        try {
            // Check for conflicts
            const checkResponse = await fetch("http://localhost:3000/check-reservation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room, roomType: "complab", date, timeslot, seat, userTier })
            });

            const checkResult = await checkResponse.json();

            if (checkResult.requireConfirmation) {
                const userConfirmed = confirm(checkResult.message);
                if (!userConfirmed) return;
            }

            // Submit reservation
            const response = await fetch("http://localhost:3000/reserve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    room, 
                    roomType: "complab", 
                    date, 
                    timeslot, 
                    seat, 
                    username: reservationUsername, 
                    userTier 
                })
            });

            const result = await response.json();

            if (response.ok) {
                successfulReservations++;
            } else {
                failedReservations++;
            }
        } catch (error) {
            console.error(`Reservation error for seat ${seat}:`, error);
            failedReservations++;
        }
    }

    // Notify user
    if (successfulReservations > 0) {
        alert(`Successfully reserved ${successfulReservations} seat(s) for ${timeslot}.`);
    }
    if (failedReservations > 0) {
        alert(`Failed to reserve ${failedReservations} seat(s). Some may already be booked.`);
    }
}



// Ensure button is correctly linked to the function
document.addEventListener("DOMContentLoaded", () => {
   

    // Set min date to today
    const dateInput = document.getElementById("date-selection");
    const today = new Date().toISOString().split("T")[0];
    dateInput.setAttribute("min", today);
});

// Function to convert time string to Date object for comparison
function convertToDate(timeStr) {
    let [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return new Date(2000, 0, 1, hours, minutes);
}

// Function to calculate the difference between two times in minutes
function getMinutesDifference(startTime, endTime) {
    const start = convertToDate(startTime);
    const end = convertToDate(endTime);
    return (end - start) / (1000 * 60); // Convert milliseconds to minutes
}
