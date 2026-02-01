/**
 * DOM manipulation and rendering functions
 */

const UI = {
    /**
     * Initialize UI elements
     */
    init() {
        this.cacheElements();
        this.bindTabEvents();
        this.bindModalEvents();
    },

    /**
     * Cache DOM element references
     */
    cacheElements() {
        // Tabs
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabPanels = document.querySelectorAll('.tab-panel');

        // Favorites
        this.favoritesList = document.getElementById('favorites-list');
        this.favoritesEmpty = document.getElementById('favorites-empty');
        this.addFavoriteBtn = document.getElementById('add-favorite-btn');

        // Schedules
        this.schedulesList = document.getElementById('schedules-list');
        this.schedulesEmpty = document.getElementById('schedules-empty');
        this.addScheduleBtn = document.getElementById('add-schedule-btn');

        // Modals
        this.favoriteModal = document.getElementById('favorite-modal');
        this.scheduleModal = document.getElementById('schedule-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.confirmModal = document.getElementById('confirm-modal');

        // Forms
        this.favoriteForm = document.getElementById('favorite-form');
        this.scheduleForm = document.getElementById('schedule-form');

        // Notification banner
        this.notificationBanner = document.getElementById('notification-banner');

        // Toast container
        this.toastContainer = document.getElementById('toast-container');
    },

    /**
     * Bind tab switching events
     */
    bindTabEvents() {
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    /**
     * Switch active tab
     * @param {string} tabName - Tab to switch to
     */
    switchTab(tabName) {
        // Update buttons
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update panels
        this.tabPanels.forEach(panel => {
            const isActive = panel.id === `${tabName}-tab`;
            panel.classList.toggle('active', isActive);
            panel.classList.toggle('hidden', !isActive);
        });
    },

    /**
     * Bind modal events (close on backdrop click, close button, etc.)
     */
    bindModalEvents() {
        document.querySelectorAll('.modal').forEach(modal => {
            // Close on backdrop click
            modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
                this.closeModal(modal);
            });

            // Close button
            modal.querySelector('.modal-close')?.addEventListener('click', () => {
                this.closeModal(modal);
            });

            // Cancel button
            modal.querySelector('.modal-cancel')?.addEventListener('click', () => {
                this.closeModal(modal);
            });
        });

        // ESC key closes modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    this.closeModal(modal);
                });
            }
        });
    },

    /**
     * Open a modal
     * @param {HTMLElement} modal - Modal element
     */
    openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close a modal
     * @param {HTMLElement} modal - Modal element
     */
    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    },

    /**
     * Render favorites list
     */
    renderFavorites() {
        const favorites = FavoritesModel.getAll();

        if (favorites.length === 0) {
            this.favoritesList.innerHTML = '';
            this.favoritesEmpty.classList.remove('hidden');
            return;
        }

        this.favoritesEmpty.classList.add('hidden');
        this.favoritesList.innerHTML = favorites.map(fav => this.createFavoriteCard(fav)).join('');

        // Bind card menu events
        this.bindCardMenuEvents();
    },

    /**
     * Create favorite card HTML
     * @param {object} favorite - Favorite data
     * @returns {string} HTML string
     */
    createFavoriteCard(favorite) {
        const items = favorite.orderDetails.items || [];
        const tags = favorite.metadata.tags || [];
        const orderCount = favorite.metadata.orderCount || 0;

        const itemsHtml = items.length > 0
            ? `<div class="favorite-card-items">
                <ul>${items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
               </div>`
            : '';

        const tagsHtml = tags.length > 0
            ? `<div class="favorite-card-tags">
                ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
               </div>`
            : '';

        return `
            <div class="favorite-card" data-id="${favorite.id}">
                <div class="favorite-card-header">
                    <div>
                        <h3 class="favorite-card-title">${this.escapeHtml(favorite.name)}</h3>
                        <p class="favorite-card-restaurant">${this.escapeHtml(favorite.restaurant.name)}</p>
                    </div>
                    <div class="favorite-card-menu">
                        <button class="card-menu-btn" aria-label="Menu">⋮</button>
                        <div class="card-menu-dropdown">
                            <button data-action="edit">Edit</button>
                            <button data-action="schedule">Schedule</button>
                            <button data-action="delete" class="danger">Delete</button>
                        </div>
                    </div>
                </div>
                ${itemsHtml}
                <div class="favorite-card-meta">
                    ${tagsHtml}
                    <span>Ordered ${orderCount}x</span>
                </div>
                <div class="favorite-card-actions">
                    <button class="btn btn-primary" data-action="order">Order Now</button>
                </div>
            </div>
        `;
    },

    /**
     * Bind card menu toggle and action events
     */
    bindCardMenuEvents() {
        // Toggle dropdown
        document.querySelectorAll('.card-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                const isOpen = dropdown.classList.contains('show');

                // Close all dropdowns
                document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.remove('show'));

                // Toggle this one
                if (!isOpen) {
                    dropdown.classList.add('show');
                }
            });
        });

        // Close dropdowns when clicking elsewhere
        document.addEventListener('click', () => {
            document.querySelectorAll('.card-menu-dropdown').forEach(d => d.classList.remove('show'));
        });
    },

    /**
     * Render schedules list
     */
    renderSchedules() {
        const schedules = SchedulesModel.getAll();

        if (schedules.length === 0) {
            this.schedulesList.innerHTML = '';
            this.schedulesEmpty.classList.remove('hidden');
            return;
        }

        this.schedulesEmpty.classList.add('hidden');
        this.schedulesList.innerHTML = schedules.map(sch => this.createScheduleItem(sch)).join('');
    },

    /**
     * Create schedule item HTML
     * @param {object} schedule - Schedule data
     * @returns {string} HTML string
     */
    createScheduleItem(schedule) {
        const favorite = FavoritesModel.getById(schedule.favoriteId);
        const favoriteName = favorite ? favorite.name : 'Unknown Order';

        const timingText = this.formatScheduleTiming(schedule);
        const nextTrigger = schedule.metadata.nextTriggerAt
            ? this.formatRelativeTime(schedule.metadata.nextTriggerAt)
            : 'Not scheduled';

        const enabledClass = schedule.settings.enabled ? 'enabled' : '';

        return `
            <div class="schedule-item" data-id="${schedule.id}">
                <div class="schedule-toggle ${enabledClass}" data-action="toggle" title="Toggle schedule"></div>
                <div class="schedule-info">
                    <div class="schedule-name">${this.escapeHtml(schedule.name)}</div>
                    <div class="schedule-details">${this.escapeHtml(favoriteName)} • ${timingText}</div>
                    <div class="schedule-next">Next: ${nextTrigger}</div>
                </div>
                <div class="schedule-actions">
                    <button class="btn btn-secondary btn-small" data-action="trigger">Trigger Now</button>
                    <button class="btn btn-secondary btn-small" data-action="edit">Edit</button>
                    <button class="btn btn-text btn-small" data-action="delete">Delete</button>
                </div>
            </div>
        `;
    },

    /**
     * Format schedule timing for display
     * @param {object} schedule - Schedule data
     * @returns {string} Formatted timing string
     */
    formatScheduleTiming(schedule) {
        if (schedule.timing.type === 'once') {
            const date = new Date(schedule.timing.dateTime);
            return date.toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = schedule.timing.daysOfWeek
            .map(d => days[d])
            .join(', ');

        const time = this.formatTime(schedule.timing.time);
        return `${selectedDays} at ${time}`;
    },

    /**
     * Format time string
     * @param {string} time - Time in HH:MM format
     * @returns {string} Formatted time
     */
    formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit'
        });
    },

    /**
     * Format relative time
     * @param {string} isoString - ISO date string
     * @returns {string} Relative time string
     */
    formatRelativeTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = date.getTime() - now.getTime();

        if (diff < 0) return 'Past due';

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h ${minutes % 60}m`;
        return `${days}d ${hours % 24}h`;
    },

    /**
     * Populate favorite select dropdown in schedule modal
     */
    populateFavoriteSelect() {
        const select = document.getElementById('schedule-favorite');
        const favorites = FavoritesModel.getAll();

        select.innerHTML = '<option value="">Select a favorite...</option>';
        favorites.forEach(fav => {
            select.innerHTML += `<option value="${fav.id}">${this.escapeHtml(fav.name)}</option>`;
        });
    },

    /**
     * Show notification banner
     * @param {object} schedule - Schedule that triggered
     * @param {object} favorite - Associated favorite
     */
    showNotificationBanner(schedule, favorite) {
        const title = document.getElementById('notification-title');
        const message = document.getElementById('notification-message');

        title.textContent = 'Time to order!';
        message.textContent = `${schedule.name} - ${favorite.name}`;

        this.notificationBanner.classList.remove('hidden');
        this.notificationBanner.dataset.scheduleId = schedule.id;
        this.notificationBanner.dataset.favoriteId = favorite.id;
    },

    /**
     * Hide notification banner
     */
    hideNotificationBanner() {
        this.notificationBanner.classList.add('hidden');
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show confirm dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @returns {Promise<boolean>} User's choice
     */
    confirm(title, message) {
        return new Promise(resolve => {
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;

            const modal = this.confirmModal;
            const okBtn = document.getElementById('confirm-ok');
            const cancelBtn = document.getElementById('confirm-cancel');

            const cleanup = () => {
                this.closeModal(modal);
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
            };

            const onOk = () => {
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);

            this.openModal(modal);
        });
    },

    /**
     * Update server status display
     * @param {boolean} connected - Is server connected
     */
    updateServerStatus(connected) {
        const status = document.getElementById('server-status');
        if (connected) {
            status.textContent = 'Connected';
            status.className = 'status-badge status-connected';
        } else {
            status.textContent = 'Disconnected';
            status.className = 'status-badge status-disconnected';
        }
    },

    /**
     * Update notification permission status display
     */
    updateNotificationStatus() {
        const status = document.getElementById('notification-status');
        const btn = document.getElementById('notification-permission-btn');

        if (!('Notification' in window)) {
            status.textContent = 'Status: Not supported in this browser';
            btn.disabled = true;
            btn.textContent = 'Not Available';
            return;
        }

        status.textContent = `Status: ${Notification.permission}`;

        if (Notification.permission === 'granted') {
            btn.textContent = 'Enabled';
            btn.disabled = true;
        } else if (Notification.permission === 'denied') {
            btn.textContent = 'Blocked';
            btn.disabled = true;
        } else {
            btn.textContent = 'Enable';
            btn.disabled = false;
        }
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Add item input row to favorite form
     * @param {string} value - Optional initial value
     */
    addItemRow(value = '') {
        const container = document.getElementById('items-container');
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="text" class="item-input" placeholder="Item name" value="${this.escapeHtml(value)}">
            <button type="button" class="remove-item-btn" title="Remove item">×</button>
        `;

        row.querySelector('.remove-item-btn').addEventListener('click', () => {
            row.remove();
        });

        container.appendChild(row);
    },

    /**
     * Clear item rows in favorite form
     */
    clearItemRows() {
        document.getElementById('items-container').innerHTML = '';
    },

    /**
     * Get items from favorite form
     * @returns {Array} Array of item strings
     */
    getItemsFromForm() {
        const inputs = document.querySelectorAll('.item-input');
        return Array.from(inputs)
            .map(input => input.value.trim())
            .filter(val => val !== '');
    },

    /**
     * Open history panel
     */
    openHistoryPanel() {
        const panel = document.getElementById('history-panel');
        const backdrop = document.getElementById('history-backdrop');

        panel.classList.remove('hidden');
        backdrop.classList.remove('hidden');

        // Trigger animation
        requestAnimationFrame(() => {
            panel.classList.add('show');
            backdrop.classList.add('show');
        });

        this.renderHistory();
    },

    /**
     * Close history panel
     */
    closeHistoryPanel() {
        const panel = document.getElementById('history-panel');
        const backdrop = document.getElementById('history-backdrop');

        panel.classList.remove('show');
        backdrop.classList.remove('show');

        setTimeout(() => {
            panel.classList.add('hidden');
            backdrop.classList.add('hidden');
        }, 300);
    },

    /**
     * Render order history with optional filter
     * @param {string} filter - Filter value (today, week, month, all)
     */
    renderHistory(filter = null) {
        const filterSelect = document.getElementById('history-filter');
        const currentFilter = filter || filterSelect.value || 'all';

        const history = this.filterHistory(OrderHistoryModel.getAll(), currentFilter);
        const list = document.getElementById('history-list');
        const empty = document.getElementById('history-empty');

        if (history.length === 0) {
            list.innerHTML = '';
            list.classList.add('hidden');
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');
        list.classList.remove('hidden');
        list.innerHTML = history.map(entry => this.createHistoryEntry(entry)).join('');
    },

    /**
     * Filter history by time frame
     * @param {Array} history - All history entries
     * @param {string} filter - Filter value
     * @returns {Array} Filtered history
     */
    filterHistory(history, filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        return history.filter(entry => {
            const entryDate = new Date(entry.orderedAt);

            switch (filter) {
                case 'today':
                    return entryDate >= today;
                case 'week':
                    return entryDate >= weekStart;
                case 'month':
                    return entryDate >= monthStart;
                case 'all':
                default:
                    return true;
            }
        });
    },

    /**
     * Create history entry HTML
     * @param {object} entry - History entry
     * @returns {string} HTML string
     */
    createHistoryEntry(entry) {
        const date = new Date(entry.orderedAt);
        const timeStr = date.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit'
        });
        const dateStr = this.formatHistoryDate(date);

        const itemsText = entry.items.length > 0
            ? entry.items.slice(0, 3).join(', ') + (entry.items.length > 3 ? '...' : '')
            : 'No items specified';

        const statusClass = entry.status;
        const statusText = entry.status === 'completed' ? 'Done'
            : entry.status === 'partial' ? 'Partial'
            : 'Failed';

        const triggerText = entry.triggeredBy === 'schedule'
            ? `via ${entry.scheduleName || 'schedule'}`
            : 'Manual';

        return `
            <div class="history-entry">
                <div class="history-entry-header">
                    <span class="history-entry-name">${this.escapeHtml(entry.favoriteName)}</span>
                    <span class="history-entry-status ${statusClass}">${statusText}</span>
                </div>
                <div class="history-entry-restaurant">${this.escapeHtml(entry.restaurantName)}</div>
                <div class="history-entry-items">${this.escapeHtml(itemsText)}</div>
                <div class="history-entry-meta">
                    <span class="history-entry-time">${dateStr} at ${timeStr}</span>
                    <span class="history-entry-trigger">${triggerText}</span>
                </div>
            </div>
        `;
    },

    /**
     * Format date for history display
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatHistoryDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
        }
    }
};
