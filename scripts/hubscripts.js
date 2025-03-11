document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const body = document.body;

  // Restricted permissions
  const reserveRoomBtn = document.getElementById('reserveRoomBtn');
  const addRoomBtn = document.getElementById('addRoomBtn');
  const reserveComputerBtn = document.getElementById('reserveComputerBtn');
  const logoutBtn = document.getElementById("logoutBtn");

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
          case 1:
              reserveComputerBtn.style.display = 'block';
              break;
          case 2:
              reserveRoomBtn.style.display = 'block';
              break;
          case 3:
              reserveRoomBtn.style.display = 'block';
              break;
          case 4:
              addRoomBtn.style.display = 'block';
              reserveRoomBtn.style.display = 'block';
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
              <img src="resources/profile.jpg" alt="Profile Picture" class="profile-picture">
              <br>
              <span class="username">${user.username}</span>
              <form id="bioForm">
                  <label for="bio">Bio:</label>
                  <br>
                  <textarea id="bio" name="bio" rows="4" cols="50">${user.bio || "Enter your bio here..."}</textarea>
                  <button type="submit">Save</button>
              </form>
          </div>
      `;

      document.getElementById('bioForm').addEventListener('submit', (event) => {
          event.preventDefault();
          const bio = document.getElementById('bio').value;
          alert('Bio saved: ' + bio);
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
});
