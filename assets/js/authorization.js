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