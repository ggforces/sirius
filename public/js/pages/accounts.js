// ==================== STATE ====================

let accounts = [];
let editingAccountId = null;

// ==================== LOAD ACCOUNTS ====================

async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            accounts = data.data;
            renderAccounts();
        } else {
            showNotification(data.message || 'Hesaplar yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Load accounts error:', error);
        showNotification('Hesaplar yüklenirken hata oluştu', 'error');
    }
}

// ==================== RENDER ACCOUNTS ====================

function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('accountsTable');
    
    // Check if elements exist
    if (!tbody || !emptyState || !table) {
        console.warn('Accounts page elements not found');
        return;
    }
    
    if (accounts.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = accounts.map(account => `
        <tr data-id="${account.id}">
            <td class="username-cell">${escapeHtml(account.username)}</td>
            <td class="secret-cell">${escapeHtml(account.password)}</td>
            <td class="secret-cell">${escapeHtml(account.shared_secret)}</td>
            <td class="secret-cell">${escapeHtml(account.identity_secret)}</td>
            <td class="actions-cell">
                <button class="btn-icon-small btn-edit" data-id="${account.id}" title="Düzenle">
                    <i class="ph-bold ph-pencil-simple"></i>
                </button>
                <button class="btn-icon-small btn-delete" data-id="${account.id}" title="Sil">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Event listeners
    attachTableEventListeners();
}

// ==================== ATTACH EVENT LISTENERS ====================

function attachTableEventListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const accountId = parseInt(e.target.closest('.btn-edit').dataset.id);
            openEditModal(accountId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const accountId = parseInt(e.target.closest('.btn-delete').dataset.id);
            openDeleteModal(accountId);
        });
    });
}

// ==================== MODAL FUNCTIONS ====================

function openAddModal() {
    editingAccountId = null;
    document.getElementById('modalTitle').textContent = 'Hesap Ekle';
    document.getElementById('accountForm').reset();
    document.getElementById('accountId').value = '';
    document.getElementById('accountModal').classList.add('active');
}

// Make openAddModal globally available
window.openAddModal = openAddModal;

function openEditModal(accountId) {
    if (!accounts || accounts.length === 0) {
        showNotification('Hesaplar henüz yüklenmedi', 'error');
        return;
    }
    
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
        showNotification('Hesap bulunamadı', 'error');
        return;
    }
    
    editingAccountId = accountId;
    document.getElementById('modalTitle').textContent = window.APP_TRANSLATIONS.accounts.editAccount;
    document.getElementById('accountId').value = account.id;
    document.getElementById('username').value = account.username;
    document.getElementById('password').value = account.password;
    document.getElementById('sharedSecret').value = account.shared_secret;
    document.getElementById('identitySecret').value = account.identity_secret;
    document.getElementById('accountModal').classList.add('active');
}

function closeModal() {
    document.getElementById('accountModal').classList.remove('active');
    document.getElementById('accountForm').reset();
    editingAccountId = null;
}

function openDeleteModal(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    editingAccountId = accountId;
    document.getElementById('deleteAccountName').textContent = account.username;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    editingAccountId = null;
}

// ==================== FORM SUBMIT ====================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const originalText = submitBtnText.textContent;
    
    // Disable button
    submitBtn.disabled = true;
    submitBtnText.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i>';
    
    const formData = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        shared_secret: document.getElementById('sharedSecret').value.trim(),
        identity_secret: document.getElementById('identitySecret').value.trim()
    };
    
    try {
        const url = editingAccountId 
            ? `/api/accounts/${editingAccountId}` 
            : '/api/accounts';
        const method = editingAccountId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            closeModal();
            await loadAccounts();
        } else {
            showNotification(data.message || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Form submit error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = originalText;
    }
}

// ==================== DELETE ACCOUNT ====================

async function handleDelete() {
    if (!editingAccountId) return;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalHTML = confirmBtn.innerHTML;
    
    // Disable button
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i>';
    
    try {
        const response = await fetch(`/api/accounts/${editingAccountId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            closeDeleteModal();
            await loadAccounts();
        } else {
            showNotification(data.message || 'Silme işlemi başarısız', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHTML;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== EVENT LISTENERS ====================

// Add account button
const addAccountBtn = document.getElementById('addAccountBtn');
if (addAccountBtn) {
    addAccountBtn.addEventListener('click', openAddModal);
}

// Add first account button (in empty state) - support both IDs
const addFirstAccountBtn = document.getElementById('addFirstAccountBtn');
if (addFirstAccountBtn) {
    addFirstAccountBtn.addEventListener('click', openAddModal);
}

const addFirstAccountDashboard = document.getElementById('addFirstAccountDashboard');
if (addFirstAccountDashboard) {
    addFirstAccountDashboard.addEventListener('click', openAddModal);
}

// Modal close - only overlay click
const modalOverlay = document.getElementById('modalOverlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
}

// Delete modal close buttons
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
if (deleteModalOverlay) {
    deleteModalOverlay.addEventListener('click', closeDeleteModal);
}

const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

// Confirm delete button
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDelete);
}

// Form submit
const accountForm = document.getElementById('accountForm');
if (accountForm) {
    accountForm.addEventListener('submit', handleFormSubmit);
}

// ==================== INITIALIZE ====================

// Only load accounts if we're on the accounts page
if (document.getElementById('accountsTableBody')) {
    loadAccounts();
}
