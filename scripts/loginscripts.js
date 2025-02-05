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