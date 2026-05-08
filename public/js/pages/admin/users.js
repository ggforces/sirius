// Admin Users Management JavaScript

let allUsers = [];
let filteredUsers = [];

// Load all users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        if (data.success) {
            allUsers = data.users;
            filteredUsers = allUsers;
            updateStats();
            renderUsersTable();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Update stats
function updateStats() {
    const total = allUsers.length;
    const active = allUsers.filter(u => u.is_active).length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeWeek = allUsers.filter(u => u.last_login && new Date(u.last_login) > weekAgo).length;
    
    document.getElementById('statsTotal').textContent = total;
    document.getElementById('statsActive').textContent = active;
    document.getElementById('statsAdmins').textContent = admins;
    document.getElementById('statsWeek').textContent = activeWeek;
}

// Render users table
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    // Update counts
    document.getElementById('showingCount').textContent = filteredUsers.length;
    document.getElementById('totalCount').textContent = allUsers.length;
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center" style="padding: 3rem;">
                    <div class="empty-state">
                        <i class="ph-bold ph-user-circle-minus"></i>
                        <p>No users found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td><strong>#${user.id}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.75rem;">
                        ${user.email.charAt(0).toUpperCase()}
                    </div>
                    <span>${escapeHtml(user.email)}</span>
                </div>
            </td>
            <td><span class="badge badge-${user.role}">${user.role === 'admin' ? '🛡️ Admin' : '👤 User'}</span></td>
            <td><span class="badge badge-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? '✅ Active' : '❌ Inactive'}</span></td>
            <td><strong>${user.account_count || 0}</strong></td>
            <td><strong>${user.proxy_count || 0}</strong></td>
            <td><strong>${user.task_count || 0}</strong></td>
            <td><strong>$${parseFloat(user.balance || 0).toFixed(2)}</strong></td>
            <td>${formatDate(user.created_at)}</td>
            <td>${user.last_login ? formatDate(user.last_login) : '<span style="color: var(--text-secondary);">Never</span>'}</td>
            <td>
                <div class="action-buttons">
                    <button data-action="view" data-user-id="${user.id}" class="btn btn-sm btn-primary" title="View Details">
                        <i class="ph-bold ph-eye"></i>
                    </button>
                    <button data-action="edit" data-user-id="${user.id}" class="btn btn-sm btn-secondary" title="Edit">
                        <i class="ph-bold ph-pencil"></i>
                    </button>
                    <button data-action="delete" data-user-id="${user.id}" data-user-email="${escapeHtml(user.email)}" class="btn btn-sm btn-danger" title="Delete">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Attach event listeners to action buttons
    tbody.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.dataset.userId);
            viewUserDetails(userId);
        });
    });
    
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.dataset.userId);
            editUser(userId);
        });
    });
    
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.dataset.userId);
            const email = e.currentTarget.dataset.userEmail;
            deleteUser(userId, email);
        });
    });
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    renderUsersTable();
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('roleFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    filteredUsers = allUsers;
    renderUsersTable();
}

// View user details
async function viewUserDetails(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (data.success) {
            const content = `
                <div class="user-details">
                    <h4>Kullanıcı Bilgileri</h4>
                    <div class="detail-grid">
                        <div><strong>ID:</strong> ${data.user.id}</div>
                        <div><strong>Email:</strong> ${escapeHtml(data.user.email)}</div>
                        <div><strong>Rol:</strong> ${data.user.role}</div>
                        <div><strong>Durum:</strong> ${data.user.is_active ? 'Aktif' : 'Pasif'}</div>
                        <div><strong>Bakiye:</strong> $${data.user.balance.toFixed(2)}</div>
                        <div><strong>Proxy Yöntemi:</strong> ${data.user.proxy_method}</div>
                    </div>
                    
                    <h4>Steam Hesapları (${data.accounts.length})</h4>
                    <div class="accounts-list">
                        ${data.accounts.length > 0 ? data.accounts.map(acc => `
                            <div class="account-item">
                                <strong>${escapeHtml(acc.username)}</strong>
                                ${acc.is_prime ? '<span class="badge badge-active">Prime</span>' : ''}
                                ${acc.limited === 0 ? '<span class="badge badge-active">Unlimited</span>' : ''}
                            </div>
                        `).join('') : '<p>Hesap yok</p>'}
                    </div>
                    
                    <h4>Son Tasklar (${data.tasks.length})</h4>
                    <div class="tasks-list">
                        ${data.tasks.length > 0 ? data.tasks.slice(0, 10).map(task => `
                            <div class="task-item">
                                <span>${task.type}</span>
                                <span class="badge badge-${task.status}">${task.status}</span>
                                <span>${formatDate(task.created_at)}</span>
                            </div>
                        `).join('') : '<p>Task yok</p>'}
                    </div>
                </div>
            `;
            
            document.getElementById('userDetailsContent').innerHTML = content;
            document.getElementById('userDetailsModal').classList.add('active');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading user details:', error);
        showNotification('Kullanıcı detayları yüklenirken hata oluştu', 'error');
    }
}

// Close user details modal
function closeUserDetailsModal() {
    document.getElementById('userDetailsModal').classList.remove('active');
}

// Edit user
function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserStatus').value = user.is_active ? '1' : '0';
    document.getElementById('editUserBalance').value = user.balance;
    
    document.getElementById('editUserModal').classList.add('active');
}

// Close edit user modal
function closeEditUserModal() {
    document.getElementById('editUserModal').classList.remove('active');
}

// Save user changes
async function saveUserChanges() {
    const userId = document.getElementById('editUserId').value;
    const role = document.getElementById('editUserRole').value;
    const is_active = document.getElementById('editUserStatus').value === '1';
    const balance = parseFloat(document.getElementById('editUserBalance').value);
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, is_active, balance })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Kullanıcı güncellendi', 'success');
            closeEditUserModal();
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Kullanıcı güncellenirken hata oluştu', 'error');
    }
}

// Delete user
async function deleteUser(userId, email) {
    if (!confirm(`${email} kullanıcısını ve tüm verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Kullanıcı silindi', 'success');
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Kullanıcı silinirken hata oluştu', 'error');
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    
    // Search on input
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    
    // Filter buttons
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetFilters);
    
    // User details modal close buttons
    document.getElementById('closeUserDetailsBtn')?.addEventListener('click', closeUserDetailsModal);
    document.getElementById('userDetailsModalOverlay')?.addEventListener('click', closeUserDetailsModal);
    
    // Edit user modal close buttons
    document.getElementById('closeEditUserBtn')?.addEventListener('click', closeEditUserModal);
    document.getElementById('editUserModalOverlay')?.addEventListener('click', closeEditUserModal);
    document.getElementById('cancelEditUserBtn')?.addEventListener('click', closeEditUserModal);
    
    // Save user changes button
    document.getElementById('saveUserChangesBtn')?.addEventListener('click', saveUserChanges);
});
