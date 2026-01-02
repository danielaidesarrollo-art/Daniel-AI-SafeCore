const { secureLog } = require('../audit/interceptor');
const { StateManager } = require('../system/state_manager');

class SecurityAnalyst {
    constructor() {
        this.eventWindow = []; // Stores recent security events
        this.WINDOW_SIZE_MS = 60000; // 1 minute
        this.THRESHOLD_BRUTE_FORCE = 5; // 5 failures/min
    }

    /**
     * Ingests a security event and analyzes patterns.
     * @param {string} eventType - e.g., 'AUTH_FAILURE', 'THREAT_DETECTED'
     * @param {string} user - User identifier
     */
    analyzeEvent(eventType, user) {
        const now = Date.now();

        // Prune old events
        this.eventWindow = this.eventWindow.filter(e => now - e.timestamp < this.WINDOW_SIZE_MS);

        // Add new event
        this.eventWindow.push({ timestamp: now, type: eventType, user });

        // ANALYSIS 1: Brute Force Detection
        const userFailures = this.eventWindow.filter(e =>
            e.user === user && e.type === 'AUTH_FAILURE'
        ).length;

        if (userFailures >= this.THRESHOLD_BRUTE_FORCE) {
            secureLog(`Predictive Obs: Brute Force Pattern detected for user ${user}`, "CRITICAL");
            StateManager.triggerLockdown(`Security Analyst: Brute Force detected (${user})`); // FAIL-SAFE TRIGGER
        }
    }
}

module.exports = new SecurityAnalyst();
