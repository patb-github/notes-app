import 'dotenv/config';

// set up mongoose connection to MongoDB
import mongoose from "mongoose";
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
})

// use the mongoose models
import User from "./models/user.model.js";
import Note from "./models/note.model.js";

// set up express app and cors
import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 8080;
const app = express();

// use jwt and token to authenticate access to protected routes
import jwt from "jsonwebtoken";
import { authenticateToken } from "./utilities.js";

app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);

// start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// =============== API Endpoints ======================

// Create Account
app.post('/create-account', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const isUser = await User.findOne({ email: email });
    if (isUser) {
        return res.status(400).json({ 
            error: true,
            message: 'User already exists' 
        });
    }

    const user = new User({
        fullName,
        email,
        password
    });

    await user.save();
    const accessToken = jwt.sign({ user}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '3600m'
    });

    return res.json({
        error: false,
        user,
        accessToken,
        message: 'Registration Successful'
    });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ message: 'User does not exist' });
    }

    if (userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };

        const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '3600m'
        });
        return res.json({
            error: false,
            email,
            accessToken,
            message: 'Login Successful'
        });
    } else {
        return res.status(400).json({ 
            error: true,
            message: 'Invalid credentials' 
        });
    }
});

// Get User
app.get('/user', authenticateToken, async (req, res) => {
    const { user } = req.user;

    const isUser = await User.findOne({ _id: user._id });

    if (!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: isUser,
        message: ""
    })
})

// Add Note
app.post('/add-note', authenticateToken, async (req, res) => {
    const { user } = req.user;
    const { title, content, tags } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id
        });
        
        await note.save();

        return res.json({
            error: false,
            note,
            message: 'Note added successfully'
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: 'Internal Server Error'
        })
    }
})

// Edit Note
app.put('/edit-note/:noteId', authenticateToken, async (req, res) => {
    const { user } = req.user;
    const { noteId } = req.params;
    const { title, content, tags, isPinned } = req.body;

    if (!title && !content && !tags) {
        return res.status(400).json({ error: true, message: "No changes provided" })
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: 'Note updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: 'Internal Server Error'
        });
    }
})
export default app;