const auditor = require('../immutable_auditor');

const MALICIOUS_PATTERNS = [
    /<script>/i,
    /javascript:/i,
    /DROP TABLE/i,
    /SELECT \* FROM/i,
    /--/
];

class AIPurifier {
    assessRisk(inputData) {
        if (typeof inputData !== 'string') {
            return { blocked: false, reason: "Non-string input" };
        }

        // 1. Signature-Based Detection
        for (const pattern of MALICIOUS_PATTERNS) {
            if (pattern.test(inputData)) {
                auditor.log(`Threat detected: ${pattern}`, "HIGH", { inputSnippet: inputData.substring(0, 50) });
                return {
                    blocked: true,
                    reason: `Malicious pattern matched: ${pattern}`
                };
            }
        }

        // 2. Entropy Check
        const entropy = this._calculateEntropy(inputData);
        if (entropy > 4.5 && inputData.length > 50) {
            auditor.log("High entropy detection", "MEDIUM", { entropy });
            return {
                blocked: true,
                reason: `High entropy detected (${entropy.toFixed(2)}): Potential obfuscation`
            };
        }

        return { blocked: false, reason: "Clean" };
    }

    sanitize(data) {
        const assessment = this.assessRisk(data);
        if (assessment.blocked) {
            throw new Error(`SafeCore Security Violation: ${assessment.reason}`);
        }
        return data;
    }

    _calculateEntropy(str) {
        const len = str.length;
        const freq = {};
        for (let i = 0; i < len; i++) {
            freq[str[i]] = (freq[str[i]] || 0) + 1;
        }
        let entropy = 0;
        for (const f in freq) {
            const p = freq[f] / len;
            entropy -= p * Math.log2(p);
        }
        return entropy;
    }
}

module.exports = new AIPurifier();
