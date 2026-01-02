const crypto = require('crypto');
const { secureLog } = require('../audit/interceptor');

class VaultService {
    constructor() {
        this._tokenMap = new Map();
    }

    tokenizeIdentity(sensitiveId) {
        const surrogate = crypto.randomUUID();
        this._tokenMap.set(surrogate, sensitiveId);
        secureLog(`Identity tokenized: ${surrogate}`, "HIGH");
        return surrogate;
    }

    detokenizeIdentity(surrogate) {
        if (this._tokenMap.has(surrogate)) {
            secureLog(`Identity detokenized: ${surrogate}`, "CRITICAL");
            return this._tokenMap.get(surrogate);
        }
        throw new Error("Token not found");
    }
}

module.exports = VaultService;
