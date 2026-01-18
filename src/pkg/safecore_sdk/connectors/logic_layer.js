const RemoteBridge = require('./remote_bridge');
const { secureLog } = require('../audit/interceptor');

class LogicLayerConnector {
    constructor(requestObj) {
        this.request = requestObj;
        this.sessionId = requestObj.sessionId || null;
        this.isAuthenticated = !!this.sessionId;

        this.safeCoreUrl = process.env.SAFE_CORE_URL;
        this.isRemote = !!this.safeCoreUrl;

        if (this.isRemote) {
            this.bridge = new RemoteBridge(this.safeCoreUrl);
        } else {
            try {
                this.orchestrator = require('../../../modules').orchestrator;
            } catch (e) {
                console.warn("⚠️ [SafeCore SDK] Orchestrator not found. Local logic unavailable.");
            }
        }
    }

    async authenticate(token) {
        if (this.isRemote) {
            const response = await this.bridge.sendSecureRequest('/api/security/authenticate', 'POST', { token });
            if (response.sessionId) {
                this.sessionId = response.sessionId;
                this.isAuthenticated = true;
            }
            return response;
        } else {
            // Local Fallback
            if (!this.orchestrator) throw new Error("Local Orchestrator missing");
            const result = await this.orchestrator.executeSecurityChain({
                action: 'AUTHENTICATE',
                token: token
            });
            if (result.sessionId) {
                this.sessionId = result.sessionId;
                this.isAuthenticated = true;
            }
            return result;
        }
    }

    async enforceSecurityBoundary(resource, action) {
        if (this.isRemote) {
            // Remote Validation
            await this.bridge.sendSecureRequest('/api/security/validate', 'POST', {
                sessionId: this.sessionId,
                token: this.request.headers['authorization'],
                resource,
                action
            });
            this.isAuthenticated = true;
        } else {
            // Local Fallback
            if (!this.orchestrator) throw new Error("Local Orchestrator missing");

            // Check State Manager locally
            try {
                require('../system/state_manager').StateManager.checkReadAccess();
            } catch (e) { } // Ignore if remote usage in some contexts

            if (!this.isAuthenticated && !this.request.headers['authorization']) {
                secureLog("Unauth logic access attempt", "CRITICAL");
                throw new Error("SafeCore: Access Denied");
            }

            const token = this.request.headers['authorization'] ? this.request.headers['authorization'].split(' ')[1] : null;

            await this.orchestrator.executeSecurityChain({
                sessionId: this.sessionId,
                token: token,
                resource: resource,
                action: action || 'EXECUTE'
            });

            this.isAuthenticated = true;
            secureLog("Logic boundary crossed", "LOW");
        }
    }

    async sanitizeInput(inputData) {
        if (!this.isAuthenticated) {
            throw new Error("SafeCore: Auth required before sanitization");
        }

        if (this.isRemote) {
            const result = await this.bridge.sendSecureRequest('/api/security/sanitize', 'POST', {
                payload: inputData,
                sessionId: this.sessionId
            });
            return result.sanitizedData;
        } else {
            if (!this.orchestrator) throw new Error("Local Orchestrator missing");
            await this.orchestrator.executeSecurityChain({
                sessionId: this.sessionId,
                payload: inputData,
                action: 'SANITIZE'
            });
            return inputData;
        }
    }
}

module.exports = LogicLayerConnector;
