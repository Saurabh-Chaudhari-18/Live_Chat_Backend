const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Environment-based CORS handling
const io = socketIO(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? "https://your-frontend-url.vercel.app" // Replace with your deployed frontend URL
            : "http://localhost:3000", // Localhost for development
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
});
const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).send('Backend is running');
});

// Register User
app.post('/register', async (req, res) => {
    const { username } = req.body;
    let user = await User.findOne({ username });

    if (!user) {
        user = new User({ username });
        await user.save();
    }
    res.send(user);
});

// Get All Users
app.get('/users', async (req, res) => {
    const users = await User.find();
    res.send(users);
});

// Get Chat History between two users
app.get('/messages/:from/:to', async (req, res) => {
    const { from, to } = req.params;
    const messages = await Message.find({
        $or: [
            { from, to },
            { from: to, to: from },
        ],
    }).sort('timestamp');
    res.send(messages);
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('sendMessage', async ({ from, to, message }) => {
        const newMessage = new Message({ from, to, message });
        await newMessage.save();

        // Emit message to both users
        io.emit('receiveMessage', { from, to, message, timestamp: newMessage.timestamp });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get("/", (req, res) => {
    res.send("<h1>Welcome to My API</h1>");
  });

// Listening on dynamic or default port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
