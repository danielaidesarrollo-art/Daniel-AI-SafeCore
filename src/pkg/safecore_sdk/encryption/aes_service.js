const crypto = require('crypto');
const fs = require('fs');

class AESService {
    constructor(keyId = "master-key-001") {
        this.keyId = keyId;
        this.algorithm = 'aes-256-gcm';
        this.key = crypto.randomBytes(32); // Simulation
    }

    encryptSensitiveData(plaintext) {
        if (!plaintext) return "";

        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag().toString('base64');

        const envelope = {
            alg: "AES-256-GCM",
            kid: this.keyId,
            iv: iv.toString('base64'),
            authTag: authTag,
            data: encrypted
        };

        return Buffer.from(JSON.stringify(envelope)).toString('base64');
    }

    decryptSensitiveData(envelopeB64) {
        try {
            const envelopeJson = Buffer.from(envelopeB64, 'base64').toString('utf8');
            const envelope = JSON.parse(envelopeJson);

            if (envelope.alg !== "AES-256-GCM") throw new Error("Unsupported Algorithm");

            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this.key,
                Buffer.from(envelope.iv, 'base64')
            );

            decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));

            let decrypted = decipher.update(envelope.data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (e) {
            console.error(`Decryption failed: ${e.message}`);
            throw e;
        }
    }
}

module.exports = AESService;
