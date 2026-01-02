const crypto = require('crypto');
const auditor = require('../immutable_auditor');

class EncryptionKeyMgmt {
    constructor() {
        this.masterKey = crypto.randomBytes(32); // In prod, this would be from a HSM/VC
        this.keys = new Map();
        this.algorithm = 'aes-256-cbc';
    }

    generateKey(keyId) {
        const key = crypto.randomBytes(32);
        this.keys.set(keyId, key);
        auditor.log("New encryption key generated", "LOW", { keyId });
        return keyId;
    }

    encrypt(data, keyId = 'default') {
        let key = this.keys.get(keyId);
        if (!key) {
            if (keyId === 'default') {
                key = this.masterKey;
            } else {
                throw new Error(`Key ${keyId} not found`);
            }
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        auditor.log("Data encrypted", "LOW", { keyId });
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            keyId
        };
    }

    decrypt(encryptedPack, keyId = 'default') {
        let key = this.keys.get(keyId);
        if (!key) {
            if (keyId === 'default') {
                key = this.masterKey;
            } else {
                throw new Error(`Key ${keyId} not found`);
            }
        }

        const iv = Buffer.from(encryptedPack.iv, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        let decrypted = decipher.update(encryptedPack.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        auditor.log("Data decrypted", "LOW", { keyId });
        return decrypted;
    }

    rotateKey(keyId) {
        auditor.log("Key rotation initiated", "MEDIUM", { keyId });
        return this.generateKey(keyId);
    }
}

module.exports = new EncryptionKeyMgmt();
