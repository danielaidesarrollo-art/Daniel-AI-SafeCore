const RemoteBridge = require('./remote_bridge');

class DataLayerConnector {
    constructor(contextId) {
        this.contextId = contextId;
        this.dataCoreUrl = process.env.DATA_CORE_URL;

        // If DATA_CORE_URL is set, we are in REMOTE mode.
        // Otherwise, we default to local orchestrator (only works inside SafeCore container)
        this.isRemote = !!this.dataCoreUrl;

        if (this.isRemote) {
            this.bridge = new RemoteBridge(this.dataCoreUrl);
        } else {
            // Lazy load to avoid crash in remote services that don't have this module
            try {
                this.orchestrator = require('../../../modules').orchestrator;
            } catch (e) {
                console.warn("⚠️ [SafeCore SDK] Orchestrator not found. Local mode unavailable. Set DATA_CORE_URL for remote mode.");
            }
        }
    }

    async protectAndStore(data, recordType = "generic") {
        if (this.isRemote) {
            // Remote Secure Call
            return await this.bridge.sendSecureRequest('/api/data/ingest', 'POST', {
                schema: recordType,
                id: `rec_${Date.now()}`,
                payload: data
            });
        } else {
            // Legacy Local Call (Only works if inside SafeCore monolith)
            if (!this.orchestrator) throw new Error("SafeCore Orchestrator unavailable");

            return await this.orchestrator.executeSecurityChain({
                action: 'PROTECT_AND_STORE',
                encryptData: data,
                metadata: { contextId: this.contextId, recordType }
            });
        }
    }

    async retrieveAndExpose(encryptedData) {
        // Retrieval logic would be similar (Remote vs Local)
        // For now, implementing basic skeleton
        if (this.isRemote) {
            // Note: In a real scenario, we'd pass the ID, not the whole data if fetching
            // But if we are decrypting data we already have:
            throw new Error("Remote Decryption not yet implemented in this simplified SDK ver");
        } else {
            return await this.orchestrator.executeSecurityChain({
                action: 'RETRIEVE_AND_EXPOSE',
                decryptData: encryptedData,
                metadata: { contextId: this.contextId }
            });
        }
    }
}

module.exports = DataLayerConnector;
