document.addEventListener('DOMContentLoaded', function() {
    updateAuthLink();
    setupAuthForms();
});

// login status
async function updateAuthLink() {
    const token = getAuthToken();
    let currentUser = null;
    
    if (token) {
        try {
            const data = await authAPI.getCurrentUser();
            if (data.success) {
                currentUser = data.user;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            removeAuthToken();
        }
    }
    
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        if (currentUser) {
            authLink.textContent = 'Log Out';
            authLink.href = 'logout.html';
        } else {
            authLink.textContent = 'Log In';
            authLink.href = 'login.html';
        }
    }
}

// setup auth forms
function setupAuthForms() {
    // login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // show password toggle
        const showPasswordCheckbox = document.getElementById('show-password');
        if (showPasswordCheckbox) {
            showPasswordCheckbox.addEventListener('change', function() {
                const passwordInput = document.getElementById('login-password');
                passwordInput.type = this.checked ? 'text' : 'password';
            });
        }
    }
    
    // signup
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // settings
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        loadSettingsData();
        settingsForm.addEventListener('submit', handleSettingsSave);
    }
    
    // logout
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // forgot password
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // reset password
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
}

// handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    try {
        const data = await authAPI.login(username, password);
        
        if (data.success) {
            // store session
            localStorage.setItem('sessionUser', JSON.stringify(data.user));
            
            // remember me
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('rememberedUser', JSON.stringify(data.user));
            } else {
                localStorage.setItem('rememberMe', 'false');
                localStorage.removeItem('rememberedUser');
            }
            
            // redirect to home
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('login-error', error.message || 'Invalid username/email or password.');
    }
}

// signup
async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    
    // Validation
    if (password !== passwordConfirm) {
        showError('signup-error', 'Passwords do not match.');
        return;
    }
    
    if (password.length < 6) {
        showError('signup-error', 'Password must be at least 6 characters long.');
        return;
    }
    
    try {
        const data = await authAPI.signup(username, email, password);
        
        if (data.success) {
            // go to login page
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Signup error:', error);
        
        // error messages
        let errorMessage = 'Signup failed. Please try again.';
        if (error.message.includes('email')) {
            errorMessage = 'Email already registered.';
        } else if (error.message.includes('username')) {
            errorMessage = 'Username already exists.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError('signup-error', errorMessage);
    }
}

// load settings data
async function loadSettingsData() {
    const token = getAuthToken();
    
    if (!token) {
        // redirect to login
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const data = await authAPI.getCurrentUser();
        
        if (data.success) {
            const user = data.user;
            document.getElementById('settings-username').value = user.username;
            document.getElementById('settings-email').value = user.email;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        window.location.href = 'login.html';
    }
}

// settings save
async function handleSettingsSave(event) {
    event.preventDefault();
    
    const newUsername = document.getElementById('settings-username').value.trim();
    const newEmail = document.getElementById('settings-email').value.trim();
    
    try {
        const data = await authAPI.updateProfile(newUsername, newEmail);
        
        if (data.success) {
            // update session
            localStorage.setItem('sessionUser', JSON.stringify(data.user));
            
            // update remembered user
            if (localStorage.getItem('rememberMe') === 'true') {
                localStorage.setItem('rememberedUser', JSON.stringify(data.user));
            }
            
            showSuccess('settings-message', 'Settings saved successfully!');
            hideError('settings-error');
        }
    } catch (error) {
        console.error('Settings save error:', error);
        
        let errorMessage = 'Failed to save settings.';
        if (error.message.includes('username')) {
            errorMessage = 'Username already taken.';
        } else if (error.message.includes('email')) {
            errorMessage = 'Email already registered.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError('settings-error', errorMessage);
    }
}

// logout
function handleLogout() {
    authAPI.logout();
    window.location.href = 'index.html';
}

// forgot password
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();
    
    // store email in session
    sessionStorage.setItem('resetEmail', email);
    
    // wip - send email
    alert('If an account exists with that email, you can now reset your password.');
    window.location.href = 'reset-password.html';
}

// reset password
async function handleResetPassword(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('reset-password').value;
    const confirmPassword = document.getElementById('reset-password-confirm').value;
    
    // validation
    if (newPassword !== confirmPassword) {
        showError('reset-error', 'Passwords do not match.');
        return;
    }
    
    if (newPassword.length < 6) {
        showError('reset-error', 'Password must be at least 6 characters long.');
        return;
    }
    
    // get email from session
    const resetEmail = sessionStorage.getItem('resetEmail');
    
    if (!resetEmail) {
        showError('reset-error', 'Invalid reset session. Please try again.');
        return;
    }
    
    try {
        const data = await authAPI.resetPassword(resetEmail, newPassword);
        
        if (data.success) {
            // clear reset session
            sessionStorage.removeItem('resetEmail');
            
            // redirect to login
            alert('Password reset successful! Please log in with your new password.');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Reset password error:', error);
        
        let errorMessage = 'Failed to reset password.';
        if (error.message.includes('email')) {
            errorMessage = 'No account found with that email address.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError('reset-error', errorMessage);
    }
}

// show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// hide error message
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// show success message
function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}
