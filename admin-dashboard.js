document.addEventListener('DOMContentLoaded', function() {
    const storesGrid = document.getElementById('storesGrid');
    const totalStoresEl = document.getElementById('totalStores');
    const activeStoresEl = document.getElementById('activeStores');
    const searchInput = document.getElementById('searchInput');
    
    // Show loading state
    renderLoadingState();
    
    // Load stores data
    loadStores();
    
    
    // Search functionality
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterStores(searchTerm);
    });
    
    function renderLoadingState() {
        storesGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading stores...</p>
            </div>
        `;
    }
    
    function renderEmptyState() {
        storesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No stores found in the database</p>
            </div>
        `;
    }
    
    function renderErrorState(error) {
        storesGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading stores: ${error.message}</p>
                <button class="retry-btn" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }

    
    
    function loadStores() {
        firebase.firestore().collection("stores").get()
            .then(querySnapshot => {
                const stores = [];
                let activeCount = 0;
                
                querySnapshot.forEach(doc => {
                    const store = {
                        id: doc.id,
                        ...doc.data()
                    };
                    stores.push(store);
                    
                    if (store.status && store.status.toLowerCase() === 'active') {
                        activeCount++;
                    }
                });
                
                // Update stats
                totalStoresEl.textContent = stores.length;
                activeStoresEl.textContent = activeCount;
                
                // Render stores
                if (stores.length > 0) {
                    renderStoresGrid(stores);
                } else {
                    renderEmptyState();
                }
            })
            .catch(error => {
                console.error("Error loading stores:", error);
                renderErrorState(error);
            });
            
    }
    
    

    function renderStoresGrid(stores) {
        storesGrid.innerHTML = stores.map(store => `
            <div class="store-card" data-id="${store.id}">
                <div class="store-header">
                    <div>
                        <h3 class="store-name">${store.name || 'Unnamed Store'}</h3>
                        <span class="store-status ${getStatusClass(store.status)}">
                            ${store.status || 'No status'}
                        </span>
                    </div>
                    <span class="store-id">${store.id}</span>
                </div>
                
                <div class="store-details">
                    <div class="store-detail">
                        <i class="fas fa-user-tie"></i>
                        <span>${store.manager || 'No manager'}</span>
                    </div>
                    
                    <div class="store-detail">
                        <i class="fas fa-mobile-alt"></i>
                        <span>${store.phone || 'No phone'}</span>
                    </div>
                    
                    <div class="store-detail">
                        <i class="fas fa-id-card"></i>
                        <span>${store.champsId || 'No Champs ID'}</span>
                    </div>
                    
                   <label class="toggle-switch">
                            <input type="checkbox" ${store.status === 'active' ? 'checked' : ''} 
                                   data-storeid="${store.id}">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label">${store.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            </div>
        `).join('');
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', handleStatusToggle);
        });
        async function handleStatusToggle(e) {
            const toggle = e.target;
            const storeId = toggle.dataset.storeid;
            const newStatus = toggle.checked ? 'active' : 'inactive';
            
            try {
                // Disable toggle during update
                toggle.disabled = true;
                
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) throw new Error('Not authenticated');

                const idToken = await currentUser.getIdTokenResult();
                if (!idToken.claims.admin) throw new Error('Admin privileges required');

                // Update Firestore
                await firebase.firestore().collection('stores').doc(storeId).update({
                    status: newStatus,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: currentUser.uid
                });
                
                // If deactivating, revoke all active sessions
                if (newStatus === 'inactive') {
                    try {
                        const userEmail = `${storeId}@storefeedback.com`;
                        const user = await firebase.auth().getUserByEmail(userEmail);
                        await firebase.auth().revokeRefreshTokens(user.uid);
                    } catch (authError) {
                        console.warn("Couldn't revoke tokens:", authError);
                    }
                }

                // Update the label text
                const label = toggle.closest('.store-header').querySelector('.toggle-label');
                label.textContent = newStatus === 'active' ? 'Active' : 'Inactive';
                
            } catch (error) {
                console.error("Error updating status:", error);
                // Revert toggle if update fails
                toggle.checked = !toggle.checked;
                alert("Failed to update store status");
            } finally {
                toggle.disabled = false;
            }
            await firebase.firestore().collection('stores').doc(storeId).update({
                status: newStatus,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
              });
              if (newStatus === 'inactive') {
                await firebase.auth().revokeRefreshTokens(storeId);
              }
              
        }
          // Add this to force immediate effect:
 
        
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteStore);
        });
    }
    function filterStores(searchTerm) {
        // Implement search filtering if needed
        // This is just a placeholder
        console.log("Searching for:", searchTerm);
    }
    
    function getStatusClass(status) {
        if (!status) return '';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'active') return 'status-active';
        if (lowerStatus === 'inactive') return 'status-inactive';
        return '';
    }

    // Get modal elements
    const addStoreBtn = document.getElementById('addStoreBtn');
    const addStoreModal = document.getElementById('addStoreModal');
    const closeModal = document.querySelector('.close-modal');
    const storeSignupForm = document.getElementById('storeSignupForm');

    // Modal open/close functionality
    addStoreBtn.addEventListener('click', () => {
        addStoreModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        addStoreModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === addStoreModal) {
            addStoreModal.style.display = 'none';
        }
    });

   // Real-time Store ID validation
