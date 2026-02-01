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
     * @param {object} triggerInfo - Optional trigger info (for scheduled orders)
     * @returns {Promise<object>} Result with success status and message
     */
    async triggerOrder(favorite, triggerInfo = {}) {
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

            // Get automation settings
            const settings = Storage.get(Storage.KEYS.SETTINGS) || {};

            // Get selected delivery address
            let deliveryAddress = null;
            if (settings.selectedAddressId && settings.addresses) {
                const selectedAddr = settings.addresses.find(a => a.id === settings.selectedAddressId);
                if (selectedAddr) {
                    deliveryAddress = selectedAddr.address;
                }
            }

            const options = {
                headless: settings.headlessMode || false,
                chromeProfile: settings.chromeProfile || null,
                deliveryAddress: deliveryAddress
            };

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
                    specialInstructions: favorite.orderDetails.specialInstructions,
                    options
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Order automation failed');
            }

            // Mark favorite as ordered
            FavoritesModel.markOrdered(favorite.id);

            // Log to order history
            const itemsAdded = result.itemsAdded || favorite.orderDetails.items.length;
            const totalItems = favorite.orderDetails.items.length;
            const status = itemsAdded === 0 ? 'failed'
                : itemsAdded < totalItems ? 'partial'
                : 'completed';

            OrderHistoryModel.add({
                favoriteId: favorite.id,
                favoriteName: favorite.name,
                restaurantName: favorite.restaurant.name,
                items: favorite.orderDetails.items,
                itemsAdded: itemsAdded,
                status: status,
                triggeredBy: triggerInfo.triggeredBy || 'manual',
                scheduleId: triggerInfo.scheduleId || null,
                scheduleName: triggerInfo.scheduleName || null
            });

            if (options.headless) {
                UI.showToast('Cart filled! Open DoorDash to review and checkout.', 'success', 5000);
            } else {
                UI.showToast('Cart filled! Review and checkout in browser.', 'success', 5000);
            }
            UI.renderFavorites();

            return { success: true, message: result.message };
        } catch (error) {
            console.error('Order automation error:', error);

            // Log failed order to history
            OrderHistoryModel.add({
                favoriteId: favorite.id,
                favoriteName: favorite.name,
                restaurantName: favorite.restaurant.name,
                items: favorite.orderDetails.items,
                itemsAdded: 0,
                status: 'failed',
                triggeredBy: triggerInfo.triggeredBy || 'manual',
                scheduleId: triggerInfo.scheduleId || null,
                scheduleName: triggerInfo.scheduleName || null,
                errorMessage: error.message
            });

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
