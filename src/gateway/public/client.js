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
            alert("Session Expired due to Inactivity");
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
                'sub': sessionToken.sub,
                'mfa_verified': sessionToken.mfa_verified.toString()
            },
            body: JSON.stringify({ data: data }) // SDK willsanitize this
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess("app-msg", `Data Securely Archived.\nRef: ${result.ref}`);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (e) {
        alert("Network Error");
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
