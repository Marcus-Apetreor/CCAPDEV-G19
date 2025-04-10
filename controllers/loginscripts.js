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

document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("login-btn");
    const signupBtn = document.getElementById("signup-btn");

    if (loginBtn && signupBtn) {
        loginBtn.addEventListener("click", function () {
            showForm("login");
        });

        signupBtn.addEventListener("click", function () {
            showForm("signup");
        });
    }
});


// Show login form by default
showForm('login');

document.addEventListener("DOMContentLoaded", function () {
    // SIGNUP FUNCTIONALITY
    const signupForm = document.querySelector("#signup-form form");
    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formData = new FormData(signupForm);
            const data = {
                username: formData.get("username"),
                email: formData.get("email"),
                password: formData.get("password"),
                repeatPassword: formData.get("repeat-password"),
                accountType: formData.get("account")
            };

            try {
                const response = await fetch("http://localhost:3000/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                const responseText = await response.text();
                console.log("Raw response:", responseText);

                if (response.ok) {
                    const result = JSON.parse(responseText);
                    alert(result.message);
                    window.location.href = "loginpage.html";
                } else {
                    const error = JSON.parse(responseText);
                    alert(error.error || "An error occurred while registering.");
                }
            } catch (error) {
                console.error("Error registering:", error);
                alert("A network error occurred. Please try again.");
            }
        });
    }

    // LOGIN FUNCTIONALITY
    const loginForm = document.querySelector("#login-form form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const data = {
                username: formData.get("username"),
                password: formData.get("password")
            };

            try {
                const response = await fetch("http://localhost:3000/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                const responseText = await response.text();
                console.log("Raw response:", responseText);

                if (response.ok) {
                    const result = JSON.parse(responseText);
                    alert(result.message);
                    
                    // Store user details in localStorage
                    localStorage.setItem("user", JSON.stringify(result.user));

                    // Redirect to the dashboard or home page
                    window.location.href = "mainhub.html";
                } else {
                    const error = JSON.parse(responseText);
                    alert(error.error || "Invalid username or password.");
                }
            } catch (error) {
                console.error("Error logging in:", error);
                alert("A network error occurred. Please try again.");
            }
        });
    }

    // LOGOUT FUNCTIONALITY
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("user");
            window.location.href = "loginpage.html";
        });
    }
});

// PROTECT DASHBOARD: Redirect users who are not logged in
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes("mainhub.html")) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Please log in first.");
            window.location.href = "loginpage.html";
        }
    }
});