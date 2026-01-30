/**
 * Data models and CRUD operations for Favorites and Schedules
 */

const FavoritesModel = {
    /**
     * Get all favorites
     * @returns {Array} Array of favorites
     */
    getAll() {
        return Storage.get(Storage.KEYS.FAVORITES) || [];
    },

    /**
     * Get a favorite by ID
     * @param {string} id - Favorite ID
     * @returns {object|null} Favorite or null
     */
    getById(id) {
        const favorites = this.getAll();
        return favorites.find(f => f.id === id) || null;
    },

    /**
     * Create a new favorite
     * @param {object} data - Favorite data
     * @returns {object} Created favorite
     */
    create(data) {
        const favorites = this.getAll();
        const now = new Date().toISOString();

        const favorite = {
            id: Storage.generateId(),
            name: data.name,
            restaurant: {
                name: data.restaurantName,
                storeUrl: data.storeUrl,
                storeId: this.extractStoreId(data.storeUrl)
            },
            orderDetails: {
                items: data.items || [],
                specialInstructions: data.specialInstructions || '',
                estimatedTotal: data.estimatedTotal || null
            },
            metadata: {
                createdAt: now,
                lastOrderedAt: null,
                orderCount: 0,
                tags: data.tags || []
            }
        };

        favorites.push(favorite);
        Storage.set(Storage.KEYS.FAVORITES, favorites);
        return favorite;
    },

    /**
     * Update an existing favorite
     * @param {string} id - Favorite ID
     * @param {object} data - Updated data
     * @returns {object|null} Updated favorite or null
     */
    update(id, data) {
        const favorites = this.getAll();
        const index = favorites.findIndex(f => f.id === id);

        if (index === -1) return null;

        const favorite = favorites[index];

        // Update fields
        if (data.name) favorite.name = data.name;
        if (data.restaurantName) favorite.restaurant.name = data.restaurantName;
        if (data.storeUrl) {
            favorite.restaurant.storeUrl = data.storeUrl;
            favorite.restaurant.storeId = this.extractStoreId(data.storeUrl);
        }
        if (data.items !== undefined) favorite.orderDetails.items = data.items;
        if (data.specialInstructions !== undefined) {
            favorite.orderDetails.specialInstructions = data.specialInstructions;
        }
        if (data.estimatedTotal !== undefined) {
            favorite.orderDetails.estimatedTotal = data.estimatedTotal;
        }
        if (data.tags !== undefined) favorite.metadata.tags = data.tags;

        favorites[index] = favorite;
        Storage.set(Storage.KEYS.FAVORITES, favorites);
        return favorite;
    },

    /**
     * Delete a favorite
     * @param {string} id - Favorite ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const favorites = this.getAll();
        const filtered = favorites.filter(f => f.id !== id);

        if (filtered.length === favorites.length) return false;

        Storage.set(Storage.KEYS.FAVORITES, filtered);

        // Also delete any schedules linked to this favorite
        SchedulesModel.deleteByFavoriteId(id);

        return true;
    },

    /**
     * Mark a favorite as ordered (update lastOrderedAt and increment orderCount)
     * @param {string} id - Favorite ID
     */
    markOrdered(id) {
        const favorites = this.getAll();
        const index = favorites.findIndex(f => f.id === id);

        if (index === -1) return;

        favorites[index].metadata.lastOrderedAt = new Date().toISOString();
        favorites[index].metadata.orderCount += 1;

        Storage.set(Storage.KEYS.FAVORITES, favorites);
    },

    /**
     * Extract store ID from DoorDash URL
     * @param {string} url - DoorDash store URL
     * @returns {string|null} Store ID or null
     */
    extractStoreId(url) {
        if (!url) return null;
        // URLs like: https://www.doordash.com/store/restaurant-name-city-12345/
        const match = url.match(/\/store\/[^\/]+-(\d+)\/?/);
        return match ? match[1] : null;
    },

    /**
     * Validate DoorDash URL
     * @param {string} url - URL to validate
     * @returns {boolean} Is valid DoorDash store URL
     */
    isValidDoorDashUrl(url) {
        if (!url) return false;
        try {
            const parsed = new URL(url);
            return (
                (parsed.hostname === 'www.doordash.com' || parsed.hostname === 'doordash.com') &&
                parsed.pathname.includes('/store/')
            );
        } catch {
            return false;
        }
    }
};

