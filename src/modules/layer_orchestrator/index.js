const iam = require('../iam_zero_trust');
const kms = require('../encryption_key_mgmt');
const auditor = require('../immutable_auditor');
const purifier = require('../ai_purifier');
const { StateManager } = require('../../pkg/safecore_sdk/system/state_manager');
const deceptionManager = require('../ai_purifier/deception');

class LayerOrchestrator {
    constructor() {
        this.status = 'ACTIVE';
        auditor.log("Layer Orchestrator Initialized", "INFO");
    }

    // High-level API for the SDK and other layers
    async executeSecurityChain(request) {
        try {
            // Check if system is in LOCKDOWN
            StateManager.checkReadAccess();

            // 1. Audit Entry
            auditor.log("Security chain execution started", "LOW", { action: request.action });

            // 2. Identity Verification (Zero Trust)
            if (request.token) {
                const authResult = iam.authenticate(request.token);
                if (!authResult.success) throw new Error("Authentication Failed");
                request.sessionId = authResult.sessionId;
            }

            if (request.sessionId) {
                if (!iam.validateSession(request.sessionId)) {
                    throw new Error("Invalid or Expired Session");
                }
            }

            // 3. Authorization
            if (request.resource && request.action) {
                if (!iam.authorize(request.sessionId, request.resource, request.action)) {
                    throw new Error("Unauthorized Action");
                }
            }

            // 4. Content Purification
            if (request.payload) {
                purifier.sanitize(request.payload);
            }

            // 5. Data Protection (Encryption/Decryption)
            if (request.encryptData) {
                return kms.encrypt(request.encryptData, request.keyId);
            }
            if (request.decryptData) {
                return kms.decrypt(request.decryptData, request.keyId);
            }

            return { status: "SUCCESS", sessionId: request.sessionId };
        } catch (error) {
            auditor.log(`Security chain failure: ${error.message}`, "CRITICAL");

            // DECEPTION TRIGGER: Instead of just locking down, we divert to Honey-Token
            if (error.message.includes("Security Violation")) {
                console.error(`[SafeCore] !!! CRITICAL THREAT DETECTED !!! Redirecting to Honey-Token (Quarantine)...`);

                // Trigger background lockdown
                StateManager.triggerLockdown(`Critical Security Violation Detected: ${error.message}`);

                // Return fake data to attacker
                return deceptionManager.generateHoneypotResponse(request.payload);
            }

            throw error;
        }
    }

    getSystemStatus() {
        return {
            state: StateManager.getCurrentState(),
            orchestrator: this.status,
            auditor: auditor.verifyLogIntegrity() ? 'HEALTHY' : 'COMPROMISED',
            iam: 'ACTIVE',
            kms: 'ACTIVE',
            purifier: 'ACTIVE'
        };
    }
}

module.exports = new LayerOrchestrator();
