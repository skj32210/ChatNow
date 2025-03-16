// Message model
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Chat room model
const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null // For private messages, this can be null
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
});

const Message = mongoose.model('Message', messageSchema);
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = { Message, ChatRoom };