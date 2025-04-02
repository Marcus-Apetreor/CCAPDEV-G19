// Fetch user data
async function fetchUserData(username) {
    try {
        const response = await fetch(`http://localhost:3000/get-user?username=${username}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Update user profile
async function updateUserProfile(formData) {
    try {
        const response = await fetch(`http://localhost:3000/update-profile`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Fetch user reservations
async function fetchUserReservations(username) {
    try {
        const response = await fetch(`http://localhost:3000/my-reservations?username=${username}`);
        if (!response.ok) throw new Error('Failed to fetch reservations');
        return await response.json();
    } catch (error) {
        console.error('Error fetching reservations:', error);
        throw error;
    }
}

// Cancel reservation
async function cancelAReservation(room, seat, date, timeslot, username) {
    try {
        const response = await fetch("http://localhost:3000/cancel-reservation", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, seat, date, timeslot, username })
        });
        if (!response.ok) throw new Error('Failed to cancel reservation');
        return await response.json();
    } catch (error) {
        console.error('Error canceling reservation:', error);
        throw error;
    }
}

// Fetch pending accounts
async function fetchPendingAccounts() {
    try {
        const response = await fetch('http://localhost:3000/pending-accounts');
        if (!response.ok) throw new Error('Failed to fetch pending accounts');
        return await response.json();
    } catch (error) {
        console.error('Error fetching pending accounts:', error);
        throw error;
    }
}

// Approve account
async function approveAnAccount(username) {
    try {
        const response = await fetch(`http://localhost:3000/approve-account/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to approve account');
        return await response.json();
    } catch (error) {
        console.error('Error approving account:', error);
        throw error;
    }
}

// Disapprove account
async function disapproveAnAccount(username) {
    try {
        const response = await fetch(`http://localhost:3000/disapprove-account/${username}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to disapprove account');
        return await response.json();
    } catch (error) {
        console.error('Error disapproving account:', error);
        throw error;
    }
}

// Export all functions
export {
    fetchUserData,
    updateUserProfile,
    fetchUserReservations,
    cancelAReservation,
    fetchPendingAccounts,
    approveAnAccount,
    disapproveAnAccount
};