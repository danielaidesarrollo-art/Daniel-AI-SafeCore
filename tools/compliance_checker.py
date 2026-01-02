import os
import json
import sys

REQUIRED_FILES = ["safecore.manifest.json"]
BANNED_PATTERNS = ["AWS_ACCESS_KEY", "PRIVATE_KEY", "password="]

def check_manifest(path):
    manifest_path = os.path.join(path, "safecore.manifest.json")
    if not os.path.exists(manifest_path):
        print("❌ FAILED: safecore.manifest.json not found.")
        return False
    
    try:
        with open(manifest_path, 'r') as f:
            data = json.load(f)
            if "compliance_level" not in data:
                 print("❌ FAILED: Manifest missing compliance_level.")
                 return False
            print(f"✅ Manifest found. Level: {data['compliance_level']}")
            return True
    except Exception as e:
        print(f"❌ FAILED: Invalid JSON manifest. {e}")
        return False

def scan_for_secrets(path):
    print("🔍 Scanning for banned secrets...")
    violations = 0
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith((".py", ".js", ".ts", ".java", ".md")):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        for pattern in BANNED_PATTERNS:
                            if pattern in content:
                                print(f"⚠️ VIOLATION: '{pattern}' found in {file}")
                                violations += 1
                except:
                    pass
    if violations > 0:
        return False
    return True

def main():
    target_path = sys.argv[1] if len(sys.argv) > 1 else "."
    print(f"Starting SafeCore Compliance Scan on: {target_path}")
    
    passed_manifest = check_manifest(target_path)
    passed_secrets = scan_for_secrets(target_path)
    
    if passed_manifest and passed_secrets:
        print("\n✅ COMPLIANCE CHECK PASSED")
        sys.exit(0)
    else:
        print("\n❌ COMPLIANCE CHECK FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()
