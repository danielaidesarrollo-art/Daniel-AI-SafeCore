const MALICIOUS_PATTERNS = [
    /<script>/i,
    /javascript:/i,
    /DROP TABLE/i,
    /SELECT \* FROM/i,
    /--/
];

class AIPurifier {
    static assessRisk(inputData) {
        if (typeof inputData !== 'string') {
            // For now, only sanitizing strings. Objects pass through cautiously.
            return { blocked: false, reason: "Non-string input" };
        }

        // 1. Signature-Based Detection (Regex)
        for (const pattern of MALICIOUS_PATTERNS) {
            if (pattern.test(inputData)) {
                return {
                    blocked: true,
                    reason: `Pattern matched: ${pattern}`
                };
            }
        }

        // 2. Heuristic Analysis
        // 2.1 Shannon Entropy Check (Detect obfuscated/encrypted payloads)
        const entropy = this.calculateEntropy(inputData);
        if (entropy > 4.5 && inputData.length > 50) {
            return {
                blocked: true,
                reason: `High entropy detected (${entropy.toFixed(2)}): Possible obfuscation`
            };
        }

        // 2.2 Suspicious Character Ratio
        const suspiciousChars = (inputData.match(/[^a-zA-Z0-9\s]/g) || []).length;
        if (suspiciousChars / inputData.length > 0.4 && inputData.length > 10) {
            return {
                blocked: true,
                reason: "Suspicious character density: Potential exploit payload"
            };
        }

        return { blocked: false, reason: "Clean" };
    }

    static calculateEntropy(str) {
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

module.exports = AIPurifier;
