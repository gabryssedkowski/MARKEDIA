document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    initAdminProfile();
    initModal();
});

let ordersData = [];
let currentOrderIdForStatus = null;

function getOrdersFromStorage() {
    try {
        const stored = localStorage.getItem('markedia-orders');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading orders", e);
        return [];
    }
}

function saveOrdersToStorage(orders) {
    localStorage.setItem('markedia-orders', JSON.stringify(orders));
}

function loadOrders() {
    ordersData = getOrdersFromStorage();
    renderOrders();
    updateDashboardStats();
    updateFunnelStats();
}

function updateDashboardStats() {
    const totalRevenueEl = document.querySelector('.stat-item:nth-child(1) .stat-value');
    const totalOrdersEl = document.querySelector('.stat-item:nth-child(1) .stat-desc');
    const newCustomersEl = document.querySelector('.stat-item:nth-child(2) .stat-value');
    const newTasksEl = document.querySelector('.stat-item:nth-child(3) .stat-value');
    
    if(!totalRevenueEl) return;
    
    const activeOrders = ordersData.filter(o => o.status === 'nowe' || o.status === 'w_realizacji');
    const revenue = ordersData.reduce((sum, o) => {
        if (o.status === 'anulowane') return sum;
        let orderTotal = 0;
        if(o.total) {
            orderTotal = Number(o.total);
        } else if (o.items && o.items.length > 0) {
            orderTotal = o.items.reduce((s, item) => s + (Number(item.price) || 0), 0);
        }
        return sum + orderTotal;
    }, 0);
    
    totalRevenueEl.innerHTML = revenue + ' zł <span class="badge positive">Netto</span>';
    totalOrdersEl.innerHTML = 'Z ' + ordersData.length + ' zamówień<br>Šącznie';
    
    if (newCustomersEl) {
        document.querySelector('.stat-item:nth-child(2) .stat-desc').innerHTML = 'Nowe zapytania<br>W systemie';
        newCustomersEl.innerHTML = ordersData.filter(o => o.status === 'nowe').length + ' <span class="badge neutral">Nowe</span>';
    }
    
    if (newTasksEl) {
        document.querySelector('.stat-item:nth-child(3) .stat-desc').innerHTML = 'Zlecenia<br>W toku';
        newTasksEl.innerHTML = activeOrders.length + ' <span class="badge positive">W realizacji</span>';
    }
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
        const date = new Date(order.createdAt).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric', year: 'numeric' });
        const colorClass = cardColors[index % cardColors.length];
        const statusMap = {
            'nowe': 'Nowe',
            'w_realizacji': 'W trakcie',
            'zakonczone': 'Zakończone',
            'anulowane': 'Anulowane'
        };
        const displayStatus = statusMap[order.status || 'nowe'] || order.status;
        
        let clientName = order.customer?.contact || order.contact || 'Klient nieznany';
        let productText = '';
        let totalVal = 0;
        
        if (order.items && order.items.length > 0) {
            productText = order.items.map(i => i.title).join(' + ');
            totalVal = order.total;
        } else {
            productText = order.title || order.template || 'Zamówienie Brak';
            totalVal = order.price || 'Wycena';
        }

        return `
            <div class="history-card ${colorClass}" onclick="openStatusModal('${order.id}')">
                <div class="card-date" style="font-weight: 600;">${date} &bull; ${displayStatus}</div>
                <div class="card-title" style="margin-top: 0.5rem; font-size: 1.1rem;">${clientName}</div>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 1rem; line-height: 1.3;">
                    ${productText}
                </div>
                <div class="card-amount" style="font-size: 1.25rem;">${totalVal} zł</div>

                <div class="card-action"><i data-lucide="${colorClass === 'black' ? 'arrow-up-right' : 'more-horizontal'}"></i></div>

                <div class="card-avatars">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--paper); color: var(--foreground); display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 0.8rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${clientName.charAt(0).toUpperCase()}
                    </div>
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

function updateFunnelStats() {
    const totalPipelineEl = document.querySelector('.funnel-total h3');
    if (!totalPipelineEl) return;
    
    const nowe = ordersData.filter(o => o.status === 'nowe');
    const wTrakcie = ordersData.filter(o => o.status === 'w_realizacji');
    const zakonczone = ordersData.filter(o => o.status === 'zakonczone');
    
    const sumOrders = (orders) => orders.reduce((sum, o) => {
        let t = Number(o.total);
        if(!t && o.items) t = o.items.reduce((s,i) => s + (Number(i.price)||0), 0);
        return sum + (t||0);
    }, 0);
    
    const vNowe = sumOrders(nowe);
    const vWTrakcie = sumOrders(wTrakcie);
    const vZakonczone = sumOrders(zakonczone);
    
    const total = vNowe + vWTrakcie + vZakonczone;
    
    totalPipelineEl.innerHTML = `${total} zŅ`;
    
    const stagesContainer = document.querySelector('.funnel-stages');
    if(stagesContainer) {
        const pNowe = total ? Math.round((vNowe/total)*100) : 0;
        const pWTrakcie = total ? Math.round((vWTrakcie/total)*100) : 0;
        const pZakonczone = total ? Math.round((vZakonczone/total)*100) : 0;
        
        stagesContainer.innerHTML = `
            <div class="stage" style="width: ${pNowe || 10}%;">
                <div class="stage-info">
                    <span class="stage-name">Nowe zapytania</span>
                    <span class="stage-val">${vNowe} zł</span>
                </div>
                <button><i data-lucide="maximize-2"></i></button>
            </div>
            <div class="stage" style="width: ${pWTrakcie || 10}%;">
                <div class="stage-info">
                    <span class="stage-name">W realizacji</span>
                    <span class="stage-val">${vWTrakcie} zł</span>
                </div>
                <button><i data-lucide="maximize-2"></i></button>
            </div>
            <div class="stage" style="width: ${pZakonczone || 10}%;">
                <div class="stage-info">
                    <span class="stage-name">Zakończone</span>
                    <span class="stage-val">${vZakonczone} zł</span>
                </div>
                <button><i data-lucide="maximize-2"></i></button>
            </div>
        `;
        if(window.lucide) window.lucide.createIcons();
    }
}