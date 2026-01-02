const { secureLog } = require('../audit/interceptor');

class AIPurifier {
    constructor() {
        this.riskThreshold = 0.7;
    }

    /**
     * Assess the risk of the input data with Context Awareness.
     * @param {Object|string} input - The data to analyze
     * @param {Object} context - { type: 'text'|'email'|'name'|'medical_code', user_role: string }
     * @returns {Object} { score: number, blocked: boolean, reason: string }
     */
    assessRisk(input, context = {}) {
        const strInput = JSON.stringify(input).toLowerCase();
        let riskScore = 0.0;
        let reasons = [];

        // 0. Contextual Integrity Check (10/10 Feature)
        if (context.type) {
            // Block Binary/Image data in text fields (Base64 heuristic)
            if (['name', 'email', 'medical_code'].includes(context.type)) {
                // Check if input looks like a massive contiguous string (base64 blob)
                // Heuristic: >500 chars and NO spaces
                if (strInput.length > 500 && !strInput.includes(' ')) {
                    riskScore += 1.0;
                    reasons.push(`Context Violation: Suspicious binary/packed data in '${context.type}' field`);
                }
            }
        }

        // 1. SQL Injection Heuristics (Weight: 0.8)
        if (strInput.match(/(\bdrop\b\s+\btable\b|\bselect\b\s+\*\s+\bfrom\b|\bunion\b\s+\bselect\b|' OR '1'='1)/i)) {
            let weight = 0.8;
            if (context.type === 'email' || context.type === 'name') weight = 1.0;

            riskScore += weight;
            reasons.push("SQL Injection Pattern Detected");
        }

        // 2. XSS / Script Injection Heuristics (Weight: 0.9)
        if (strInput.match(/(<script>|javascript:|onerror=|onload=|<\/script>)/i)) {
            riskScore += 0.9;
            reasons.push("XSS/Script Injection Pattern Detected");
        }

        // 3. PHI Leakage Heuristics (Weight: 0.7)
        const ssnMatches = (strInput.match(/\d{3}-\d{2}-\d{4}/g) || []).length;
        if (ssnMatches > 5) {
            riskScore += 0.7;
            reasons.push(`Massive PHI Leakage Potential (${ssnMatches} SSNs)`);
        }

        // Cap score at 1.0
        riskScore = Math.min(riskScore, 1.0);

        if (riskScore >= this.riskThreshold) {
            secureLog(`Threat Detected: ${reasons.join(", ")} (Score: ${riskScore})`, "HIGH");
            return { score: riskScore, blocked: true, reason: reasons.join("; ") };
        }

        return { score: riskScore, blocked: false, reason: null };
    }
}

module.exports = new AIPurifier();
