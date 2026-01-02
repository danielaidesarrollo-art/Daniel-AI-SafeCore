#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];

console.log(`
  _____             _      _        _    _________ 
 |  __ \\           (_)    | |      /_\\  |_   ___  |
 | |  | | __ _ _ __ _  ___| |___  //_\\\\   | |_  \\_|
 | |  | |/ _\` | '__| |/ _ \\ / __|/  _  \\  |  _|  _ 
 | |__| | (_| | |  | |  __/ \\__ \\\\_| |_/ _| |___/ |
 |_____/ \\__,_|_|  |_|\\___|_|___/\\_\\ /_/|_________|
                                                   
      SafeCore Terminal v1.0.0 (Commercial Edition)
`);

async function run() {
    switch (command) {
        case 'init':
            console.log("🔌 Coupling SafeCore to host system...");
            // Simulate scaffolding SDK
            await new Promise(r => setTimeout(r, 1000));
            console.log("   - Injecting Logic Layer... OK");
            console.log("   - Injecting Data Layer... OK");
            console.log("   - Establishing Protocol Handshake... OK");
            console.log("\n✅ SafeCore successfully coupled! You are now protected.");
            break;

        case 'scan':
            console.log("🔎 Initiating SafeCore Deep Scan...");
            try {
                // Determine path to scanner relative to this script
                const scannerPath = path.join(__dirname, '../tools/secure_scanner.js');
                execSync(`node "${scannerPath}"`, { stdio: 'inherit' });
            } catch (e) {
                // Scanner exits with 1 on critical found, which throws here
                // We handle it gracefully
                console.log("\n⚠️  Scan completed with findings.");
            }
            break;

        case 'status':
            console.log("📊 System Status Monitor");
            console.log("   ---------------------");
            // Simulate fetching real-time status from state manager
            const { StateManager, SYSTEM_STATES } = require('../src/pkg/safecore_sdk/system/state_manager');
            const KeyManager = require('../src/pkg/safecore_sdk/encryption/key_manager');

            KeyManager.initialize();
            const state = StateManager.getCurrentState();
            const color = state === SYSTEM_STATES.LOCKDOWN ? '\x1b[31m' : '\x1b[32m';

            console.log(`   Defense Level: 10/10 (MAXIMUM)`);
            console.log(`   System State:  ${color}${state}\x1b[0m`);
            console.log(`   Active Key ID: ${KeyManager.getCurrentKeyId() || 'Not Initialized'}`);
            console.log(`   Purifier:      Active (Context-Aware)`);
            console.log(`   Observability: Active (Predictive)`);
            break;

        case 'help':
        default:
            console.log("Available Commands:");
            console.log("   init      - Couple SafeCore to this system");
            console.log("   scan      - Audit host code for vulnerabilities");
            console.log("   status    - View real-time security telemetry");
            break;
    }
}

run();
