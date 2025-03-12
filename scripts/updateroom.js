document.addEventListener("DOMContentLoaded", async function () {
    const filterDropdown = document.getElementById("filterRoomType");
    const searchInput = document.getElementById("searchRoom");
    const searchButton = document.getElementById("searchButton");
    const tableBody = document.getElementById("reservationTable");

    let allReservations = []; // Store all reservations from DB
    let isSearching = false; // Track if search is active

    // Fetch reservations from database
    async function fetchReservations() {
        try {
            const response = await fetch("http://localhost:3000/reservations");
            if (!response.ok) throw new Error("Failed to fetch reservations.");
            allReservations = await response.json();
            renderReservations();
        } catch (error) {
            console.error("Error fetching reservations:", error);
        }
    }

  // Render reservations based on filters OR search
function renderReservations() {
    let filteredReservations = allReservations;

    if (isSearching) {
        const searchQuery = searchInput.value.trim().toLowerCase();
        filteredReservations = allReservations.filter(res => 
            res.room.toLowerCase().includes(searchQuery)
        );

        // Reset dropdown when searching
        filterDropdown.value = "all";
        isSearching = false;
    } else {
        const selectedFilter = filterDropdown.value;
        if (selectedFilter !== "all") {
            filteredReservations = allReservations.filter(res => res.roomType === selectedFilter);
        }
    }

    // Populate table
    tableBody.innerHTML = filteredReservations.map(res => `
        <tr>
            <td>${res.username}</td>
            <td>${res.room}</td>
            <td>${res.seat || "N/A"}</td>
            <td>${res.date}</td>
            <td>${res.timeslot}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-index="${allReservations.indexOf(res)}">
                    Edit
                </button>
                <button class="btn btn-danger btn-sm cancel-btn" data-room="${res.room}" data-seat="${res.seat || "N/A"}"
                    data-date="${res.date}" data-timeslot="${res.timeslot}" data-username="${res.username}">
                    Cancel
                </button>
            </td>
        </tr>
    `).join('');

    // Attach cancel event listeners
    document.querySelectorAll(".cancel-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const { room, seat, date, timeslot, username } = this.dataset;
            if (confirm("Are you sure you want to cancel this reservation?")) {
                await cancelReservation(room, seat, date, timeslot, username);
                fetchReservations(); // Refresh table after deletion
            }
        });
    });

    // Attach edit event listeners
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            const index = this.dataset.index;
            editReservation(index);
        });
    });
}


function editReservation(index) {
    const res = allReservations[index];

    document.getElementById("editIndex").value = index;
    document.getElementById("editUsername").value = res.username;
    document.getElementById("editRoom").value = res.room;
    document.getElementById("editSeat").value = res.seat || "";
    document.getElementById("editDate").value = res.date;

    // Store original values to help find the reservation when updating
    originalUsername = res.username;
    originalRoom = res.room;
    originalDate = res.date;
    originalTimeblock = res.timeslot;

    const seatInput = document.getElementById("editSeat");
    const timeBlockSelect = document.getElementById("editTimeBlock");
    const startTimeSelect = document.getElementById("start-time");
    const endTimeSelect = document.getElementById("end-time");
    const startTimeContainer = document.getElementById("startTimeContainer");
    const endTimeContainer = document.getElementById("endTimeContainer");

    // Available time block options
    const timeBlockOptions = [
        "7:30 AM - 9:00 AM",
        "9:15 AM - 10:45 AM",
        "11:00 AM - 12:30 PM",
        "12:45 PM - 2:15 PM",
        "2:30 PM - 4:00 PM",
        "4:15 PM - 5:45 PM",
        "6:00 PM - 7:30 PM",
        "7:45 PM - 9:15 PM"
    ];

    // If seat is "N/A" or null → Show time block selection, disable seat input
    if (!res.seat || res.seat === "N/A" || res.seat.trim() === "") {
        seatInput.disabled = true;
        seatInput.style.backgroundColor = "#e9ecef";
        seatInput.style.cursor = "not-allowed";

        timeBlockSelect.innerHTML = timeBlockOptions.map(time =>
            `<option value="${time}" ${time === res.timeslot ? "selected" : ""}>${time}</option>`
        ).join("");

        timeBlockSelect.disabled = false;
        startTimeContainer.style.display = "none"; // Hide Start Time
        endTimeContainer.style.display = "none"; // Hide End Time
    } else {
        // Enable seat input, show Start and End Time dropdowns
        seatInput.disabled = false;
        seatInput.style.backgroundColor = "";
        seatInput.style.cursor = "";

        timeBlockSelect.innerHTML = `<option value="${res.timeslot}">${res.timeslot}</option>`;
        timeBlockSelect.disabled = true; // Prevent modification

        startTimeContainer.style.display = "block";
        endTimeContainer.style.display = "block";

        // Extract start and end time from timeslot
        const [start, end] = res.timeslot.split(" - ");

        // Populate Start & End Time dropdowns
        generateTimeOptions(startTimeSelect, 7, 30);
        generateTimeOptions(endTimeSelect, 8, 0);

        // Set default values based on reservation's time block
        startTimeSelect.value = start;
        endTimeSelect.value = end;
    }

    // Show modal
    const editModal = new bootstrap.Modal(document.getElementById("editModal"));
    editModal.show();
}



