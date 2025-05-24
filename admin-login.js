document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const adminLoginForm = document.getElementById('adminLoginForm');
    const errorElement = document.getElementById('loginError');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Force token refresh to get latest claims
                const idToken = await user.getIdTokenResult(true);
                
                if (idToken.claims.admin) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    await auth.signOut();
                    errorElement.textContent = 'Admin privileges required';
                    errorElement.style.display = 'block';
                }
            } catch (error) {
                console.error("Auth state error:", error);
                await auth.signOut();
            }
        }
    });

    adminLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div>';
        errorElement.style.display = 'none';
        
        try {
            // Sign in
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Force token refresh to get latest claims
            const idToken = await userCredential.user.getIdTokenResult(true);
            
            if (!idToken.claims.admin) {
                throw new Error('Admin privileges required');
            }
            
            window.location.href = 'admin-dashboard.html';
            
        } catch (error) {
            console.error("Login error:", error);
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
            await auth.signOut();
            
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login';
        }
    });
});