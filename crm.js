document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
    initAdminProfile();
    initModal();
    initSidebar();
});

let ordersData = [];
let currentOrderIdForStatus = null;
let currentFilter = "all";
let searchTerm = "";
let layoutMode = "grid";

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

    let filteredOrders = ordersData.filter(order => {
        let matchesSearch = true;
        if (searchTerm) {
            const textToSearch = ((order.customer?.contact || order.contact || '') + ' ' + (order.title || '') + ' ' + (order.items?.map(i => i.title).join(' ') || '')).toLowerCase();
            matchesSearch = textToSearch.includes(searchTerm.toLowerCase());
        }
        let matchesFilter = true;
        if (currentFilter === 'starred') {
            matchesFilter = !!order.isStarred;
        } else if (currentFilter === 'bookmarked') {
            matchesFilter = !!order.isBookmarked;
        }
        return matchesSearch && matchesFilter;
    });

    if (filteredOrders.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Brak zamówień.</p>';
        return;
    }

    const cardColors = ['blue', 'teal', 'black', 'yellow', 'bg-light'];

    grid.innerHTML = filteredOrders.map((order, index) => {
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
            <div class="history-card ${colorClass}" onclick="if(!event.target.closest('.card-icon-btn')) openStatusModal('${order.id}')">
                <div class="card-date" style="font-weight: 600;">${date} &bull; ${displayStatus}</div>
                <div class="card-title" style="margin-top: 0.5rem; font-size: 1.1rem;">${clientName}</div>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 1rem; line-height: 1.3;">
                    ${productText}
                </div>
                <div class="card-amount" style="font-size: 1.25rem;">${totalVal} zł</div>

                <div class="card-action"><i data-lucide="${colorClass === 'black' ? 'arrow-up-right' : 'more-horizontal'}"></i></div>

                <div class="card-actions-group">
                    <button class="card-icon-btn star-btn ${order.isStarred ? 'active' : ''}" onclick="toggleOrderFlag('${order.id}', 'isStarred', event)" title="Wyróżnij"><i data-lucide="star"></i></button>
                    <button class="card-icon-btn bookmark-btn ${order.isBookmarked ? 'active' : ''}" onclick="toggleOrderFlag('${order.id}', 'isBookmarked', event)" title="Zapisz"><i data-lucide="bookmark"></i></button>
                </div>

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

    if (window.gsap) {
        gsap.fromTo('.history-card',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
        );
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

window.toggleOrderFlag = function(orderId, flag, event) {
    event.stopPropagation();
    const order = ordersData.find(o => o.id === orderId);
    if (order) {
        order[flag] = !order[flag];
        saveOrdersToStorage(ordersData);

        const btn = event.currentTarget;
        if(window.gsap) {
            gsap.to(btn, { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1, onComplete: renderOrders });
        } else {
            renderOrders();
        }
    }
}

function initSidebar() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-action]');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('order-search-input');
    const closeSearchBtn = document.getElementById('close-search-btn');
    const grid = document.getElementById('orders-grid');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.getAttribute('data-action');

            if(window.gsap) {
                gsap.fromTo(item, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(1.7)' });
            }

            if (['filter-starred', 'filter-bookmarked', 'view-grid', 'view-list'].includes(action)) {
                if (['view-grid', 'view-list'].includes(action)) {
                    document.querySelectorAll('.sidebar-nav .nav-item[data-action="view-grid"], .sidebar-nav .nav-item[data-action="view-list"]').forEach(n => n.classList.remove('active'));
                    item.classList.add('active');
                } else {
                    if(item.classList.contains('active')) {
                        item.classList.remove('active');
                        currentFilter = 'all';
                    } else {
                        document.querySelectorAll('.sidebar-nav .nav-item[data-action="filter-starred"], .sidebar-nav .nav-item[data-action="filter-bookmarked"]').forEach(n => n.classList.remove('active'));
                        item.classList.add('active');
                        currentFilter = action === 'filter-starred' ? 'starred' : 'bookmarked';
                    }
                    renderOrders();
                }
            }

            switch (action) {
                case 'search':
                    if (searchContainer.style.display === 'none') {
                        searchContainer.style.display = 'flex';
                        if(window.gsap) {
                            gsap.fromTo(searchContainer, {width: 0, opacity: 0}, {width: 220, opacity: 1, duration: 0.4, ease: 'power2.out'});
                        }
                        searchInput.focus();
                    } else {
                        if(window.gsap) {
                            gsap.to(searchContainer, {width: 0, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { searchContainer.style.display = 'none'; }});
                        } else {
                            searchContainer.style.display = 'none';
                        }
                        searchTerm = '';
                        searchInput.value = '';
                        renderOrders();
                    }
                    break;
                case 'export':
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ordersData, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "markedia_orders.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                    break;
                case 'view-grid':
                    layoutMode = 'grid';
                    grid.classList.remove('list-view');
                    renderOrders();
                    break;
                case 'view-list':
                    layoutMode = 'list';
                    grid.classList.add('list-view');
                    renderOrders();
                    break;
                case 'settings':
                    document.getElementById('settings-modal').style.display = 'flex';
                    break;
            }
        });
    });

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderOrders();
        });
    }

    if(closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            if(window.gsap) {
                gsap.to(searchContainer, {width: 0, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { searchContainer.style.display = 'none'; }});
            } else {
                searchContainer.style.display = 'none';
            }
            searchTerm = '';
            searchInput.value = '';
            renderOrders();
        });
    }

    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.querySelector('.close-settings-modal');
    if(closeSettings) closeSettings.onclick = () => settingsModal.style.display = 'none';
    document.getElementById('clear-orders-btn')?.addEventListener('click', () => {
        if(confirm('Na pewno chcesz usunąć wszystkie zamówienia?')) {
            localStorage.removeItem('markedia-orders');
            ordersData = [];
            loadOrders();
            settingsModal.style.display = 'none';
        }
    });
    document.getElementById('reset-profile-btn')?.addEventListener('click', () => {
        if(confirm('Zresetować profil admina do domyślnego?')) {
            localStorage.removeItem('crm_admin_profile');
            initAdminProfile();
            settingsModal.style.display = 'none';
        }
    });
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