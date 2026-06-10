// Security Helper
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

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
    

    let currentRev = parseInt(totalRevenueEl.getAttribute('data-value') || 0);
    if(window.gsap) {
        gsap.to({val: currentRev}, {val: revenue, duration: 1, onUpdate: function() {
            totalRevenueEl.innerHTML = Math.floor(this.targets()[0].val) + ' zł <span class="badge positive">Netto</span>';
        }});
        totalRevenueEl.setAttribute('data-value', revenue);
    } else {
        totalRevenueEl.innerHTML = revenue + ' zł <span class="badge positive">Netto</span>';
    }

    totalOrdersEl.innerHTML = 'Z ' + ordersData.length + ' zamówień<br>Šącznie';
    
    if (newCustomersEl) {
        document.querySelector('.stat-item:nth-child(2) .stat-desc').innerHTML = 'Nowe zapytania<br>W systemie';

        const newCount = ordersData.filter(o => o.status === 'nowe').length;
        let currentNew = parseInt(newCustomersEl.getAttribute('data-value') || 0);
        if(window.gsap) {
            gsap.to({val: currentNew}, {val: newCount, duration: 1, onUpdate: function() {
                newCustomersEl.innerHTML = Math.floor(this.targets()[0].val) + ' <span class="badge neutral">Nowe</span>';
            }});
            newCustomersEl.setAttribute('data-value', newCount);
        } else {
            newCustomersEl.innerHTML = newCount + ' <span class="badge neutral">Nowe</span>';
        }

    }
    
    if (newTasksEl) {
        document.querySelector('.stat-item:nth-child(3) .stat-desc').innerHTML = 'Zlecenia<br>W toku';

        const activeCount = activeOrders.length;
        let currentActive = parseInt(newTasksEl.getAttribute('data-value') || 0);
        if(window.gsap) {
            gsap.to({val: currentActive}, {val: activeCount, duration: 1, onUpdate: function() {
                newTasksEl.innerHTML = Math.floor(this.targets()[0].val) + ' <span class="badge positive">W realizacji</span>';
            }});
            newTasksEl.setAttribute('data-value', activeCount);
        } else {
            newTasksEl.innerHTML = activeCount + ' <span class="badge positive">W realizacji</span>';
        }

    }
}


// Global activities memory
let globalActivities = JSON.parse(localStorage.getItem('markedia-crm-activities')) || [
    { type: 'create', text: 'Utworzono nowe zamówienie #ORD-562', time: new Date(Date.now() - 3600000).toISOString() },
    { type: 'status', text: 'Zmieniono status zamówienia #ORD-12345 na W realizacji', time: new Date(Date.now() - 7200000).toISOString() },
    { type: 'note', text: 'Dodano notatkę do zamówienia #ORD-9876', time: new Date(Date.now() - 86400000).toISOString() }
];

function logActivity(type, text) {
    globalActivities.unshift({ type, text, time: new Date().toISOString() });
    if(globalActivities.length > 50) globalActivities.pop();
    localStorage.setItem('markedia-crm-activities', JSON.stringify(globalActivities));
    renderGlobalActivities();
}

function renderGlobalActivities() {
    const list = document.getElementById('global-activity-list');
    if(!list) return;
    list.innerHTML = '';

    globalActivities.forEach(act => {
        let iconHtml = '';
        if(act.type === 'create') iconHtml = '<i data-lucide="plus"></i>';
        else if(act.type === 'status') iconHtml = '<i data-lucide="refresh-cw"></i>';
        else if(act.type === 'note') iconHtml = '<i data-lucide="file-text"></i>';
        else iconHtml = '<i data-lucide="info"></i>';

        const timeStr = new Date(act.time).toLocaleString('pl-PL');

        list.innerHTML += `
            <div class="activity-item">
                <div class="activity-icon ${act.type}">
                    ${iconHtml}
                </div>
                <div class="activity-content">
                    <div class="activity-text">${escapeHTML(act.text)}</div>
                    <div class="activity-time">${timeStr}</div>
                </div>
            </div>
        `;
    });

    if(window.lucide) window.lucide.createIcons();
}

