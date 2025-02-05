const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const body = document.body;

//restricted perms
const reserveRoomBtn = document.getElementById('reserveRoomBtn');
const addRoomBtn = document.getElementById('addRoomBtn');

function getAccountTier() {
  // TODO: back-end for getting account tiers
  return 4;
}

function checkAccountTier() {
  const accountTier = getAccountTier();
  switch (accountTier) {
      case 1:
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

document.addEventListener('DOMContentLoaded', checkAccountTier);

document.getElementById('userProfileBtn').addEventListener('click', () => {
  mainContent.innerHTML = `
    <h2>User Profile</h2>
    <div class="profile-section">
      <img src="resources/profile.jpg" alt="Profile Picture" class="profile-picture">
      <br>
      <span class="username">Username</span>
      <form id="bioForm">
        <label for="bio">Bio:</label>
        <br>
        <textarea id="bio" name="bio" rows="4" cols="50">Enter your bio here...</textarea>
        <button type="submit">Save</button>
      </form>
    </div>
  `;

  // Add event listener to handle form submission
  document.getElementById('bioForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const bio = document.getElementById('bio').value;
      // TODO: Save the bio to the backend or local storage
      alert('Bio saved: ' + bio);
  });
});
  
document.getElementById('myReservationsBtn').addEventListener('click', () => {
  // example data
  const reservations = [
      { roomNumber: '101', seat: 'C2R5', timeSlot: '10:30 AM - 11:00 AM' },
      { roomNumber: '102', seat: 'C3R2', timeSlot: '11:30 AM - 12:00 PM' },
      { roomNumber: '103', seat: 'C1R1', timeSlot: '12:30 PM - 01:00 PM' },
      { roomNumber: '102', seat: 'C3R5', timeSlot: '1:30 AM - 2:00 PM' },
      { roomNumber: '103', seat: 'C1R2', timeSlot: '2:30 PM - 3:00 PM' }
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
  
document.getElementById('reserveRoomBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Reserve a Room</h2>
      <iframe src="roomreservation.html" width="100%" height="600px" style="border:none;"></iframe>
    `;
});
document.getElementById('reserveComputerBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Reserve a Computer</h2>
      <p>Redirecting to the computer reservation page...</p>
    `;
});
document.getElementById('addRoomBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Add/Update Rooms</h2>
      <iframe src="add-update-room.html" width="100%" height="600px" style="border:none;"></iframe>
    `;
});
