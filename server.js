require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Note = require('./models/Note');
const protect = require('./middleware/auth');

const app = express();
app.use(express.json());

//1. Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected to NoteLocker!'))
    .catch((err) => console.error('DB Error:', err));

//2. Auth: Sign Up
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User.findOne({ email });

        if (exists) return res.status(400).json({ message: "User already exists!"});

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({name, email, password, hashedPassword});
        res.status(201).json({message: "User registered successfully!"});

    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

//3: Auth Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({message :"Invalid credentials"});

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({userId: user._id }, process.env.JWT_SECRET, {expiresIn: '1d'});
        res.json({message: "Logged in!", token});
    } catch (error) {
        res.status(500).json({error: removeEventListener.message });
    }
});

//-----PROTECTED NOTE ROUTES-----

//4. Create a note (Requires token)
app.post('/api/notes', protect, async (req, res) => {
    try {
        const {title, content} = req.body;
        const note = await Note.create({
            user: req.user, //Gotten straight grom the middleware
            title,
            content
        });
        res.status(201).json( note );
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

//5. Get all my notes (Only notes matching the logged-in user)
app.get('/api/notes', protect, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user});
        res.json(notes);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

//6. Delete a note (Only if the note belong to the logged-in user)
app.delete('/api/notes/:id', protect, async (req,res) => {
    try {
       const note = await Note.findOneAndDelete({_id: req.params.id, user: req.user });
       if (!note) return res.status(404).json({ message: 'Note not found or unauthorized' });
       res.json({ message: 'Note deleted successfully' }); 
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
