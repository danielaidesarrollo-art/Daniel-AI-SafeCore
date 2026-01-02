const crypto = require('crypto');
const { secureLog } = require('../audit/interceptor');

class KeyManager {
    constructor() {
        this.keys = new Map(); // id -> { key, status: 'active'|'deprecated'|'revoked' }
        this.currentKeyId = null;
    }

    /**
     * initializes the master key
     */
    initialize() {
        if (!this.currentKeyId) {
            this.rotateMasterKey("Initial Setup");
        }
    }

    /**
     * Generates a new master key and deprecates the old one.
     * @param {string} reason - Audit reason for rotation
     */
    rotateMasterKey(reason) {
        const newKeyId = `k-${Date.now()}`;
        const newKey = crypto.randomBytes(32); // 256-bit key

        // 1. Mark old key as deprecated (still readable)
        if (this.currentKeyId) {
            const oldKeyMeta = this.keys.get(this.currentKeyId);
            if (oldKeyMeta.status !== 'revoked') {
                oldKeyMeta.status = 'deprecated';
                secureLog(`Key Deprecated: ${this.currentKeyId}`, "MEDIUM");
            }
        }

        // 2. Set new key
        this.keys.set(newKeyId, { key: newKey, status: 'active', created: Date.now() });
        this.currentKeyId = newKeyId;

        secureLog(`Key Rotated. New Master: ${newKeyId}. Reason: ${reason}`, "CRITICAL");
        return newKeyId;
    }

    /**
     * Get the specific key for decryption
     */
    getKey(keyId) {
        const keyMeta = this.keys.get(keyId);
        if (!keyMeta) {
            throw new Error(`Key ${keyId} not found`);
        }
        if (keyMeta.status === 'revoked') {
            secureLog(`Attempt to use REVOKED key: ${keyId}`, "CRITICAL");
            throw new Error(`Key ${keyId} is Revoked`);
        }
        return keyMeta.key;
    }

    getCurrentKey() {
        return this.getKey(this.currentKeyId);
    }

    getCurrentKeyId() {
        return this.currentKeyId;
    }
}

module.exports = new KeyManager();
