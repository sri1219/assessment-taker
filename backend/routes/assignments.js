const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');

// Get All Assignments (for Dashboard)
router.get('/', async (req, res) => {
    try {
        const assignments = await Assignment.find().populate('createdBy', 'name');
        res.json(assignments);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Single Assignment by ID
router.get('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ error: 'Not Found' });
        res.json(assignment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create Assignment (Trainer Only - Mock Check)
router.post('/', async (req, res) => {
    const { title, description, starterCode, testCases, userId } = req.body;
    try {
        // In real app, check req.user.role === 'trainer'
        const assignment = new Assignment({
            title,
            description,
            starterCode,
            testCases,
            createdBy: userId
        });
        await assignment.save();
        res.json(assignment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
