/**
 * DoorDash URL validation and automation triggering
 */

const DoorDash = {
    SERVER_URL: 'http://localhost:3001',
    isAutomating: false,

    /**
     * Check if server is running
     * @returns {Promise<boolean>} Server status
     */
    async checkServer() {
        try {
            const response = await fetch(`${this.SERVER_URL}/api/health`, {
                method: 'GET',
                mode: 'cors'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    /**
     * Validate a DoorDash store URL
     * @param {string} url - URL to validate
     * @returns {object} Validation result with isValid and message
     */
    validateUrl(url) {
        if (!url) {
            return { isValid: false, message: 'URL is required' };
        }

        try {
            const parsed = new URL(url);

            if (parsed.hostname !== 'www.doordash.com' && parsed.hostname !== 'doordash.com') {
                return { isValid: false, message: 'URL must be from doordash.com' };
            }

            if (!parsed.pathname.includes('/store/')) {
                return { isValid: false, message: 'URL must be a DoorDash store page' };
            }

            return { isValid: true, message: '' };
        } catch (error) {
            return { isValid: false, message: 'Invalid URL format' };
        }
    },

    /**
     * Trigger automation for a favorite order
     * @param {object} favorite - Favorite order data
     * @returns {Promise<object>} Result with success status and message
     */
    async triggerOrder(favorite) {
        if (this.isAutomating) {
            UI.showToast('Automation already in progress', 'warning');
            return { success: false, message: 'Already automating' };
        }

        this.isAutomating = true;
        UI.showToast('Starting order automation...', 'info');

        try {
            // Check server
            const serverUp = await this.checkServer();
            if (!serverUp) {
                throw new Error('Automation server is not running. Start it with: cd server && npm start');
            }

            // Send order request
            const response = await fetch(`${this.SERVER_URL}/api/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storeUrl: favorite.restaurant.storeUrl,
                    storeName: favorite.restaurant.name,
                    items: favorite.orderDetails.items,
                    specialInstructions: favorite.orderDetails.specialInstructions
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Order automation failed');
            }

            // Mark favorite as ordered
            FavoritesModel.markOrdered(favorite.id);

            UI.showToast('Cart filled! Review and checkout in browser.', 'success', 5000);
            UI.renderFavorites();

            return { success: true, message: result.message };
        } catch (error) {
            console.error('Order automation error:', error);
            UI.showToast(error.message, 'error', 5000);
            return { success: false, message: error.message };
        } finally {
            this.isAutomating = false;
        }
    },

    /**
     * Open DoorDash store in new tab (fallback without automation)
     * @param {string} url - Store URL
     */
    openStore(url) {
        window.open(url, '_blank');
    }
};
