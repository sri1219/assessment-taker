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

module.exports = router;
