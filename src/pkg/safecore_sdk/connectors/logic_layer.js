const orchestrator = require('../../../modules').orchestrator;
const { secureLog } = require('../audit/interceptor');

class LogicLayerConnector {
    constructor(requestObj) {
        this.request = requestObj;
        this.sessionId = requestObj.sessionId || null;
        this.isAuthenticated = !!this.sessionId;
    }

    async authenticate(token) {
        const result = await orchestrator.executeSecurityChain({
            action: 'AUTHENTICATE',
            token: token
        });
        if (result.sessionId) {
            this.sessionId = result.sessionId;
            this.isAuthenticated = true;
        }
        return result;
    }

    async enforceSecurityBoundary(resource, action) {
        // CRITICAL: Fail-Safe Check First
        require('../system/state_manager').StateManager.checkReadAccess();

        if (!this.isAuthenticated && !this.request.headers['authorization']) {
            secureLog("Unauth logic access attempt", "CRITICAL");
            throw new Error("SafeCore: Access Denied");
        }

        const token = this.request.headers['authorization'] ? this.request.headers['authorization'].split(' ')[1] : null;

        await orchestrator.executeSecurityChain({
            sessionId: this.sessionId,
            token: token,
            resource: resource,
            action: action || 'EXECUTE'
        });

        this.isAuthenticated = true;
        secureLog("Logic boundary crossed", "LOW");
    }

    async sanitizeInput(inputData) {
        if (!this.isAuthenticated) {
            throw new Error("SafeCore: Auth required before sanitization");
        }

        await orchestrator.executeSecurityChain({
            sessionId: this.sessionId,
            payload: inputData,
            action: 'SANITIZE'
        });

        return inputData;
    }
}

module.exports = LogicLayerConnector;
