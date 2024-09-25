const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

// Get Chat History between two users
router.get('/messages/:from/:to', async (req, res) => {
    const { from, to } = req.params;
    const messages = await Message.find({
        $or: [
            { from, to },
            { from: to, to: from }
        ]
    }).sort('timestamp');
    res.send(messages);
});

module.exports = router;
