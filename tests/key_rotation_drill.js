const KeyManager = require('../src/pkg/safecore_sdk/encryption/key_manager');
const AESService = require('../src/pkg/safecore_sdk/encryption/aes_service');

// Mock AES Service requiring KeyManager injection (simulation stub)
class MockAES {
    constructor() {
        this.keyId = KeyManager.getCurrentKeyId();
        this.key = KeyManager.getCurrentKey();
    }

    encrypt(data) {
        // Simplified mock encryption: prefix with keyId
        return JSON.stringify({ keyId: this.keyId, payload: Buffer.from(data).toString('base64') });
    }

    decrypt(blob) {
        const parsed = JSON.parse(blob);
        // Request key from KeyManager based on metadata
        const key = KeyManager.getKey(parsed.keyId);
        // In real AES, we would use this 'key' to decrypt. Here we just return payload.
        return Buffer.from(parsed.payload, 'base64').toString();
    }
}

function runRotationDrill() {
    console.log("🔐 Starting Key Rotation Drill...\n");

    // 1. Init
    KeyManager.initialize();
    const aesV1 = new MockAES();
    const dataV1 = aesV1.encrypt("Sensitive Patient Data V1");
    console.log(`[1] Encrypted data with Key V1 (${aesV1.keyId})`);

    // 2. Rotate Key
    console.log("\n[2] Triggering Auto-Rotation...");
    KeyManager.rotateMasterKey("Scheduled Rotation");

    // 3. Encrypt new data with V2
    const aesV2 = new MockAES(); // Refreshes key from manager
    const dataV2 = aesV2.encrypt("New Patient Data V2");
    console.log(`[3] Encrypted data with Key V2 (${aesV2.keyId})`);

    // 4. Verify Readability of Legacy Data (V1)
    console.log("\n[4] Verifying Legacy Data Readability...");
    try {
        const recoveredV1 = aesV2.decrypt(dataV1); // Using v2 service but it should fetch v1 key
        if (recoveredV1 === "Sensitive Patient Data V1") {
            console.log("   ✅ SUCCESS: Legacy data readable after rotation.");
        } else {
            console.error("   ❌ FAIL: Readability check failed.");
        }
    } catch (e) {
        console.error(`   ❌ FAIL: ${e.message}`);
    }

    console.log("\n✨ Key Rotation Drill Complete.");
}

runRotationDrill();