function renderOrders() {
    const grid = document.getElementById('orders-grid');
    if (!grid) return;

    // Add skeletons before real data
    grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="history-card skeleton-card">
            <div class="skeleton skeleton-text" style="width: 40%;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 60%;"></div>
            <div class="skeleton skeleton-amount"></div>
        </div>
    `).join('');

    setTimeout(() => {

    // Add brief loading state to show interactivity, especially if sorting/filtering
    grid.style.opacity = '0.5';
    setTimeout(() => {
        grid.style.opacity = '1';
    }, 150);

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

    const localOrderSort = document.getElementById('order-sort');
    if (localOrderSort) {
        const sortMode = localOrderSort.value;
        filteredOrders.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || new Date().toISOString());
            const dateB = new Date(b.createdAt || b.date || new Date().toISOString());
            const valA = a.price || (a.items && a.items.length ? a.items.reduce((s, i) => s + (i.price || 0)*(i.quantity || 1), 0) : 0);
            const valB = b.price || (b.items && b.items.length ? b.items.reduce((s, i) => s + (i.price || 0)*(i.quantity || 1), 0) : 0);

            switch (sortMode) {
                case 'date-desc': return dateB - dateA;
                case 'date-asc': return dateA - dateB;
                case 'value-desc': return valB - valA;
                case 'value-asc': return valA - valB;
                case 'status': return (a.status || '').localeCompare(b.status || '');
                default: return 0;
            }
        });
    } else {
        // default sorting by date desc
        filteredOrders.sort((a, b) => new Date(b.createdAt || b.date || new Date().toISOString()) - new Date(a.createdAt || a.date || new Date().toISOString()));
    }

    if (filteredOrders.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: var(--text-muted); background: var(--card-light); border-radius: var(--radius-md); border: 1px dashed var(--panel-border);">
                <i data-lucide="package-open" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3 style="margin: 0 0 8px 0; font-size: 1.2rem; color: var(--text-main);">Brak zamówień</h3>
                <p style="margin: 0; font-size: 0.9rem;">Nie znaleziono zamówień pasujących do obecnych filtrów.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const cardColors = ['blue', 'teal', 'black', 'yellow', 'bg-light'];

            grid.innerHTML = filteredOrders.map((order, index) => {
        const orderDateStr = order.createdAt || order.date || new Date().toISOString();
        const date = new Date(orderDateStr).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric', year: 'numeric' });

        // Use strict colors based on status
        let cardColorClass = '';
        switch(order.status) {
            case 'nowe': cardColorClass = 'blue'; break;
            case 'w_realizacji': cardColorClass = 'orange'; break;
            case 'poprawki': cardColorClass = 'orange'; break;
            case 'do_akceptacji': cardColorClass = 'purple'; break;
            case 'zakonczone': cardColorClass = 'green'; break;
            case 'anulowane': cardColorClass = 'red'; break;
            default: cardColorClass = 'blue';
        }

        const statusMap = {
            'nowe': 'Nowe',
            'w_realizacji': 'W realizacji',
            'poprawki': 'Poprawki',
            'do_akceptacji': 'Oczekuje na akceptację',
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

        clientName = escapeHTML(clientName);
        productText = escapeHTML(productText);

        const priorityHtml = order.priority ? `<span class="priority-badge priority-${order.priority}">${order.priority === 'high' ? 'Wysoki' : order.priority === 'low' ? 'Niski' : 'Normalny'}</span>` : '';
        const orderDate = new Date(orderDateStr);
        const daysSinceCreation = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
        const delayHtml = daysSinceCreation > 7 && (order.status !== 'zakonczone' && order.status !== 'anulowane') ? `<span class="delay-indicator" title="Opóźnienie realizacji! (${daysSinceCreation} dni)">&bull;</span>` : '';

        return `
            <div class="history-card ${cardColorClass}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap: wrap; gap: 4px;">
                    <div class="card-date" style="font-weight: 600; margin:0; display:flex; align-items:center; gap: 4px;">${date} &bull; ${displayStatus} ${delayHtml}</div>
                    ${priorityHtml}
                </div>
                <div class="card-title" style="margin-top: 0.5rem; font-size: 1.1rem;" title="${clientName}">${clientName}</div>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 1rem; line-height: 1.3;">
                    ${productText}
                </div>
                <div class="card-amount" style="font-size: 1.25rem;">${totalVal} zł</div>

                <div class="card-action"><i data-lucide="${cardColorClass === 'black' ? 'arrow-up-right' : 'more-horizontal'}"></i></div>

                <div class="card-actions-group">
                    <button class="card-icon-btn star-btn ${order.isStarred ? 'active' : ''}" onclick="toggleOrderFlag('${order.id}', 'isStarred', event)" title="Wyróżnij"><i data-lucide="star"></i></button>
                    <button class="card-icon-btn bookmark-btn ${order.isBookmarked ? 'active' : ''}" onclick="toggleOrderFlag('${order.id}', 'isBookmarked', event)" title="Zapisz"><i data-lucide="bookmark"></i></button>
                </div>

                <div class="card-avatars">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--paper); color: var(--foreground); display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 0.8rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${clientName.charAt(0).toUpperCase()}
                    </div>
                </div>

                <div class="quick-actions-overlay">
                    <button class="qa-btn" data-tooltip="Otwórz" onclick="openOrderDetails('${order.id}', event)"><i data-lucide="maximize-2" style="width:18px;height:18px;"></i></button>
                    <button class="qa-btn" data-tooltip="Edytuj" onclick="editOrderDetails('${order.id}', event)"><i data-lucide="edit-2" style="width:18px;height:18px;"></i></button>
                    <button class="qa-btn" data-tooltip="Zmień status" onclick="openStatusModal('${order.id}', event)"><i data-lucide="activity" style="width:18px;height:18px;"></i></button>
                    <button class="qa-btn" data-tooltip="Dodaj notatkę" onclick="openAddNoteModal('${order.id}', event)"><i data-lucide="file-text" style="width:18px;height:18px;"></i></button>
                    <button class="qa-btn qa-delete" data-tooltip="Usuń" onclick="confirmDeleteOrder('${order.id}', event)"><i data-lucide="trash-2" style="width:18px;height:18px;"></i></button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Add staggered animation classes to newly created cards instead of relying fully on GSAP here
    // though GSAP is still great for entry. Let's combine them or use just GSAP.
        if (window.gsap) {
            gsap.fromTo('.history-card',
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'transform' }
            );
        } else {
            const cards = grid.querySelectorAll('.history-card');
            cards.forEach((card, i) => {
                card.style.animationDelay = `${i * 0.05}s`;
                card.classList.add('stagger-item');
            });
        }
    }, 400); // end of skeleton timeout
}

