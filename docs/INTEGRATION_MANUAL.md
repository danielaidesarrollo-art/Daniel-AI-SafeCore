# Daniel_AI SafeCore Integration Manual

## 1. Quick Start
To integrate SafeCore into your module:

1.  **Add SDK**: Ensure `safecore_sdk` is in `PYTHONPATH`.
2.  **Declare Manifest**: Create `safecore.manifest.json`.
3.  **Use Connectors**: Do not write custom security logic.

## 2. Connecting Data Layer
Use `DataLayerConnector` for all persistence.
```python
from safecore_sdk.connectors import DataLayerConnector

conn = DataLayerConnector(context_id="ctx-123")
encrypted_blob = conn.protect_and_store("clinical_data")
```

## 3. Connecting Logic Layer
Use `LogicLayerConnector` for all business logic.
```python
from safecore_sdk.connectors import LogicLayerConnector

def process_patient_data(request):
    logic = LogicLayerConnector(request)
    logic.enforce_security_boundary() # Auth + MFA check
    logic.validate_inactivity()       # Auto-Logout check
    
    clean_input = logic.sanitize_input(request.data)
    # ... logic ...
```

## 4. De-linking Identity (Vault)
Never store PII/PHI directly. Use the Vault.
```python
from safecore_sdk.encryption.vault_service import VaultService

vault = VaultService()
token = vault.tokenize_identity("PATIENT-ID-001")
# Store 'token' in DB, not 'PATIENT-ID-001'
```

## 5. Deployment (IaC)
- Use `infra/terraform/vpc.tf` to provision the isolated network.
- Ensure your service runs inside the `safecore-private-subnet`.
