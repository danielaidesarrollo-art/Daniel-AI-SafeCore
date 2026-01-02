// SafeCore Secure Client
// Implements Auto-Logout and Auth Header Management

let sessionToken = null;
let inactivityTimer;
const TIMEOUT_SECONDS = 900; // 15 Minutes
let timeLeft = TIMEOUT_SECONDS;

function login() {
    const user = document.getElementById('username').value;
    const mfa = document.getElementById('mfa-toggle').checked;

    if (!mfa) {
        showError("login-msg", "MFA Verification Failed. Access Denied.");
        return;
    }

    // Simulate Token with MFA Flag
    sessionToken = {
        sub: user,
        mfa_verified: true,
        roles: ['clinician']
    };

    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('user-display').innerText = user;

    startSessionTimer();
    pollSystemStatus();
}

function pollSystemStatus() {
    setInterval(async () => {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            const stateEl = document.getElementById('system-state');

            if (data.system_integrity.state === 'LOCKDOWN') {
                stateEl.innerText = 'LOCKDOWN';
                stateEl.style.background = 'rgba(255, 77, 77, 0.2)';
                stateEl.style.color = '#ff4d4d';
                stateEl.style.borderColor = '#ff4d4d';
                showError("app-msg", "SYSTEM LOCKDOWN ACTIVE: Security Breach Detected");
            } else {
                stateEl.innerText = 'NORMAL';
                stateEl.style.background = 'rgba(0, 255, 0, 0.1)';
                stateEl.style.color = '#00ff00';
                stateEl.style.borderColor = '#00ff00';
            }
        } catch (e) {
            console.warn("Status poll failed");
        }
    }, 5000);
}

function logout() {
    sessionToken = null;
    clearInterval(inactivityTimer);
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    timeLeft = TIMEOUT_SECONDS;
}

// --- Auto-Logout Logic ---
function startSessionTimer() {
    timeLeft = TIMEOUT_SECONDS;
    clearInterval(inactivityTimer);

    inactivityTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;

        if (timeLeft <= 0) {
            showError("app-msg", "Session Expired due to Inactivity");
            logout();
        }
    }, 1000);

    // Reset timer on user activity
    document.body.onmousemove = resetTimer;
    document.body.onkeypress = resetTimer;
}

function resetTimer() {
    timeLeft = TIMEOUT_SECONDS;
}

// --- Secure API Call ---
async function submitData() {
    const data = document.getElementById('clinical-data').value;

    try {
        const response = await fetch('/api/clinical/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': 'Bearer token_admin_123'
            },
            body: JSON.stringify({ data: data })
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess("app-msg", `Data Securely Archived.\nRef: ${result.ref}`);
        } else {
            showError("app-msg", `Error: ${result.error}`);
        }
    } catch (e) {
        showError("app-msg", "Security Handshake Failed / Network Error");
    }
}

function showError(elementId, msg) {
    const el = document.getElementById(elementId);
    el.innerText = msg;
    el.style.display = 'block';
}

function showSuccess(elementId, msg) {
    const el = document.getElementById(elementId);
    el.innerText = msg;
    el.style.display = 'block';
}
