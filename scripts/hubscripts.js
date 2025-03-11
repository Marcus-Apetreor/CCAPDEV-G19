document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const body = document.body;

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

    function toggleSidebar() {
        sidebar.classList.toggle('hide');
        body.classList.toggle('sidebar-hidden');
    }

    checkAccountTier(); // Call after DOM loads

    // Logout Functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("user"); // Clear user data
            window.location.href = "loginpage.html"; // Redirect to login page
        });
    }

    // User Profile Button
    document.getElementById('userProfileBtn').addEventListener('click', () => {
        mainContent.innerHTML = `
            <h2>User Profile</h2>
            <div class="profile-section">
                <img src="${user.profilePicture || 'resources/profile.jpg'}" alt="Profile Picture" class="profile-picture" id="profile-picture">
                <br>
                <span class="username">${user.username}</span>
                <form id="profileForm">
                    <label for="profilePicture">Profile Picture:</label>
                    <input type="file" id="profilePicture" name="profilePicture" accept="image/*">
                    <br>
                    <label for="bio">Bio:</label>
                    <br>
                    <textarea id="bio" name="bio" rows="4" cols="50">${user.bio || "Enter your bio here..."}</textarea>
                    <button type="submit">Save</button>
                </form>
            </div>
        `;

        document.getElementById('profileForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const bio = document.getElementById('bio').value;
            const profilePictureInput = document.getElementById('profilePicture');
            const profilePictureFile = profilePictureInput.files[0];

            const formData = new FormData();
            formData.append('bio', bio);
            if (profilePictureFile) {
                formData.append('profilePicture', profilePictureFile);
            }

            try {
                const response = await fetch(`http://localhost:3000/update-profile`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    alert('Profile updated successfully');
                    document.getElementById('profile-picture').src = updatedUser.profilePicture || 'resources/profile.jpg';
                } else {
                    alert('Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('An error occurred while updating your profile. Please try again.');
            }
        });
    });

    // My Reservations Button
    document.getElementById('myReservationsBtn').addEventListener('click', () => {
        // Example data
        const reservations = [
            { roomNumber: '101', seat: '1', timeSlot: '10:30 AM - 11:00 AM' },
            { roomNumber: '102', seat: '3', timeSlot: '11:30 AM - 12:00 PM' },
            { roomNumber: '103', seat: '5', timeSlot: '12:30 PM - 01:00 PM' },
            { roomNumber: '102', seat: '2', timeSlot: '1:30 AM - 2:00 PM' },
            { roomNumber: '103', seat: '6', timeSlot: '2:30 PM - 3:00 PM' }
        ];

        let tableRows = reservations.map(reservation => `
            <tr>
                <td>${reservation.roomNumber}</td>
                <td>${reservation.seat}</td>
                <td>${reservation.timeSlot}</td>
            </tr>
        `).join('');

        mainContent.innerHTML = `
            <h2>My Reservations</h2>
            <table>
                <thead>
                    <tr>
                        <th>Room Number</th>
                        <th>Seat</th>
                        <th>Time Slot</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    });

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