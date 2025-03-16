// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Message, ChatRoom } = require('../models/Chat');

// Create a new message
router.post('/', auth, async (req, res) => {
  try {
    const { content, chatRoom, fileUrl, fileName, fileType } = req.body;
    
    // Check if chat exists
    const chat = await ChatRoom.findById(chatRoom);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Create new message
    const message = new Message({
      content,
      sender: req.user.id,
      chatRoom,
      fileUrl,
      fileName,
      fileType
    });
    
    await message.save();
    
    // Update last message in chat
    chat.lastMessage = message._id;
    await chat.save();
    
    // Populate sender details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username');
    
    res.json(populatedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
