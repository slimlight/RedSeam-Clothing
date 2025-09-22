// avatar
const avatarInput = document.getElementById('avatarInput');
const avatarImage = document.getElementById('avatarImage');
const cameraIcon = document.getElementById('cameraIcon');
const uploadBtn = document.getElementById('uploadBtn');
const removeBtn = document.getElementById('removeBtn');
        
        // Handle file selection
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Show uploaded image
                    avatarImage.src = e.target.result;
                    avatarImage.classList.remove('d-none');
                    // Hide camera icon
                    cameraIcon.classList.add('d-none');
                    // Show remove button
                    removeBtn.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Handle remove avatar
        removeBtn.addEventListener('click', function() {
            // Clear file input
            avatarInput.value = '';
            // Hide uploaded image
            avatarImage.classList.add('d-none');
            avatarImage.src = '';
            // Show camera icon
            cameraIcon.classList.remove('d-none');
            // Hide remove button
            removeBtn.classList.add('d-none');
        });

// Registration form handling
const registerForm = document.getElementById('registerForm');
const usernameEl = document.getElementById('username');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const confirmPasswordEl = document.getElementById('confirmPassword');
const apiMessageEl = document.getElementById('apiMessage');
const registerBtn = document.getElementById('registerBtn');

function showFieldError(el, msg) {
    const errEl = document.getElementById(el.id + 'Error');
    if (msg) {
        errEl.textContent = msg;
        errEl.classList.remove('d-none');
    } else {
        errEl.textContent = '';
        errEl.classList.add('d-none');
    }
}

function validateForm() {
    let valid = true;
    // username
    if (!usernameEl.value || usernameEl.value.trim().length < 3) {
        showFieldError(usernameEl, 'Username must be at least 3 characters.');
        valid = false;
    } else {
        showFieldError(usernameEl, '');
    }
    // email (basic)
    const emailVal = emailEl.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
        showFieldError(emailEl, 'Email is required.');
        valid = false;
    } else if (!emailRegex.test(emailVal)) {
        showFieldError(emailEl, 'Please enter a valid email address.');
        valid = false;
    } else {
        showFieldError(emailEl, '');
    }
    // password
    if (!passwordEl.value || passwordEl.value.length < 3) {
        showFieldError(passwordEl, 'Password must be at least 3 characters.');
        valid = false;
    } else {
        showFieldError(passwordEl, '');
    }
    // confirm
    if (confirmPasswordEl.value !== passwordEl.value) {
        showFieldError(confirmPasswordEl, 'Passwords do not match.');
        valid = false;
    } else {
        showFieldError(confirmPasswordEl, '');
    }

    return valid;
}

function setApiMessage(message, isError = true) {
    apiMessageEl.textContent = message;
    apiMessageEl.className = isError ? 'text-danger' : 'text-success';
}

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    apiMessageEl.textContent = '';

    if (!validateForm()) return;

    // disable submit
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';

    try {
        const formData = new FormData();
        formData.append('username', usernameEl.value.trim());
        formData.append('email', emailEl.value.trim());
        formData.append('password', passwordEl.value);
        // optional avatar
        if (avatarInput.files && avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }

        const res = await fetch('https://api.redseam.redberryinternship.ge/api/register', {
            method: 'POST',
            body: formData
        });

        // Safely handle responses that aren't valid JSON (e.g., HTML error pages)
        const contentType = res.headers.get('content-type') || '';
        let data = null;
        let text = null;
        if (contentType.includes('application/json')) {
            try {
                data = await res.json();
            } catch (parseErr) {
                // JSON parse failed - fall back to text
                console.warn('Failed to parse JSON response:', parseErr);
                text = await res.text();
            }
        } else {
            // not JSON - read as text (this avoids unexpected token '<' JSON errors)
            text = await res.text();
        }

        if (!res.ok) {
            // API may return field-specific errors or a message
            if (data && data.errors) {
                // sample shape: {username: [..], email: [..]}
                Object.keys(data.errors).forEach(key => {
                    const el = document.getElementById(key);
                    const msg = Array.isArray(data.errors[key]) ? data.errors[key].join(' ') : data.errors[key];
                    if (el) showFieldError(el, msg);
                });
            }
            // Prefer JSON message, then plain text, then generic
            const errMsg = (data && data.message) || (text && text.trim()) || 'Registration failed. Please check your input.';
            setApiMessage(errMsg);
        } else {
            // success - prefer JSON message, otherwise show text
            const successMsg = (data && data.message) || (text && text.trim()) || 'Registration successful!';
            setApiMessage(successMsg, false);

            // Save minimal user info to localStorage so header can update on index.html
            // Try to get avatar URL from JSON response (common pattern: data.user.avatar)
            let user = { username: usernameEl.value.trim() };
            if (data && data.user) {
                // try common fields
                if (data.user.avatar) user.avatar = data.user.avatar;
                if (data.user.username) user.username = data.user.username;
            }
            // If avatar was uploaded and API didn't return a URL, store a local preview (data URL)
            if (!user.avatar && avatarInput.files && avatarInput.files[0]) {
                // attempt to store preview already shown in avatarImage.src (data URL)
                if (avatarImage && avatarImage.src) user.avatar = avatarImage.src;
            }

            try {
                localStorage.setItem('redseam_user', JSON.stringify(user));
            } catch (e) {
                console.warn('Could not save user to localStorage', e);
            }

            // redirect to index to show logged-in header state
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        }
    } catch (err) {
        setApiMessage('Network error. Please try again.');
        console.error(err);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
});