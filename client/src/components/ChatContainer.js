import React, { useEffect, useState } from 'react';
import './ChatContainer.css';
import ChatWindow from './ChatWindow';
import UserList from './UserList';

function ChatContainer({ user, socket, onLogout }) {
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // Fetch all users
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/users`, {
          headers: {
            'x-auth-token': user.token
          }
        });
        const data = await response.json();
        // Filter out current user
        setUsers(data.filter(u => u._id !== user.userId));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    // Fetch user chats
    const fetchChats = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chats`, {
          headers: {
            'x-auth-token': user.token
          }
        });
        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };
    
    fetchUsers();
    fetchChats();
    
    // Socket listeners
    socket.on('new_chat', (chat) => {
      setChats(prevChats => [...prevChats, chat]);
    });
    
    socket.on('update_chat', (updatedChat) => {
      setChats(prevChats => prevChats.map(chat => 
        chat._id === updatedChat._id ? updatedChat : chat
      ));
      
      if (activeChat && activeChat._id === updatedChat._id) {
        setActiveChat(updatedChat);
      }
    });
    
    return () => {
      socket.off('new_chat');
      socket.off('update_chat');
    };
  }, [socket, user.token, user.userId, activeChat]);
  
  const startChat = async (userId) => {
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.isPrivate && 
        chat.participants.length === 2 && 
        chat.participants.includes(user.userId) && 
        chat.participants.includes(userId)
      );
      
      if (existingChat) {
        setActiveChat(existingChat);
        return;
      }
      
      // Create new chat
      const response = await fetch(`http://localhost:5001/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': user.token
        },
        body: JSON.stringify({
          participants: [user.userId, userId],
          isPrivate: true
        })
      });
      
      const newChat = await response.json();
      setChats(prevChats => [...prevChats, newChat]);
      setActiveChat(newChat);
      
      // Join the chat room
      socket.emit('join_room', newChat._id);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  const selectChat = (chat) => {
    setActiveChat(chat);
    // Join the chat room
    socket.emit('join_room', chat._id);
  };
  
  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="user-info">
          <h3>{user.username}</h3>
          <button onClick={onLogout}>Logout</button>
        </div>
        <UserList 
          users={users} 
          chats={chats} 
          currentUser={user} 
          onUserSelect={startChat} 
          onChatSelect={selectChat}
          activeChat={activeChat}
        />
      </div>
      <div className="chat-window-container">
        {activeChat ? (
          <ChatWindow 
            chat={activeChat} 
            user={user} 
            socket={socket}
          />
        ) : (
          <div className="no-chat-selected">
            <p>Select a user or chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatContainer;
