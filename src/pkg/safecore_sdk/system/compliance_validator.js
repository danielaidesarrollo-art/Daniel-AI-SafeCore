const fs = require('fs');
const path = require('path');

/**
 * ComplianceValidator
 * Verifies that the local environment adheres to the Daniel_AI Ecosystem Compliance requirements.
 */
class ComplianceValidator {
    constructor(rootPath = process.cwd()) {
        this.rootPath = rootPath;
        this.manifestPath = path.join(this.rootPath, 'manifest.json');

        // Specific to SafeCore core manifest
        if (!fs.existsSync(this.manifestPath)) {
            const safeCoreManifest = path.join(this.rootPath, 'safecore.manifest.json');
            if (fs.existsSync(safeCoreManifest)) {
                this.manifestPath = safeCoreManifest;
            }
        }
    }

    /**
     * Validates the local manifest.
     * @returns {Object} - { valid: boolean, level: string, fingerprint: string }
     */
    validate() {
        try {
            if (!fs.existsSync(this.manifestPath)) {
                return { valid: false, error: "Manifest missing. Compliance check failed." };
            }

            const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));

            // Required Fields Check
            const required = ['project_name', 'compliance_level', 'features'];
            for (const field of required) {
                if (!manifest[field]) {
                    return { valid: false, error: `Missing required field: ${field}` };
                }
            }

            // Compliance Fingerprint (deterministic hash of the manifest)
            const fingerprint = Buffer.from(JSON.stringify({
                id: manifest.project_id || 'unregistered',
                level: manifest.compliance_level,
                features: manifest.features
            })).toString('base64');

            return {
                valid: true,
                packageName: manifest.project_name,
                level: manifest.compliance_level,
                fingerprint: fingerprint
            };

        } catch (e) {
            return { valid: false, error: `Validation Error: ${e.message}` };
        }
    }
}

module.exports = ComplianceValidator;
