const express = require('express');
const router = express.Router();
const { executeJava } = require('../utils/executor');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

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

// Submit Code (Run against all Test Cases)
router.post('/submit', async (req, res) => {
    const { userId, assignmentId, code, violationCount } = req.body;

    try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

        let passedCount = 0;
        let results = [];

        for (const testCase of assignment.testCases) {
            const result = await executeJava(code, testCase.input);
            const passed = result.output.trim() === testCase.expectedOutput.trim();
            if (passed) passedCount++;

            results.push({
                input: testCase.input,
                expected: testCase.expectedOutput,
                actual: result.output,
                error: result.error,
                passed
            });
        }

        const score = assignment.testCases.length > 0
            ? Math.round((passedCount / assignment.testCases.length) * 100)
            : 0;

        const submission = new Submission({
            user: userId,
            assignment: assignmentId,
            code,
            score,
            status: score === 100 ? 'Pass' : 'Fail',
            violationCount
        });

        await submission.save();

        res.json({
            score,
            results: results.map(r => ({ ...r, expected: 'HIDDEN' })), // Hide expected in response usually, but maybe show strictly for debug? Keeping generic.
            submissionId: submission._id
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
