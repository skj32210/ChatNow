// components/ChatWindow.js
import React, { useEffect, useRef, useState } from 'react';
import './ChatWindow.css';

function ChatWindow({ chat, user, socket }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Fetch messages for the chat
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/chats/${chat._id}/messages`, {
          headers: {
            'x-auth-token': user.token
          }
        });
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Listen for new messages
    socket.on('receive_message', (newMessage) => {
      if (newMessage.chatRoom === chat._id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    });
    
    return () => {
      socket.off('receive_message');
    };
  }, [chat._id, socket, user.token]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const uploadFile = async () => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: {
          'x-auth-token': user.token
        },
        body: formData
      });
      
      const fileData = await response.json();
      setFile(null);
      setIsLoading(false);
      
      return fileData;
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
      return null;
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && !file) || isLoading) return;
    
    try {
      let fileData = null;
      
      if (file) {
        fileData = await uploadFile();
        if (!fileData) return;
      }
      
      const messageData = {
        content: message.trim(),
        sender: user.userId,
        chatRoom: chat._id,
        fileUrl: fileData?.fileUrl || null,
        fileName: fileData?.fileName || null,
        fileType: fileData?.fileType || null
      };
      
      // Send message to server to save
      const response = await fetch(`http://localhost:5000/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': user.token
        },
        body: JSON.stringify(messageData)
      });
      
      const savedMessage = await response.json();
      
      // Emit message through socket
      socket.emit('send_message', savedMessage);
      
      // Clear message input
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>
          {chat.name || 
            chat.participants
              .filter(p => p !== user.userId)
              .map(p => {
                const participant = chat.participantDetails?.find(u => u._id === p);
                return participant ? participant.username : 'User';
              })
              .join(', ')
          }
        </h3>
      </div>
      
      <div className="messages-container">
        {messages.map((msg) => (
          <div 
            key={msg._id} 
            className={`message ${msg.sender === user.userId ? 'own-message' : 'other-message'}`}
          >
            <div className="message-content">
              <p>{msg.content}</p>
              {msg.fileUrl && (
                <div className="file-attachment">
                  {msg.fileType.startsWith('image/') ? (
                    <img 
                      src={`http://localhost:5000${msg.fileUrl}`} 
                      alt={msg.fileName} 
                      className="message-image" 
                    />
                  ) : (
                    <a 
                      href={`http://localhost:5000${msg.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      {msg.fileName}
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="message-time">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={sendMessage}>
        <div className="file-input-container">
          <label htmlFor="file-input" className="file-input-label">
            {file ? file.name : 'Attach File'}
          </label>
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={(!message.trim() && !file) || isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;