const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = ["safecore.manifest.json"];
const BANNED_PATTERNS = ["AWS_ACCESS_KEY", "PRIVATE_KEY", "password="];

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

function scanForSecrets(targetPath) {
    console.log("🔍 Scanning for banned secrets...");
    let violations = 0;

    function walkSync(dir, filelist) {
        const files = fs.readdirSync(dir);
        files.forEach(function (file) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'tools') {
                    walkSync(filePath, filelist);
                }
            } else {
                if (/\.(js|ts|py|java|md|json)$/.test(file)) {
                    // Check content
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        BANNED_PATTERNS.forEach(pattern => {
                            if (content.includes(pattern)) {
                                console.error(`⚠️ VIOLATION: '${pattern}' found in ${path.relative(targetPath, filePath)}`);
                                violations++;
                            }
                        });
                    } catch (err) {
                        // Ignore read errors
                    }
                }
            }
        });
    }

    walkSync(targetPath, []);

    if (violations > 0) {
        return false;
    }
    return true;
}

function main() {
    const targetPath = process.argv[2] || ".";
    console.log(`Starting SafeCore Compliance Scan on: ${targetPath}`);

    const passedManifest = checkManifest(targetPath);
    const passedSecrets = scanForSecrets(targetPath);

    if (passedManifest && passedSecrets) {
        console.log("\n✅ COMPLIANCE CHECK PASSED");
        process.exit(0);
    } else {
        console.log("\n❌ COMPLIANCE CHECK FAILED");
        process.exit(1);
    }
}

main();
