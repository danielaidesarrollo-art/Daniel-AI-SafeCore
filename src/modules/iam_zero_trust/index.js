const auditor = require('../immutable_auditor');

class IAMZeroTrust {
    constructor() {
        this.activeSessions = new Map();
        // Mock IDP data for demonstration
        this.validTokens = ['token_admin_123', 'token_user_456'];
    }

    authenticate(token) {
        if (this.validTokens.includes(token)) {
            const sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
            const sessionData = {
                token,
                role: token.includes('admin') ? 'ADMIN' : 'USER',
                startTime: Date.now(),
                lastSeen: Date.now()
            };
            this.activeSessions.set(sessionId, sessionData);

            auditor.log(`Auth successful for role: ${sessionData.role}`, "LOW", { sessionId });
            return { success: true, sessionId, role: sessionData.role };
        }

        auditor.log("Auth failure: Invalid token", "HIGH", { token: token ? "HIDDEN" : "MISSING" });
        return { success: false, error: "Invalid Credentials" };
    }

    authorize(sessionId, resource, action) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            auditor.log("Authz failure: session not found", "MEDIUM", { sessionId, resource });
            return false;
        }

        // Basic Zero Trust policy: Verify every time
        session.lastSeen = Date.now();

        // Simple role-based access control
        if (session.role === 'ADMIN') return true;
        if (session.role === 'USER' && action === 'READ') return true;

        auditor.log("Authz denied", "HIGH", { sessionId, role: session.role, resource, action });
        return false;
    }

    validateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return false;

        const maxIdle = 15 * 60 * 1000; // 15 mins
        if (Date.now() - session.lastSeen > maxIdle) {
            this.activeSessions.delete(sessionId);
            auditor.log("Session expired due to inactivity", "MEDIUM", { sessionId });
            return false;
        }
        return true;
    }
}

module.exports = new IAMZeroTrust();
