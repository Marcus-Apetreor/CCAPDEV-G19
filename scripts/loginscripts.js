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
                if (responseText) {
                    const result = JSON.parse(responseText);
                    alert(result.message);
                    window.location.href = "loginpage.html";
                } else {
                    alert("Registration successful, but no message received.");
                    window.location.href = "loginpage.html";
                }
            } else {
                if (responseText) {
                    const error = JSON.parse(responseText);
                    alert(error.error);
                } else {
                    alert("An error occurred while registering. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error registering:", error);
            alert("An error occurred while registering. Please try again.");
        }
    });
});