const AIPurifier = require('../src/pkg/safecore_sdk/threat/ai_purifier');
const SecurityAnalyst = require('../src/pkg/safecore_sdk/threat/security_analyst');
const { StateManager, SYSTEM_STATES } = require('../src/pkg/safecore_sdk/system/state_manager');

function runAdvancedSecurityTest() {
    console.log("🕵️ Starting Phase 3 (10/10) Security Test...\n");

    // TEST 1: Context-Aware Purification
    console.log("[1] Testing Context-Aware Purifier...");

    // Scenario: Attacker tries to put a binary/image (base64) into a 'name' field
    const maliciousPayload = "a".repeat(600); // Simulate large blob without spaces
    const result = AIPurifier.assessRisk(maliciousPayload, { type: 'name' });

    if (result.blocked && result.reason.includes("Context Violation")) {
        console.log("   ✅ SUCCESS: Context Violation blocked (Binary in Name field).");
    } else {
        console.error(`   ❌ FAIL: Context check failed. Score: ${result.score}`);
        process.exit(1);
    }

    // TEST 2: Predictive Observability (Brute Force)
    console.log("\n[2] Testing Predictive Observability (Brute Force)...");

    // Reset State for test
    if (StateManager.getCurrentState() === SYSTEM_STATES.LOCKDOWN) {
        StateManager.resetSystem("root-override-123");
    }

    // Simulate 5 rapid failures
    const attacker = "user-123";
    for (let i = 0; i < 5; i++) {
        SecurityAnalyst.analyzeEvent('AUTH_FAILURE', attacker);
    }

    // specific check: Analyst should have triggered Lockdown
    if (StateManager.getCurrentState() === SYSTEM_STATES.LOCKDOWN) {
        console.log("   ✅ SUCCESS: Security Analyst triggered Lockdown on Brute Force pattern.");
    } else {
        console.error("   ❌ FAIL: System did not lock down after brute force simulation.");
        process.exit(1);
    }

    console.log("\n✨ Advanced Security Test Complete.");
}

runAdvancedSecurityTest();
