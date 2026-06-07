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

    const dashboardGrid = document.querySelector('.dashboard-grid');
    const pageTitle = document.querySelector('.page-title');
    const statsRow = document.querySelector('.stats-row');
    const historyTitle = document.querySelector('.interaction-history .panel-header h2');

    function toggleFullView(isActive, type) {
        const clientOrdersView = document.getElementById('client-orders-view');
        if (clientOrdersView) {
            clientOrdersView.style.display = 'none';
        }
        dashboardGrid.style.display = 'grid'; // ensure normal grid is visible
        document.querySelector('.sub-header').style.display = 'flex'; // ensure subheader is visible

        if (isActive) {
            dashboardGrid.classList.add('full-view');
            statsRow.style.display = 'none';
            if (type === 'starred') {
                pageTitle.innerHTML = 'Ulubione<br>Zamówienia';
                historyTitle.innerText = 'Ulubione zamówienia';
            } else if (type === 'bookmarked') {
                pageTitle.innerHTML = 'Zapisane<br>Zamówienia';
                historyTitle.innerText = 'Zapisane zamówienia';
            }
        } else {
            dashboardGrid.classList.remove('full-view');
            statsRow.style.display = 'flex';
            pageTitle.innerHTML = 'Panel<br>Zarządzania';
            historyTitle.innerText = 'Interaction History / Spis zamówień';
        }
    }

    const sidebarLogoBtn = document.getElementById('sidebar-logo-btn');
    if (sidebarLogoBtn) {
        sidebarLogoBtn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            document.querySelector('.sidebar-nav .nav-item[data-action="view-grid"]')?.classList.add('active');

            currentFilter = 'all';
            layoutMode = 'grid';
            grid.classList.remove('list-view');

            toggleFullView(false);
            renderOrders();
        });
    }

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
                        toggleFullView(false);
                    } else {
                        document.querySelectorAll('.sidebar-nav .nav-item[data-action="filter-starred"], .sidebar-nav .nav-item[data-action="filter-bookmarked"]').forEach(n => n.classList.remove('active'));
                        item.classList.add('active');
                        currentFilter = action === 'filter-starred' ? 'starred' : 'bookmarked';
                        toggleFullView(true, currentFilter);
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

                    const clientOrdersViewGrid = document.getElementById('client-orders-view');
                    if (clientOrdersViewGrid) {
                        clientOrdersViewGrid.style.display = 'none';
                    }
                    document.querySelector('.dashboard-grid').style.display = 'grid';
                    document.querySelector('.sub-header').style.display = 'flex';

                    renderOrders();
                    break;
                case 'view-list':
                    const clientOrdersView = document.getElementById('client-orders-view');
                    const dashboardGridEl = document.querySelector('.dashboard-grid');
                    const subHeaderEl = document.querySelector('.sub-header');

                    if (clientOrdersView) {
                        dashboardGridEl.style.display = 'none';
                        subHeaderEl.style.display = 'none';
                        clientOrdersView.style.display = 'block';

                        // Initial render of client panel
                        if (typeof renderClientOrders === 'function') {
                            renderClientOrders();
                        }
                    }
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
// --- Client Panel Logic ---
let currentClientFilter = 'all';
let currentClientSearch = '';

function getClientStatusInfo(status) {
    const map = {
        'nowe': { text: 'Oczekuje', cls: 'status-oczekuje', icon: 'clock' },
        'w_realizacji': { text: 'W realizacji', cls: 'status-realizacja', icon: 'tool' },
        'do_akceptacji': { text: 'Do akceptacji', cls: 'status-akceptacja', icon: 'check-circle' },
        'gotowe': { text: 'Do akceptacji', cls: 'status-akceptacja', icon: 'check-circle' },
        'wyslane': { text: 'Wysłane', cls: 'status-wyslane', icon: 'truck' },
        'zakonczone': { text: 'Zakończone', cls: 'status-zakonczone', icon: 'flag' },
        'anulowane': { text: 'Anulowane', cls: 'status-zakonczone', icon: 'x-circle' } // Map canceled to completed for simplicity or create new
    };
    return map[status] || map['nowe'];
}

function getProgressSteps(status) {
    const statuses = ['nowe', 'w_realizacji', 'do_akceptacji', 'wyslane', 'zakonczone'];
    let idx = statuses.indexOf(status);
    if (idx === -1) idx = 0;

    // Gotowe mapped to do akceptacji step
    if (status === 'gotowe') idx = 2;

    const percentage = Math.min(100, Math.max(0, (idx / (statuses.length - 1)) * 100));

    const stepsHtml = `
        <div class="client-progress-container">
            <div class="client-progress-track">
                <div class="client-progress-fill" style="width: ${percentage}%; background-color: var(--purple);"></div>
            </div>
            <div class="client-progress-steps">
                <span class="client-step-label ${idx >= 0 ? 'active' : ''}">Złożone</span>
                <span class="client-step-label ${idx >= 1 ? 'active' : ''}">Projektowanie</span>
                <span class="client-step-label ${idx >= 2 ? 'active' : ''}">Poprawki</span>
                <span class="client-step-label ${idx >= 3 ? 'active' : ''}">Akceptacja</span>
                <span class="client-step-label ${idx >= 4 ? 'active' : ''}">Gotowe</span>
            </div>
        </div>
    `;
    return stepsHtml;
}

function renderClientOrders() {
    const grid = document.getElementById('client-orders-grid');
    const emptyState = document.getElementById('client-empty-state');
    const totalCountEl = document.getElementById('client-total-count');
    const activeCountEl = document.getElementById('client-active-count');
    const completedCountEl = document.getElementById('client-completed-count');
    const totalValEl = document.getElementById('client-total-value');

    if (!grid || !emptyState) return;

    let filtered = ordersData.filter(order => {
        let matchesSearch = true;
        if (currentClientSearch) {
            const textToSearch = ((order.customer?.contact || order.contact || '') + ' ' + (order.title || '') + ' ' + (order.items?.map(i => i.title).join(' ') || '')).toLowerCase();
            matchesSearch = textToSearch.includes(currentClientSearch.toLowerCase());
        }

        let matchesFilter = true;
        if (currentClientFilter === 'aktywne') {
            matchesFilter = ['w_realizacji', 'gotowe'].includes(order.status);
        } else if (currentClientFilter === 'oczekujace') {
            matchesFilter = order.status === 'nowe';
        } else if (currentClientFilter === 'zakonczone') {
            matchesFilter = ['wyslane', 'zakonczone', 'anulowane'].includes(order.status);
        }

        return matchesSearch && matchesFilter;
    });

    // Update Stats
    if (totalCountEl) totalCountEl.innerText = ordersData.length;

    const activeCount = ordersData.filter(o => ['w_realizacji', 'gotowe', 'do_akceptacji'].includes(o.status)).length;
    if (activeCountEl) activeCountEl.innerText = activeCount;

    const completedCount = ordersData.filter(o => ['zakonczone', 'wyslane'].includes(o.status)).length;
    if (completedCountEl) completedCountEl.innerText = completedCount;

    const totalValue = ordersData.reduce((sum, order) => {
        return sum + (order.items || []).reduce((itemSum, item) => itemSum + (item.price || 0) * (item.quantity || 1), 0);
    }, 0);
    if (totalValEl) totalValEl.innerText = totalValue + '$';

    if (filtered.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';

    filtered.forEach(order => {
        const statusInfo = getClientStatusInfo(order.status);
        const orderTitle = order.title || (order.items && order.items.length > 0 ? order.items[0].title : 'Zamówienie niestandardowe');
        const price = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

        const card = document.createElement('div');
        card.className = 'client-card';
        card.onclick = () => openClientModal(order);

        const thumbImg = (order.items && order.items[0] && order.items[0].image) ?
            `<img src="${order.items[0].image}" alt="thumb">` :
            `<i data-lucide="package" style="width:24px;height:24px;"></i>`;

        card.innerHTML = `
            <div class="client-card-header">
                <div class="client-card-thumb">
                    ${thumbImg}
                </div>
                <div class="client-card-info">
                    <h3 class="client-card-title">${orderTitle}</h3>
                    <p class="client-card-id">#${order.id}</p>
                </div>
                <div class="client-status-badge ${statusInfo.cls}">
                    <i data-lucide="${statusInfo.icon}"></i>
                    ${statusInfo.text}
                </div>
            </div>
            <div class="client-card-body">
                <div class="client-card-details">
                    <div class="client-detail-item">
                        <span class="client-detail-label">Data zamówienia</span>
                        <span class="client-detail-value">${new Date(order.date).toLocaleDateString('pl-PL')}</span>
                    </div>
                    <div class="client-detail-item" style="text-align: right;">
                        <span class="client-detail-label">Wartość</span>
                        <span class="client-detail-value">${price}$</span>
                    </div>
                </div>
                ${getProgressSteps(order.status)}
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

function openClientModal(order) {
    const modal = document.getElementById('client-order-modal');
    if (!modal) return;

    const statusInfo = getClientStatusInfo(order.status);
    const orderTitle = order.title || (order.items && order.items.length > 0 ? order.items[0].title : 'Zamówienie niestandardowe');
    const price = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    document.getElementById('modal-client-title').innerText = orderTitle;
    document.getElementById('modal-client-id').innerText = `Zamówienie #${order.id}`;
    document.getElementById('modal-client-date').innerText = new Date(order.date).toLocaleDateString('pl-PL');
    document.getElementById('modal-client-price').innerText = price + '$';

    const thumbContainer = document.getElementById('modal-client-thumb');
    thumbContainer.innerHTML = (order.items && order.items[0] && order.items[0].image) ?
            `<img src="${order.items[0].image}" alt="thumb">` :
            `<i data-lucide="package" style="width:32px;height:32px;"></i>`;

    const badgeContainer = document.getElementById('modal-client-status-badge');
    badgeContainer.innerHTML = `
        <div class="client-status-badge ${statusInfo.cls}" style="font-size: 0.9rem; padding: 6px 16px;">
            <i data-lucide="${statusInfo.icon}" style="width:16px;height:16px;"></i>
            ${statusInfo.text}
        </div>
    `;

    // Options
    const optionsContainer = document.getElementById('modal-client-options');
    let optionsHtml = '';
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            optionsHtml += `<div class="client-info-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                <span class="client-info-val">${item.title} (x${item.quantity})</span>`;

            if (item.options) {
                Object.entries(item.options).forEach(([key, val]) => {
                    optionsHtml += `<span class="client-info-label" style="font-size: 0.8rem;">- ${key}: ${val}</span>`;
                });
            }
            optionsHtml += `</div>`;
        });
    } else {
         optionsHtml = '<p style="color:var(--text-muted); font-size: 0.9rem; margin:0;">Brak szczegółowych opcji.</p>';
    }
    optionsContainer.innerHTML = optionsHtml;

    // Contact info inside description for now if there isn't a dedicated description
    const descContainer = document.getElementById('modal-client-desc');
    descContainer.innerHTML = `
        <p><strong>Kontakt:</strong> ${order.contact || 'Brak danych'}</p>
        <p><strong>Uwagi:</strong> Projekty w trakcie analizy zapotrzebowania klienta. Wszelkie uwagi prosimy przesyłać na adres mailowy.</p>
    `;

    // Advanced Timeline
    renderAdvancedTimeline(order.status);

    // Chat / Messages
    renderClientChat(order.id);

    // Files (Categorized)
    renderClientFiles(order.status);

    // Acceptance Section Logic
    const acceptanceSection = document.getElementById('client-acceptance-section');
    if (order.status === 'do_akceptacji' || order.status === 'gotowe') {
        acceptanceSection.style.display = 'block';
    } else {
        acceptanceSection.style.display = 'none';
    }

    modal.style.display = 'flex';
    if (window.lucide) {
        lucide.createIcons();
    }
}

function renderAdvancedTimeline(status) {
    const timelineContainer = document.getElementById('modal-client-timeline');
    const steps = [
        { id: 'nowe', label: 'Złożone', icon: 'file-text' },
        { id: 'w_realizacji_1', label: 'Materiały', icon: 'inbox' },
        { id: 'w_realizacji_2', label: 'Projektowanie', icon: 'pen-tool' },
        { id: 'poprawki', label: 'Poprawki', icon: 'refresh-cw' },
        { id: 'do_akceptacji', label: 'Akceptacja', icon: 'check-square' },
        { id: 'zakonczone', label: 'Ukończone', icon: 'award' }
    ];

    let currentStepIdx = 0;
    if (status === 'w_realizacji') currentStepIdx = 2;
    if (status === 'do_akceptacji' || status === 'gotowe') currentStepIdx = 4;
    if (status === 'wyslane' || status === 'zakonczone') currentStepIdx = 5;

    const percentage = (currentStepIdx / (steps.length - 1)) * 100;

    let html = `
        <div class="timeline-track">
            <div class="timeline-line">
                <div class="timeline-line-fill" style="width: ${percentage}%"></div>
            </div>
    `;

    steps.forEach((step, idx) => {
        let cls = '';
        if (idx < currentStepIdx) cls = 'completed';
        else if (idx === currentStepIdx) cls = 'active';

        html += `
            <div class="timeline-step ${cls}">
                <div class="timeline-icon">
                    <i data-lucide="${step.icon}"></i>
                </div>
                <div class="timeline-label">${step.label}</div>
            </div>
        `;
    });

    html += `</div>`;
    timelineContainer.innerHTML = html;
}

function renderClientChat(orderId) {
    const chatContainer = document.getElementById('modal-client-chat-messages');
    // Mock messages
    const messages = [
        { sender: 'designer', text: 'Dzień dobry! Zaczynamy pracę nad projektem. Proszę o przesłanie logo w wektorach.', time: '10:00' },
        { sender: 'client', text: 'Dzień dobry, pliki załączone w sekcji źródłowej.', time: '10:15' },
        { sender: 'designer', text: 'Dziękuję. Pierwsze szkice będą gotowe do jutra.', time: '10:30' }
    ];

    let html = '';
    messages.forEach(msg => {
        html += `
            <div class="chat-msg ${msg.sender}">
                <div class="chat-bubble">${msg.text}</div>
                <div class="chat-time">${msg.time}</div>
            </div>
        `;
    });
    chatContainer.innerHTML = html;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Attach send button logic once (cleanup old listeners first if needed, simplistic approach here)
    const sendBtn = document.getElementById('client-chat-send');
    const inputField = document.getElementById('client-chat-input');

    sendBtn.onclick = () => {
        const text = inputField.value.trim();
        if (!text) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg client';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'chat-bubble';
        bubbleDiv.textContent = text;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        msgDiv.appendChild(bubbleDiv);
        msgDiv.appendChild(timeDiv);

        chatContainer.appendChild(msgDiv);

        inputField.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
}

function renderClientFiles(status) {
    const filesContainer = document.getElementById('modal-client-files');

    const sourceFiles = [
        { name: 'brief.pdf', icon: 'file-text' },
        { name: 'logo.ai', icon: 'image' }
    ];

    const previewFiles = ['w_realizacji', 'do_akceptacji', 'gotowe', 'wyslane', 'zakonczone'].includes(status)
        ? [{ name: 'szkic_v1.jpg', icon: 'image' }] : [];

    const finalFiles = ['wyslane', 'zakonczone'].includes(status)
        ? [{ name: 'final_render.zip', icon: 'archive' }] : [];

    let html = '';

    if (sourceFiles.length > 0) {
        html += `<div class="client-file-category">
            <div class="client-file-category-title">Pliki źródłowe</div>`;
        sourceFiles.forEach(f => {
            html += `
                <div class="client-file-item">
                    <div class="client-file-info">
                        <i data-lucide="${f.icon}" class="client-file-icon"></i>
                        <span>${f.name}</span>
                    </div>
                    <i data-lucide="download" style="width:16px;height:16px;color:var(--text-muted)"></i>
                </div>`;
        });
        html += `</div>`;
    }

    if (previewFiles.length > 0) {
        html += `<div class="client-file-category">
            <div class="client-file-category-title">Podglądy</div>`;
        previewFiles.forEach(f => {
            html += `
                <div class="client-file-item">
                    <div class="client-file-info">
                        <i data-lucide="${f.icon}" class="client-file-icon"></i>
                        <span>${f.name}</span>
                    </div>
                    <i data-lucide="eye" style="width:16px;height:16px;color:var(--text-muted)"></i>
                </div>`;
        });
        html += `</div>`;
    }

    if (finalFiles.length > 0) {
        html += `<div class="client-file-category">
            <div class="client-file-category-title">Pliki finalne</div>`;
        finalFiles.forEach(f => {
            html += `
                <div class="client-file-item">
                    <div class="client-file-info">
                        <i data-lucide="${f.icon}" class="client-file-icon"></i>
                        <span>${f.name}</span>
                    </div>
                    <i data-lucide="download" style="width:16px;height:16px;color:var(--text-muted)"></i>
                </div>`;
        });
        html += `</div>`;
    }

    if (!html) {
        html = '<p style="color:var(--text-muted); font-size:0.9rem;">Brak plików w tym projekcie.</p>';
    }

    filesContainer.innerHTML = html;
}

// Initialization for Client Panel
document.addEventListener('DOMContentLoaded', () => {
    // Client Search
    const clientSearch = document.getElementById('client-search-input');
    if (clientSearch) {
        clientSearch.addEventListener('input', (e) => {
            currentClientSearch = e.target.value;
            renderClientOrders();
        });
    }

    // Client Filters
    const filterBtns = document.querySelectorAll('.client-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentClientFilter = target.getAttribute('data-client-filter');
            renderClientOrders();
        });
    });

    // Client Modal Close
    const closeModalBtn = document.getElementById('client-close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('client-order-modal').style.display = 'none';
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('client-order-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Acceptance buttons logic
    const acceptBtn = document.getElementById('btn-accept-project');
    const rejectBtn = document.getElementById('btn-reject-project');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            alert('Projekt zaakceptowany! Rozpoczynamy przygotowywanie plików finalnych.');
            // Here you would send a request to backend to update order status to 'zakonczone' or similar
            document.getElementById('client-order-modal').style.display = 'none';
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            alert('Wysłano prośbę o poprawki. Zespół zajmie się nimi wkrótce.');
            // Here you would send a request to backend to update order status to 'poprawki' or similar
            document.getElementById('client-order-modal').style.display = 'none';
        });
    }
});
