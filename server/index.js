const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiter (Global)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes (Placeholder)
app.get('/', (req, res) => {
    res.send('Opinion App API');
});

const authRoutes = require('./routes/auth');
const opinionRoutes = require('./routes/opinions');
const topicRoutes = require('./routes/topics');
app.use('/api/auth', authRoutes);
app.use('/api/opinions', opinionRoutes);
app.use('/api/topics', topicRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
