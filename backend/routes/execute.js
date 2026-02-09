const express = require('express');
const router = express.Router();
const { executeJava, executeJS, executeTS } = require('../utils/executor');

// Run Code (Test against Sample Cases or Specific Input)
router.post('/run', async (req, res) => {
    const { code, input, language = 'java' } = req.body;

    // Security Check: Block restricted keywords (naive check)
    const securityViolations = [
        'Runtime.getRuntime',
        'ProcessBuilder',
        'require("child_process")',
        'require("fs")',
        'eval(',
        'Function(',
        '__dirname',
        '__filename'
    ];

    const hasViolation = securityViolations.some(keyword => code.includes(keyword));
    if (hasViolation) {
        return res.json({ output: '', error: 'Security Violation: Restricted keywords detected.' });
    }

    try {
        let result;
        switch (language.toLowerCase()) {
            case 'javascript':
                result = await executeJS(code, input || "");
                break;
            case 'typescript':
                result = await executeTS(code, input || "");
                break;
            case 'java':
            default:
                result = await executeJava(code, input || "");
                break;
        }
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit Code (Not used - see assessments.js)
// router.post('/submit', ...);

module.exports = router;
