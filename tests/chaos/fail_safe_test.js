const DataLayerConnector = require('../../src/pkg/safecore_sdk/connectors/data_layer');
const { secureLog } = require('../../src/pkg/safecore_sdk/audit/interceptor');

// Mock dependencies to allow "Breakage"
const AESService = require('../../src/pkg/safecore_sdk/encryption/aes_service');

function runChaosTest() {
    console.log("🔥 Starting Chaos Engineering (Fail-Safe) Test...\n");

    // SCENARIO: Vault Service goes offline (Atomic Failure verification)
    console.log("[1] Simulating 'Vault Service Death' (Connection Refused)...");

    // 1. Sabotage the Dependency
    const originalEncrypt = AESService.prototype.encryptSensitiveData;
    AESService.prototype.encryptSensitiveData = () => {
        secureLog("CHAOS: Vault Connection Failed", "CRITICAL");
        throw new Error("ConnectionRefused: Vault Service Unreachable");
    };

    // 2. Attempt Operation
    try {
        const dataConn = new DataLayerConnector("chaos-ctx");
        const result = dataConn.protectAndStore("Critical Patient Data", "ClinicalIngest");

        console.error("   ❌ FAIL: System allowed write during critical dependency failure (Fail-Open)!");
        process.exit(1);

    } catch (e) {
        // 3. Verify "Fail-Closed"
        if (e.message.includes("Vault Service Unreachable")) {
            console.log("   ✅ SUCCESS: System Failed-Closed. Operation blocked. Error propagated.");
            console.log("   🛡️  Fail-Safe Protocol: Verified.");
        } else {
            console.error(`   ❌ FAIL: Unexpected error behavior: ${e.message}`);
            process.exit(1);
        }
    } finally {
        // Restore for other tests if needed
        AESService.prototype.encryptSensitiveData = originalEncrypt;
    }

    console.log("\n✨ Chaos Test Complete.");
}

runChaosTest();
