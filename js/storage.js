/**
 * LocalStorage abstraction layer
 */
const Storage = {
    KEYS: {
        FAVORITES: 'doordash_favorites',
        SCHEDULES: 'doordash_schedules',
        SETTINGS: 'doordash_settings',
        ORDER_HISTORY: 'doordash_order_history'
    },

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed data or null
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading from storage (${key}):`, error);
            return null;
        }
    },

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to storage (${key}):`, error);
            return false;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from storage (${key}):`, error);
        }
    },

    /**
     * Clear all app data from localStorage
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => this.remove(key));
    },

    /**
     * Export all app data as JSON
     * @returns {object} All app data
     */
    exportData() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name.toLowerCase()] = this.get(key) || [];
        });
        data.exportedAt = new Date().toISOString();
        data.version = '1.0';
        return data;
    },

    /**
     * Import data from JSON
     * @param {object} data - Data to import
     * @returns {object} Result with success status and message
     */
    importData(data) {
        try {
            if (!data || typeof data !== 'object') {
                return { success: false, message: 'Invalid data format' };
            }

            if (data.favorites && Array.isArray(data.favorites)) {
                this.set(this.KEYS.FAVORITES, data.favorites);
            }

            if (data.schedules && Array.isArray(data.schedules)) {
                this.set(this.KEYS.SCHEDULES, data.schedules);
            }

            if (data.settings && typeof data.settings === 'object') {
                this.set(this.KEYS.SETTINGS, data.settings);
            }

            if (data.order_history && Array.isArray(data.order_history)) {
                this.set(this.KEYS.ORDER_HISTORY, data.order_history);
            }

            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, message: 'Failed to import data' };
        }
    },

    /**
     * Generate a UUID
     * @returns {string} UUID
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};
