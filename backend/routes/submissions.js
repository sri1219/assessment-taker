const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// Get All Submissions (Admin)
router.get('/', async (req, res) => {
    try {
        const submissions = await Submission.find({})
            .populate('user', 'name email')
            .populate('assessment', 'title');
        res.json(submissions);
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
