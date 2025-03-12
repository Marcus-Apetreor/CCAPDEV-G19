document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const body = document.body;
    const profilePicElement = document.getElementById("profile-picture");



    // Restricted permissions
    const reserveRoomBtn = document.getElementById('reserveRoomBtn');
    const addRoomBtn = document.getElementById('addRoomBtn');
    const reserveComputerBtn = document.getElementById('reserveComputerBtn');
    const logoutBtn = document.getElementById("logoutBtn");
    const approveAccBtn = document.getElementById('approveAccBtn');

    // Get logged-in user
    const user = JSON.parse(localStorage.getItem("user"));



    if (user) {
        console.log("User logged in:", user);
        console.log("Username:", user.username);
        console.log("Email:", user.email);
        console.log("Tier:", user.tier);

        profilePicElement.src = user.profilePicture ? user.profilePicture : "img/defaultdp.png";


        const usernameElement = document.querySelector(".username");
        if (usernameElement) {
            usernameElement.textContent = user.username;
        }
    } else {
        // If no user is logged in, redirect to login page
        window.location.href = "loginpage.html";
    }

    function checkAccountTier() {
        if (!user) return;
        const accountTier = user.tier; // Use the stored user tier

        switch (accountTier) {
            case 1: //Student
                reserveComputerBtn.style.display = 'block';
                break;
            case 2: //Officer
                reserveRoomBtn.style.display = 'block';
                break;
            case 3: //Faculty
                reserveRoomBtn.style.display = 'block';
                break;
            case 4: //Admin
                addRoomBtn.style.display = 'block';
                reserveRoomBtn.style.display = 'block';
                approveAccBtn.style.display = 'block';
                break;
        }
    }


  
    checkAccountTier(); // Call after DOM loads

    // Logout Functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("user"); // Clear user data
            window.location.href = "loginpage.html"; // Redirect to login page
        });
    }

    document.getElementById('userProfileBtn').addEventListener('click', async () => {
        try {
            // Fetch latest user data from the server
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.username) {
                alert("Error: User not found. Please log in again.");
                return;
            }
    
            const response = await fetch(`http://localhost:3000/get-user?username=${user.username}`);
            if (!response.ok) throw new Error('Failed to fetch user data');
    
            const updatedUser = await response.json();
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Update localStorage
    
            // Render User Profile with the latest data
            mainContent.innerHTML = `
                <h2>User Profile</h2>
                <div class="profile-section">
                    <img src="${updatedUser.profilePicture || 'resources/profile.jpg'}" alt="Profile Picture" class="profile-picture" id="profile-picture2">
                    <br>
                    <span class="username">${updatedUser.username}</span>
                    <form id="profileForm" class="profile-form">
                        <label for="profilePicture" class="form-label">Profile Picture:</label>
                        <input type="file" id="profilePicture" name="profilePicture" accept="image/*" class="form-input">
                        <br>
                        <label for="bio" class="form-label">Bio:</label>
                        <br>
                        <textarea id="bio" name="bio" rows="4" class="form-textarea">${updatedUser.bio || "Enter your bio here..."}</textarea>
                        <button type="submit" class="form-button">Save</button>
                    </form>
                </div>
            `;
    
            // Handle profile update
            document.getElementById('profileForm').addEventListener('submit', async (event) => {
                event.preventDefault();
    
                const bio = document.getElementById('bio').value;
                const profilePictureInput = document.getElementById('profilePicture');
                const profilePictureFile = profilePictureInput.files[0];
    
                const formData = new FormData();
                formData.append('username', updatedUser.username);
                formData.append('bio', bio);
    
                if (profilePictureFile) {
                    formData.append('profilePicture', profilePictureFile);
                }
    
                // Debugging: Log FormData values
                for (let pair of formData.entries()) {
                    console.log(pair[0], pair[1]);
                }
    
                try {
                    const updateResponse = await fetch(`http://localhost:3000/update-profile`, {
                        method: 'POST',
                        body: formData
                    });
    
                    if (updateResponse.ok) {
                        const newUserData = await updateResponse.json();
                        localStorage.setItem('user', JSON.stringify(newUserData));
    
                        alert('Profile updated successfully');
    
                        // ✅ Refresh profile picture & bio dynamically
                        document.getElementById('profile-picture2').src = `${newUserData.profilePicture}?t=${new Date().getTime()}`;
                        document.querySelector(".profile img").src = `${newUserData.profilePicture}?t=${new Date().getTime()}`;
                        document.getElementById('bio').value = newUserData.bio;
                    } else {
                        alert('Failed to update profile');
                    }
                } catch (error) {
                    console.error('Error updating profile:', error);
                    alert('An error occurred while updating your profile. Please try again.');
                }
            });
    
        } catch (error) {  // ✅ Properly placed catch block
            console.error('Error fetching user data:', error);
            alert('Could not load profile data. Please try again.');
        }
    });
    
    document.getElementById('myReservationsBtn').addEventListener('click', async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.username) {
            alert("Error: User not found. Please log in again.");
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:3000/my-reservations?username=${user.username}`);
            const reservations = await response.json();
    
            let tableRows = reservations.map(reservation => `
                <tr>
                    <td>${reservation.room}</td>
                    <td>${reservation.seat || "N/A"}</td>
                    <td>${reservation.date}</td>
                    <td>${reservation.timeslot}</td>
                    <td>
                        <button class="cancel-btn" data-room="${reservation.room}" data-seat="${reservation.seat}" 
                            data-date="${reservation.date}" data-timeslot="${reservation.timeslot}" data-username="${user.username}">
                            Cancel
                        </button>
                    </td>
                </tr>
            `).join('');
    
            mainContent.innerHTML = `
                <h2>My Reservations</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Room</th>
                                <th>Seat</th>
                                <th>Date</th>
                                <th>Time Slot</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="reservationTable">
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;
    
            // Attach event listener to the table container
            document.getElementById('reservationTable').addEventListener('click', async function (event) {
                if (event.target.classList.contains('cancel-btn')) {
                    const room = event.target.dataset.room;
                    const seat = event.target.dataset.seat;
                    const date = event.target.dataset.date;
                    const timeslot = event.target.dataset.timeslot;
                    const username = event.target.dataset.username;
    
                    cancelReservation(room, seat, date, timeslot, username);
                }
            });
    
        } catch (error) {
            console.error("Error fetching reservations:", error);
            alert("An error occurred while fetching reservations. Please try again.");
        }
    });
    
    // Function to cancel a reservation
    async function cancelReservation(room, seat, date, timeslot, username) {
        const confirmation = confirm("Are you sure you want to cancel this reservation?");
        if (!confirmation) return;
    
        try {
            const response = await fetch("http://localhost:3000/cancel-reservation", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room, seat, date, timeslot, username }) // 🔹 Ensure JSON is sent
            });
    
            if (response.ok) {
                alert("Reservation canceled successfully.");
                document.getElementById('myReservationsBtn').click();
            } else {
                alert("Failed to cancel reservation. Please try again.");
            }
        } catch (error) {
            console.error("Error canceling reservation:", error);
            alert("An error occurred while canceling the reservation.");
        }
    }
    
    

    
    
    // Reserve a Room Button
    if (reserveRoomBtn) {
        reserveRoomBtn.addEventListener('click', () => {
            mainContent.innerHTML = `
                <h2>Reserve a Room</h2>
                <iframe src="roomreservation.html" width="100%" height="600px" style="border:none;"></iframe>
            `;
        });
    }

    // Reserve a Computer Button
    if (reserveComputerBtn) {
        reserveComputerBtn.addEventListener('click', () => {
            mainContent.innerHTML = `
                <h2>Reserve a Computer</h2>
                <iframe src="computer-lab.html" width="100%" height="600px" style="border:none;"></iframe>
            `;
        });
    }

    // Add/Update Room Button
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', () => {
            mainContent.innerHTML = `
                <h2>Add/Update Rooms</h2>
                <iframe src="add-update-room.html" width="100%" height="600px" style="border:none;"></iframe>
            `;
        });
    }

    // Approve Account Button
    if (approveAccBtn) {
        approveAccBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:3000/pending-accounts');
                const accounts = await response.json();

                let accountRows = accounts.map((account, index) => `
                    <tr id="account-${index}">
                        <td>${account.username}</td>
                        <td>${account.email}</td>
                        <td>${account.tier}</td>
                        <td>
                            <button onclick="approveAccount('${account._id}', ${index})">Approve</button>
                            <button onclick="disapproveAccount('${account._id}', ${index})">Disapprove</button>
                        </td>
                    </tr>
                `).join('');

                mainContent.innerHTML = `
                  <h2>Approve Accounts</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Account Tier Requested</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${accountRows}
                    </tbody>
                  </table>
                `;
            } catch (error) {
                console.error('Error fetching pending accounts:', error);
            }
        });
    }

    async function approveAccount(accountId, index) {
        try {
            const response = await fetch(`http://localhost:3000/approve-account/${accountId}`, {
                method: 'POST'
            });
            if (response.ok) {
                document.getElementById(`account-${index}`).remove();
                alert('Account approved');
            } else {
                alert('Failed to approve account');
            }
        } catch (error) {
            console.error('Error approving account:', error);
        }
    }

    async function disapproveAccount(accountId, index) {
        try {
            const response = await fetch(`http://localhost:3000/disapprove-account/${accountId}`, {
                method: 'POST'
            });
            if (response.ok) {
                document.getElementById(`account-${index}`).remove();
                alert('Account disapproved');
            } else {
                alert('Failed to disapprove account');
            }
        } catch (error) {
            console.error('Error disapproving account:', error);
        }
    }
});

function toggleSidebar() {
    sidebar.classList.toggle('hide');
    body.classList.toggle('sidebar-hidden');
}
