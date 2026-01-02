const KeyScheduler = require('../src/pkg/safecore_sdk/encryption/key_scheduler');
const KeyManager = require('../src/pkg/safecore_sdk/encryption/key_manager');

function runSchedulerTest() {
    console.log("⏱️  Starting Automated Key Scheduler Test...\n");

    // Init
    KeyManager.initialize();
    const initialKey = KeyManager.getCurrentKeyId();
    console.log(`[1] Initial Master Key: ${initialKey}`);

    // Simulate 15 Days (No Rotation Expected)
    console.log("\n[2] Simulating +15 Days...");
    KeyScheduler.simulateTimePassage(15);
    if (KeyManager.getCurrentKeyId() === initialKey) {
        console.log("   ✅ OK: No rotation triggered yet.");
    } else {
        console.error("   ❌ FAIL: Premature rotation!");
        process.exit(1);
    }

    // Simulate another 20 Days (Total 35 > 30, Expect Rotation)
    console.log("\n[3] Simulating +20 Days (Total 35)...");
    KeyScheduler.simulateTimePassage(20);

    const newKey = KeyManager.getCurrentKeyId();
    if (newKey !== initialKey) {
        console.log(`   ✅ SUCCESS: Automated Rotation Triggered. New Key: ${newKey}`);
    } else {
        console.error("   ❌ FAIL: Rotation did NOT trigger after interval.");
        process.exit(1);
    }

    console.log("\n✨ Scheduler Test Complete.");
}

runSchedulerTest();
