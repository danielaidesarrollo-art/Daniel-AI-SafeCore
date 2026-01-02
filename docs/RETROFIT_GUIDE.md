# SafeCore Retrofit Guide

This guide outlines the steps to bring legacy Daniel_AI applications into compliance with SafeCore standards.

## Phase 1: Assessment & Preparation
1.  **Identify Compliance Level**: Determine if the application requires Level 1, 2, or 3 compliance (see `COMPLIANCE_MANDATE.md`).
2.  **Inventory Secrets**: Find all hardcoded API keys, passwords, and secrets. **REMOVE THEM**.
3.  **Install SDK**: Add the `safecore_sdk` to your project dependencies.

## Phase 2: Integration Steps

### Step 1: Add Manifest
Create a `safecore.manifest.json` in your project root:
```json
{
  "project_name": "legacy-app-v1",
  "compliance_level": "L2",
  "maintainer": "team@daniel.ai"
}
```

### Step 2: Switch Authentication
Replace local login logic with SafeCore IAM redirection:
```python
# Before
def login(user, password):
    return db.check_password(user, password)

# After
from safecore_sdk.auth import authenticate_via_sidecar
def login(request):
    return authenticate_via_sidecar(request.headers)
```

### Step 3: Enable Auditing
Route critical logs to the Immutable Auditor:
```python
# Before
logger.info("User updated profile")

# After
from safecore_sdk.audit import secure_log
secure_log("User updated profile", sensitivity="HIGH")
```

## Phase 3: Validation
1.  Run `node tools/compliance_checker.js` in your project root.
2.  Fix any reported violations.
3.  Deploy to Staging and verify Sidecar connectivity.
