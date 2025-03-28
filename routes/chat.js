const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// Send a message
router.post("/send", async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get chat messages
router.get("/:sender/:receiver", async (req, res) => {
  const { sender, receiver } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
