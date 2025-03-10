function showForm(formType) {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-btn').classList.remove('active');
    document.getElementById('signup-btn').classList.remove('active');
    if (formType === 'login') {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('login-btn').classList.add('active');
    } else if (formType === 'signup') {
        document.getElementById('signup-form').classList.add('active');
        document.getElementById('signup-btn').classList.add('active');
    }
}
// to show login form by default
showForm('login');

document.addEventListener("DOMContentLoaded", function() {
    const signupForm = document.querySelector("#signup-form form");

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get input values
        const username = document.getElementById("username-input").value.trim();
        const email = document.getElementById("email-input").value.trim();
        const password = document.getElementById("password-input").value;
        const repeatPassword = document.getElementById("repeat-password-input").value;
        const accountType = document.getElementById("account-select").value;

        // Send request to backend
        try {
            const response = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, repeatPassword, accountType })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Signup successful! You can now log in.");
                signupForm.reset();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error registering:", error);
            alert("Something went wrong. Please try again.");
        }
    });

    const loginForm = document.querySelector("#login-form form");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get input values
        const username = loginForm.querySelector("input[name='username']").value.trim();
        const password = loginForm.querySelector("input[name='password']").value;

        // Send request to backend
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Login successful!");
                localStorage.setItem("user", JSON.stringify(result.user)); // Store user data in local storage
                window.location.href = "mainhub.html"; // Redirect to a dashboard page
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Something went wrong. Please try again.");
        }
    });
});
