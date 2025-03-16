// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { ChatRoom, Message } = require('../models/Chat');
const User = require('../models/User');

// Get all chats for the current user
router.get('/', auth, async (req, res) => {
  try {
    // Find all chats where the user is a participant
    let chats = await ChatRoom.find({
      participants: req.user.id
    }).populate('participants', 'username').populate('lastMessage');
    
    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new chat
router.post('/', auth, async (req, res) => {
  try {
    const { name, isPrivate, participants } = req.body;
    
    // Ensure current user is included in participants
    if (!participants.includes(req.user.id)) {
      participants.push(req.user.id);
    }
    
    // Create new chat room
    const chatRoom = new ChatRoom({
      name,
      isPrivate,
      participants
    });
    
    await chatRoom.save();
    
    // Populate participant details
    const populatedChat = await ChatRoom.findById(chatRoom._id)
      .populate('participants', 'username');
    
    res.json(populatedChat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a specific chat
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await ChatRoom.findById(req.params.id)
      .populate('participants', 'username')
      .populate('lastMessage');
    
    // Check if chat exists
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get messages for a specific chat
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const chat = await ChatRoom.findById(req.params.id);
    
    // Check if chat exists
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get messages for the chat
    const messages = await Message.find({ chatRoom: req.params.id })
      .sort({ createdAt: 1 })
      .populate('sender', 'username');
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;