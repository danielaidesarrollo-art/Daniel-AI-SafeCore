const { secureLog } = require('../audit/interceptor');
const IDPBridge = require('../auth/idp_bridge');

class LogicLayerConnector {
    constructor(requestObj) {
        this.request = requestObj;
        this.isAuthenticated = false;
        this.lastActive = requestObj.last_active_timestamp || 0;
        this.idp = new IDPBridge();
    }

    enforceSecurityBoundary() {
        // CRITICAL: Fail-Safe Check First
        require('../system/state_manager').StateManager.checkReadAccess();

        if (!this.idp.validateSession(this.request.headers)) {
            secureLog("Unauth logic access attempt", "CRITICAL");
            throw new Error("SafeCore: Access Denied");
        }
        this.isAuthenticated = true;
        secureLog("Logic boundary crossed", "LOW");
    }

    validateInactivity(maxIdleSeconds = 900) {
        const currentTime = Date.now() / 1000;
        const idleTime = currentTime - this.lastActive;

        if (idleTime > maxIdleSeconds) {
            secureLog(`Auto-Logout triggered: Idle for ${idleTime}s`, "MEDIUM");
            this.isAuthenticated = false;
            throw new Error("Session Expired due to Inactivity");
        }
        return true;
    }

    sanitizeInput(inputData) {
        if (!this.isAuthenticated) {
            throw new Error("SafeCore: Auth required before sanitization");
        }
        // AI Purifier Stub
        if (JSON.stringify(inputData).includes("<script>")) {
            secureLog("Malicious input blocked", "HIGH");
            throw new Error("SafeCore: Threat Detected by Purifier");
        }
        return inputData;
    }
}

module.exports = LogicLayerConnector;