function initModal() {
    const modal = document.getElementById('status-modal');
    const closeBtn = modal ? modal.querySelector('.close-modal') : null;
    const cancelBtn = modal ? modal.querySelector('.close-modal-btn') : null;
    const saveBtn = document.getElementById('save-status-btn');

    if(!modal || !saveBtn) return;

    const closeModal = () => {
        modal.classList.remove('is-open');
        setTimeout(() => modal.style.display = 'none', 300);
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    saveBtn.onclick = () => {
        const newStatus = document.getElementById('new-status-select').value;
        if (currentOrderIdForStatus) {
            updateOrderStatus(currentOrderIdForStatus, newStatus);
            closeModal();
            // Also update modal visually if it is open
            if(window.currentAdminModalOrderId === currentOrderIdForStatus) {
                 const order = ordersData.find(o => o.id === currentOrderIdForStatus);
                 if(order) openOrderDetails(order.id, null);
            }
        }
    }
}

window.toggleOrderFlag = function(orderId, flag, event) {
    event.stopPropagation();
    const order = ordersData.find(o => o.id === orderId);
    if (order) {
        order[flag] = !order[flag];
        saveOrdersToStorage(ordersData);
        logActivity('info', `Zmieniono oznaczenie (${flag}) dla zamówienia #${orderId}`);

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
    const localOrderSearch = document.getElementById('order-search');
    const localOrderSort = document.getElementById('order-sort');
    const grid = document.getElementById('orders-grid');

    const dashboardGrid = document.querySelector('.dashboard-grid');
    const pageTitle = document.querySelector('.page-title');
    const statsRow = document.querySelector('.stats-row');
    const historyTitle = document.querySelector('.interaction-history .panel-header h2');

    function toggleFullView(isActive, type) {
        if(window.gsap) {
            gsap.fromTo('.dashboard-grid', {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.4, ease: 'power2.out'});
        }
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

    if(localOrderSearch) {
        localOrderSearch.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderOrders();
        });
    }

    if(localOrderSort) {
        localOrderSort.addEventListener('change', (e) => {
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
                    if(window.gsap) {
                        gsap.to('#client-orders-view', {opacity: 0, y: -10, duration: 0.2, ease: 'power2.in', onComplete: () => {
                            const clientOrdersViewGrid = document.getElementById('client-orders-view');
                            if (clientOrdersViewGrid) clientOrdersViewGrid.style.display = 'none';
                            document.querySelector('.dashboard-grid').style.display = 'grid';
                            document.querySelector('.sub-header').style.display = 'flex';
                            gsap.fromTo('.dashboard-grid, .sub-header', {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.4, ease: 'power2.out'});
                            renderOrders();
                        }});
                    } else {
                        const clientOrdersViewGrid = document.getElementById('client-orders-view');
                        if (clientOrdersViewGrid) clientOrdersViewGrid.style.display = 'none';
                        document.querySelector('.dashboard-grid').style.display = 'grid';
                        document.querySelector('.sub-header').style.display = 'flex';
                        renderOrders();
                    }
                    layoutMode = 'grid';
                    grid.classList.remove('list-view');
                    break;

                case 'view-list':
                    const clientOrdersView = document.getElementById('client-orders-view');
                    const dashboardGridEl = document.querySelector('.dashboard-grid');
                    const subHeaderEl = document.querySelector('.sub-header');

                    if (clientOrdersView) {
                        if(window.gsap) {
                            gsap.to('.dashboard-grid, .sub-header', {opacity: 0, y: -10, duration: 0.2, ease: 'power2.in', onComplete: () => {
                                dashboardGridEl.style.display = 'none';
                                subHeaderEl.style.display = 'none';
                                clientOrdersView.style.display = 'block';
                                gsap.fromTo('#client-orders-view', {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.4, ease: 'power2.out'});
                                if (typeof renderClientOrders === 'function') {
                                    renderClientOrders();
                                }
                            }});
                        } else {
                            dashboardGridEl.style.display = 'none';
                            subHeaderEl.style.display = 'none';
                            clientOrdersView.style.display = 'block';
                            if (typeof renderClientOrders === 'function') {
                                renderClientOrders();
                            }
                        }
                    }
                    break;

                case 'settings':
                    const settingsModal = document.getElementById('settings-modal');
                    settingsModal.style.display = 'flex';
                    setTimeout(() => settingsModal.classList.add('is-open'), 10);
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
    if(closeSettings) closeSettings.onclick = () => {
        settingsModal.classList.remove('is-open');
        setTimeout(() => settingsModal.style.display = 'none', 300);
    }
    document.getElementById('clear-orders-btn')?.addEventListener('click', () => {
        if(confirm('Na pewno chcesz usunąć wszystkie zamówienia?')) {
            localStorage.removeItem('markedia-orders');
            ordersData = [];
            loadOrders();
            settingsModal.classList.remove('is-open');
            setTimeout(() => settingsModal.style.display = 'none', 300);
        }
    });
    document.getElementById('reset-profile-btn')?.addEventListener('click', () => {
        if(confirm('Zresetować profil admina do domyślnego?')) {
            localStorage.removeItem('crm_admin_profile');
            initAdminProfile();
            settingsModal.classList.remove('is-open');
            setTimeout(() => settingsModal.style.display = 'none', 300);
        }
    });

    // Hide settings modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('is-open');
            setTimeout(() => settingsModal.style.display = 'none', 300);
        }
    });
}

window.openStatusModal = function(orderId, event) {
    if(event) event.stopPropagation();
    currentOrderIdForStatus = orderId;
    const order = ordersData.find(o => o.id === orderId);
    if(order) {
        const select = document.getElementById('new-status-select');
        if(select) select.value = order.status || 'nowe';
        const modal = document.getElementById('status-modal');
        modal.style.display = 'flex';
        // Add timeout to allow display flex to apply before adding class for transition
        setTimeout(() => modal.classList.add('is-open'), 10);
    }
}

function updateOrderStatus(orderId, newStatus) {
    const orderIndex = ordersData.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        ordersData[orderIndex].status = newStatus;
        saveOrdersToStorage(ordersData);
        logActivity('status', `Zmieniono status zamówienia #${orderId} na: ${newStatus}`);
        renderOrders();
        updateDashboardStats();
        updateFunnelStats();
    }
}

