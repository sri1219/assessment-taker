const express = require('express');
const router = express.Router();
const { executeJava } = require('../utils/executor');

// Run Code (Test against Sample Cases or Specific Input)
router.post('/run', async (req, res) => {
    const { code, input } = req.body;

    // Security Check: Block extremely obviously bad things (naive check)
    if (code.includes('Runtime.getRuntime') || code.includes('ProcessBuilder')) {
        return res.json({ output: '', error: 'Security Violation: Restricted keywords detected.' });
    }

    try {
        const result = await executeJava(code, input || "");
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit Code (Not used - see assessments.js)
// router.post('/submit', ...);

module.exports = router;
