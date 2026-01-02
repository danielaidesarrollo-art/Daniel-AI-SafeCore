const app = require('./server');
const http = require('http');

function makeRequest(port, path, method, headers, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

function testGateway() {
    console.log("🧪 Starting Gateway Security Test (Native HTTP)...");

    const server = app.listen(0, async () => {
        const port = server.address().port;

        try {
            // TEST 1: Unauthorized Request
            console.log("\n[Test 1] Sending Request WITHOUT Auth...");
            const res1 = await makeRequest(port, '/api/clinical/ingest', 'POST',
                { 'Content-Type': 'application/json' },
                JSON.stringify({ data: "patient info" })
            );
            console.log(`   Response: ${res1.status} (Expected 403)`);

            // TEST 2: Authorized Request
            console.log("\n[Test 2] Sending Request WITH Authorization Header...");
            const res2 = await makeRequest(port, '/api/clinical/ingest', 'POST',
                {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer token_admin_123'
                },
                JSON.stringify({ data: "patient info" })
            );
            console.log(`   Response: ${res2.status} (Expected 200)`);

            // TEST 3: Malicious Payload
            console.log("\n[Test 3] Sending Malicious Payload (<script>)...");
            const res3 = await makeRequest(port, '/api/clinical/ingest', 'POST',
                {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer token_admin_123'
                },
                JSON.stringify({ data: "<script>alert(1)</script>" })
            );
            console.log(`   Response: ${res3.status} (Expected 403)`);

            if (res1.status === 403 && res2.status === 200 && res3.status === 403) {
                console.log("\n✅ GATEWAY INTEGRATION TEST PASSED");
            } else {
                console.log("\n❌ GATEWAY INTEGRATION TEST FAILED");
                process.exitCode = 1;
            }

        } catch (e) {
            console.error("Test Error:", e);
        } finally {
            server.close();
        }
    });
}

testGateway();
