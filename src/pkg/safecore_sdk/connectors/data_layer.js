const orchestrator = require('../../../modules').orchestrator;

class DataLayerConnector {
    constructor(contextId) {
        this.contextId = contextId;
    }

    async protectAndStore(data, recordType = "generic") {
        return await orchestrator.executeSecurityChain({
            action: 'PROTECT_AND_STORE',
            encryptData: data,
            metadata: { contextId: this.contextId, recordType }
        });
    }

    async retrieveAndExpose(encryptedData) {
        return await orchestrator.executeSecurityChain({
            action: 'RETRIEVE_AND_EXPOSE',
            decryptData: encryptedData,
            metadata: { contextId: this.contextId }
        });
    }
}

module.exports = DataLayerConnector;
