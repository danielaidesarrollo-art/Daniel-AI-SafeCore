const VaultService = require('../../src/pkg/safecore_sdk/encryption/vault_service');
const DataLayerConnector = require('../../src/pkg/safecore_sdk/connectors/data_layer');
const LogicLayerConnector = require('../../src/pkg/safecore_sdk/connectors/logic_layer');

const CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Asthma", "Migraine", "Fracture"];
const NAMES = ["John Doe", "Jane Smith", "Alice Jones", "Bob Brown", "Charlie Davis"];

function generateRecord() {
    return {
        request_id: require('crypto').randomUUID(),
        patient_pii: {
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            ssn: `${Math.floor(Math.random() * 899) + 100}-XX-XXXX`,
            dob: "1980-01-01"
        },
        medical_data: {
            condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
            notes: "Patient reports mild symptoms.",
            diagnosis_code: `ICD-${Math.floor(Math.random() * 89) + 10}`
        }
    };
}

function runSimulation() {
    console.log("🚀 Starting 'Patient Zero' Simulation (Node.js)...\n");

    // 0. Generate Data
    const originalRecord = generateRecord();
    console.log(`📄 Generated Synthetic Record for: ${originalRecord.patient_pii.name}`);

    // 1. Initialize Services
    const vault = new VaultService();
    const dataConn = new DataLayerConnector("sim-ctx-001");

    // 2. De-identification
    console.log("\n🔒 Step 1: Tokenization...");
    const pii = originalRecord.patient_pii;
    const originalId = `${pii.name}|${pii.ssn}`;
    const patientToken = vault.tokenizeIdentity(originalId);
    console.log(`   ✅ Identity replaced with Token: ${patientToken}`);

    // 3. Encryption
    console.log("\n🛡️  Step 2: Encryption...");
    const storagePayload = JSON.stringify({
        patient_token: patientToken,
        data: originalRecord.medical_data
    });
    const encryptedBlob = dataConn.protectAndStore(storagePayload, "MedicalRecord");
    console.log(`   ✅ Encrypted Blob: ${encryptedBlob.substring(0, 50)}...`);

    // 4. Secure Access
    console.log("\n🧠 Step 3: Secure Access...");
    const mockRequest = {
        headers: { sub: "admin", mfa_verified: true },
        last_active_timestamp: Date.now() / 1000
    };
    const logicConn = new LogicLayerConnector(mockRequest);

    try {
        logicConn.enforceSecurityBoundary();
        logicConn.validateInactivity();
        console.log("   ✅ Access Authorized.");

        const decryptedStr = dataConn.retrieveAndExpose(encryptedBlob);
        const decryptedData = JSON.parse(decryptedStr);

        if (decryptedData.patient_token === patientToken) {
            console.log("   ✅ Integrity Verified: Token matches.");
        } else {
            console.error("   ❌ Integrity Mismatch!");
        }

        const realIdentity = vault.detokenizeIdentity(patientToken);
        console.log(`   ✅ Detokenization Successful. Retrieved: ${realIdentity}`);

    } catch (e) {
        console.error(`   ❌ Access Denied: ${e.message}`);
        process.exit(1);
    }

    console.log("\n✨ Simulation Complete: Protocol Verified.");
}

runSimulation();