document.getElementById('storeId').addEventListener('input', async function() {
    const storeId = this.value.trim();
    const statusElement = this.parentNode.querySelector('.store-id-status');
    
    // Changed to only accept digits (no "store" prefix)
    if (!/^\d+$/.test(storeId)) {
        statusElement.textContent = 'Must be numbers only';
        statusElement.className = 'store-id-status';
        return;
    }

    statusElement.textContent = 'Checking...';
    
    try {
        const storeDoc = await firebase.firestore().collection('stores').doc(storeId).get();
        const auth = firebase.auth();
        const signInMethods = await auth.fetchSignInMethodsForEmail(`${storeId}@storefeedback.com`); // Simplified email
        
        if (storeDoc.exists || signInMethods.length > 0) {
            statusElement.textContent = 'Already taken';
            statusElement.className = 'store-id-status taken';
        } else {
            statusElement.textContent = 'Available';
            statusElement.className = 'store-id-status available';
        }
    } catch (error) {
        statusElement.textContent = 'Error checking';
        console.error("Validation error:", error);
    }
});

    // Password toggle visibility
    document.querySelector('.toggle-password').addEventListener('click', function() {
        const passwordInput = document.getElementById('storePassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    storeSignupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (!submitBtn) {
            console.error('Submit button not found!');
            return;
        }
    
        // Get form values
        const storeData = {
            name: document.getElementById('storeName').value.trim(),
            storeId: document.getElementById('storeId').value.trim(), // This should be just numbers (e.g. 620)
            champsId: document.getElementById('champsId').value.trim(),
            manager: document.getElementById('managerName').value.trim(),
            phone: document.getElementById('phoneNumber').value.trim(),
            password: document.getElementById('storePassword').value
        };
    
        // Validate
        if (!Object.values(storeData).every(field => field)) {
            alert('Please fill in all fields');
            return;
        }
    
        // Ensure storeId is only digits
        if (!/^\d+$/.test(storeData.storeId)) {
            alert('Store ID must contain only numbers');
            return;
        }
    
        try {
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    
            // Create auth account with simplified email
            const userEmail = `${storeData.storeId}@storefeedback.com`; // Now just "620@storefeedback.com"
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(
                userEmail,
                storeData.password
            );
    
            // Save store data to Firestore
            await firebase.firestore().collection('stores').doc(storeData.storeId).set({
                name: storeData.name,
                storeId: storeData.storeId, // Store just the numbers (620)
                champsId: storeData.champsId,
                manager: storeData.manager,
                phone: storeData.phone,
                email: userEmail, // Store the email separately
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                feedbackLinks: 0,
                totalResponses: 0,
                averageRating: 0,
                authUID: userCredential.user.uid
            });
    
            // Success
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
            setTimeout(() => {
                addStoreModal.style.display = 'none';
                storeSignupForm.reset();
                submitBtn.innerHTML = 'Register Store';
                submitBtn.disabled = false;
                loadStores();
            }, 1500);
    
    } catch (error) {
        console.error("Registration error:", error);
        
        let errorMessage = 'Registration failed';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Store ID already exists';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters';
        } else {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
        const submitBtn = storeSignupForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Register Store';
        submitBtn.disabled = false;
    }
});

async function toggleStoreStatus(e) {
    const button = e.target;
    const storeCard = button.closest('.store-card');
    const storeId = storeCard.dataset.id;
    const currentStatus = storeCard.querySelector('.store-status').textContent;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  
      // Update Firestore
      await firebase.firestore().collection('stores').doc(storeId).update({
        status: newStatus
      });
  
      // Update UI
      const statusElement = storeCard.querySelector('.store-status');
      statusElement.textContent = newStatus;
      statusElement.className = `store-status status-${newStatus}`;
      
      // Update button text
      button.textContent = newStatus === 'inactive' ? 'Activate' : 'Deactivate';
      button.className = `status-toggle-btn ${newStatus === 'inactive' ? 'activate-btn' : 'deactivate-btn'}`;
  
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update status");
    } finally {
      button.disabled = false;
    }
  }
  
  // Initialize your dashboard
  document.addEventListener('DOMContentLoaded', function() {
    // Attach click handlers to all toggle buttons
    document.querySelectorAll('.status-toggle-btn').forEach(btn => {
      btn.addEventListener('click', toggleStoreStatus);
    });
  });



async function deleteStore(e) {
    if (!confirm("Are you sure you want to delete this store? This cannot be undone.")) {
        return;
    }
    
    const storeCard = e.target.closest('.store-card');
    const storeId = storeCard.dataset.id;
    
    try {
        // Delete from Firestore
        await firebase.firestore().collection('stores').doc(storeId).delete();
        
        // Delete auth user (optional)
        try {
            const userEmail = `${storeId}@storefeedback.com`;
            const user = await firebase.auth().getUserByEmail(userEmail);
            await firebase.auth().deleteUser(user.uid);
        } catch (authError) {
            console.warn("Could not delete auth user:", authError);
        }
        
        // Remove from UI
        storeCard.remove();
        
        // Update stats
        loadStores();
    } catch (error) {
        console.error("Error deleting store:", error);
        alert("Failed to delete store");
    }
}
});