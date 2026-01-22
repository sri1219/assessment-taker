const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const { executeJava } = require('../utils/executor');

// Create Assessment
router.post('/', async (req, res) => {
    try {
        const { title, description, problems, duration, createdBy } = req.body;
        const assessment = new Assessment({ title, description, problems, duration, createdBy });
        await assessment.save();
        res.json(assessment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get All Assessments (Trainee View)
router.get('/', async (req, res) => {
    try {
        const assessments = await Assessment.find().select('-createdBy'); // Hide creator
        res.json(assessments);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Assessment Details (Start)
router.get('/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id).populate('problems');
        if (!assessment) return res.status(404).json({ error: 'Not Found' });
        res.json(assessment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start/Resume Assessment
router.post('/:id/start', async (req, res) => {
    const { userId } = req.body;
    try {
        let submission = await Submission.findOne({ user: userId, assessment: req.params.id });

        if (submission && submission.status === 'SUBMITTED') {
            return res.status(403).json({ error: 'Assessment already submitted' });
        }

        if (!submission) {
            submission = new Submission({
                user: userId,
                assessment: req.params.id,
                status: 'IN_PROGRESS'
            });
            await submission.save();
        }

        res.json(submission);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit Assessment (Final)
router.post('/:id/submit', async (req, res) => {
    const { userId, answers, violationCount } = req.body;
    try {
        let submission = await Submission.findOne({ user: userId, assessment: req.params.id });
        if (!submission) return res.status(404).json({ error: 'No active submission' });

        if (submission.status === 'SUBMITTED') {
            return res.status(400).json({ error: 'Already submitted' });
        }

        // Calculate score
        let totalReceived = 0;
        let totalPossible = 0;

        // Very basic scoring logic for now (sum of parts)
        // Check Compilation and Basic Scoring
        // Reverted per user request to move compilation to Admin Review step
        answers.forEach(a => {
            totalReceived += a.passedTestCases || 0;
            totalPossible += a.totalTestCases || 0;
        });

        const finalScore = totalPossible > 0 ? Math.round((totalReceived / totalPossible) * 100) : 0;

        submission.answers = answers;
        submission.status = 'SUBMITTED';
        submission.submittedAt = Date.now();
        submission.finalScore = finalScore;
        submission.violationCount = violationCount;

        await submission.save();
        res.json(submission);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Assessment
router.put('/:id', async (req, res) => {
    try {
        const { title, description, problems, duration, isActive } = req.body;
        const assessment = await Assessment.findByIdAndUpdate(
            req.params.id,
            { title, description, problems, duration, isActive },
            { new: true }
        );
        res.json(assessment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Assessment
router.delete('/:id', async (req, res) => {
    try {
        const assessmentId = req.params.id;

        // Cascade delete: Remove all submissions associated with this assessment
        await Submission.deleteMany({ assessment: assessmentId });

        // Delete the assessment itself
        await Assessment.findByIdAndDelete(assessmentId);

        res.json({ message: 'Assessment and associated submissions deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
