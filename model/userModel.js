const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email format'],
        trim: true
    },
    password: {
        type: String,
        required: true,
         minlength: 6
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    is_admin:{
        type:Boolean,
        required:true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
});



module.exports = mongoose.model('User', userSchema);