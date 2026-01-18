const crypto = require('crypto');

/**
 * DecryptionMiddleware
 * Intercepts requests with 'X-SafeCore-Encrypted' header and decrypts the payload.
 */
const DecryptionMiddleware = (req, res, next) => {
    // 1. Check if request is encrypted
    if (req.headers['x-safecore-encrypted'] !== 'true') {
        const encryptedOnly = process.env.ENFORCE_ENCRYPTION === 'true';
        if (encryptedOnly && req.method !== 'GET') {
            return res.status(403).json({ error: "Encryption Required" });
        }
        return next();
    }

    // 2. Encrypted Request Detected
    const clientSecret = process.env.SAFECORE_CLIENT_SECRET;
    if (!clientSecret) {
        console.error("CRITICAL: Missing SAFECORE_CLIENT_SECRET on server");
        return res.status(500).json({ error: "Server Configuration Error" });
    }

    try {
        const { iv, data, tag } = req.body;

        if (!iv || !data || !tag) {
            return res.status(400).json({ error: "Invalid Encrypted Payload Format" });
        }

        // 3. Decrypt
        const key = crypto.createHash('sha256').update(clientSecret).digest();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));

        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // 4. Replace body with decrypted data
        req.body = JSON.parse(decrypted);
        req.isEncrypted = true;

        // Log Audit
        // console.log("[SafeCore] Decrypted secure payload successfully");

        next();

    } catch (err) {
        console.error(`[Decryption Failed] ${err.message}`);
        return res.status(403).json({ error: "Decryption Failed - Invalid Signature/Key" });
    }
};

module.exports = DecryptionMiddleware;
