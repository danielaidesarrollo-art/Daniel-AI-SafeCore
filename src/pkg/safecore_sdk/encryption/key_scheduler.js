const KeyManager = require('./key_manager');
const { secureLog } = require('../audit/interceptor');

class KeyScheduler {
    constructor() {
        this.ROTATION_INTERVAL_DAYS = 30;
        this.currentSystemTime = Date.now();
        this.lastRotation = this.currentSystemTime;
    }

    /**
     * Simulates the passage of time and triggers rotation if needed.
     * @param {number} daysPassed - Amount of time to fast-forward from CURRENT simulated time
     */
    simulateTimePassage(daysPassed) {
        const msPerDay = 86400000;

        // Advance system time
        this.currentSystemTime += (daysPassed * msPerDay);

        secureLog(`KeyScheduler: Time advanced by ${daysPassed} days`, "LOW");

        // Check interval against NEW system time
        const diffMs = this.currentSystemTime - this.lastRotation;
        const diffDays = diffMs / msPerDay;

        if (diffDays >= this.ROTATION_INTERVAL_DAYS) {
            secureLog(`KeyScheduler: Interval (${this.ROTATION_INTERVAL_DAYS}d) reached (Elapsed: ${diffDays.toFixed(1)}d). Triggering Rotation...`, "HIGH");
            KeyManager.rotateMasterKey("Automated Scheduler Policy (30 Days)");
            this.lastRotation = this.currentSystemTime; // Reset timer to NOW
        } else {
            secureLog(`KeyScheduler: No rotation needed. (Elapsed: ${diffDays.toFixed(1)}d, Next due in ${(this.ROTATION_INTERVAL_DAYS - diffDays).toFixed(1)} days)`, "LOW");
        }
    }
}

module.exports = new KeyScheduler();
