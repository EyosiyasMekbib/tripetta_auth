require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes

// Registration Route
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const user = new User({ firstName, lastName, email, password });
    await user.save();
    res.status(201).send({ message: 'User registered successfully!' });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate email
      return res.status(400).send({ error: 'Email already exists!' });
    }
    res.status(400).send({ error: 'Registration failed!' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send({ error: 'Invalid email or password!' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).send({ error: 'Invalid email or password!' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.send({ token });
  } catch (error) {
    res.status(400).send({ error: 'Login failed!' });
  }
});

// Protected Route Example
app.get('/profile', async (req, res) => {
  // Extract token from headers
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ error: 'Access denied!' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).send({ error: 'User not found!' });
    res.send(user);
  } catch (error) {
    res.status(400).send({ error: 'Invalid token!' });
  }
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
