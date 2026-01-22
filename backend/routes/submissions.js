const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// Get All Submissions (Admin)
router.get('/', async (req, res) => {
    try {
        const submissions = await Submission.find({})
            .populate('user', 'name email')
            .populate('assessment', 'title')
            .populate('answers.problem', 'title totalMarks');
        res.json(submissions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Grading (Manual)
router.put('/:id/grade', async (req, res) => {
    try {
        const { answers } = req.body; // Array of objects with problem ID and score
        const submission = await Submission.findById(req.params.id).populate('answers.problem');
        if (!submission) return res.status(404).json({ error: 'Not Found' });

        // Update individual answer scores
        let totalManualScore = 0;
        let totalMaxScore = 0;

        submission.answers.forEach(a => {
            const grade = answers.find(g => g.problemId === a.problem._id.toString());
            if (grade) {
                a.manualScore = Number(grade.score);
            }
            totalManualScore += (a.manualScore || 0);
            totalMaxScore += (a.problem.totalMarks || 0);
        });

        submission.totalManualScore = totalManualScore;
        submission.totalMaxScore = totalMaxScore;

        // Calculate percentage
        if (totalMaxScore > 0) {
            submission.finalScore = Math.round((totalManualScore / totalMaxScore) * 100);
        } else {
            submission.finalScore = 0;
        }

        console.log(`Grading Submission ${submission._id}: Obtained=${totalManualScore}, Max=${totalMaxScore}, Final=${submission.finalScore}%`);

        await submission.save();
        res.json(submission);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete a Submission (Reset)
router.post('/:id/delete', async (req, res) => {
    try {
        await Submission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Submission deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
