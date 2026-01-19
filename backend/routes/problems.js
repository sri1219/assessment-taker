const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

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

module.exports = router;
