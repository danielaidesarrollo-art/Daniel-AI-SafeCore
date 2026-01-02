const orchestrator = require('./layer_orchestrator');
const iam = require('./iam_zero_trust');
const kms = require('./encryption_key_mgmt');
const auditor = require('./immutable_auditor');
const purifier = require('./ai_purifier');

module.exports = {
    orchestrator,
    iam,
    kms,
    auditor,
    purifier,

    // System helper
    status: () => orchestrator.getSystemStatus()
};
