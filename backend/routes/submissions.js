const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// Get All Submissions (Admin)
router.get('/', async (req, res) => {
    try {
        const submissions = await Submission.find({})
            .populate('user', 'name email')
            .populate('assessment', 'title')
            .populate('answers.problem', 'title');
        res.json(submissions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Grading (Manual)
router.put('/:id/grade', async (req, res) => {
    try {
        const { answers } = req.body; // Array of objects with problem ID and score
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ error: 'Not Found' });

        // Update individual answer scores
        let totalManualScore = 0;
        submission.answers.forEach(a => {
            const grade = answers.find(g => g.problemId === a.problem.toString());
            if (grade) {
                a.manualScore = Number(grade.score);
            }
            totalManualScore += (a.manualScore || 0);
        });

        // Update final score (Naive approach: simply sum manual scores? Or mix? 
        // User asked: "Update score manually... calculate final score".
        // Let's assume Final Score = Total Manual Score (since admin overrides).
        // Or should it be a percentage?
        // Let's assume for now, it's a sum of manual scores given for each question.
        // Assuming max score per question is meant to be handled by admin judgment.

        // Wait, "Once review is submitted for all... calculate final score".
        // It's ambiguous if this means overrides the auto score or adds to it. 
        // Given typical grading, manual review OVERRIDES auto-grading.
        // So we'll set finalScore = Sum of Manual Scores.

        // BETTER: Calculate percentage based on number of questions? 
        // Let's stick to the simplest: Sum of manual scores. 
        // But the previous logic was percentage. 
        // Let's recalculate percentage based on `totalPossible` (test cases) if available, 
        // OR just store the raw manual score sum.
        // User Prompt: "score given for all the programs, Calculate the final score."
        // Let's assume the admin inputs a score out of 100 or something? No, "below each answer".
        // Likely score per question.
        // Let's set finalScore to the Average of (Manual Score / Max Score)? No Max Score known per question unless we assume 100.
        // Let's implementation: Final Score = Sum of Manual Scores.
        submission.finalScore = totalManualScore;

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
