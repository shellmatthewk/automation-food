const puppeteer = require('puppeteer');
const { SELECTORS, TIMEOUTS } = require('./selectors');

/**
 * Automate DoorDash order - navigate to store and add items to cart
 * @param {object} orderData - Order details
 * @param {string} orderData.storeUrl - DoorDash store URL
 * @param {string} orderData.storeName - Restaurant name
 * @param {Array<string>} orderData.items - Items to add to cart
 * @param {string} orderData.specialInstructions - Special instructions
 * @returns {Promise<object>} Result with itemsAdded count
 */
async function automateOrder(orderData) {
    const { storeUrl, storeName, items, specialInstructions } = orderData;

    let browser;
    let itemsAdded = 0;

    try {
        console.log('Launching browser...');

        // Launch browser with visible window
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--start-maximized',
                '--disable-blink-features=AutomationControlled'
            ],
            // Use default Chrome profile to leverage existing login
            // Uncomment and modify path for your system if needed:
            // userDataDir: '/Users/YOUR_USER/Library/Application Support/Google/Chrome/Default'
        });

        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        console.log(`Navigating to: ${storeUrl}`);
        await page.goto(storeUrl, {
            waitUntil: 'networkidle2',
            timeout: TIMEOUTS.PAGE_LOAD
        });

        // Wait for page to fully load
        await delay(2000);

        // Check if we're on the right page
        const pageUrl = page.url();
        if (!pageUrl.includes('doordash.com')) {
            throw new Error('Navigation failed - not on DoorDash');
        }

        // Check for login prompt
        const loginPrompt = await page.$(SELECTORS.LOGIN_MODAL);
        if (loginPrompt) {
            console.log('\n⚠️  Login required!');
            console.log('Please log in to DoorDash in the browser window.');
            console.log('The script will wait for you to complete login...\n');

            // Wait for login modal to disappear (user logged in)
            await page.waitForSelector(SELECTORS.LOGIN_MODAL, {
                hidden: true,
                timeout: 120000 // 2 minutes to log in
            });

            await delay(2000);
        }

        console.log(`Store loaded: ${storeName || 'Unknown'}`);

        // If no items specified, just navigate to store
        if (!items || items.length === 0) {
            console.log('No items specified - browser opened to store page');
            return {
                success: true,
                message: 'Store page opened successfully',
                itemsAdded: 0
            };
        }

        // Try to add each item
        for (const itemName of items) {
            console.log(`\nSearching for: "${itemName}"`);

            const added = await tryAddItem(page, itemName);
            if (added) {
                itemsAdded++;
                console.log(`✓ Added: ${itemName}`);
            } else {
                console.log(`✗ Could not find: ${itemName}`);
            }

            // Small delay between items
            await delay(1000);
        }

        console.log(`\n${'='.repeat(40)}`);
        console.log(`Added ${itemsAdded} of ${items.length} items to cart`);
        console.log(`${'='.repeat(40)}`);
        console.log('\n📋 Please review your cart and complete checkout manually.\n');

        // Keep browser open for user to review and checkout
        // Don't close the browser automatically

        return {
            success: true,
            message: `Added ${itemsAdded} of ${items.length} items to cart`,
            itemsAdded
        };

    } catch (error) {
        console.error('Automation error:', error.message);

        // Still keep browser open on error so user can see what happened
        if (browser) {
            console.log('\nBrowser left open for debugging. Close manually when done.\n');
        }

        throw error;
    }
}

/**
 * Try to find and add an item to cart
 * @param {Page} page - Puppeteer page
 * @param {string} itemName - Item to search for
 * @returns {Promise<boolean>} Whether item was added
 */
async function tryAddItem(page, itemName) {
    try {
        // Strategy 1: Try using search if available
        const searchAdded = await trySearchAndAdd(page, itemName);
        if (searchAdded) return true;

        // Strategy 2: Scroll through menu and find item
        const scrollAdded = await tryScrollAndFind(page, itemName);
        if (scrollAdded) return true;

        return false;
    } catch (error) {
        console.error(`Error adding "${itemName}":`, error.message);
        return false;
    }
}

/**
 * Try to search for item and add to cart
 * @param {Page} page - Puppeteer page
 * @param {string} itemName - Item to search for
 * @returns {Promise<boolean>} Whether item was added
 */
