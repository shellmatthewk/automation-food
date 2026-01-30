# DoorDash Order Scheduler

A browser-based app to save favorite DoorDash orders, schedule reminders, and automate cart filling via Puppeteer.

## Features

- **Favorites Management**: Save your go-to DoorDash orders with restaurant info, items, and special instructions
- **Scheduling**: Set one-time or recurring reminders for your favorite orders
- **Browser Notifications**: Get system notifications when it's time to order
- **Puppeteer Automation**: Automatically fill your cart with saved items (requires local server)
- **Data Portability**: Export/import your data as JSON

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

Click the ⚙️ icon to access settings:

- **Enable Notifications**: Grant permission for browser notifications
- **Server Status**: Check if the automation server is running
- **Export Data**: Download your favorites and schedules as JSON
- **Import Data**: Restore from a previously exported JSON file
- **Clear All Data**: Delete all saved data (cannot be undone)

## Project Structure

```
automation-food/
├── index.html              # Single-page app
├── css/
│   └── styles.css          # Styling
├── js/
│   ├── app.js              # App initialization
│   ├── storage.js          # LocalStorage abstraction
│   ├── models.js           # Data models & CRUD
│   ├── ui.js               # DOM manipulation
│   ├── scheduler.js        # Timer/reminder logic
│   └── doordash.js         # URL validation & API calls
├── server/
│   ├── package.json        # Node.js dependencies
│   ├── server.js           # Express API server
│   └── puppeteer/
│       ├── autoorder.js    # DoorDash automation
│       └── selectors.js    # DOM selectors
└── README.md
```

## Technical Notes

### Browser Limitations

JavaScript timers only work while the tab is open/active. The app uses multiple strategies:

- **Active polling**: Checks schedules every 30 seconds
- **Visibility API**: Checks for missed reminders when tab becomes visible
- **Browser Notifications**: System-level alerts (requires permission)

### Puppeteer Automation

The automation script:

1. Opens a visible Chrome window (not headless)
2. Navigates to the DoorDash store URL
3. Searches for each saved item by name
4. Clicks "Add to Cart" for matches
5. **Stops before checkout** - you review and pay manually

The script uses fuzzy matching to find items even if names aren't exact.

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

The Puppeteer script opens a fresh browser. You'll need to log in to DoorDash the first time. To avoid this:

1. Edit `server/puppeteer/autoorder.js`
2. Uncomment the `userDataDir` line
3. Set the path to your Chrome profile

### Notifications not appearing

1. Click ⚙️ Settings
2. Click "Enable" for Browser Notifications
3. Allow when your browser prompts
4. Check that your system allows browser notifications

## Data Storage

All data is stored in your browser's LocalStorage:

- `doordash_favorites`: Your saved orders
- `doordash_schedules`: Your reminder schedules
- `doordash_settings`: App settings

Use the Export feature to back up your data before clearing browser data.

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
