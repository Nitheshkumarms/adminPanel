document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('adminPassword');
    const errorMessage = document.getElementById('errorMessage');
    
    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
    
    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = passwordInput.value.trim();
        
        // Simple validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Simulate loading (replace with actual auth in production)
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        
        // Simulate API call delay (remove in production)
        setTimeout(() => {
            // Replace this with actual authentication logic
            if (username === 'admin' && password === 'admin123') {
                // On successful login
                localStorage.setItem('adminAuthenticated', 'true');
                window.location.href = 'admin-dashboard.html';
            } else {
                showError('Invalid credentials. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        }, 1000);
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});