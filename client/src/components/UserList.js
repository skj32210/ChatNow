// components/UserList.js
import React from 'react';
import './UserList.css';

function UserList({ users, chats, currentUser, onUserSelect, onChatSelect, activeChat }) {
  // Get private chats
  const privateChats = chats.filter(chat => chat.isPrivate);
  
  return (
    <div className="user-list-container">
      <div className="section-title">Chats</div>
      <ul className="chat-list">
        {privateChats.map(chat => {
          // Find the other participant
          const otherParticipantId = chat.participants.find(p => p !== currentUser.userId);
          const otherUser = users.find(user => user._id === otherParticipantId);
          
          return (
            <li 
              key={chat._id} 
              className={`chat-item ${activeChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => onChatSelect(chat)}
            >
              <div className="chat-name">
                {otherUser ? otherUser.username : 'Unknown User'}
              </div>
              {chat.lastMessage && (
                <div className="last-message">
                  {chat.lastMessage.content.length > 20 
                    ? chat.lastMessage.content.substring(0, 20) + '...' 
                    : chat.lastMessage.content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      
      <div className="section-title">Users</div>
      <ul className="users-list">
        {users.map(user => (
          <li 
            key={user._id} 
            className="user-item" 
            onClick={() => onUserSelect(user._id)}
          >
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;