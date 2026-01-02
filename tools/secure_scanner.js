const fs = require('fs');
const path = require('path');

const CONFIG = {
    rootDir: './src',
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    ignore: ['node_modules', '.git', 'dist', 'tests'], // Ignoring tests in strict scans
    rules: [
        { id: 'RCE_EVAL', level: 'CRITICAL', pattern: /eval\s*\(/, message: 'Usage of eval() detected. This is a severe RCE risk.' },
        { id: 'RCE_EXEC', level: 'CRITICAL', pattern: /exec\s*\(/, message: 'Usage of child_process.exec() detected. Potential Command Injection.' },
        { id: 'SECRET_AWS', level: 'CRITICAL', pattern: /AKIA[0-9A-Z]{16}/, message: 'Potential AWS Access Key ID found.' },
        { id: 'SECRET_KEY', level: 'CRITICAL', pattern: /-----BEGIN PRIVATE KEY-----/, message: 'Hardcoded Private Key detected.' },
        { id: 'WEAK_CRYPTO', level: 'HIGH', pattern: /createHash\(['"](md5|sha1)['"]\)/, message: 'Weak hashing algorithm (MD5/SHA1) detected. Use SHA-256.' },
        { id: 'DEBUG_LOG', level: 'LOW', pattern: /console\.log\(/, message: 'Leftover console.log statements impacting performance/privacy.' }
    ]
};

let issuesFound = 0;

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        CONFIG.rules.forEach(rule => {
            if (rule.pattern.test(line)) {
                // Formatting output
                const color = rule.level === 'CRITICAL' ? '\x1b[31m' : (rule.level === 'HIGH' ? '\x1b[33m' : '\x1b[36m');
                console.log(`${color}[${rule.level}] ${rule.id}\x1b[0m: ${rule.message}`);
                console.log(`    at ${filePath}:${index + 1}`);
                console.log(`    > ${line.trim().substring(0, 100)}...`);

                if (rule.level === 'CRITICAL' || rule.level === 'HIGH') {
                    issuesFound++;
                }
            }
        });
    });
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!CONFIG.ignore.includes(file)) {
                traverseDir(fullPath);
            }
        } else {
            if (CONFIG.extensions.includes(path.extname(fullPath))) {
                scanFile(fullPath);
            }
        }
    });
}

console.log("🛡️  Starting SafeCore Code Scanner...");
console.log(`   Scanning directory: ${CONFIG.rootDir}`);
traverseDir(CONFIG.rootDir);

if (issuesFound > 0) {
    console.error(`\n❌ Scan FAILED. ${issuesFound} Critical/High issues found.`);
    process.exit(1);
} else {
    console.log("\n✅ Scan PASSED. No Critical/High issues detected.");
    process.exit(0);
}
