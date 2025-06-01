document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    const DOM = {
        storesGrid: document.getElementById('storesGrid'),
        totalStoresEl: document.getElementById('totalStores'),
        activeStoresEl: document.getElementById('activeStores'),
        searchInput: document.getElementById('searchInput'),
        addStoreBtn: document.getElementById('addStoreBtn'),
        addStoreModal: document.getElementById('addStoreModal'),
        closeModal: document.querySelector('.close-modal'),
        goToSignupBtn: document.getElementById('goToSignupBtn'),
        logoutBtn: document.getElementById('logoutBtn')
    };

    // Check admin authentication
    auth.onAuthStateChanged(handleAuthState);

    function handleAuthState(user) {
        if (user) {
            verifyAdmin(user);
        } else {
            console.log('No user logged in');
            redirectToLogin();
        }
    }

    async function verifyAdmin(user) {
        try {
            const idToken = await user.getIdTokenResult(true);
            if (idToken.claims.admin) {
                console.log('Admin user authenticated');
                loadStores();
                setupEventListeners();
            } else {
                console.log('User is not an admin');
                redirectToLogin();
            }
        } catch (error) {
            console.error('Error verifying admin status:', error);
            redirectToLogin();
        }
    }

    function redirectToLogin() {
        window.location.href = 'index.html';
    }

    function setupEventListeners() {
        // Search functionality
        DOM.searchInput.addEventListener('input', (e) => {
            filterStores(e.target.value.toLowerCase());
        });

        // Search functionality
        DOM.searchInput.addEventListener('input', (e) => {
            filterStores(e.target.value.toLowerCase());
        });
    
        // Go to signup page
        DOM.goToSignupBtn.addEventListener('click', () => {
            window.location.href = 'store-signup.html';
        });
    
        // Logout button
        DOM.logoutBtn.addEventListener('click', handleLogout);


        // Store ID validation
        document.getElementById('storeId').addEventListener('input', validateStoreId);

        // Password toggle visibility
        document.querySelector('.toggle-password').addEventListener('click', togglePasswordVisibility);

        // Store signup form submission

        
        // Logout button
        DOM.logoutBtn.addEventListener('click', handleLogout);
    }

    async function validateStoreId(e) {
        const storeId = e.target.value;
        const statusElement = e.target.nextElementSibling;
        
        if (storeId.length === 3 && /^\d+$/.test(storeId)) {
            try {
                const doc = await db.collection('stores').doc(storeId).get();
                const email = `${storeId}@storefeedback.com`;
                
                try {
                    await auth.getUserByEmail(email);
                    updateStatusElement(statusElement, 'Store ID already exists', 'taken');
                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        updateStatusElement(statusElement, 'Store ID available', 'available');
                    } else {
                        throw error;
                    }
                }
            } catch (error) {
                console.error('Error checking store ID:', error);
                updateStatusElement(statusElement, 'Error checking availability', 'taken');
            }
        } else {
            updateStatusElement(statusElement, 'Must be 3 digits', 'taken');
        }
    }

    function updateStatusElement(element, text, className) {
        element.textContent = text;
        element.className = `store-id-status ${className}`;
    }

    function togglePasswordVisibility(e) {
        const passwordInput = document.getElementById('storePassword');
        const icon = e.target.querySelector('i');
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
        
        const submitBtn = DOM.storeSignupForm.querySelector('button[type="submit"]');
        
        if (!formData.storeId.match(/^\d{3}$/)) {
            alert('Store ID must be 3 digits');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner"></div> Creating...';
            
            await createStoreAccount(formData);
            
            alert('Store created successfully!');
            DOM.addStoreModal.style.display = 'none';
            DOM.storeSignupForm.reset();
            loadStores();
        } catch (error) {
            handleStoreCreationError(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Store';
        }
    }

    async function createStoreAccount({ storeId, storeName, champsId, managerName, phoneNumber, password }) {
        const email = `${storeId}@storefeedback.com`;
        await auth.createUserWithEmailAndPassword(email, password);
        
        await db.collection('stores').doc(storeId).set({
            name: storeName,
            champsId,
            manager: managerName,
            phone: phoneNumber,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            feedbackLinks: 0,
            totalResponses: 0,
            averageRating: 0
        });
    }

    function handleStoreCreationError(error) {
        console.error('Error creating store:', error);
        let errorMessage = 'Failed to create store';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Store ID already exists';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters';
        }
        
        alert(errorMessage);
    }

    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            auth.signOut()
                .then(() => window.location.href = 'index.html')
                .catch(error => {
                    console.error('Logout error:', error);
                    alert('Logout failed. Please try again.');
                });
        }
    }

    function renderLoadingState() {
        DOM.storesGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading stores...</p>
            </div>
        `;
    }

    function renderEmptyState() {
        DOM.storesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No stores found</p>
            </div>
        `;
    }

    function renderErrorState(error) {
        DOM.storesGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading stores: ${error.message}</p>
                <button class="retry-btn" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }

    async function loadStores() {
        renderLoadingState();
        
        try {
            const { stores, activeCount } = await fetchStores();
            
            DOM.totalStoresEl.textContent = stores.length;
            DOM.activeStoresEl.textContent = activeCount;

            stores.length > 0 ? renderStoresGrid(stores) : renderEmptyState();
        } catch (error) {
            console.error("Error loading stores:", error);
            renderErrorState(error);
        }
    }

    async function fetchStores() {
        const querySnapshot = await db.collection('stores').get();
        const stores = [];
        let activeCount = 0;

        querySnapshot.forEach(doc => {
            const store = { id: doc.id, ...doc.data() };
            stores.push(store);
            if (store.status?.toLowerCase() === 'active') activeCount++;
        });

        return { stores, activeCount };
    }

    function renderStoresGrid(stores) {
        DOM.storesGrid.innerHTML = stores.map(store => `
            <div class="store-card ${store.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}" data-id="${store.id}">
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

                    <div class="store-actions">
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
    }

    async function handleStatusToggle(e) {
        const toggle = e.target;
        const storeId = toggle.dataset.storeid;
        const newStatus = toggle.checked ? 'active' : 'inactive';
        const storeCard = toggle.closest('.store-card');

        try {
            toggle.disabled = true;
            storeCard.classList.toggle('active', newStatus === 'active');
            storeCard.classList.toggle('inactive', newStatus !== 'active');
            
            await db.collection('stores').doc(storeId).update({
                status: newStatus,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            updateStatusUI(toggle, newStatus);
        } catch (error) {
            console.error("Error updating status:", error);
            revertStatusUI(toggle, storeCard, newStatus);
            alert("Failed to update store status");
        } finally {
            toggle.disabled = false;
        }
    }

    function updateStatusUI(toggle, newStatus) {
        const label = toggle.nextElementSibling;
        label.textContent = newStatus === 'active' ? 'Active' : 'Inactive';
        DOM.activeStoresEl.textContent = newStatus === 'active' 
            ? parseInt(DOM.activeStoresEl.textContent) + 1 
            : parseInt(DOM.activeStoresEl.textContent) - 1;
    }

    function revertStatusUI(toggle, storeCard, attemptedStatus) {
        const originalStatus = attemptedStatus === 'active' ? 'inactive' : 'active';
        storeCard.classList.toggle('active', originalStatus === 'active');
        storeCard.classList.toggle('inactive', originalStatus !== 'active');
        toggle.checked = !toggle.checked;
    }

    function filterStores(searchTerm) {
        document.querySelectorAll('.store-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(searchTerm) ? 'block' : 'none';
        });
    }

    function getStatusClass(status) {
        if (!status) return '';
        const lowerStatus = status.toLowerCase();
        return lowerStatus === 'active' ? 'status-active' : 
               lowerStatus === 'inactive' ? 'status-inactive' : '';
    }
});