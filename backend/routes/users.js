const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get All Users (Admin)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete User (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Delete the user
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // 2. Delete all submissions by this user
        const Submission = require('../models/Submission');
        await Submission.deleteMany({ user: userId });

        res.json({ message: 'User and associated data deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