async function trySearchAndAdd(page, itemName) {
    try {
        // Look for search input
        const searchInput = await page.$(SELECTORS.SEARCH_INPUT);
        if (!searchInput) {
            return false;
        }

        // Clear and type search query
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(itemName, { delay: 50 });

        // Wait for search results
        await delay(TIMEOUTS.SEARCH_RESULTS);

        // Find matching menu item
        const menuItems = await page.$$(SELECTORS.MENU_ITEM);

        for (const item of menuItems) {
            const nameElement = await item.$(SELECTORS.MENU_ITEM_NAME);
            if (!nameElement) continue;

            const name = await page.evaluate(el => el.textContent, nameElement);

            if (fuzzyMatch(name, itemName)) {
                // Click the item to open modal
                await item.click();
                await delay(TIMEOUTS.MODAL_OPEN);

                // Add to cart
                const added = await clickAddToCart(page);
                if (added) {
                    // Clear search
                    await searchInput.click({ clickCount: 3 });
                    await searchInput.press('Backspace');
                    await delay(500);
                    return true;
                }
            }
        }

        // Clear search if no match
        await searchInput.click({ clickCount: 3 });
        await searchInput.press('Backspace');

        return false;
    } catch (error) {
        console.error('Search strategy failed:', error.message);
        return false;
    }
}

/**
 * Scroll through menu and find item
 * @param {Page} page - Puppeteer page
 * @param {string} itemName - Item to find
 * @returns {Promise<boolean>} Whether item was added
 */
async function tryScrollAndFind(page, itemName) {
    try {
        // Scroll to load more items
        for (let i = 0; i < 5; i++) {
            const menuItems = await page.$$(SELECTORS.MENU_ITEM);

            for (const item of menuItems) {
                try {
                    const nameElement = await item.$(SELECTORS.MENU_ITEM_NAME);
                    if (!nameElement) continue;

                    const name = await page.evaluate(el => el.textContent, nameElement);

                    if (fuzzyMatch(name, itemName)) {
                        // Scroll item into view
                        await item.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                        await delay(500);

                        // Click the item
                        await item.click();
                        await delay(TIMEOUTS.MODAL_OPEN);

                        // Add to cart
                        return await clickAddToCart(page);
                    }
                } catch (e) {
                    // Item may have become stale, continue
                }
            }

            // Scroll down to load more
            await page.evaluate(() => window.scrollBy(0, 500));
            await delay(1000);
        }

        return false;
    } catch (error) {
        console.error('Scroll strategy failed:', error.message);
        return false;
    }
}

/**
 * Click the Add to Cart button in item modal
 * @param {Page} page - Puppeteer page
 * @returns {Promise<boolean>} Whether successfully added
 */
async function clickAddToCart(page) {
    try {
        // Wait for modal to open
        await page.waitForSelector(SELECTORS.ITEM_MODAL, {
            visible: true,
            timeout: TIMEOUTS.MODAL_OPEN
        });

        // Find and click Add to Cart button
        const addButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => {
                const text = btn.textContent?.toLowerCase() || '';
                return text.includes('add to cart') ||
                       text.includes('add to order') ||
                       text.includes('add item');
            });
        });

        if (addButton) {
            await addButton.click();
            await delay(TIMEOUTS.ADD_TO_CART);
            return true;
        }

        // Try alternative: click last button in modal (often the add button)
        const modalButtons = await page.$$(`${SELECTORS.ITEM_MODAL} button`);
        if (modalButtons.length > 0) {
            await modalButtons[modalButtons.length - 1].click();
            await delay(TIMEOUTS.ADD_TO_CART);
            return true;
        }

        // Close modal if we couldn't add
        const closeButton = await page.$(SELECTORS.CLOSE_MODAL_BUTTON);
        if (closeButton) {
            await closeButton.click();
            await delay(500);
        }

        return false;
    } catch (error) {
        console.error('Add to cart failed:', error.message);

        // Try to close any open modal
        try {
            await page.keyboard.press('Escape');
            await delay(500);
        } catch (e) {}

        return false;
    }
}

/**
 * Fuzzy match item names
 * @param {string} menuItemName - Name from menu
 * @param {string} searchName - Name we're looking for
 * @returns {boolean} Whether names match
 */
function fuzzyMatch(menuItemName, searchName) {
    if (!menuItemName || !searchName) return false;

    const normalize = (str) => str.toLowerCase().trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ');

    const menuNorm = normalize(menuItemName);
    const searchNorm = normalize(searchName);

    // Exact match
    if (menuNorm === searchNorm) return true;

    // Contains match
    if (menuNorm.includes(searchNorm) || searchNorm.includes(menuNorm)) return true;

    // Word match - all search words appear in menu item
    const searchWords = searchNorm.split(' ').filter(w => w.length > 2);
    const menuWords = menuNorm.split(' ');

    if (searchWords.length > 0) {
        const matchCount = searchWords.filter(sw =>
            menuWords.some(mw => mw.includes(sw) || sw.includes(mw))
        ).length;

        return matchCount >= searchWords.length * 0.7;
    }

    return false;
}

/**
 * Simple delay helper
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { automateOrder };