// --- Admin Profile Logic ---
function initAdminProfile() {
    renderGlobalActivities();
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
                logActivity('info', 'Zaktualizowano profil administratora');
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
    

    let currentTotal = parseInt(totalPipelineEl.getAttribute('data-value') || 0);
    if(window.gsap) {
        gsap.to({val: currentTotal}, {val: total, duration: 1, onUpdate: function() {
            totalPipelineEl.innerHTML = Math.floor(this.targets()[0].val) + ' zł';
        }});
        totalPipelineEl.setAttribute('data-value', total);
    } else {
        totalPipelineEl.innerHTML = `${total} zł`;
    }

    
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
        let orderTitle = order.title || (order.items && order.items.length > 0 ? order.items[0].title : 'Zamówienie niestandardowe');
        orderTitle = escapeHTML(orderTitle);
        const price = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

        const card = document.createElement('div');
        card.className = 'client-card';
        card.onclick = () => openClientModal(order);

        const thumbImg = (order.items && order.items[0] && order.items[0].image) ?
            `<img src="${escapeHTML(order.items[0].image)}" alt="thumb">` :
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
                        <span class="client-detail-value">${new Date(order.createdAt || order.date || new Date().toISOString()).toLocaleDateString('pl-PL')}</span>
                    </div>
                    <div class="client-detail-item" style="text-align: right;">
                        <span class="client-detail-label">Wartość</span>
                        <span class="client-detail-value">${price} zł</span>
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
    let orderTitle = order.title || (order.items && order.items.length > 0 ? order.items[0].title : 'Zamówienie niestandardowe');
    orderTitle = escapeHTML(orderTitle);
    const price = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    document.getElementById('modal-client-title').innerText = orderTitle;
    document.getElementById('modal-client-id').innerText = `Zamówienie #${order.id}`;
    document.getElementById('modal-client-date').innerText = new Date(order.createdAt || order.date || new Date().toISOString()).toLocaleDateString('pl-PL');
    document.getElementById('modal-client-price').innerText = price + ' zł';

    const thumbContainer = document.getElementById('modal-client-thumb');
    thumbContainer.innerHTML = (order.items && order.items[0] && order.items[0].image) ?
            `<img src="${escapeHTML(order.items[0].image)}" alt="thumb">` :
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
                <span class="client-info-val">${escapeHTML(item.title)} (x${item.quantity})</span>`;

            if (item.options) {
                Object.entries(item.options).forEach(([key, val]) => {
                    optionsHtml += `<span class="client-info-label" style="font-size: 0.8rem;">- ${escapeHTML(key)}: ${escapeHTML(val.toString())}</span>`;
                });
            }
            optionsHtml += `</div>`;
        });
    } else {
         optionsHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: var(--radius-sm); border: 1px dashed var(--panel-border);">
                <i data-lucide="settings" style="width: 24px; height: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 0.9rem; font-style: italic;">Brak szczegółowych opcji.</p>
            </div>
         `;
    }
    optionsContainer.innerHTML = optionsHtml;

    // Contact info inside description for now if there isn't a dedicated description
    const descContainer = document.getElementById('modal-client-desc');
    descContainer.innerHTML = `
        <p><strong>Kontakt:</strong> ${escapeHTML(order.contact || 'Brak danych')}</p>
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
    setTimeout(() => modal.classList.add('is-open'), 10);
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
                <div class="chat-bubble">${escapeHTML(msg.text)}</div>
                <div class="chat-time">${escapeHTML(msg.time)}</div>
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
        html = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: var(--radius-sm); border: 1px dashed var(--panel-border);">
                <i data-lucide="folder-open" style="width: 24px; height: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 0.9rem; font-style: italic;">Brak plików w tym projekcie.</p>
            </div>
        `;
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
            const modal = document.getElementById('client-order-modal');
            modal.classList.remove('is-open');
            setTimeout(() => modal.style.display = 'none', 300);
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('client-order-modal');
        if (e.target === modal) {
            modal.classList.remove('is-open');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });

    // Acceptance buttons logic
    const acceptBtn = document.getElementById('btn-accept-project');
    const rejectBtn = document.getElementById('btn-reject-project');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            alert('Projekt zaakceptowany! Rozpoczynamy przygotowywanie plików finalnych.');
            const modal = document.getElementById('client-order-modal');
            modal.classList.remove('is-open');
            setTimeout(() => modal.style.display = 'none', 300);
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            alert('Wysłano prośbę o poprawki. Zespół zajmie się nimi wkrótce.');
            const modal = document.getElementById('client-order-modal');
            modal.classList.remove('is-open');
            setTimeout(() => modal.style.display = 'none', 300);
        });
    }
});

