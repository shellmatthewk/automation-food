/**
 * App initialization and event binding
 */

const App = {
    /**
     * Initialize the application
     */
    init() {
        // Initialize UI
        UI.init();

        // Render initial data
        UI.renderFavorites();
        UI.renderSchedules();

        // Bind events
        this.bindFavoriteEvents();
        this.bindScheduleEvents();
        this.bindSettingsEvents();
        this.bindNotificationBannerEvents();
        this.bindHistoryEvents();

        // Initialize scheduler
        Scheduler.init();

        // Check server status
        this.checkServerStatus();

        // Update notification status
        UI.updateNotificationStatus();

        console.log('DoorDash Scheduler initialized');
    },

    /**
     * Bind favorite-related events
     */
    bindFavoriteEvents() {
        // Add favorite button
        UI.addFavoriteBtn.addEventListener('click', () => {
            this.openFavoriteModal();
        });

        // Add item button
        document.getElementById('add-item-btn').addEventListener('click', () => {
            UI.addItemRow();
        });

        // Form submission
        UI.favoriteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFavorite();
        });

        // Card actions (delegated)
        UI.favoritesList.addEventListener('click', (e) => {
            const card = e.target.closest('.favorite-card');
            if (!card) return;

            const id = card.dataset.id;
            const action = e.target.dataset.action;

            switch (action) {
                case 'order':
                    this.orderFavorite(id);
                    break;
                case 'edit':
                    this.editFavorite(id);
                    break;
                case 'schedule':
                    this.scheduleFavorite(id);
                    break;
                case 'delete':
                    this.deleteFavorite(id);
                    break;
            }
        });
    },

    /**
     * Bind schedule-related events
     */
    bindScheduleEvents() {
        // Add schedule button
        UI.addScheduleBtn.addEventListener('click', () => {
            this.openScheduleModal();
        });

        // Schedule type toggle
        document.querySelectorAll('input[name="schedule-type"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const isOnce = radio.value === 'once';
                document.getElementById('once-options').classList.toggle('hidden', !isOnce);
                document.getElementById('recurring-options').classList.toggle('hidden', isOnce);
            });
        });

        // Form submission
        UI.scheduleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSchedule();
        });

        // Schedule item actions (delegated)
        UI.schedulesList.addEventListener('click', (e) => {
            const item = e.target.closest('.schedule-item');
            if (!item) return;

            const id = item.dataset.id;
            const action = e.target.dataset.action;

            switch (action) {
                case 'toggle':
                    this.toggleSchedule(id);
                    break;
                case 'trigger':
                    Scheduler.manualTrigger(id);
                    break;
                case 'edit':
                    this.editSchedule(id);
                    break;
                case 'delete':
                    this.deleteSchedule(id);
                    break;
            }
        });
    },

    /**
     * Bind settings-related events
     */
    bindSettingsEvents() {
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            UI.openModal(UI.settingsModal);
            this.checkServerStatus();
            UI.updateNotificationStatus();
            this.loadAutomationSettings();
        });

        // Address selection
        document.getElementById('address-select').addEventListener('change', (e) => {
            this.saveSelectedAddress(e.target.value);
        });

        // Add address
        document.getElementById('add-address-btn').addEventListener('click', () => {
            this.addAddress();
        });

        // Delete address
        document.getElementById('delete-address-btn').addEventListener('click', () => {
            this.deleteSelectedAddress();
        });

        // Headless mode toggle
        document.getElementById('headless-mode').addEventListener('change', (e) => {
            this.saveAutomationSettings();
        });

        // Chrome profile path
        document.getElementById('chrome-profile').addEventListener('change', (e) => {
            this.saveAutomationSettings();
        });

        // Notification permission
        document.getElementById('notification-permission-btn').addEventListener('click', async () => {
            await Scheduler.requestNotificationPermission();
            UI.updateNotificationStatus();
        });

        // Export data
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
            e.target.value = ''; // Reset for re-selection
        });

        // Clear data
        document.getElementById('clear-data-btn').addEventListener('click', async () => {
            const confirmed = await UI.confirm(
                'Clear All Data',
                'This will delete all your favorites and schedules. This cannot be undone.'
            );
            if (confirmed) {
                Storage.clearAll();
                UI.renderFavorites();
                UI.renderSchedules();
                UI.showToast('All data cleared', 'success');
            }
        });
    },

    /**
     * Bind notification banner events
     */
    bindNotificationBannerEvents() {
        document.getElementById('notification-order').addEventListener('click', () => {
            const favoriteId = UI.notificationBanner.dataset.favoriteId;
            this.orderFavorite(favoriteId);
            UI.hideNotificationBanner();
        });

        document.getElementById('notification-snooze').addEventListener('click', () => {
            const scheduleId = UI.notificationBanner.dataset.scheduleId;
            Scheduler.snooze(scheduleId, 5);
        });

        document.getElementById('notification-dismiss').addEventListener('click', () => {
            UI.hideNotificationBanner();
        });
    },

    /**
     * Bind history panel events
     */
    bindHistoryEvents() {
        // Open history panel
        document.getElementById('history-toggle-btn').addEventListener('click', () => {
            UI.openHistoryPanel();
        });

        // Close history panel
        document.getElementById('history-close-btn').addEventListener('click', () => {
            UI.closeHistoryPanel();
        });

        // Close on backdrop click
        document.getElementById('history-backdrop').addEventListener('click', () => {
            UI.closeHistoryPanel();
        });

        // Filter change
        document.getElementById('history-filter').addEventListener('change', (e) => {
            UI.renderHistory(e.target.value);
        });

        // Clear history
        document.getElementById('history-clear-btn').addEventListener('click', async () => {
            const confirmed = await UI.confirm(
                'Clear History',
                'This will delete all order history. This cannot be undone.'
            );
            if (confirmed) {
                OrderHistoryModel.clearAll();
                UI.renderHistory();
                UI.showToast('History cleared', 'success');
            }
        });
    },

    /**
     * Open favorite modal for adding
     */
    openFavoriteModal() {
        document.getElementById('favorite-modal-title').textContent = 'Add Favorite';
        UI.favoriteForm.reset();
        UI.clearItemRows();
        UI.addItemRow(); // Start with one empty row
        document.getElementById('favorite-id').value = '';
        UI.openModal(UI.favoriteModal);
    },

    /**
     * Open favorite modal for editing
     * @param {string} id - Favorite ID
     */
    editFavorite(id) {
        const favorite = FavoritesModel.getById(id);
        if (!favorite) return;

        document.getElementById('favorite-modal-title').textContent = 'Edit Favorite';
        document.getElementById('favorite-id').value = id;
        document.getElementById('favorite-name').value = favorite.name;
        document.getElementById('restaurant-name').value = favorite.restaurant.name;
        document.getElementById('restaurant-url').value = favorite.restaurant.storeUrl || '';
        document.getElementById('special-instructions').value = favorite.orderDetails.specialInstructions || '';
        document.getElementById('estimated-total').value = favorite.orderDetails.estimatedTotal || '';
        document.getElementById('favorite-tags').value = (favorite.metadata.tags || []).join(', ');

        UI.clearItemRows();
        const items = favorite.orderDetails.items || [];
        if (items.length === 0) {
            UI.addItemRow();
        } else {
            items.forEach(item => UI.addItemRow(item));
        }

        UI.openModal(UI.favoriteModal);
    },

    /**
     * Save favorite (create or update)
     */
    saveFavorite() {
        const id = document.getElementById('favorite-id').value;
        const url = document.getElementById('restaurant-url').value;

        // Validate URL
        const validation = DoorDash.validateUrl(url);
        if (!validation.isValid) {
            UI.showToast(validation.message, 'error');
            return;
        }

        const data = {
            name: document.getElementById('favorite-name').value.trim(),
            restaurantName: document.getElementById('restaurant-name').value.trim(),
            storeUrl: url,
            items: UI.getItemsFromForm(),
            specialInstructions: document.getElementById('special-instructions').value.trim(),
            estimatedTotal: parseFloat(document.getElementById('estimated-total').value) || null,
            tags: document.getElementById('favorite-tags').value
                .split(',')
                .map(t => t.trim())
                .filter(t => t)
        };

        if (id) {
            FavoritesModel.update(id, data);
            UI.showToast('Favorite updated', 'success');
        } else {
            FavoritesModel.create(data);
            UI.showToast('Favorite created', 'success');
        }

        UI.closeModal(UI.favoriteModal);
        UI.renderFavorites();
    },

    /**
     * Delete a favorite
     * @param {string} id - Favorite ID
     */
    async deleteFavorite(id) {
        const favorite = FavoritesModel.getById(id);
        if (!favorite) return;

        const confirmed = await UI.confirm(
            'Delete Favorite',
            `Delete "${favorite.name}"? Any linked schedules will also be deleted.`
        );

        if (confirmed) {
            FavoritesModel.delete(id);
            UI.showToast('Favorite deleted', 'success');
            UI.renderFavorites();
            UI.renderSchedules();
        }
    },

    /**
     * Order a favorite
     * @param {string} id - Favorite ID
     */
    orderFavorite(id) {
        const favorite = FavoritesModel.getById(id);
        if (!favorite) {
            UI.showToast('Favorite not found', 'error');
            return;
        }
        DoorDash.triggerOrder(favorite);
    },

    /**
     * Open schedule modal for a specific favorite
     * @param {string} favoriteId - Favorite ID
     */
    scheduleFavorite(favoriteId) {
        this.openScheduleModal();
        document.getElementById('schedule-favorite').value = favoriteId;
    },

    /**
     * Open schedule modal for adding
     */
    openScheduleModal() {
        document.getElementById('schedule-modal-title').textContent = 'Add Schedule';
        UI.scheduleForm.reset();
        document.getElementById('schedule-id').value = '';

        // Reset visibility
        document.getElementById('once-options').classList.remove('hidden');
        document.getElementById('recurring-options').classList.add('hidden');

        // Set default datetime to now + 1 hour
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        defaultTime.setMinutes(0);
        document.getElementById('schedule-datetime').value = defaultTime.toISOString().slice(0, 16);

        UI.populateFavoriteSelect();
        UI.openModal(UI.scheduleModal);
    },

    /**
     * Open schedule modal for editing
     * @param {string} id - Schedule ID
     */
    editSchedule(id) {
        const schedule = SchedulesModel.getById(id);
        if (!schedule) return;

        document.getElementById('schedule-modal-title').textContent = 'Edit Schedule';
        document.getElementById('schedule-id').value = id;
        document.getElementById('schedule-name').value = schedule.name;

        UI.populateFavoriteSelect();
        document.getElementById('schedule-favorite').value = schedule.favoriteId;

        // Set type
        const typeRadio = document.querySelector(`input[name="schedule-type"][value="${schedule.timing.type}"]`);
        if (typeRadio) typeRadio.checked = true;

        // Show/hide options
        const isOnce = schedule.timing.type === 'once';
        document.getElementById('once-options').classList.toggle('hidden', !isOnce);
        document.getElementById('recurring-options').classList.toggle('hidden', isOnce);

        if (isOnce && schedule.timing.dateTime) {
            document.getElementById('schedule-datetime').value = schedule.timing.dateTime.slice(0, 16);
        } else {
            // Recurring options
            document.querySelectorAll('input[name="schedule-days"]').forEach(cb => {
                cb.checked = schedule.timing.daysOfWeek?.includes(parseInt(cb.value));
            });
            document.getElementById('schedule-time').value = schedule.timing.time || '';
        }

        document.getElementById('reminder-minutes').value = schedule.settings.reminderMinutesBefore || 15;
        document.getElementById('schedule-autoopen').checked = schedule.settings.autoOpen || false;

        UI.openModal(UI.scheduleModal);
    },

    /**
     * Save schedule (create or update)
     */
    saveSchedule() {
        const id = document.getElementById('schedule-id').value;
        const type = document.querySelector('input[name="schedule-type"]:checked').value;

        const data = {
            name: document.getElementById('schedule-name').value.trim(),
            favoriteId: document.getElementById('schedule-favorite').value,
            type,
            reminderMinutesBefore: parseInt(document.getElementById('reminder-minutes').value) || 0,
            autoOpen: document.getElementById('schedule-autoopen').checked
        };

        if (type === 'once') {
            data.dateTime = document.getElementById('schedule-datetime').value;
            if (!data.dateTime) {
                UI.showToast('Please select a date and time', 'error');
                return;
            }
        } else {
            data.daysOfWeek = Array.from(document.querySelectorAll('input[name="schedule-days"]:checked'))
                .map(cb => parseInt(cb.value));
            data.time = document.getElementById('schedule-time').value;

            if (data.daysOfWeek.length === 0) {
                UI.showToast('Please select at least one day', 'error');
                return;
            }
            if (!data.time) {
                UI.showToast('Please select a time', 'error');
                return;
            }
        }

        if (!data.favoriteId) {
            UI.showToast('Please select a favorite', 'error');
            return;
        }

        if (id) {
            SchedulesModel.update(id, data);
            UI.showToast('Schedule updated', 'success');
        } else {
            SchedulesModel.create(data);
            UI.showToast('Schedule created', 'success');
        }

        UI.closeModal(UI.scheduleModal);
        UI.renderSchedules();
    },

    /**
     * Toggle schedule enabled state
     * @param {string} id - Schedule ID
     */
    toggleSchedule(id) {
        SchedulesModel.toggle(id);
        UI.renderSchedules();
    },

    /**
     * Delete a schedule
     * @param {string} id - Schedule ID
     */
    async deleteSchedule(id) {
        const schedule = SchedulesModel.getById(id);
        if (!schedule) return;

        const confirmed = await UI.confirm(
            'Delete Schedule',
            `Delete "${schedule.name}"?`
        );

        if (confirmed) {
            SchedulesModel.delete(id);
            UI.showToast('Schedule deleted', 'success');
            UI.renderSchedules();
        }
    },

    /**
     * Check automation server status
     */
    async checkServerStatus() {
        const connected = await DoorDash.checkServer();
        UI.updateServerStatus(connected);
    },

    /**
     * Load automation settings into the settings form
     */
    loadAutomationSettings() {
        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        this.populateAddressSelect(settings.addresses || [], settings.selectedAddressId);
        document.getElementById('headless-mode').checked = settings.headlessMode || false;
        document.getElementById('chrome-profile').value = settings.chromeProfile || '';
    },

    /**
     * Populate address select dropdown
     * @param {Array} addresses - List of saved addresses
     * @param {string} selectedId - Currently selected address ID
     */
    populateAddressSelect(addresses, selectedId) {
        const select = document.getElementById('address-select');
        select.innerHTML = '<option value="">Select an address...</option>';

        addresses.forEach(addr => {
            const option = document.createElement('option');
            option.value = addr.id;
            option.textContent = `${addr.label}: ${addr.address}`;
            if (addr.id === selectedId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    },

    /**
     * Add a new address
     */
    addAddress() {
        const labelInput = document.getElementById('address-label');
        const valueInput = document.getElementById('address-value');

        const label = labelInput.value.trim();
        const address = valueInput.value.trim();

        if (!label || !address) {
            UI.showToast('Please enter both label and address', 'error');
            return;
        }

        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        if (!settings.addresses) {
            settings.addresses = [];
        }

        const newAddress = {
            id: Storage.generateId(),
            label: label,
            address: address
        };

        settings.addresses.push(newAddress);
        settings.selectedAddressId = newAddress.id;
        Storage.set(Storage.KEYS.SETTINGS, settings);

        // Update UI
        this.populateAddressSelect(settings.addresses, settings.selectedAddressId);
        labelInput.value = '';
        valueInput.value = '';

        UI.showToast('Address added', 'success');
    },

    /**
     * Delete the selected address
     */
    deleteSelectedAddress() {
        const select = document.getElementById('address-select');
        const selectedId = select.value;

        if (!selectedId) {
            UI.showToast('No address selected', 'error');
            return;
        }

        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        settings.addresses = (settings.addresses || []).filter(addr => addr.id !== selectedId);

        if (settings.selectedAddressId === selectedId) {
            settings.selectedAddressId = null;
        }

        Storage.set(Storage.KEYS.SETTINGS, settings);
        this.populateAddressSelect(settings.addresses, settings.selectedAddressId);

        UI.showToast('Address deleted', 'success');
    },

    /**
     * Save the selected address
     * @param {string} addressId - Selected address ID
     */
    saveSelectedAddress(addressId) {
        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        settings.selectedAddressId = addressId || null;
        Storage.set(Storage.KEYS.SETTINGS, settings);
    },

    /**
     * Save automation settings from the settings form
     */
    saveAutomationSettings() {
        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        settings.headlessMode = document.getElementById('headless-mode').checked;
        settings.chromeProfile = document.getElementById('chrome-profile').value.trim() || null;
        Storage.set(Storage.KEYS.SETTINGS, settings);
    },

    /**
     * Export data to JSON file
     */
    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `doordash-scheduler-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        UI.showToast('Data exported', 'success');
    },

    /**
     * Import data from JSON file
     * @param {File} file - JSON file to import
     */
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const result = Storage.importData(data);

                if (result.success) {
                    UI.renderFavorites();
                    UI.renderSchedules();
                    UI.showToast(result.message, 'success');
                } else {
                    UI.showToast(result.message, 'error');
                }
            } catch (error) {
                UI.showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
