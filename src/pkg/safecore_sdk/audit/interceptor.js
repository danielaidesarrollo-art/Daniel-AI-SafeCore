const crypto = require('crypto');

// In-Memory simulated immutable ledger
const auditLedger = [];
let previousHash = "0000000000000000000000000000000000000000000000000000000000000000";

function generateHash(index, timestamp, sensitivity, message, prevHash) {
    const payload = `${index}|${timestamp}|${sensitivity}|${message}|${prevHash}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
}

function secureLog(message, sensitivity = "LOW") {
    const timestamp = new Date().toISOString();
    const index = auditLedger.length;

    const currentHash = generateHash(index, timestamp, sensitivity, message, previousHash);

    const entry = {
        index,
        timestamp,
        sensitivity,
        message,
        prevHash: previousHash,
        hash: currentHash
    };

    auditLedger.push(entry);
    previousHash = currentHash; // Chain update

    console.log(`[AUDIT] [${timestamp}] [${sensitivity}] ${message} {hash:${currentHash.substring(0, 8)}...}`);
}

function verifyChainIntegrity() {
    let calculatedPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";

    for (const entry of auditLedger) {
        // 1. Verify links
        if (entry.prevHash !== calculatedPrevHash) {
            return { valid: false, reason: `Chain broken at index ${entry.index}. PrevHash mismatch.` };
        }

        // 2. Verify content match
        const actualHash = generateHash(entry.index, entry.timestamp, entry.sensitivity, entry.message, entry.prevHash);
        if (actualHash !== entry.hash) {
            return { valid: false, reason: `Integrity check failed at index ${entry.index}. Content modified.` };
        }

        calculatedPrevHash = entry.hash;
    }
    return { valid: true };
}

// SIMULATION TOOL: Do not use in production
function simulateTamper(index) {
    if (auditLedger[index]) {
        auditLedger[index].message += " [TAMPERED]";
        // We do NOT update the hash, to ensure verification fails
    }
}

function monitoredFunction(fn) {
    return function (...args) {
        const start = Date.now();
        const funcName = fn.name || "anonymous";

        secureLog(`intercept: call ${funcName}`, "MEDIUM");

        try {
            const result = fn.apply(this, args);
            const duration = Date.now() - start;
            secureLog(`intercept: success ${funcName} (${duration}ms)`, "LOW");
            return result;
        } catch (e) {
            const duration = Date.now() - start;
            secureLog(`intercept: failure ${funcName} - ${e.message}`, "HIGH");
            throw e;
        }
    }
}

module.exports = { secureLog, monitoredFunction, verifyChainIntegrity, simulateTamper };