window.editOrderDetails = function(orderId, event) {
    if(event) event.stopPropagation();
    alert('Edycja zamówienia wkrótce...');
};

window.openAddNoteModal = function(orderId, event) {
    if(event) event.stopPropagation();
    window.currentAdminModalOrderId = orderId;
    document.getElementById('admin-note-input').value = '';
    const modal = document.getElementById('admin-note-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('is-open'), 10);
};

window.confirmDeleteOrder = function(orderId, event) {
    if(event) event.stopPropagation();
    if(confirm("Czy na pewno chcesz usunąć to zamówienie? Tej akcji nie można cofnąć.")) {
        ordersData = ordersData.filter(o => o.id !== orderId);
        localStorage.setItem('markedia-orders', JSON.stringify(ordersData));
        logActivity('info', `Usunięto zamówienie #${orderId}`);
        renderOrders();
        updateDashboardStats();
        updateFunnelStats();
    }
};

window.openOrderDetails = function(orderId, event) {
    if(event) event.stopPropagation();
    const order = ordersData.find(o => o.id === orderId);
    if(!order) return;

    // Setup modal elements
    const modal = document.getElementById('admin-order-modal');
    const orderDateStr = order.createdAt || order.date || new Date().toISOString();
    document.getElementById('admin-modal-id').innerText = '#' + order.id;
    document.getElementById('admin-modal-title').innerText = order.title || 'Zamówienie';
    document.getElementById('admin-modal-date').innerHTML = `<i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Data: ` + new Date(orderDateStr).toLocaleDateString('pl-PL');

    // Calculate deadline (default +14 days)
    const deadlineDate = new Date(orderDateStr);
    deadlineDate.setDate(deadlineDate.getDate() + 14);
    document.getElementById('admin-modal-deadline').innerHTML = `<i data-lucide="clock" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Termin: ` + deadlineDate.toLocaleDateString('pl-PL');

    // Status Badge
    const statusMap = {
        'nowe': 'Nowe',
        'w_realizacji': 'W realizacji',
        'poprawki': 'Poprawki',
        'do_akceptacji': 'Oczekuje na akceptację',
        'zakonczone': 'Zakończone',
        'anulowane': 'Anulowane'
    };
    const statusText = statusMap[order.status || 'nowe'] || order.status;

    let badgeClass = 'status-badge ';
    let iconName = 'circle';

    switch(order.status) {
        case 'nowe': badgeClass += 'pulse-blue'; iconName = 'info'; break;
        case 'w_realizacji': badgeClass += 'pulse-orange'; iconName = 'loader'; break;
        case 'do_akceptacji': badgeClass += 'purple'; iconName = 'check-circle'; break;
        case 'poprawki': badgeClass += 'orange'; iconName = 'edit-3'; break;
        case 'zakonczone': badgeClass += 'green'; iconName = 'check'; break;
        case 'anulowane': badgeClass += 'red'; iconName = 'x-circle'; break;
        default: badgeClass += 'pulse-blue';
    }

    document.getElementById('admin-modal-status-badge').innerHTML = `
        <div class="${badgeClass}" style="padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i> ${statusText}
        </div>
    `;

    // Client Info
    let contact = order.customer?.contact || order.contact || 'Brak danych kontaktowych';
    document.getElementById('admin-modal-client-info').innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Kontakt:</strong> ${escapeHTML(contact)}</div>
        <div style="color: var(--text-muted); font-size: 0.85rem;">Identyfikator klienta: ${escapeHTML(order.customer?.id || 'Nieznany')}</div>
    `;

    // Products
    let productsHtml = '';
    let total = 0;
    if (order.items && order.items.length > 0) {
        productsHtml = order.items.map(item => {
            total += (item.price || 0) * (item.quantity || 1);
            return `
            <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
                <div>
                    <div style="font-weight: 500;">${escapeHTML(item.title || 'Produkt')}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Ilość: ${escapeHTML((item.quantity || 1).toString())}</div>
                </div>
                <div style="font-weight: 600;">${(item.price || 0) * (item.quantity || 1)} zł</div>
            </div>`;
        }).join('');
    } else {
        productsHtml = `
            <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
                <div>
                    <div style="font-weight: 500;">${escapeHTML(order.title || order.template || 'Zamówienie Brak')}</div>
                </div>
                <div style="font-weight: 600;">${escapeHTML((order.price || 'Wycena').toString())}</div>
            </div>`;
        total = order.price || 0;
    }

    // Config info
    let configHtml = '';
    if (order.config) {
        configHtml = '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--panel-border);">';
        configHtml += '<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Szczegóły konfiguracji:</div>';
        for (const [key, val] of Object.entries(order.config)) {
            if(val) {
                configHtml += `<div style="font-size: 0.85rem; margin-bottom: 3px;"><strong>${escapeHTML(key)}:</strong> ${escapeHTML(val.toString())}</div>`;
            }
        }
        configHtml += '</div>';
    }

    document.getElementById('admin-modal-products').innerHTML = productsHtml + configHtml;
    document.getElementById('admin-modal-total').innerText = total + ' zł';

    // Timeline
    const steps = [
        { id: 'nowe', label: 'Nowe', icon: 'file-plus' },
        { id: 'w_realizacji', label: 'W realizacji', icon: 'loader' },
        { id: 'poprawki', label: 'Poprawki', icon: 'edit-3' },
        { id: 'do_akceptacji', label: 'Akceptacja', icon: 'user-check' },
        { id: 'zakonczone', label: 'Zakończone', icon: 'check-circle' }
    ];

    let timelineHtml = '';
    let currentFound = false;

    if (order.status === 'anulowane') {
        timelineHtml = `
            <div class="admin-timeline-step active" style="--success: var(--error);">
                <div class="admin-timeline-content" style="color: var(--error); display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="x-circle" style="width: 16px; height: 16px;"></i> Zamówienie anulowane
                </div>
            </div>
        `;
    } else {
        steps.forEach((step) => {
            let stepClass = '';
            if (order.status === step.id) {
                stepClass = 'active';
                currentFound = true;
            } else if (!currentFound) {
                stepClass = 'completed';
            }

            // Poprawki is a conditional step, skip if not active and order went past it without it
            if (step.id === 'poprawki' && order.status !== 'poprawki') {
                // If it's completed, we still show it just so timeline is uniform, or skip it
                // To keep it simple, we'll just keep standard flow.
            }

            timelineHtml += `
                <div class="admin-timeline-step ${stepClass}">
                    <div class="admin-timeline-content" style="display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="${step.icon}" style="width: 16px; height: 16px;"></i> ${step.label}
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('admin-modal-timeline').innerHTML = timelineHtml;

    // Notes
    renderAdminNotes(order);

    // Setup global current for adding notes
    window.currentAdminModalOrderId = orderId;

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('is-open'), 10);

    if(window.lucide) {
        lucide.createIcons();
    }
};

