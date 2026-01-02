const express = require('express');
const DataLayerConnector = require('../pkg/safecore_sdk/connectors/data_layer');
const LogicLayerConnector = require('../pkg/safecore_sdk/connectors/logic_layer');
const { secureLog } = require('../pkg/safecore_sdk/audit/interceptor');

const path = require('path');

const app = express();
app.use(express.json());

// --- Middleware: Strict Browser Security (No-Cache) ---
app.use((req, res, next) => {
    // CRITICAL: Prevent PHI from being stored in browser cache/disk
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
});

// Serve Secure Frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- Middleware: SafeCore Security Boundary ---
app.use('/api', (req, res, next) => { // Apply SDK only to API routes
    try {
        // Construct Request Object for SDK
        const requestObj = {
            headers: req.headers,
            last_active_timestamp: Date.now() / 1000 // In prod, get from session store
        };

        // Initialize Logic Connector
        const logic = new LogicLayerConnector(requestObj);

        // 1. Enforce Auth & MFA
        logic.enforceSecurityBoundary();

        // 2. Enforce Auto-Logout Rule
        logic.validateInactivity();

        // 3. Attach SafeCore Context to Request
        req.safeCore = logic;

        next();
    } catch (e) {
        secureLog(`Gateway Blocked Request: ${e.message}`, "HIGH");
        res.status(403).json({ error: "SafeCore Gateway: access_denied", details: e.message });
    }
});

// --- Routes ---

/**
 * Endpoint to ingest clinical data.
 * Applies Input Sanitization -> Encryption -> Storage using SDK.
 */
app.post('/api/clinical/ingest', (req, res) => {
    try {
        const logic = req.safeCore;

        // 4. Sanitize Input (AI Purifier)
        const cleanData = logic.sanitizeInput(req.body);

        // 5. Encrypt & Store (Data Layer)
        const dataConn = new DataLayerConnector("gateway-ctx");
        const encryptedBlob = dataConn.protectAndStore(JSON.stringify(cleanData), "ClinicalIngest");

        res.status(201).json({
            status: "securely_archived",
            ref: encryptedBlob.substring(0, 20) + "..."
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Health Check (Public)
 * Bypasses strict checks for monitoring, but logs access.
 */
app.get('/health', (req, res) => {
    secureLog("Health check accessed", "LOW");
    res.json({ status: "SafeCore Gateway Active", checks: "IAM, MFA, Audit, Encryption" });
});

// Start Server (if run directly)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🛡️  SafeCore API Gateway listening on port ${PORT}`);
    });
}

module.exports = app;
