const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../../../logs');
const LOG_FILE = path.join(LOG_DIR, 'safecore.audit.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Simple console logger for now.
// In a real scenario, this would write to a tamper-proof append-only log.

function secureLog(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [SAFECORE_AUDIT] [${level}] ${message}`;

    // 1. Console Output (for CLI visibility)
    let color = "\x1b[37m"; // White
    if (level === "CRITICAL") color = "\x1b[31m"; // Red
    else if (level === "HIGH") color = "\x1b[33m"; // Yellow
    else if (level === "MEDIUM") color = "\x1b[36m"; // Cyan

    console.log(`${color}${logEntry}\x1b[0m`);

    // 2. Persistent File Output
    try {
        fs.appendFileSync(LOG_FILE, logEntry + '\n', 'utf8');
    } catch (err) {
        console.error("❌ CRITICAL: Failed to write to audit log file!", err);
    }
}

module.exports = { secureLog };
