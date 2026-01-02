const LogicLayerConnector = require('../src/pkg/safecore_sdk/connectors/logic_layer');

console.log("🧪 Starting SafeCore SDK Verification...");
let passed = 0;
let total = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        console.log(`   ✅ PASS: ${message}`);
        passed++;
    } else {
        console.log(`   ❌ FAIL: ${message}`);
    }
}

async function runTests() {
    // 1. Test Unauthorized Access
    console.log("\n[Test 1] Unauthorized Access");
    try {
        const connector = new LogicLayerConnector({ headers: {} });
        await connector.enforceSecurityBoundary();
        assert(false, "Should have thrown Access Denied");
    } catch (e) {
        assert(e.message.includes("Access Denied") || e.message.includes("Authentication Failed"), "Correctly denied access");
    }

    // 2. Test Authorized Access
    console.log("\n[Test 2] Authorized Access");
    try {
        // Using a valid token from our mock IAM
        const connector = new LogicLayerConnector({
            headers: { 'authorization': 'Bearer token_admin_123' }
        });

        await connector.enforceSecurityBoundary('SYSTEM_DASHBOARD', 'READ');
        assert(connector.isAuthenticated === true, "Session authenticated and boundary crossed");

        // 3. Test Input Sanitization (Clean)
        const cleanInput = "Hello SafeCore";
        const result = await connector.sanitizeInput(cleanInput);
        assert(result === cleanInput, "Clean input passed through");

        // 4. Test Input Sanitization (Malicious)
        console.log("\n[Test 3] Threat Detection");
        try {
            await connector.sanitizeInput("SELECT * FROM users");
            assert(false, "Should have blocked SQL injection");
        } catch (e) {
            assert(e.message.includes("Security Violation") || e.message.includes("Threat Detected"), "Correctly blocked SQLi");
        }

    } catch (e) {
        console.error("Unexpected error:", e);
        assert(false, "Unexpected error during authorized test");
    }

    console.log(`\n----------------------------------------`);
    console.log(`Summary: ${passed}/${total} Tests Passed`);

    if (passed === total) process.exit(0);
    else process.exit(1);
}

runTests();
