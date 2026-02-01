const express = require('express');
const cors = require('cors');
const { automateOrder } = require('./puppeteer/autoorder');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Order automation endpoint
app.post('/api/order', async (req, res) => {
    const { storeUrl, storeName, items, specialInstructions, options } = req.body;

    // Validate request
    if (!storeUrl) {
        return res.status(400).json({ error: 'Store URL is required' });
    }

    // Validate URL format
    try {
        const url = new URL(storeUrl);
        if (!url.hostname.includes('doordash.com')) {
            return res.status(400).json({ error: 'Invalid DoorDash URL' });
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    const headless = options?.headless || false;
    const chromeProfile = options?.chromeProfile || null;
    const deliveryAddress = options?.deliveryAddress || null;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Order automation requested`);
    console.log(`Store: ${storeName || 'Unknown'}`);
    console.log(`URL: ${storeUrl}`);
    console.log(`Items: ${items?.length || 0}`);
    console.log(`Mode: ${headless ? 'headless' : 'visible'}`);
    if (chromeProfile) console.log(`Chrome profile: ${chromeProfile}`);
    if (deliveryAddress) console.log(`Delivery address: ${deliveryAddress}`);
    console.log(`${'='.repeat(50)}\n`);

    try {
        const result = await automateOrder({
            storeUrl,
            storeName,
            items: items || [],
            specialInstructions: specialInstructions || '',
            options: { headless, chromeProfile, deliveryAddress }
        });

        res.json({
            success: true,
            message: result.message || 'Order automation completed',
            itemsAdded: result.itemsAdded || 0
        });
    } catch (error) {
        console.error('Automation error:', error);
        res.status(500).json({
            error: error.message || 'Automation failed',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`DoorDash Automation Server`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`\nWaiting for order requests...`);
    console.log(`${'='.repeat(50)}\n`);
});