const SchedulesModel = {
    /**
     * Get all schedules
     * @returns {Array} Array of schedules
     */
    getAll() {
        return Storage.get(Storage.KEYS.SCHEDULES) || [];
    },

    /**
     * Get a schedule by ID
     * @param {string} id - Schedule ID
     * @returns {object|null} Schedule or null
     */
    getById(id) {
        const schedules = this.getAll();
        return schedules.find(s => s.id === id) || null;
    },

    /**
     * Get schedules by favorite ID
     * @param {string} favoriteId - Favorite ID
     * @returns {Array} Array of schedules
     */
    getByFavoriteId(favoriteId) {
        const schedules = this.getAll();
        return schedules.filter(s => s.favoriteId === favoriteId);
    },

    /**
     * Create a new schedule
     * @param {object} data - Schedule data
     * @returns {object} Created schedule
     */
    create(data) {
        const schedules = this.getAll();
        const now = new Date().toISOString();

        const schedule = {
            id: Storage.generateId(),
            favoriteId: data.favoriteId,
            name: data.name,
            timing: {
                type: data.type, // 'once' or 'recurring'
                daysOfWeek: data.daysOfWeek || [], // [0-6] for recurring
                time: data.time || null, // 'HH:MM' for recurring
                dateTime: data.dateTime || null // ISO string for one-time
            },
            settings: {
                reminderMinutesBefore: data.reminderMinutesBefore || 15,
                autoOpen: data.autoOpen || false,
                enabled: true
            },
            metadata: {
                createdAt: now,
                lastTriggeredAt: null,
                nextTriggerAt: this.calculateNextTrigger(data)
            }
        };

        schedules.push(schedule);
        Storage.set(Storage.KEYS.SCHEDULES, schedules);
        return schedule;
    },

    /**
     * Update an existing schedule
     * @param {string} id - Schedule ID
     * @param {object} data - Updated data
     * @returns {object|null} Updated schedule or null
     */
    update(id, data) {
        const schedules = this.getAll();
        const index = schedules.findIndex(s => s.id === id);

        if (index === -1) return null;

        const schedule = schedules[index];

        // Update fields
        if (data.name) schedule.name = data.name;
        if (data.favoriteId) schedule.favoriteId = data.favoriteId;
        if (data.type) schedule.timing.type = data.type;
        if (data.daysOfWeek !== undefined) schedule.timing.daysOfWeek = data.daysOfWeek;
        if (data.time !== undefined) schedule.timing.time = data.time;
        if (data.dateTime !== undefined) schedule.timing.dateTime = data.dateTime;
        if (data.reminderMinutesBefore !== undefined) {
            schedule.settings.reminderMinutesBefore = data.reminderMinutesBefore;
        }
        if (data.autoOpen !== undefined) schedule.settings.autoOpen = data.autoOpen;
        if (data.enabled !== undefined) schedule.settings.enabled = data.enabled;

        // Recalculate next trigger
        schedule.metadata.nextTriggerAt = this.calculateNextTrigger({
            type: schedule.timing.type,
            daysOfWeek: schedule.timing.daysOfWeek,
            time: schedule.timing.time,
            dateTime: schedule.timing.dateTime,
            reminderMinutesBefore: schedule.settings.reminderMinutesBefore
        });

        schedules[index] = schedule;
        Storage.set(Storage.KEYS.SCHEDULES, schedules);
        return schedule;
    },

    /**
     * Delete a schedule
     * @param {string} id - Schedule ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const schedules = this.getAll();
        const filtered = schedules.filter(s => s.id !== id);

        if (filtered.length === schedules.length) return false;

        Storage.set(Storage.KEYS.SCHEDULES, filtered);
        return true;
    },

    /**
     * Delete all schedules for a favorite
     * @param {string} favoriteId - Favorite ID
     */
    deleteByFavoriteId(favoriteId) {
        const schedules = this.getAll();
        const filtered = schedules.filter(s => s.favoriteId !== favoriteId);
        Storage.set(Storage.KEYS.SCHEDULES, filtered);
    },

    /**
     * Toggle schedule enabled state
     * @param {string} id - Schedule ID
     * @returns {object|null} Updated schedule or null
     */
    toggle(id) {
        const schedule = this.getById(id);
        if (!schedule) return null;
        return this.update(id, { enabled: !schedule.settings.enabled });
    },

    /**
     * Mark a schedule as triggered
     * @param {string} id - Schedule ID
     */
    markTriggered(id) {
        const schedules = this.getAll();
        const index = schedules.findIndex(s => s.id === id);

        if (index === -1) return;

        const schedule = schedules[index];
        schedule.metadata.lastTriggeredAt = new Date().toISOString();

        // For one-time schedules, disable after trigger
        if (schedule.timing.type === 'once') {
            schedule.settings.enabled = false;
            schedule.metadata.nextTriggerAt = null;
        } else {
            // Recalculate next trigger for recurring
            schedule.metadata.nextTriggerAt = this.calculateNextTrigger({
                type: schedule.timing.type,
                daysOfWeek: schedule.timing.daysOfWeek,
                time: schedule.timing.time,
                reminderMinutesBefore: schedule.settings.reminderMinutesBefore
            });
        }

        schedules[index] = schedule;
        Storage.set(Storage.KEYS.SCHEDULES, schedules);
    },

    /**
     * Calculate next trigger time
     * @param {object} data - Schedule timing data
     * @returns {string|null} ISO string of next trigger or null
     */
    calculateNextTrigger(data) {
        const now = new Date();
        const reminderOffset = (data.reminderMinutesBefore || 0) * 60 * 1000;

        if (data.type === 'once') {
            if (!data.dateTime) return null;
            const triggerTime = new Date(data.dateTime).getTime() - reminderOffset;
            return triggerTime > now.getTime() ? new Date(triggerTime).toISOString() : null;
        }

        if (data.type === 'recurring') {
            if (!data.time || !data.daysOfWeek || data.daysOfWeek.length === 0) {
                return null;
            }

            const [hours, minutes] = data.time.split(':').map(Number);
            const daysOfWeek = data.daysOfWeek.map(Number).sort((a, b) => a - b);

            // Check each day in the next week
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(now);
                checkDate.setDate(checkDate.getDate() + i);
                const dayOfWeek = checkDate.getDay();

                if (daysOfWeek.includes(dayOfWeek)) {
                    checkDate.setHours(hours, minutes, 0, 0);
                    const triggerTime = checkDate.getTime() - reminderOffset;

                    if (triggerTime > now.getTime()) {
                        return new Date(triggerTime).toISOString();
                    }
                }
            }
        }

        return null;
    },

    /**
     * Get all active schedules that should trigger now
     * @returns {Array} Array of schedules to trigger
     */
    getDueSchedules() {
        const schedules = this.getAll();
        const now = new Date().getTime();
        const threshold = 30 * 1000; // 30 second window

        return schedules.filter(schedule => {
            if (!schedule.settings.enabled) return false;
            if (!schedule.metadata.nextTriggerAt) return false;

            const triggerTime = new Date(schedule.metadata.nextTriggerAt).getTime();
            const lastTriggered = schedule.metadata.lastTriggeredAt
                ? new Date(schedule.metadata.lastTriggeredAt).getTime()
                : 0;

            // Check if within trigger window and not already triggered
            return triggerTime <= now &&
                   triggerTime > now - threshold &&
                   lastTriggered < triggerTime;
        });
    }
};
