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
            <td class="secret-cell">
                <span class="secret-hidden">••••••••</span>
                <span class="secret-visible" style="display: none;">${escapeHtml(account.password)}</span>
                <button class="btn-icon-small toggle-secret" data-field="password" data-id="${account.id}">
                    <i class="ph-bold ph-eye"></i>
                </button>
            </td>
            <td class="secret-cell">
                <span class="secret-hidden">••••••••••••</span>
                <span class="secret-visible" style="display: none;">${escapeHtml(account.shared_secret)}</span>
                <button class="btn-icon-small toggle-secret" data-field="shared_secret" data-id="${account.id}">
                    <i class="ph-bold ph-eye"></i>
                </button>
            </td>
            <td class="secret-cell">
                <span class="secret-hidden">••••••••••••</span>
                <span class="secret-visible" style="display: none;">${escapeHtml(account.identity_secret)}</span>
                <button class="btn-icon-small toggle-secret" data-field="identity_secret" data-id="${account.id}">
                    <i class="ph-bold ph-eye"></i>
                </button>
            </td>
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
    // Toggle secret visibility
    document.querySelectorAll('.toggle-secret').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cell = e.target.closest('.secret-cell');
            const hidden = cell.querySelector('.secret-hidden');
            const visible = cell.querySelector('.secret-visible');
            const icon = btn.querySelector('i');
            
            if (hidden.style.display === 'none') {
                hidden.style.display = 'inline';
                visible.style.display = 'none';
                icon.className = 'ph-bold ph-eye';
            } else {
                hidden.style.display = 'none';
                visible.style.display = 'inline';
                icon.className = 'ph-bold ph-eye-slash';
            }
        });
    });
    
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
    document.getElementById('modalTitle').textContent = window.APP_TRANSLATIONS.accounts.addAccount;
    document.getElementById('accountForm').reset();
    document.getElementById('accountId').value = '';
    document.getElementById('accountModal').classList.add('active');
}

function openEditModal(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
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

// ==================== PASSWORD TOGGLE ====================

function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'ph-bold ph-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'ph-bold ph-eye';
            }
        });
    });
}

// ==================== EVENT LISTENERS ====================

// Add account button
document.getElementById('addAccountBtn').addEventListener('click', openAddModal);

// Modal close buttons
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);

// Delete modal close buttons
document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
document.getElementById('deleteModalOverlay').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);

// Confirm delete button
document.getElementById('confirmDeleteBtn').addEventListener('click', handleDelete);

// Form submit
document.getElementById('accountForm').addEventListener('submit', handleFormSubmit);

// Setup password toggles
setupPasswordToggles();

// ==================== INITIALIZE ====================

loadAccounts();
