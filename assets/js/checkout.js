 // Get modal element and buttons
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        const payButton = document.getElementById('payButton');
        const continueButton = document.getElementById('continueButton');
        const closeButton = document.querySelector('#successModal .btn-close');
        
        // Show modal when pay button is clicked
        payButton.addEventListener('click', function() {
            successModal.show();
        });
        
        // Hide modal when continue shopping button is clicked
        continueButton.addEventListener('click', function() {
            successModal.hide();
        });
        
        // Hide modal when close button is clicked
        closeButton.addEventListener('click', function() {
            successModal.hide();
        });