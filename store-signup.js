document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // DOM elements
    const storeSignupForm = document.getElementById('storeSignupForm');
    const goToDashboardBtn = document.getElementById('goToDashboardBtn');
    const storeIdInput = document.getElementById('storeId');
    const statusElement = storeIdInput.nextElementSibling;
    const togglePassword = document.querySelector('.toggle-password');
    
    // Event listeners
    storeIdInput.addEventListener('input', validateStoreId);
    togglePassword.addEventListener('click', togglePasswordVisibility);
    storeSignupForm.addEventListener('submit', handleStoreSignup);
    goToDashboardBtn.addEventListener('click', () => {
        window.location.href = 'admin-dashboard.html';
    });
    
    // Check if user is logged in (optional)
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is logged in
            console.log("User is logged in:", user.email);
        } else {
            // User is not logged in - this is okay for signup
            console.log("No user logged in - proceeding with signup");
        }
    });
    
    async function validateStoreId(e) {
        const storeId = e.target.value;
        
        if (storeId.length === 3 && /^\d+$/.test(storeId)) {
            try {
                const doc = await db.collection('stores').doc(storeId).get();
                const email = `${storeId}@storefeedback.com`;
                
                try {
                    await auth.getUserByEmail(email);
                    updateStatusElement('Store ID already exists', 'taken');
                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        updateStatusElement('Store ID available', 'available');
                    } else {
                        throw error;
                    }
                }
            } catch (error) {
                console.error('Error checking store ID:', error);
                updateStatusElement('Error checking availability', 'taken');
            }
        } else {
            updateStatusElement('Must be 3 digits', 'taken');
        }
    }
    
    function updateStatusElement(text, className) {
        statusElement.textContent = text;
        statusElement.className = `store-id-status ${className}`;
    }
    
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('storePassword');
        const icon = this.querySelector('i');
        const isPassword = passwordInput.type === 'password';
        
        passwordInput.type = isPassword ? 'text' : 'password';
        icon.classList.replace(isPassword ? 'fa-eye' : 'fa-eye-slash', 
                             isPassword ? 'fa-eye-slash' : 'fa-eye');
    }
    
    async function handleStoreSignup(e) {
        e.preventDefault();
        
        const formData = {
            storeName: document.getElementById('storeName').value,
            storeId: document.getElementById('storeId').value,
            champsId: document.getElementById('champsId').value,
            managerName: document.getElementById('managerName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            password: document.getElementById('storePassword').value
        };
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!formData.storeId.match(/^\d{3}$/)) {
            alert('Store ID must be 3 digits');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner"></div> Creating...';
            
            // Create the store account
            await createStoreAccount(formData);
            
            alert('Store created successfully! You can now login.');
            window.location.href = 'admin-dashboard.html';
        } catch (error) {
            handleStoreCreationError(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Register Store';
        }
    }
    
    async function createStoreAccount({ storeId, storeName, champsId, managerName, phoneNumber, password }) {
        const email = `${storeId}@storefeedback.com`;
        
        // Create the authentication account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Create the store document
        await db.collection('stores').doc(storeId).set({
            name: storeName,
            champsId,
            manager: managerName,
            phone: phoneNumber,
            email: email,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            feedbackLinks: 0,
            totalResponses: 0,
            averageRating: 0
        });
        
        return userCredential;
    }
    
    function handleStoreCreationError(error) {
        console.error('Error creating store:', error);
        let errorMessage = 'Failed to create store';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Store ID already exists';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please contact admin.';
        }
        
        alert(errorMessage);
    }
});