// Convert Start & End Time into Time Block Format
function getTimeBlock(start, end) {
    return `${start} - ${end}`;
}

document.getElementById("editForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const updatedSeat = document.getElementById("editSeat").disabled ? null : document.getElementById("editSeat").value.trim();
    let updatedTimeBlock = document.getElementById("editTimeBlock").value;

    // If using Start & End Time, convert it to Time Block format
    if (!document.getElementById("editSeat").disabled) {
        const startTime = document.getElementById("start-time").value;
        const endTime = document.getElementById("end-time").value;
        updatedTimeBlock = getTimeBlock(startTime, endTime);
    }

    const updatedReservation = {
        originalUsername, 
        originalRoom, 
        originalDate, // Ensure this is set
        originalTimeblock, // Ensure this is set
        username: document.getElementById("editUsername").value,
        room: document.getElementById("editRoom").value,
        seat: updatedSeat,
        date: document.getElementById("editDate").value,
        timeslot: updatedTimeBlock
    };

    // 🔹 Log the data before sending it to the backend
    console.log("Sending update request with data:", updatedReservation);

    try {
        const response = await fetch("http://localhost:3000/update-reservation", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedReservation)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Reservation updated successfully!");
            fetchReservations(); // Refresh table
            bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
        } else {
            alert(result.error || "Failed to update reservation.");
        }
    } catch (error) {
        console.error("Error updating reservation:", error);
        alert("An error occurred. Please try again.");
    }
});

function generateTimeOptions(selectElement, startHour, startMinute) {
    selectElement.innerHTML = ""; // Clear existing options

    const endHour = 21, endMinute = 30;
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
        let ampm = currentHour < 12 ? "AM" : "PM";
        let displayHour = currentHour % 12 || 12;
        let displayMinute = currentMinute.toString().padStart(2, '0');
        let timeValue = `${displayHour}:${displayMinute} ${ampm}`;

        let option = document.createElement("option");
        option.value = timeValue;
        option.textContent = timeValue;

        selectElement.appendChild(option);

        currentMinute += 30;
        if (currentMinute === 60) {
            currentMinute = 0;
            currentHour++;
        }
    }
}




    // Cancel Reservation Function
    async function cancelReservation(room, seat, date, timeslot, username) {
        try {
            const response = await fetch("http://localhost:3000/cancel-reservation", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room, seat, date, timeslot, username })
            });

            if (response.ok) {
                alert("Reservation canceled successfully.");
            } else {
                alert("Failed to cancel reservation. Please try again.");
            }
        } catch (error) {
            console.error("Error canceling reservation:", error);
            alert("An error occurred while canceling the reservation.");
        }
    }

    // Event Listeners
    filterDropdown.addEventListener("change", () => {
        isSearching = false;
        renderReservations();
    });

    searchButton.addEventListener("click", () => {
        isSearching = true;
        renderReservations();
    });

    // Fetch initial data
    fetchReservations();
});
