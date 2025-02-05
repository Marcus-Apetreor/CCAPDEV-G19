const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const body = document.body;

//restricted perms
const reserveRoomBtn = document.getElementById('reserveRoomBtn');
const addRoomBtn = document.getElementById('addRoomBtn');
const approveAccBtn = document.getElementById('approveAccBtn');

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
          approveAccBtn.style.display = 'block';
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
      { roomNumber: '101', seat: 'C2R5', timeSlot: '10:00 AM - 11:00 AM' },
      { roomNumber: '102', seat: 'C3R2', timeSlot: '11:00 AM - 12:00 PM' },
      { roomNumber: '103', seat: 'C1R1', timeSlot: '12:00 PM - 01:00 PM' }
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
      <p>Redirecting to the room reservation page...</p>
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
      <h2>Add/Edit Rooms</h2>
      <p>Redirecting to admin editor page...</p>
      <!-- Add more reserve room content here -->
    `;
});
document.getElementById('approveAccBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Approve Accounts</h2>
      <p>Here are the list of accounts pending for approval of perms...</p>
      <!-- Add more reserve room content here -->
    `;
});