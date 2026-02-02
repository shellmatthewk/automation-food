# Web Workflow Automation Engine

A local-first automation system that replaces repetitive, manual web-based workflows across web applications without APIs, saving startups time and reducing operational bottlenecks.

---

## The Problem

Many operational workflows still require manual, repetitive browser interactions:

- Placing recurring orders on platforms without APIs
- Filling forms across systems that don't integrate
- Monitoring dashboards and triggering actions
- Data entry between legacy web applications

These workflows are tedious, error-prone, and don't scale. Traditional solutions (Zapier, n8n) require APIs or webhooks. When the target platform is a consumer web app with no developer access, you need a different approach.

## The Solution

This engine uses **browser automation as the integration layer**. Instead of waiting for APIs that may never exist, it interacts with web applications the same way a human would—but faster, on a schedule, and without mistakes.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Workflow   │  │  Scheduler  │  │   Execution History │  │
│  │  Templates  │  │  (Polling)  │  │   (Audit Trail)     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│                    localStorage                             │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────┼──────────────────────────────────┐
│                   Automation Server                         │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────────────┐  │
│  │   Express   │  │  Puppeteer  │  │   Selector Engine   │  │
│  │   REST API  │  │  (Headless) │  │   (Fuzzy Matching)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Local-first** | No cloud dependencies. Runs on locally on your machine, everything is local|
| **No framework** | Vanilla JS keeps the codebase hackable. Easy to understand, modify, extend. |
| **No database** | localStorage is sufficient for personal automation.|
| **Visible + Headless modes** | Debug visually, run in production headlessly. |
| **Chrome profile support** | Reuse existing auth sessions instead of handling login flows. |
| **Fuzzy matching** | Real-world UIs have inconsistent naming. Exact matches fail. |

---

## Case Study: Food Order Automation

The included implementation automates a recurring food ordering workflow:

**Before**: Every day at lunch, manually open DoorDash → navigate to restaurant → search for items → add to cart → checkout. 5-10 minutes of clicking.

**After**: Define the order once. Schedule it. The system fills your cart automatically. You just confirm and pay.

### Features Implemented

- **Workflow Templates** — Save complete order configurations (restaurant, items, instructions)
- **Flexible Scheduling** — One-time or recurring (specific days/times)
- **Execution History** — Track every automation run with status and timestamps
- **Multi-location Support** — Switch between saved delivery addresses
- **Resilient Automation** — Fuzzy item matching, scroll-based discovery, modal handling

### Why This Workflow?

Food ordering is a good demonstration because:
1. It's a real, recurring operational task
2. The target platform has no public API
3. The workflow has multiple steps (navigate → search → add → customize)
4. It requires handling dynamic content (menus, modals, search results)

The same patterns apply to expense reporting, inventory checks, appointment booking, or any repetitive web task.

---

## Technical Highlights

### Browser Automation Engine

```javascript
// Fuzzy matching handles real-world menu inconsistencies
// "Chicken Bowl" matches "Chicken Burrito Bowl", "Bowl - Chicken", etc.
function fuzzyMatch(menuItemName, searchName) {
    const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '');
    const searchWords = normalize(searchName).split(' ');
    const menuWords = normalize(menuItemName).split(' ');

    const matchCount = searchWords.filter(sw =>
        menuWords.some(mw => mw.includes(sw) || sw.includes(mw))
    ).length;

    return matchCount >= searchWords.length * 0.7;
}
```

### Scheduling System

- **Polling-based** with 30-second intervals
- **Visibility API integration** — catches missed triggers when tab regains focus
- **Snooze support** — delay execution without rescheduling
- **Browser notifications** — system-level alerts even when tab is backgrounded

### Session Persistence

```javascript
// Headless mode reuses existing Chrome session
// No need to handle OAuth, 2FA, or complex login flows
const launchOptions = {
    headless: true,
    userDataDir: '/path/to/chrome/profile'  // Logged-in session
};
```

---

## Generalizing to Other Workflows

To adapt this system to a different workflow:

1. **Define the template schema** in `models.js`
2. **Write selectors** for the target site in `selectors.js`
3. **Implement the automation logic** in a new handler (similar to `autoorder.js`)
4. **Update the UI** to capture workflow-specific inputs

Example workflows this architecture supports:

| Workflow | Template Data | Automation Steps |
|----------|---------------|------------------|
| Expense reporting | Receipt data, categories | Login → Upload → Fill form → Submit |
| Inventory reorder | SKUs, quantities, thresholds | Check stock → Add to cart → Checkout |
| Appointment booking | Preferences, time windows | Search availability → Select slot → Confirm |
| Price monitoring | URLs, price thresholds | Navigate → Extract price → Compare → Alert |

---

## Running Locally

```bash
# Clone
git clone https://github.com/yourusername/web-workflow-automation.git
cd web-workflow-automation

# Start automation server
cd server && npm install && npm start

# Open UI
open index.html
```

### Headless Mode Setup

1. Open Settings
2. Enable "Run headless"
3. Set Chrome Profile Path (e.g., `~/Library/Application Support/Google/Chrome/Default`)
4. Ensure you're logged into the target site in that profile

---

## Project Structure

```
├── index.html                 # Single-page application
├── css/styles.css             # Design system (CSS variables, responsive)
├── js/
│   ├── app.js                 # Application bootstrap, event binding
│   ├── models.js              # Data models (Templates, Schedules, History)
│   ├── storage.js             # Persistence layer abstraction
│   ├── scheduler.js           # Polling engine, notifications
│   ├── ui.js                  # View rendering, modals, toasts
│   └── doordash.js            # Workflow-specific API client
├── server/
│   ├── server.js              # REST API (Express)
│   └── puppeteer/
│       ├── autoorder.js       # Automation implementation
│       └── selectors.js       # Target site DOM selectors
└── fonts/                     # Inter variable font (OFL 1.1 license)
```

---

## Limitations & Trade-offs

| Limitation | Mitigation |
|------------|------------|
| Selectors break when target site updates | Centralized in `selectors.js`, easy to update |
| Requires local server running | Could containerize or run as system service |
| Single-user, single-machine | Intentional for v1; could add auth + cloud storage |
| No visual workflow builder | Template schema is code; power users preferred |

---

## Future Directions

- [ ] Workflow recording (capture browser actions → generate automation)
- [ ] Retry logic with exponential backoff
- [ ] Screenshot capture on failure for debugging
- [ ] Docker container for portable deployment
- [ ] Multi-workflow orchestration (chains, conditionals)

---
## Fonts

This project uses **Inter 4.1** under the [SIL Open Font License (OFL 1.1)](Inter-4.1/OFL.txt).

## License

MIT
