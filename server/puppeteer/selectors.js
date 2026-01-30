/**
 * DOM selectors for DoorDash UI elements
 * These may need to be updated if DoorDash changes their site structure
 */

const SELECTORS = {
    // Store page
    STORE_NAME: '[data-anchor-id="StoreHeader"] h1, [data-testid="store-name"]',
    MENU_CATEGORY: '[data-anchor-id="MenuItem"], [data-testid="menu-item"]',

    // Menu items
    MENU_ITEM: '[data-anchor-id="MenuItem"], [data-testid="StoreMenuItem"]',
    MENU_ITEM_NAME: '[data-anchor-id="MenuItemName"], [data-testid="menu-item-name"], h3, span',
    MENU_ITEM_BUTTON: 'button, [role="button"]',

    // Search
    SEARCH_INPUT: 'input[placeholder*="Search"], input[type="search"], [data-testid="SearchInput"]',
    SEARCH_BUTTON: 'button[aria-label*="Search"], [data-testid="SearchButton"]',
    SEARCH_RESULTS: '[data-testid="SearchResults"], [data-anchor-id="SearchResults"]',

    // Item modal / customization
    ITEM_MODAL: '[data-testid="ItemModal"], [role="dialog"]',
    ITEM_MODAL_NAME: '[data-testid="ItemModalName"], [role="dialog"] h2',
    ADD_TO_CART_BUTTON: 'button[data-anchor-id="AddToCartButton"], button:has-text("Add to Cart"), button:has-text("Add to Order")',
    CLOSE_MODAL_BUTTON: '[data-testid="CloseButton"], button[aria-label="Close"], [role="dialog"] button:first-child',

    // Quantity controls
    QUANTITY_INCREASE: 'button[aria-label*="Increase"], button[data-testid="QuantityIncrease"]',
    QUANTITY_DECREASE: 'button[aria-label*="Decrease"], button[data-testid="QuantityDecrease"]',
    QUANTITY_INPUT: 'input[aria-label*="quantity"], [data-testid="QuantityInput"]',

    // Special instructions
    SPECIAL_INSTRUCTIONS: 'textarea[placeholder*="instruction"], textarea[data-testid="SpecialInstructions"]',

    // Cart
    CART_BUTTON: '[data-testid="CartButton"], button[aria-label*="cart"], [data-anchor-id="CartButton"]',
    CART_ITEMS: '[data-testid="CartItem"], [data-anchor-id="CartItem"]',
    CART_TOTAL: '[data-testid="CartTotal"], [data-anchor-id="CartTotal"]',
    CHECKOUT_BUTTON: 'button[data-testid="CheckoutButton"], button:has-text("Checkout")',

    // Loading states
    LOADING_SPINNER: '[data-testid="Loading"], [aria-busy="true"]',
    SKELETON: '[data-testid="Skeleton"], [class*="skeleton"]',

    // Address/delivery
    ADDRESS_BUTTON: '[data-testid="AddressButton"], button[aria-label*="address"]',
    DELIVERY_TIME: '[data-testid="DeliveryTime"], [data-anchor-id="DeliveryTime"]',

    // Login prompts
    LOGIN_MODAL: '[data-testid="LoginModal"], [role="dialog"]:has(button:has-text("Log in"))',
    LOGIN_BUTTON: 'button:has-text("Log in"), button:has-text("Sign in")'
};

/**
 * Alternative selectors to try if primary ones fail
 * DoorDash frequently updates their class names
 */
const FALLBACK_SELECTORS = {
    MENU_ITEM: [
        '[data-anchor-id="MenuItem"]',
        '[data-testid="StoreMenuItem"]',
        '.styles__MenuItemContainer',
        'div[class*="MenuItem"]'
    ],
    ADD_TO_CART: [
        'button[data-anchor-id="AddToCartButton"]',
        'button:contains("Add to Cart")',
        'button:contains("Add to Order")',
        '[role="dialog"] button[class*="Button"]:last-child'
    ],
    SEARCH: [
        'input[placeholder*="Search"]',
        'input[type="search"]',
        '[data-testid="SearchInput"]',
        'input[class*="search"]'
    ]
};

/**
 * Wait timeouts (in milliseconds)
 */
const TIMEOUTS = {
    PAGE_LOAD: 30000,
    ELEMENT_VISIBLE: 10000,
    ANIMATION: 500,
    MODAL_OPEN: 2000,
    SEARCH_RESULTS: 5000,
    ADD_TO_CART: 3000
};

module.exports = {
    SELECTORS,
    FALLBACK_SELECTORS,
    TIMEOUTS
};
