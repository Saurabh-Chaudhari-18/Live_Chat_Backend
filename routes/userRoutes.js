const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    const { username } = req.body;
    let user = await User.findOne({ username });

    if (!user) {
        user = new User({ username });
        await user.save();
    }
    res.send(user);
});

// Get All Users
router.get('/users', async (req, res) => {
    const users = await User.find();
    res.send(users);
});

module.exports = router;
