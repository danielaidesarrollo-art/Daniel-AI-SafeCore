const { secureLog } = require('../audit/interceptor');
const AESService = require('../encryption/aes_service');

class DataLayerConnector {
    constructor(contextId) {
        this.contextId = contextId;
        this.aes = new AESService();
    }

    protectAndStore(data, recordType = "generic") {
        secureLog(`Writing protected record: ${recordType}`, "HIGH");
        return this.aes.encryptSensitiveData(data);
    }

    retrieveAndExpose(encryptedData) {
        secureLog(`Reading protected record`, "HIGH");
        return this.aes.decryptSensitiveData(encryptedData);
    }
}

module.exports = DataLayerConnector;
