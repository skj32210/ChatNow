const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Register a new user
router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Create new user
      user = new User({
        username,
        email,
        password
      });
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      
      // Save user to database
      await user.save();
      
      // Create and return JWT token
      const payload = {
        user: {
          id: user.id
        }
      };
      
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, userId: user.id, username: user.username });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // Login user
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Create and return JWT token
      const payload = {
        user: {
          id: user.id
        }
      };
      
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, userId: user.id, username: user.username });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // Get user profile (protected route)
  router.get('/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // Middleware to protect routes
  function auth(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user from payload
      req.user = decoded.user;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  }
  
  module.exports = router;