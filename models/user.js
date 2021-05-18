const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 1024
    }
}));

module.exports = User;