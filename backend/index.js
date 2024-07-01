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

// create account
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

// login
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

export default app;