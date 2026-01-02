/**
 * Daniel_AI SafeCore: Deception Manager
 * Generates synthetic "Honey-Token" data to deceive attackers.
 */

const crypto = require('crypto');

class DeceptionManager {
    constructor() {
        this.quarantineVault = new Map();
    }

    /**
     * Generates a "Quarantine Cell" (Fake DB Response).
     * @param {string} originalRequest 
     */
    generateHoneypotResponse(originalRequest) {
        // AI-driven simulation of a "successful" response
        const fakeId = `PAT-FAKE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        return {
            status: "SUCCESS",
            ref: crypto.randomBytes(16).toString('hex'),
            data: {
                id: fakeId,
                patient_name: this._generateFakeName(),
                ssn: `***-**-${Math.floor(1000 + Math.random() * 9000)}`,
                diagnosis: "SIMULATED_DATA_PROTECTED",
                note: "Access granted to shadow environment."
            },
            notice: "Integrity check passed." // Deceive the attacker
        };
    }

    _generateFakeName() {
        const names = ["John Doe", "Jane Smith", "Alex River", "Sam Knight"];
        return names[Math.floor(Math.random() * names.length)];
    }

    logDeception(threat, payload) {
        console.log(`[DECEPTION] Threat quarantined: ${threat}. Payload diverted to Honey-Token.`);
    }
}

module.exports = new DeceptionManager();
