require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Chat Schema
const chatSchema = new mongoose.Schema({
  message: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', chatSchema);

// Routes
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ timestamp: 1 }).limit(50);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  // LOCAL: http://localhost:5001/chat
  // PROD: https://your-ai-service.onrender.com/chat
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001/chat';
  
  try {
    const aiResponse = await axios.post(AI_SERVICE_URL, { message }, { timeout: 30000 });
    const chat = new Chat({ message, response: aiResponse.data.response });
    await chat.save();
    
    res.json({ response: aiResponse.data.response });
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({ 
      error: 'AI service unavailable. Using fallback.',
      response: 'Sorry, I\'m having trouble connecting to the AI right now. Please try again.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 Mongo URI: ${process.env.MONGO_URI ? 'Set ✅' : 'Missing ❌'}`);
});
// Replace the mongoose.connect section with:
console.log('🔄 Connecting to MongoDB Atlas...');
console.log('URI starts with:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'MISSING!');

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,  // 10s timeout
  connectTimeoutMS: 10000,          // Faster connect
  bufferCommands: false,             // No buffering hangs
  maxPoolSize: 10                    // Connection pool
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully!');
})
.catch(err => {
  console.error('❌ MongoDB connection FAILED:', err.message);
  console.error('Full error:', err);
  process.exit(1);  // Exit if DB fails
});

// Add connection events
mongoose.connection.on('connected', () => console.log('🔗 Mongoose connected'));
mongoose.connection.on('error', err => console.error('❌ Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.log('🔌 Mongoose disconnected'));
