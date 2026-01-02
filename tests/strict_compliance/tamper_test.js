const { secureLog, verifyChainIntegrity, simulateTamper } = require('../../src/pkg/safecore_sdk/audit/interceptor');
const { StateManager } = require('../../src/pkg/safecore_sdk/system/state_manager');
const LogicLayerConnector = require('../../src/pkg/safecore_sdk/connectors/logic_layer');

function runTamperSimulation() {
    console.log("🕵️ Starting Stick Compliance & Fail-Safe Test...\n");

    // 1. Generate Legitimate Logs
    console.log("[1] Generating legitimate audit traffic...");
    secureLog("System Start", "LOW");
    secureLog("User Login: admin", "MEDIUM");
    secureLog("Data Access: Patient-001", "HIGH");

    // 2. Initial Integrity Check
    const check1 = verifyChainIntegrity();
    if (check1.valid) {
        console.log("   ✅ Integrity Check PASSED (Chain Valid)");
    } else {
        console.error("   ❌ Integrity Check FAILED (Unexpected)");
        process.exit(1);
    }

    // 3. Simulate Attack (Tamper with Log Index 1)
    console.log("\n[2] 😈 Simulating malicious intrusion (Modifying Log #1)...");
    simulateTamper(1);

    // 4. Detect Tampering
    console.log("[3] Verifying Integrity after attack...");
    const check2 = verifyChainIntegrity();

    if (!check2.valid) {
        console.log(`   ✅ TAMPER DETECTED: ${check2.reason}`);
        console.log("   🚨 TRIGGERING SYSTEM LOCKDOWN...");
        StateManager.triggerLockdown("Audit Integrity Failure Detected");
    } else {
        console.error("   ❌ TAMPER NOT DETECTED (Chain validation failed to catch modification)");
        process.exit(1);
    }

    // 5. Verify Lockdown Enforcement
    console.log("\n[4] Attempting operation during LOCKDOWN...");
    try {
        const mockReq = { headers: { sub: 'admin' } };
        const logic = new LogicLayerConnector(mockReq);
        logic.enforceSecurityBoundary();
        console.error("   ❌ FAIL: Operation allowed during Lockdown!");
        process.exit(1);
    } catch (e) {
        if (e.message.includes("System is in LOCKDOWN")) {
            console.log(`   ✅ FAIL-SAFE SUCCESS: Operation blocked. Reason: ${e.message}`);
        } else {
            console.error(`   ❌ Unexpected Error: ${e.message}`);
            process.exit(1);
        }
    }

    console.log("\n✨ Strict Compliance Test Complete.");
}

runTamperSimulation();
