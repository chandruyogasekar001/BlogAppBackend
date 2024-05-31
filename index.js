const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define Schema for Blog Post
const blogSchema = new mongoose.Schema({
    title: String,
    description: String,
    imageUrl: String,
    content: String
});

const Blog = mongoose.model('Blog', blogSchema);

// Define Schema for User
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// User sign-in route
app.post('/api/sign-in', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.json({ status: false, msg: 'Invalid username or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            return res.json({ status: true, msg: 'Login successful', data: { username: user.username } });
        } else {
            return res.json({ status: false, msg: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        return res.status(500).json({ status: false, msg: 'Internal server error' });
    }
});

// Routes for blog posts (unchanged)
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/blogs', async (req, res) => {
    const blog = new Blog(req.body);
    try {
        const newBlog = await blog.save();
        res.status(201).json(newBlog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
app.put('/api/blogs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedBlog = await Blog.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedBlog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
app.delete('/api/blogs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Blog.findByIdAndDelete(id);
        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Error handling
app.on('error', (error) => {
    console.error('Server error:', error);
});
