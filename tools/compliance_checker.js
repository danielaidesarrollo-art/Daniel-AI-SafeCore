const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = ["safecore.manifest.json"];
const BANNED_PATTERNS = [
    { pattern: "AWS_ACCESS_KEY", sensitivity: "CRITICAL", desc: "Hardcoded Cloud Credential" },
    { pattern: "PRIVATE_KEY", sensitivity: "CRITICAL", desc: "Private Cryptographic Material" },
    { pattern: "password=", sensitivity: "HIGH", desc: "Potential Hardcoded Password" },
    { pattern: "alert(", sensitivity: "MEDIUM", desc: "Potential XSS testing leak" }
];

function checkManifest(targetPath) {
    const manifestPath = path.join(targetPath, "safecore.manifest.json");
    if (!fs.existsSync(manifestPath)) {
        console.error("❌ FAILED: safecore.manifest.json not found.");
        return false;
    }

    try {
        const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (!data.compliance_level) {
            console.error("❌ FAILED: Manifest missing compliance_level.");
            return false;
        }
        console.log(`✅ Manifest found. Level: ${data.compliance_level}`);
        return true;
    } catch (e) {
        console.error(`❌ FAILED: Invalid JSON manifest. ${e.message}`);
        return false;
    }
}

function scanProject(targetPath) {
    console.log("🔍 Scanning project for secrets and SDK usage...");
    let violations = 0;
    let sdkFound = false;

    function walkSync(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(function (file) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Exclude system/test directories
                if (!['node_modules', '.git', 'tools', 'logs', 'brain', 'docs', 'reports', 'tests'].includes(file)) {
                    walkSync(filePath);
                }
            } else {
                // Scan files with relevant extensions
                if (/\.(js|ts|py|json|html)$/.test(file) && file !== 'test_gateway.js') {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');

                        // Check for SDK usage
                        if (content.includes('safecore_sdk') || content.includes('LogicLayerConnector')) {
                            sdkFound = true;
                        }

                        // Check for banned patterns
                        BANNED_PATTERNS.forEach(banned => {
                            if (content.includes(banned.pattern)) {
                                console.error(`⚠️ VIOLATION [${banned.sensitivity}]: ${banned.desc} found in ${path.relative(targetPath, filePath)}`);
                                violations++;
                            }
                        });
                    } catch (err) { }
                }
            }
        });
    }

    walkSync(targetPath);

    if (!sdkFound) {
        console.error("❌ FAILED: SafeCore SDK usage not detected in project logic.");
        return false;
    } else {
        console.log("✅ SafeCore SDK integration detected.");
    }

    return violations === 0;
}

function main() {
    const targetPath = process.argv[2] || ".";
    console.log(`Starting SafeCore Compliance Scan on: ${path.resolve(targetPath)}`);

    const passedManifest = checkManifest(targetPath);
    const passedScan = scanProject(targetPath);

    if (passedManifest && passedScan) {
        console.log("\n✅ COMPLIANCE CHECK PASSED: System meets all security mandates.");
        process.exit(0);
    } else {
        console.log("\n❌ COMPLIANCE CHECK FAILED: Resolve violations to proceed.");
        process.exit(1);
    }
}

main();
