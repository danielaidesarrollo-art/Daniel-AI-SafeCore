const axios = require('axios');
const crypto = require('crypto');
const ComplianceValidator = require('../system/compliance_validator');

/**
 * RemoteBridge
 * Handles secure communication between cores using AES-256-GCM encryption.
 * Acts as the Transport Layer for the SafeCore SDK.
 */
class RemoteBridge {
    constructor(serviceUrl, clientSecret) {
        this.serviceUrl = serviceUrl;
        this.clientSecret = clientSecret || process.env.SAFECORE_CLIENT_SECRET;
        this.compliance = new ComplianceValidator().validate();

        if (!this.clientSecret) {
            console.warn("⚠️ [RemoteBridge] No CLIENT_SECRET provided. Encryption will fail if not set via env.");
        }
    }

    /**
     * Encrypts a payload using AES-256-GCM
     * @param {Object} payload - The JSON data to encrypt
     * @returns {Object} - { iv, encryptedData, authTag }
     */
    encryptPayload(payload) {
        if (!this.clientSecret) throw new Error("Missing Client Secret for Encryption");

        const iv = crypto.randomBytes(16);
        // Ensure key is 32 bytes (sha256 hash of secret)
        const key = crypto.createHash('sha256').update(this.clientSecret).digest();

        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');

        return {
            iv: iv.toString('hex'),
            data: encrypted,
            tag: authTag
        };
    }

    /**
     * Sends a secure request to a remote core.
     * @param {string} endpoint - Relative path (e.g., '/api/data/ingest')
     * @param {string} method - 'GET', 'POST', etc.
     * @param {Object} data - The raw data to send
     * @param {Object} headers - Additional headers (Auth tokens, etc.)
     */
    async sendSecureRequest(endpoint, method = 'POST', data = {}, headers = {}) {
        // 1. Encrypt Payload
        const securePayload = this.encryptPayload(data);

        // 2. Prepare Headers (Including Compliance Fingerprint)
        const requestHeaders = {
            'Content-Type': 'application/json',
            'X-SafeCore-Encrypted': 'true',
            ...headers
        };

        if (this.compliance.valid) {
            requestHeaders['X-SafeCore-Compliance'] = this.compliance.fingerprint;
            requestHeaders['X-SafeCore-Origin'] = this.compliance.packageName;
        }

        // 3. Send over HTTPS
        try {
            const response = await axios({
                method: method,
                url: `${this.serviceUrl}${endpoint}`,
                data: securePayload,
                headers: requestHeaders
            });

            return response.data;
        } catch (error) {
            console.error(`[RemoteBridge] Request Failed: ${error.message}`);
            if (error.response) {
                throw new Error(`Remote Core Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
}

module.exports = RemoteBridge;
