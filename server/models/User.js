const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Please use a valid @gmail.com address'],
    },
    password: {
        type: String,
        required: false, // Allow passwordless/OTP users
    },
    username: {
        type: String,
        required: true,
    },
    isSetupComplete: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', UserSchema);
