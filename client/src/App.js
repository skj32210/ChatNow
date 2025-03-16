// App.js
import React, { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
import ChatContainer from './components/ChatContainer';
import Login from './components/Login';
import Register from './components/Register';

const SERVER_URL = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem('chatAppUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(SERVER_URL, {
        auth: {
          token: user.token
        }
      });
      
      setSocket(newSocket);
      
      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);
  
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('chatAppUser', JSON.stringify(userData));
  };
  
  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    setUser(null);
    localStorage.removeItem('chatAppUser');
  };
  
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/" /> : <Register onRegister={handleLogin} />
          } />
          <Route path="/" element={
            user && socket ? 
              <ChatContainer user={user} socket={socket} onLogout={handleLogout} /> :
              <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;