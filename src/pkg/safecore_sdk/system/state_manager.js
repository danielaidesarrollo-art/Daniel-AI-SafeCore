const { secureLog } = require('../audit/interceptor');

const SYSTEM_STATES = {
    NORMAL: "NORMAL",
    READ_ONLY: "READ_ONLY",
    LOCKDOWN: "LOCKDOWN"
};

class StateManager {
    constructor() {
        if (!StateManager.instance) {
            this.currentState = SYSTEM_STATES.NORMAL;
            this.lockdownReason = null;
            secureLog("StateManager: System Initialized (NORMAL)", "LOW");
            StateManager.instance = this;
        }
        return StateManager.instance;
    }

    getCurrentState() {
        return this.currentState;
    }

    triggerLockdown(reason) {
        if (this.currentState === SYSTEM_STATES.LOCKDOWN) return;

        this.currentState = SYSTEM_STATES.LOCKDOWN;
        this.lockdownReason = reason;

        // In a real system, this would trigger alerts via PagerDuty/Email
        secureLog(`!!! CRITICAL SYSTEM LOCKDOWN !!! Reason: ${reason}`, "CRITICAL");
        console.error(`\n[CRITICAL] SYSTEM ENTERED LOCKDOWN: ${reason}\n`);
    }

    triggerReadOnly(reason) {
        if (this.currentState !== SYSTEM_STATES.NORMAL) return;

        this.currentState = SYSTEM_STATES.READ_ONLY;
        secureLog(`System shifted to READ-ONLY: ${reason}`, "HIGH");
    }

    checkWriteAccess() {
        if (this.currentState === SYSTEM_STATES.LOCKDOWN) {
            throw new Error(`System is in LOCKDOWN. Reason: ${this.lockdownReason}`);
        }
        if (this.currentState === SYSTEM_STATES.READ_ONLY) {
            throw new Error("System is in READ-ONLY mode.");
        }
        return true;
    }

    checkReadAccess() {
        if (this.currentState === SYSTEM_STATES.LOCKDOWN) {
            throw new Error(`System is in LOCKDOWN. Reason: ${this.lockdownReason}`);
        }
        return true;
    }

    // For testing/recovery
    resetSystem(adminKey) {
        if (adminKey === "root-override-123") {
            this.currentState = SYSTEM_STATES.NORMAL;
            this.lockdownReason = null;
            secureLog("System manually reset to NORMAL by Admin", "CRITICAL");
        }
    }
}

const instance = new StateManager();
// Object.freeze(instance); // REMOVED: Need to update state

module.exports = { StateManager: instance, SYSTEM_STATES };
