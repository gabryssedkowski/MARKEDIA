document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    initAdminProfile();
    initModal();
});

let ordersData = [];
let currentOrderIdForStatus = null;

function getOrdersFromStorage() {
    try {
        const stored = localStorage.getItem('markedia_orders');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading orders", e);
        return [];
    }
}

function saveOrdersToStorage(orders) {
    localStorage.setItem('markedia_orders', JSON.stringify(orders));
}

function loadOrders() {
    ordersData = getOrdersFromStorage();
    renderOrders();
}

function renderOrders() {
    const grid = document.getElementById('orders-grid');
    if (!grid) return;

    if (ordersData.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Brak zamówień.</p>';
        return;
    }

    const cardColors = ['blue', 'teal', 'black', 'yellow', 'bg-light'];

    grid.innerHTML = ordersData.map((order, index) => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const colorClass = cardColors[index % cardColors.length];
        const statusMap = {
            'nowe': 'Nowe',
            'w_realizacji': 'W trakcie',
            'gotowe': 'Gotowe do wysyłki',
            'wyslane': 'Wysłane'
        };
        const displayStatus = statusMap[order.status || 'nowe'] || order.status;

        return `
            <div class="history-card ${colorClass}" onclick="openStatusModal('${order.id}')">
                <div class="card-date">${date} - ${displayStatus}</div>
                <div class="card-title">${order.items ? order.items[0]?.title : order.title || 'Zamówienie'}</div>
                <div class="card-amount">${order.total || 'N/A'} zł</div>

                <div class="card-action"><i data-lucide="${colorClass === 'black' ? 'arrow-up-right' : 'more-horizontal'}"></i></div>

                <div class="card-avatars">
                    <img src="https://i.pravatar.cc/150?img=${(index * 3 + 1) % 70}" alt="avatar">
                    <img src="https://i.pravatar.cc/150?img=${(index * 3 + 2) % 70}" alt="avatar">
                    <img src="https://i.pravatar.cc/150?img=${(index * 3 + 3) % 70}" alt="avatar">
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function initModal() {
    const modal = document.getElementById('status-modal');
    const closeBtn = document.querySelector('.close-modal');
    const saveBtn = document.getElementById('save-status-btn');

    if(!modal || !closeBtn || !saveBtn) return;

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = 'none';
    }

    saveBtn.onclick = () => {
        const newStatus = document.getElementById('new-status-select').value;
        if (currentOrderIdForStatus) {
            updateOrderStatus(currentOrderIdForStatus, newStatus);
            modal.style.display = 'none';
        }
    }
}

window.openStatusModal = function(orderId) {
    currentOrderIdForStatus = orderId;
    const order = ordersData.find(o => o.id === orderId);
    if(order) {
        const select = document.getElementById('new-status-select');
        if(select) select.value = order.status || 'nowe';
        document.getElementById('status-modal').style.display = 'flex';
    }
}

function updateOrderStatus(orderId, newStatus) {
    const orderIndex = ordersData.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        ordersData[orderIndex].status = newStatus;
        saveOrdersToStorage(ordersData);
        renderOrders();
    }
}

// --- Admin Profile Logic ---
function initAdminProfile() {
    const defaultProfile = {
        name: 'Eva Robinson',
        title: 'CEO, Inc. Alabama Machinery\n& Supply',
        firstName: 'Eva',
        lastName: 'Robinson',
        email: 'Evao@alabamamachinery.com',
        phone: '+911 120 222 313',
        avatar: 'https://i.pravatar.cc/150?img=11'
    };

    let profile = JSON.parse(localStorage.getItem('crm_admin_profile')) || defaultProfile;

    const els = {
        name: document.getElementById('admin-name'),
        title: document.getElementById('admin-title-text'),
        firstName: document.getElementById('admin-first-name'),
        lastName: document.getElementById('admin-last-name'),
        email: document.getElementById('admin-email'),
        phone: document.getElementById('admin-phone'),
        avatarMain: document.getElementById('main-profile-img'),
        avatarHeader: document.querySelector('#header-profile-pic img')
    };

    function renderProfile() {
        if(els.name) els.name.textContent = profile.name;
        if(els.title) els.title.innerHTML = profile.title.replace('\n', '<br>');
        if(els.firstName) els.firstName.textContent = profile.firstName;
        if(els.lastName) els.lastName.textContent = profile.lastName;
        if(els.email) els.email.textContent = profile.email;
        if(els.phone) els.phone.textContent = profile.phone;
        if(els.avatarMain) els.avatarMain.src = profile.avatar;
        if(els.avatarHeader) els.avatarHeader.src = profile.avatar;
    }

    renderProfile();

    // Avatar upload
    const avatarInput = document.getElementById('avatar-upload');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    profile.avatar = event.target.result;
                    localStorage.setItem('crm_admin_profile', JSON.stringify(profile));
                    renderProfile();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Edit info dummy
    const editBtn = document.getElementById('edit-admin-info-btn');
    if(editBtn) {
        editBtn.addEventListener('click', () => {
            const newFirstName = prompt("Podaj nowe imię:", profile.firstName);
            if(newFirstName !== null) {
                profile.firstName = newFirstName;
                profile.name = `${profile.firstName} ${profile.lastName}`;
                localStorage.setItem('crm_admin_profile', JSON.stringify(profile));
                renderProfile();
            }
        });
    }
}
