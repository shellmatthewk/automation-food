# DoorDash Order Scheduler

A local-first web application for automating DoorDash orders with scheduled reminders, saved favorites, and Puppeteer-powered cart filling.

Built with vanilla JavaScript, Express, and Puppeteer. No frameworks, no database required.

## Features

- **Favorite Orders** - Save restaurants, menu items, and special instructions for quick reordering
- **Smart Scheduling** - One-time or recurring reminders (e.g., weekday lunches at noon)
- **Browser Automation** - Puppeteer navigates to store, searches items, and fills your cart
- **Headless Mode** - Run automation in background using your Chrome profile
- **Order History** - Track past orders with time-based filtering (today, week, month)
- **Multiple Addresses** - Save home, work, and other delivery locations
- **Data Portability** - Export/import everything as JSON
- **Responsive UI** - Side-by-side layout on desktop, stacked on mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, CSS Custom Properties, Inter font |
| Backend | Node.js, Express |
| Automation | Puppeteer |
| Storage | localStorage (no database) |

## Quick Start

### 1. Open the Web UI

Simply open `index.html` in your browser:

```bash
open index.html
# or
# double-click index.html in Finder
```

### 2. Start the Automation Server (Optional)

The automation server enables the "Order Now" feature to automatically fill your DoorDash cart.

```bash
cd server
npm install
npm start
```

The server runs on `http://localhost:3001`.

## Usage

### Adding a Favorite

1. Click **"+ Add Favorite"**
2. Enter a name for your order (e.g., "My Chipotle Bowl")
3. Enter the restaurant name
4. Paste the DoorDash store URL (e.g., `https://www.doordash.com/store/chipotle-city-12345/`)
5. Add items you want to order (these will be searched when automating)
6. Optionally add special instructions and tags
7. Click **"Save Favorite"**

### Creating a Schedule

1. Click **"+ Add Schedule"** or click **"Schedule"** on a favorite card
2. Select which favorite order to schedule
3. Choose **One-time** or **Recurring**
   - One-time: Pick a specific date and time
   - Recurring: Select days of the week and time
4. Set reminder offset (e.g., 15 minutes before)
5. Optionally enable auto-open (triggers automation automatically)
6. Click **"Save Schedule"**

### Ordering

When a schedule triggers (or you click "Order Now"):

1. The app calls the local Puppeteer server
2. A Chrome window opens and navigates to the DoorDash store
3. The script searches for each saved item and adds it to cart
4. The browser stays open for you to review and complete checkout

**Important**: You must be logged into DoorDash in your browser for automation to work.

## Settings

Click "Settings" to access:

- **Delivery Addresses** - Add/remove multiple addresses, select active one
- **Notifications** - Enable browser notifications for reminders
- **Headless Mode** - Run automation without visible browser window
- **Chrome Profile** - Path to Chrome profile with saved DoorDash login
- **Server Status** - Check if automation server is running
- **Export/Import** - Backup and restore all data as JSON

## Project Structure

```
├── index.html                 # Single-page application
├── css/
│   └── styles.css             # CSS variables, responsive grid, animations
├── js/
│   ├── app.js                 # Initialization, event binding
│   ├── storage.js             # localStorage abstraction
│   ├── models.js              # Favorites, Schedules, OrderHistory models
│   ├── ui.js                  # DOM rendering, modals, toasts
│   ├── scheduler.js           # Polling, notifications, snooze
│   └── doordash.js            # URL validation, server API calls
├── server/
│   ├── server.js              # Express REST API
│   └── puppeteer/
│       ├── autoorder.js       # Browser automation logic
│       └── selectors.js       # DoorDash DOM selectors
└── Inter-4.1/                 # Inter variable font
```

## Technical Notes

### Browser Limitations

JavaScript timers only work while the tab is open/active. The app uses multiple strategies:

- **Active polling**: Checks schedules every 30 seconds
- **Visibility API**: Checks for missed reminders when tab becomes visible
- **Browser Notifications**: System-level alerts (requires permission)

### Puppeteer Automation

The automation script:

1. Launches Chrome (visible or headless mode)
2. Navigates to the DoorDash store URL
3. Detects login prompts (waits for manual login or uses Chrome profile)
4. Searches for each saved item by name (fuzzy matching)
5. Clicks "Add to Cart" for matches
6. **Stops before checkout** - you review and pay manually

**Headless Mode**: Enable in Settings with a Chrome profile path. The browser runs in background and closes automatically after filling the cart.

### DoorDash DOM Selectors

DoorDash frequently updates their website. If automation stops working:

1. Check `server/puppeteer/selectors.js`
2. Update selectors to match current DoorDash HTML structure
3. Use browser DevTools to inspect element classes/attributes

## Troubleshooting

### "Automation server is not running"

Make sure you've started the server:

```bash
cd server
npm install  # first time only
npm start
```

### Items not being found

- Check that item names match what's on the DoorDash menu
- The script uses fuzzy matching, but very different names won't match
- Some items may require customization modals that aren't fully handled

### Login required

In visible mode, log in when prompted. For headless mode:

1. Open Settings
2. Enter your Chrome Profile Path (e.g., `~/Library/Application Support/Google/Chrome/Default`)
3. Ensure you're logged into DoorDash in that Chrome profile
4. Enable "Run headless"

### Notifications not appearing

1. Click ⚙️ Settings
2. Click "Enable" for Browser Notifications
3. Allow when your browser prompts
4. Check that your system allows browser notifications

## Data Storage

All data is stored in browser LocalStorage (no backend database):

- `doordash_favorites` - Saved orders
- `doordash_schedules` - Reminder schedules
- `doordash_settings` - Addresses, headless mode, Chrome profile
- `doordash_order_history` - Past orders (last 100)

Use Export to back up before clearing browser data.

## Development

To modify the app:

- Frontend: Edit files in `js/` and `css/`
- Backend: Edit files in `server/`
- No build step required - just refresh the browser

For the server in development mode with auto-reload:

```bash
cd server
npm run dev
```

## License

MIT
