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
      <p>Here is the user profile information...</p>
      <!-- Add more user profile content here -->
    `;
  });
  
  document.getElementById('myReservationsBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>My Reservations</h2>
      <p>Here is the list of your reservations...</p>
      <!-- Add more reservations content here -->
    `;
  });
  
  document.getElementById('reserveRoomBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Reserve a Room</h2>
      <p>Here is the form to reserve a room...</p>
      <!-- Add more reserve room content here -->
    `;
  });
  document.getElementById('reserveComputerBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Reserve a Computer</h2>
      <p>Here is the form to reserve a computer...</p>
      <!-- Add more reserve room content here -->
    `;
  });
  document.getElementById('addRoomBtn').addEventListener('click', () => {
    mainContent.innerHTML = `
      <h2>Add/Edit Rooms</h2>
      <p>Here are the form/s for adding/editting rooms room...</p>
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