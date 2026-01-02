const AIPurifier = require('../src/pkg/safecore_sdk/threat/ai_purifier');

function testPurifier() {
    console.log("🧪 Testing AI Purifier Risk Scoring...\n");

    const tests = [
        { name: "Normal Clinical Note", input: { note: "Patient complains of headache." }, expectedBlock: false },
        { name: "SQL Injection", input: { id: "1'; DROP TABLE users;--" }, expectedBlock: true },
        { name: "XSS Attack", input: { comment: "<script>alert('hacked')</script>" }, expectedBlock: true },
        { name: "Mass PHI Leakage", input: { data: "123-45-6789, 987-65-4321, 111-22-3333, 444-55-6666, 777-88-9999, 000-00-0000" }, expectedBlock: true }
    ];

    let passed = 0;

    tests.forEach(test => {
        const result = AIPurifier.assessRisk(test.input);
        const action = result.blocked ? "BLOCKED 🛑" : "ALLOWED ✅";
        const score = result.score.toFixed(2);

        console.log(`[${test.name}] Score: ${score} -> ${action}`);

        if (result.blocked === test.expectedBlock) {
            passed++;
        } else {
            console.error(`   ❌ FAILED: Expected blocked=${test.expectedBlock}, got ${result.blocked}`);
        }
    });

    if (passed === tests.length) {
        console.log("\n✅ AI PURIFIER VERIFIED: All Heuristics Passing.");
    } else {
        console.error("\n❌ AI PURIFIER FAILED.");
        process.exit(1);
    }
}

testPurifier();
