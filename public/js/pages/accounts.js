// ==================== STATE ====================

let accounts = [];
let filteredAccounts = [];
let editingAccountId = null;
let selectedAccountIds = new Set();
let searchQuery = '';

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
            filteredAccounts = accounts;
            applyFilters();
            renderAccounts();
            updateStats();
        } else {
            showNotification(data.message || 'Hesaplar yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Load accounts error:', error);
        showNotification('Hesaplar yüklenirken hata oluştu', 'error');
    }
}

// ==================== FILTER & SEARCH ====================

function applyFilters() {
    let filtered = [...accounts];
    
    // Apply search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(account => 
            account.username.toLowerCase().includes(query) ||
            (account.steamid && account.steamid.toLowerCase().includes(query))
        );
    }
    
    filteredAccounts = filtered;
}

function handleSearch(e) {
    searchQuery = e.target.value;
    applyFilters();
    renderAccounts();
    updateStats();
}

// ==================== STATS ====================

function updateStats() {
    const totalAccountsStat = document.getElementById('totalAccountsStat');
    const totalPrimeStat = document.getElementById('totalPrimeStat');
    const totalNonPrimeStat = document.getElementById('totalNonPrimeStat');
    
    if (totalAccountsStat) {
        const label = window.t('accounts.totalAccounts');
        totalAccountsStat.innerHTML = `${label}: <strong>${filteredAccounts.length}</strong>`;
    }
    
    if (totalPrimeStat) {
        const primeCount = filteredAccounts.filter(a => a.last_checked_at && a.is_prime).length;
        const label = window.t('accounts.totalPrime');
        totalPrimeStat.innerHTML = `${label}: <strong>${primeCount}</strong>`;
    }
    
    if (totalNonPrimeStat) {
        const nonPrimeCount = filteredAccounts.filter(a => a.last_checked_at && !a.is_prime).length;
        const label = window.t('accounts.totalNonPrime');
        totalNonPrimeStat.innerHTML = `${label}: <strong>${nonPrimeCount}</strong>`;
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
    
    if (filteredAccounts.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredAccounts.map(account => {
        // Get translations
        const notCheckedText = window.t('accounts.table.notChecked').toUpperCase();
        const noBanText = window.t('accounts.table.noBan').toUpperCase();
        
        // Prime status
        let primeText = '-';
        let primeClass = 'badge-secondary';
        if (account.last_checked_at) {
            if (account.is_prime) {
                primeText = 'PRIME';
                primeClass = 'badge-success';
            } else {
                primeText = 'NON-PRIME';
                primeClass = 'badge-danger';
            }
        } else {
            primeText = notCheckedText;
        }
        
        // Account type (Limited/Unlimited)
        let accountTypeText = '-';
        let accountTypeClass = 'badge-secondary';
        if (account.last_checked_at) {
            if (account.limited === 0) {
                accountTypeText = 'UNLIMITED';
                accountTypeClass = 'badge-success';
            } else if (account.limited === 1 || account.limited === 2) {
                accountTypeText = 'LIMITED';
                accountTypeClass = 'badge-danger';
            }
        } else {
            accountTypeText = notCheckedText;
        }
        
        // Wallet
        let walletText = '-';
        if (account.last_checked_at && account.wallet_balance !== null) {
            walletText = `${account.wallet_balance.toFixed(2)} ${account.wallet_currency || 'USD'}`;
        }
        
        // Trade ban
        let tradeBanText = '-';
        if (account.last_checked_at) {
            tradeBanText = `<span class="text-success">${noBanText}</span>`;
        }
        
        return `
            <tr data-id="${account.id}">
                <td class="checkbox-cell">
                    <input type="checkbox" class="account-checkbox" data-id="${account.id}" ${selectedAccountIds.has(account.id) ? 'checked' : ''}>
                </td>
                <td class="username-cell">
                    <strong>${escapeHtml(account.username)}</strong>
                    ${account.steamid ? `<br><small class="text-secondary">${account.steamid}</small>` : ''}
                </td>
                <td class="prime-cell">
                    <span class="badge ${primeClass}">${primeText}</span>
                </td>
                <td class="accounttype-cell">
                    <span class="badge ${accountTypeClass}">${accountTypeText}</span>
                </td>
                <td class="wallet-cell">${walletText}</td>
                <td class="tradeban-cell">${tradeBanText}</td>
                <td class="actions-cell">
                    <button class="btn-icon-small btn-edit" data-id="${account.id}" title="Düzenle">
                        <i class="ph-bold ph-pencil-simple"></i>
                    </button>
                    <button class="btn-icon-small btn-delete" data-id="${account.id}" title="Sil">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
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

function openBulkAddModal() {
    document.getElementById('bulkAddForm').reset();
    document.getElementById('bulkAddModal').classList.add('active');
}

function closeBulkAddModal() {
    document.getElementById('bulkAddModal').classList.remove('active');
    document.getElementById('bulkAddForm').reset();
}

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
    document.getElementById('modalTitle').textContent = window.APP_TRANSLATIONS?.accounts?.editAccount || 'Hesap Düzenle';
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

// ==================== BULK ADD ACCOUNTS ====================

async function handleBulkAdd(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBulkAddBtn');
    const submitBtnText = document.getElementById('submitBulkAddBtnText');
    const originalText = submitBtnText.textContent;
    
    // Disable button
    submitBtn.disabled = true;
    submitBtnText.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i>';
    
    const jsonText = document.getElementById('bulkAccountsJson').value.trim();
    
    try {
        // Parse JSON
        let accountsData;
        try {
            accountsData = JSON.parse(jsonText);
        } catch (parseError) {
            showNotification('JSON formatı hatalı', 'error');
            return;
        }
        
        // Ensure it's an array
        if (!Array.isArray(accountsData)) {
            accountsData = [accountsData];
        }
        
        // Extract required fields
        const accounts = accountsData.map(acc => ({
            username: acc.steamUsername || acc.username,
            password: acc.steamPassword || acc.password,
            shared_secret: acc.sharedSecret || acc.shared_secret,
            identity_secret: acc.identitySecret || acc.identity_secret
        })).filter(acc => acc.username && acc.password && acc.shared_secret && acc.identity_secret);
        
        if (accounts.length === 0) {
            showNotification('Geçerli hesap bulunamadı', 'error');
            return;
        }
        
        // Send bulk add request
        const response = await fetch('/api/accounts/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ accounts })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const { successCount, failedCount } = data.data;
            
            if (successCount > 0 && failedCount === 0) {
                showNotification(`${successCount} hesap başarıyla eklendi`, 'success');
            } else if (successCount > 0 && failedCount > 0) {
                showNotification(`${successCount} hesap eklendi, ${failedCount} hesap eklenemedi`, 'warning');
            } else {
                showNotification('Hesaplar eklenemedi', 'error');
            }
            
            closeBulkAddModal();
            await loadAccounts();
        } else {
            showNotification(data.message || 'Hesaplar eklenemedi', 'error');
        }
    } catch (error) {
        console.error('Bulk add error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = originalText;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== BULK DELETE ====================

let bulkDeleteAccountIds = [];

function openBulkDeleteModal() {
    if (selectedAccountIds.size === 0) {
        showNotification('Lütfen silinecek hesapları seçin', 'warning');
        return;
    }
    
    bulkDeleteAccountIds = Array.from(selectedAccountIds);
    const message = document.getElementById('bulkDeleteMessage');
    if (message) {
        message.textContent = `${bulkDeleteAccountIds.length} ${message.textContent}`;
    }
    
    document.getElementById('bulkDeleteModal').classList.add('active');
}

function closeBulkDeleteModal() {
    document.getElementById('bulkDeleteModal').classList.remove('active');
    bulkDeleteAccountIds = [];
}

function updateBulkDeleteButton() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtnToolbar');
    const bulkDeleteText = document.getElementById('bulkDeleteTextToolbar');
    
    if (!bulkDeleteBtn || !bulkDeleteText) return;
    
    if (selectedAccountIds.size > 0) {
        bulkDeleteBtn.style.display = 'inline-flex';
        const selectedText = window.t('accounts.selectedCount');
        const bulkDeleteLabel = window.t('accounts.bulkDelete');
        bulkDeleteText.textContent = `${bulkDeleteLabel} (${selectedAccountIds.size} ${selectedText})`;
    } else {
        bulkDeleteBtn.style.display = 'none';
    }
}

function handleSelectAll(e) {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.account-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const accountId = parseInt(checkbox.dataset.id);
        if (isChecked) {
            selectedAccountIds.add(accountId);
        } else {
            selectedAccountIds.delete(accountId);
        }
    });
    
    updateBulkDeleteButton();
}

function handleCheckboxChange(e) {
    const accountId = parseInt(e.target.dataset.id);
    
    if (e.target.checked) {
        selectedAccountIds.add(accountId);
    } else {
        selectedAccountIds.delete(accountId);
    }
    
    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.account-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = allChecked && checkboxes.length > 0;
    }
    
    updateBulkDeleteButton();
}

async function handleBulkDelete() {
    if (bulkDeleteAccountIds.length === 0) {
        closeBulkDeleteModal();
        return;
    }
    
    const confirmBtn = document.getElementById('confirmBulkDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    // Disable button
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i>';
    
    try {
        const response = await fetch('/api/accounts/bulk', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ accountIds: bulkDeleteAccountIds })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const { successCount, failedCount } = data.data;
            
            if (successCount > 0 && failedCount === 0) {
                showNotification(`${successCount} hesap başarıyla silindi`, 'success');
            } else if (successCount > 0 && failedCount > 0) {
                showNotification(`${successCount} hesap silindi, ${failedCount} hesap silinemedi`, 'warning');
            } else {
                showNotification('Hesaplar silinemedi', 'error');
            }
            
            // Clear selection
            selectedAccountIds.clear();
            updateBulkDeleteButton();
            
            // Close modal
            closeBulkDeleteModal();
            
            // Reload accounts
            await loadAccounts();
        } else {
            showNotification(data.message || 'Hesaplar silinemedi', 'error');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

// ==================== EVENT LISTENERS ====================

// Add account button
const addAccountBtn = document.getElementById('addAccountBtn');
if (addAccountBtn) {
    addAccountBtn.addEventListener('click', openAddModal);
}

// Bulk add account button
const bulkAddAccountBtn = document.getElementById('bulkAddAccountBtn');
if (bulkAddAccountBtn) {
    bulkAddAccountBtn.addEventListener('click', openBulkAddModal);
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

// Bulk add modal close
const bulkAddModalOverlay = document.getElementById('bulkAddModalOverlay');
if (bulkAddModalOverlay) {
    bulkAddModalOverlay.addEventListener('click', closeBulkAddModal);
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

// Bulk add form submit
const bulkAddForm = document.getElementById('bulkAddForm');
if (bulkAddForm) {
    bulkAddForm.addEventListener('submit', handleBulkAdd);
}

// Select all checkbox
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', handleSelectAll);
}

// Bulk delete button
const bulkDeleteBtnToolbar = document.getElementById('bulkDeleteBtnToolbar');
if (bulkDeleteBtnToolbar) {
    bulkDeleteBtnToolbar.addEventListener('click', openBulkDeleteModal);
}

// Search input
const accountSearch = document.getElementById('accountSearch');
if (accountSearch) {
    accountSearch.addEventListener('input', handleSearch);
}

// Bulk delete modal close buttons
const bulkDeleteModalOverlay = document.getElementById('bulkDeleteModalOverlay');
if (bulkDeleteModalOverlay) {
    bulkDeleteModalOverlay.addEventListener('click', closeBulkDeleteModal);
}

const cancelBulkDeleteBtn = document.getElementById('cancelBulkDeleteBtn');
if (cancelBulkDeleteBtn) {
    cancelBulkDeleteBtn.addEventListener('click', closeBulkDeleteModal);
}

// Confirm bulk delete button
const confirmBulkDeleteBtn = document.getElementById('confirmBulkDeleteBtn');
if (confirmBulkDeleteBtn) {
    confirmBulkDeleteBtn.addEventListener('click', handleBulkDelete);
}

// Delegate checkbox events
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('account-checkbox')) {
        handleCheckboxChange(e);
    }
});

// ==================== INITIALIZE ====================

// Polling interval for auto-refresh
let pollingInterval = null;

// Only load accounts if we're on the accounts page
if (document.getElementById('accountsTableBody')) {
    loadAccounts();
    
    // Auto-refresh every 5 seconds
    pollingInterval = setInterval(() => {
        loadAccounts();
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
