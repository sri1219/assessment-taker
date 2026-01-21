const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const Assessment = require('../models/Assessment');

// Create Problem (Admin)
router.post('/', async (req, res) => {
    try {
        const problem = new Problem(req.body);
        await problem.save();
        res.json(problem);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get All Problems (Admin selection)
router.get('/', async (req, res) => {
    try {
        const problems = await Problem.find();
        res.json(problems);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Problem
router.delete('/:id', async (req, res) => {
    try {
        const problemId = req.params.id;

        // Remove this problem from any assessments that include it
        await Assessment.updateMany(
            { problems: problemId },
            { $pull: { problems: problemId } }
        );

        await Problem.findByIdAndDelete(problemId);
        res.json({ message: 'Problem deleted and removed from assessments' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Problem
router.put('/:id', async (req, res) => {
    try {
        const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!problem) return res.status(404).json({ error: 'Problem not found' });
        res.json(problem);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Maintenance Route: Cleanup Orphaned Problems in Assessments
router.post('/cleanup', async (req, res) => {
    try {
        const assessments = await Assessment.find();
        const problems = await Problem.find({}, '_id');
        const validProblemIds = new Set(problems.map(p => p._id.toString()));

        let modifiedCount = 0;

        for (const assess of assessments) {
            const originalLength = assess.problems.length;
            // Filter out IDs that don't exist in the Problems collection
            assess.problems = assess.problems.filter(pid => pid && validProblemIds.has(pid.toString()));
            if (assess.problems.length !== originalLength) {
                await assess.save();
                modifiedCount++;
            }
        }

        res.json({ message: `Cleanup complete. Updated ${modifiedCount} assessments.` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