function renderAdminNotes(order) {
    const notesContainer = document.getElementById('admin-modal-notes');
    if (!order.notes || order.notes.length === 0) {
        notesContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: var(--radius-sm); border: 1px dashed var(--panel-border);">
                <i data-lucide="file-text" style="width: 24px; height: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 0.9rem; font-style: italic;">Brak notatek do tego zamówienia.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    notesContainer.innerHTML = order.notes.map(note => `
        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: var(--radius-sm); border-left: 2px solid var(--purple);">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span>Administrator</span>
                <span>${new Date(note.createdAt || note.date || new Date().toISOString()).toLocaleString('pl-PL')}</span>
            </div>
            <div style="font-size: 0.95rem; line-height: 1.4;">${escapeHTML(note.text)}</div>
        </div>
    `).join('');
}

window.addNoteFromModal = function() {
    const orderId = window.currentAdminModalOrderId;
    if(!orderId) return;
    document.getElementById('admin-note-input').value = '';
    const modal = document.getElementById('admin-note-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('is-open'), 10);
};

window.saveNoteFromModal = function() {
    const orderId = window.currentAdminModalOrderId;
    if(!orderId) return;

    const note = document.getElementById('admin-note-input').value;
    if (note && note.trim() !== "") {
        const orderIndex = ordersData.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            if (!ordersData[orderIndex].notes) {
                ordersData[orderIndex].notes = [];
            }
            ordersData[orderIndex].notes.push({
                text: note,
                date: new Date().toISOString()
            });
            localStorage.setItem('markedia-orders', JSON.stringify(ordersData));
            renderAdminNotes(ordersData[orderIndex]);
            logActivity('note', `Dodano notatkę do zamówienia #${orderId}`);
            closeAdminNoteModal();
        }
    }
};

function closeAdminOrderModal() {
    const modal = document.getElementById('admin-order-modal');
    modal.classList.remove('is-open');
    setTimeout(() => modal.style.display = 'none', 300);
}

function closeAdminNoteModal() {
    const modal = document.getElementById('admin-note-modal');
    modal.classList.remove('is-open');
    setTimeout(() => modal.style.display = 'none', 300);
}

document.getElementById('close-admin-order-modal').addEventListener('click', closeAdminOrderModal);
document.getElementById('close-admin-note-modal').addEventListener('click', closeAdminNoteModal);

// Hide on outside click
window.addEventListener('click', (e) => {
    const adminModal = document.getElementById('admin-order-modal');
    const noteModal = document.getElementById('admin-note-modal');
    const statusModal = document.getElementById('status-modal');

    if (e.target === adminModal) closeAdminOrderModal();
    if (e.target === noteModal) closeAdminNoteModal();
    if (e.target === statusModal) {
        statusModal.classList.remove('is-open');
        setTimeout(() => statusModal.style.display = 'none', 300);
    }
});
