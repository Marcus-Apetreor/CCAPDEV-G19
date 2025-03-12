# AnimoHub

AnimoHub is a web application designed to streamline room and seat reservations for students, professors, organization leaders, and administrators at DLSU. It addresses inefficiencies in locating and reserving lecture rooms, computer labs, and conference rooms by providing a centralized system with real-time availability updates. The app includes role-based access, time-slot reservations (90 minutes for rooms, 30 minutes for lab seats), notifications, and admin controls to prioritize and manage reservations effectively.

## Key Features

### Role-Based Access
- **Tier 1 (Students)**: Reserve computer lab seats, view room availability (except conference rooms).
- **Tier 2 (Org Officers)**: Reserve all room types, override Tier 1 reservations.
- **Tier 3 (Professors)**: Reserve all rooms, override Tier 1–2 reservations, cancel no-show reservations.
- **Admin**: Full control (approve registrations, edit/delete any reservation, manage accounts).

### Reservation System
- **Rooms**: 90-minute slots with 15-minute breaks.
- **Computer Lab Seats**: 30-minute slots (max 90 minutes/day for students).

### Search System
- Check room availability, view public profiles (limited details), and filter by day/time.

### Override Rules
- Higher-tier accounts can override lower-tier reservations (e.g., professors override students).

### Account Management
- Users can delete their accounts (clears reservations); admins can delete any account except other admins.

## Installation Instructions
1. Clone the repository.
2. Install dependencies (Node.js).
3. Set up a database (MongoDB).
5. Run the server and access via a web browser.

## Usage Instructions

### Registration/Login
- Students register as Tier 1; Tier 2–3 require admin approval.

### Reserving a Room/Seat
- Select room type, time slot, and confirm.
- Lab seats: 30-minute slots; rooms: 90-minute slots.

### Overriding Reservations
- Professors/admins can cancel or modify lower-tier reservations.

### Searching Rooms
- Use filters to check availability and view public profiles of reservers.


## License Information
License information is not provided.
