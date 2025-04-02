// Function to register a user
async function registerUser(data) {
    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "An error occurred while registering.");
        }

        return await response.json(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error registering user:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

// Function to log in a user
async function loginUser(data) {
    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Invalid username or password.");
        }

        return await response.text(); // Return the parsed JSON response
    } catch (error) {
        console.error("Error logging in user:", error);
        throw error; // Re-throw the error for the caller to handle
    }
}

// Export all functions
export { registerUser, loginUser};