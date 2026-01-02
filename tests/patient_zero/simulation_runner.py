import sys
import os
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../src')))

from pkg.safecore_sdk.encryption.vault_service import VaultService
from pkg.safecore_sdk.connectors.data_layer import DataLayerConnector
from pkg.safecore_sdk.connectors.logic_layer import LogicLayerConnector
from pkg.safecore_sdk.auth.idp_bridge import IDPBridge
from data_generator import generate_record

def run_simulation():
    print("🚀 Starting 'Patient Zero' Simulation...\n")
    
    # 0. Generate Data
    original_record = generate_record()
    print(f"📄 Generated Synthetic Record for: {original_record['patient_pii']['name']}")
    
    # 1. Initialize Services
    vault = VaultService()
    data_conn = DataLayerConnector(context_id="sim-ctx-001")
    
    # 2. De-identification (Vault)
    print("\n🔒 Step 1: Tokenization (De-linking Identity)...")
    pii = original_record['patient_pii']
    # Create a composite ID for simulation
    original_id = f"{pii['name']}|{pii['ssn']}"
    
    patient_token = vault.tokenize_identity(original_id)
    print(f"   ✅ Identity '{original_id}' replaced with Token: {patient_token}")
    
    # 3. Secure Storage (Data Connector)
    print("\n🛡️  Step 2: Encryption (Data Layer)...")
    # We store the medical data linked ONLY to the token, not the name
    storage_payload = {
        "patient_token": patient_token,
        "data": original_record["medical_data"]
    }
    
    # Serialize and Encrypt
    encrypted_blob = data_conn.protect_and_store(json.dumps(storage_payload), record_type="MedicalRecord")
    print(f"   ✅ Data Encrypted and Stored. Blob: {encrypted_blob[:50]}...")
    
    # 4. Secure Access (Logic Layer)
    print("\n🧠 Step 3: Secure Access (Logic Layer)...")
    # Simulate a request context
    mock_request = {
        "headers": {"mfa_verified": True}, # Valid Session
        "last_active_timestamp": __import__("time").time()
    }
    
    logic_conn = LogicLayerConnector(mock_request)
    
    try:
        logic_conn.enforce_security_boundary() # Auth Check
        logic_conn.validate_inactivity()       # Timeout Check
        print("   ✅ Access Authorized & Session Validated.")
        
        # Simulate retrieval
        decrypted_str = data_conn.retrieve_and_expose(encrypted_blob)
        decrypted_data = json.loads(decrypted_str)
        
        if decrypted_data["patient_token"] == patient_token:
            print("   ✅ Integrity Verified: Token matches.")
        else:
            print("   ❌ Integrity Mismatch!")

        # Simulate Detokenization (Only for authorized personnel)
        real_identity = vault.detokenize_identity(patient_token)
        print(f"   ✅ Detokenization Successful. Retrieved: {real_identity}")

    except Exception as e:
        print(f"   ❌ Access Denied: {str(e)}")
        sys.exit(1)

    print("\n✨ Simulation Complete: Protocol Verified.")

if __name__ == "__main__":
    try:
        run_simulation()
    except ImportError:
        # Fallback for when running directly and path issues occur
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
        run_simulation()
