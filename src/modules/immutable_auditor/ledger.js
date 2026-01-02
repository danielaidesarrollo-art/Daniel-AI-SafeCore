/**
 * Daniel_AI SafeCore: Audit Ledger (High Availability)
 * Simulated persistent ledger for security logs.
 */

const fs = require('fs');
const path = require('path');

class AuditLedger {
    constructor() {
        this.ledgerPath = path.join(__dirname, '../../../logs/safecore_ledger.json');
        if (!fs.existsSync(path.dirname(this.ledgerPath))) {
            fs.mkdirSync(path.dirname(this.ledgerPath), { recursive: true });
        }
    }

    /**
     * Commits a log entry to the persistent ledger.
     */
    async commit(entry) {
        let ledger = [];
        if (fs.existsSync(this.ledgerPath)) {
            ledger = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
        }

        const logWithProof = {
            ...entry,
            _commitment: this._generateLedgerProof(entry),
            _ledger_id: ledger.length + 1
        };

        ledger.push(logWithProof);
        fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));

        console.log(`[AuditLedger] Log committed to High-Availability Storage (ID: ${logWithProof._ledger_id})`);
        return logWithProof;
    }

    _generateLedgerProof(entry) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
    }
}

module.exports = new AuditLedger();
