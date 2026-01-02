const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ImmutableAuditor {
    constructor() {
        this.logDir = path.join(__dirname, '../../../logs');
        this.logFile = path.join(this.logDir, 'safecore.audit.log');
        this.stateFile = path.join(this.logDir, 'auditor.state.json');
        this.lastHash = this._loadLastHash();

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    _loadLastHash() {
        if (fs.existsSync(this.stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                return state.lastHash || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    _saveLastHash(hash) {
        fs.writeFileSync(this.stateFile, JSON.stringify({ lastHash: hash, timestamp: new Date().toISOString() }), 'utf8');
        this.lastHash = hash;
    }

    log(message, level = "INFO", metadata = {}) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            level,
            message,
            metadata,
            prevHash: this.lastHash
        };

        const entryString = JSON.stringify(entry);
        const currentHash = crypto.createHash('sha256').update(entryString).digest('hex');
        
        const securedEntry = {
            ...entry,
            hash: currentHash
        };

        const logLine = JSON.stringify(securedEntry) + '\n';
        
        try {
            fs.appendFileSync(this.logFile, logLine, 'utf8');
            this._saveLastHash(currentHash);
            
            // Console output for visibility
            let color = "\x1b[37m"; // White
            if (level === "CRITICAL") color = "\x1b[31m"; // Red
            else if (level === "HIGH") color = "\x1b[33m"; // Yellow
            else if (level === "MEDIUM") color = "\x1b[36m"; // Cyan
            
            console.log(`${color}[SAFECORE_AUDIT] [${level}] ${message}\x1b[0m`);
            
            return currentHash;
        } catch (err) {
            console.error("❌ CRITICAL: Immutable Auditor failed to write log!", err);
            throw new Error("Audit Failure: System Halt mandated by security policy");
        }
    }

    verifyLogIntegrity() {
        if (!fs.existsSync(this.logFile)) return true;

        const lines = fs.readFileSync(this.logFile, 'utf8').trim().split('\n');
        let expectedPrevHash = null;

        for (const line of lines) {
            if (!line) continue;
            const entry = JSON.parse(line);
            const { hash, ...data } = entry;
            
            // Verify current hash
            const calculatedHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
            if (calculatedHash !== hash) return false;
            
            // Verify chain
            if (data.prevHash !== expectedPrevHash) return false;
            
            expectedPrevHash = hash;
        }
        return true;
    }
}

module.exports = new ImmutableAuditor();
